// Fetch and cache the MegaETH ICO USDT-allocation snapshot from Dune query 6275079.
// Row schema (verified):
//   bid_usdt           number (raw bid, USDT)
//   bidder             string (HTML <a href=etherscan/...>0x...</a>)
//   category           string ("Partial Allocation (Partial Refund)" / "Full Allocation" / etc.)
//   lockup_status      string ("Unlocked" / ...)
//   net_allocated_usdt number (the USDT actually allocated — what we display)
//   refund_usdt        number

const { DUNE_QUERY_ID, DUNE_API_KEY } = require("../config/megaeth")
const REFRESH_MS = 6 * 60 * 60 * 1000 // 6h

let cache = {
  loadedAt: 0,
  loading: null,
  rows: new Map(), // wallet (lowercase) -> row
  rawCount: 0,
  error: null,
}

const ADDR_RE = /0x[a-fA-F0-9]{40}/

function extractAddress(html) {
  if (typeof html !== "string") return null
  const m = html.match(ADDR_RE)
  return m ? m[0].toLowerCase() : null
}

async function loadSnapshot() {
  if (!DUNE_API_KEY) {
    cache.error = "DUNE_API_KEY not set"
    return cache
  }
  const url = `https://api.dune.com/api/v1/query/${DUNE_QUERY_ID}/results?limit=1000`
  let res
  try {
    // Dune accepts both X-Dune-API-Key and ?api_key=. Header is preferred.
    res = await fetch(url, { headers: { "X-Dune-API-Key": DUNE_API_KEY } })
  } catch (e) {
    cache.error = `Dune request failed: ${e.message}`
    return cache
  }
  if (!res.ok) {
    const t = await res.text().catch(() => "")
    cache.error = `Dune ${res.status}: ${t.slice(0, 200)}`
    return cache
  }
  const json = await res.json()
  const rows = json?.result?.rows || []
  let totalRows = rows.length
  let nextOffset = json?.next_offset
  // paginate (Dune returns up to 1k by default; fetch more if needed)
  while (nextOffset != null) {
    const r = await fetch(`${url}&offset=${nextOffset}`, { headers: { "X-Dune-API-Key": DUNE_API_KEY } })
    if (!r.ok) break
    const j = await r.json()
    for (const row of j?.result?.rows || []) rows.push(row)
    totalRows = rows.length
    nextOffset = j?.next_offset
    if (rows.length > 200000) break // safety
  }

  const map = new Map()
  for (const row of rows) {
    const addr = extractAddress(row.bidder)
    if (!addr) continue
    // Sum if duplicate addresses appear (defensive)
    const existing = map.get(addr)
    const usdt = Number(row.net_allocated_usdt) || 0
    const bid = Number(row.bid_usdt) || 0
    const refund = Number(row.refund_usdt) || 0
    if (existing) {
      existing.usdtAllocated += usdt
      existing.usdtBid += bid
      existing.usdtRefund += refund
    } else {
      map.set(addr, {
        wallet: addr,
        usdtAllocated: usdt,
        usdtBid: bid,
        usdtRefund: refund,
        category: row.category || null,
        lockupStatus: row.lockup_status || null,
      })
    }
  }
  cache = {
    loadedAt: Date.now(),
    loading: null,
    rows: map,
    rawCount: totalRows,
    error: null,
    executionEndedAt: json?.execution_ended_at || null,
  }
  return cache
}

async function getSnapshot() {
  const now = Date.now()
  const fresh = cache.loadedAt && now - cache.loadedAt < REFRESH_MS && !cache.error
  if (fresh) return cache
  if (cache.loading) return cache.loading
  cache.loading = loadSnapshot().finally(() => { cache.loading = null })
  return cache.loading
}

async function getAllocation(address) {
  if (!address) return null
  const snap = await getSnapshot()
  if (snap.error) {
    const err = new Error(snap.error)
    err.code = "DUNE_UNAVAILABLE"
    throw err
  }
  return snap.rows.get(address.toLowerCase()) || null
}

function snapshotMeta() {
  return {
    loadedAt: cache.loadedAt || null,
    rowCount: cache.rows.size,
    rawCount: cache.rawCount,
    executionEndedAt: cache.executionEndedAt || null,
    error: cache.error,
  }
}

module.exports = { getAllocation, getSnapshot, snapshotMeta }
