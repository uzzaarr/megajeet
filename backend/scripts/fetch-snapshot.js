#!/usr/bin/env node
// One-time script: fetches the full Dune ICO snapshot and saves to data/allocations.json
const fs = require('fs')
const path = require('path')

const DUNE_API_KEY = process.env.DUNE_API_KEY || process.argv[2]
const QUERY_ID = 6275079
const OUT = path.join(__dirname, '../data/allocations.json')
const ADDR_RE = /0x[a-fA-F0-9]{40}/

if (!DUNE_API_KEY) {
  console.error('Usage: node fetch-snapshot.js <DUNE_API_KEY>')
  process.exit(1)
}

async function fetchAll() {
  const url = `https://api.dune.com/api/v1/query/${QUERY_ID}/results?limit=1000`
  const headers = { 'X-Dune-API-Key': DUNE_API_KEY }

  console.log('Fetching Dune snapshot...')
  let res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`Dune ${res.status}: ${await res.text()}`)
  let json = await res.json()

  const rows = json?.result?.rows || []
  let nextOffset = json?.next_offset

  while (nextOffset != null) {
    console.log(`  paginating offset=${nextOffset}, rows so far=${rows.length}`)
    res = await fetch(`${url}&offset=${nextOffset}`, { headers })
    if (!res.ok) break
    json = await res.json()
    for (const row of json?.result?.rows || []) rows.push(row)
    nextOffset = json?.next_offset
  }

  console.log(`Total rows fetched: ${rows.length}`)

  // Deduplicate and normalise
  const map = new Map()
  for (const row of rows) {
    const m = typeof row.bidder === 'string' ? row.bidder.match(ADDR_RE) : null
    if (!m) continue
    const addr = m[0].toLowerCase()
    const usdt = Number(row.net_allocated_usdt) || 0
    const bid  = Number(row.bid_usdt) || 0
    const refund = Number(row.refund_usdt) || 0
    const existing = map.get(addr)
    if (existing) {
      existing.usdtAllocated += usdt
      existing.usdtBid      += bid
      existing.usdtRefund   += refund
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

  const out = Array.from(map.values())
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, JSON.stringify(out, null, 0))
  console.log(`Saved ${out.length} unique wallets → ${OUT}`)
}

fetchAll().catch(e => { console.error(e); process.exit(1) })
