// MegaETH L2 MEGA-token activity for a wallet — sourced from megaeth.blockscout.com
// using the Etherscan-compatible API.
//
// Disposition uses NET BALANCE rather than summing outflows:
//   disposed = max(0, allocation - currentBalance)
// The disposed pool is split into "sold" vs "transferred" by the ratio of
// swap-method outflows to non-swap outflows in the timeline (i.e. behaviour
// preference from the timeline determines the split, but the magnitude is
// always anchored to the net change in balance).
//
// Three guards:
//   1. If the wallet has no claim tx yet, we return totals=null + hasClaimed=false
//      so the UI shows "Not claimed yet" instead of fake "100% disposed".
//   2. If there are zero recorded outflows, default the split to 100% transferred.
//   3. If outflows exist but balance >= allocation (e.g. they bought back), we
//      still treat held = full allocation, sold/transferred = 0. The timeline
//      still tells the cumulative story.
const {
  BLOCKSCOUT_BASE_URL,
  BLOCKSCOUT_API_KEY,
  MEGA_TOKEN_ADDRESS,
  MEGA_DECIMALS,
  TGE_DATE_TS,
  DISTRIBUTOR_ADDRESS,
  classifyOutflow,
} = require("../config/megaeth")

const PAGE_SIZE = 100

function rawToFloat(raw, decimals = MEGA_DECIMALS) {
  if (raw == null) return 0
  const s = String(raw)
  // Use BigInt to avoid precision loss, then convert.
  try {
    const n = BigInt(s)
    const denom = 10n ** BigInt(decimals)
    const whole = n / denom
    const frac = n % denom
    return Number(whole) + Number(frac) / Number(denom)
  } catch {
    return Number(s) / Math.pow(10, decimals)
  }
}

async function fetchPage(address, page) {
  const url = new URL(`${BLOCKSCOUT_BASE_URL}/api`)
  url.searchParams.set("module", "account")
  url.searchParams.set("action", "tokentx")
  url.searchParams.set("contractaddress", MEGA_TOKEN_ADDRESS)
  url.searchParams.set("address", address)
  url.searchParams.set("sort", "asc")
  url.searchParams.set("page", String(page))
  url.searchParams.set("offset", String(PAGE_SIZE))
  if (BLOCKSCOUT_API_KEY) url.searchParams.set("apikey", BLOCKSCOUT_API_KEY)
  const res = await fetch(url, { headers: { accept: "application/json" } })
  if (!res.ok) throw new Error(`Blockscout ${res.status}`)
  const json = await res.json()
  // Blockscout returns status:"0" / message:"No transactions found" with empty result
  if (json.status === "0" && /no transactions/i.test(json.message || "")) return []
  if (json.status !== "1" && json.status !== 1) {
    if (Array.isArray(json.result)) return json.result
    return []
  }
  return Array.isArray(json.result) ? json.result : []
}

async function fetchAllTransfers(address) {
  const all = []
  for (let page = 1; page <= 50; page++) {
    const rows = await fetchPage(address, page)
    all.push(...rows)
    if (rows.length < PAGE_SIZE) break
  }
  return all
}

async function fetchTokenBalance(address) {
  const url = new URL(`${BLOCKSCOUT_BASE_URL}/api`)
  url.searchParams.set("module", "account")
  url.searchParams.set("action", "tokenbalance")
  url.searchParams.set("contractaddress", MEGA_TOKEN_ADDRESS)
  url.searchParams.set("address", address)
  url.searchParams.set("tag", "latest")
  if (BLOCKSCOUT_API_KEY) url.searchParams.set("apikey", BLOCKSCOUT_API_KEY)
  const res = await fetch(url, { headers: { accept: "application/json" } })
  if (!res.ok) throw new Error(`Blockscout balance ${res.status}`)
  const json = await res.json()
  return rawToFloat(json?.result || "0")
}

async function getActivity(address, megaAllocation) {
  const wallet = address.toLowerCase()
  const rows = await fetchAllTransfers(wallet)

  // Normalise + sort
  const transfers = rows.map((r) => {
    const ts = Number(r.timeStamp || r.timestamp || 0)
    const from = String(r.from || "").toLowerCase()
    const to = String(r.to || "").toLowerCase()
    const amount = rawToFloat(r.value, Number(r.tokenDecimal || MEGA_DECIMALS))
    const flow = from === wallet ? "out" : to === wallet ? "in" : "other"
    const fn = r.functionName || ""
    return {
      hash: r.hash,
      blockNumber: Number(r.blockNumber) || null,
      ts,
      from,
      to,
      amount,
      flow,
      functionName: fn,
      classification: flow === "out" ? classifyOutflow(fn) : flow === "in" ? "received" : "other",
    }
  }).sort((a, b) => a.ts - b.ts)

  // Claim tx = inbound from the official distributor on/after TGE
  const claim = transfers.find(
    (t) => t.flow === "in" && t.from === DISTRIBUTOR_ADDRESS && t.ts >= TGE_DATE_TS
  ) || null
  const firstInbound = transfers.find((t) => t.flow === "in") || null
  const hasClaimed = !!claim

  // Cumulative outflow magnitudes — used only as the SPLIT RATIO for the
  // disposed pool, not the disposed magnitude itself.
  let swapOutSum = 0, otherOutSum = 0, totalOut = 0
  for (const t of transfers) {
    if (t.flow !== "out") continue
    totalOut += t.amount
    if (t.classification === "sold") swapOutSum += t.amount
    else otherOutSum += t.amount
  }

  // Pre-claim: don't compute disposition. Balance might be 0 simply because
  // the user hasn't claimed yet — calling that "100% sold" would be a lie.
  if (!hasClaimed) {
    return {
      claim: null,
      firstInbound,
      hasClaimed: false,
      currentBalance: null,
      totals: null,
      timeline: transfers,
      transferCount: transfers.length,
    }
  }

  // Skip the balance call if there are no outflows — held trivially = full
  // allocation (or claim amount if there's no Dune allocation).
  let currentBalance
  if (totalOut === 0) {
    currentBalance = transfers.filter((t) => t.flow === "in").reduce((s, t) => s + t.amount, 0)
  } else {
    currentBalance = await fetchTokenBalance(wallet)
  }

  // Anchor: prefer the on-chain allocation when Dune is silent.
  const anchor = megaAllocation > 0 ? megaAllocation : claim?.amount || 0

  let heldMega = Math.min(currentBalance, anchor || currentBalance)
  let disposedMega = Math.max(0, (anchor || 0) - currentBalance)

  // Split disposed into sold vs transferred by the outflow ratio.
  let soldMega = 0, transferredMega = 0
  if (disposedMega > 0) {
    if (totalOut <= 0) {
      // Defensive: indexer lag — bucket as transferred (less accusatory).
      transferredMega = disposedMega
    } else {
      const swapRatio = swapOutSum / totalOut
      soldMega = disposedMega * swapRatio
      transferredMega = disposedMega - soldMega
    }
  }

  const denom = anchor || (heldMega + disposedMega) || 1
  const totals = {
    megaAllocation: anchor,
    currentBalance,
    soldMega,
    transferredMega,
    heldMega,
    soldPct: (soldMega / denom) * 100,
    transferredPct: (transferredMega / denom) * 100,
    heldPct: (heldMega / denom) * 100,
    boughtBack: currentBalance > anchor && anchor > 0,
  }

  return {
    claim,
    firstInbound,
    hasClaimed: true,
    currentBalance,
    totals,
    timeline: transfers,
    transferCount: transfers.length,
  }
}

module.exports = { getActivity }
