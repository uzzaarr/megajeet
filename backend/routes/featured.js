// GET /api/featured
//   → [{ handle, displayName, avatarUrl, score, profileLink, wallet, allocation, activity }]
//
// Resolves a curated list of X handles (config/featured.js) via Ethos, picks
// the configured wallet, looks up the Dune allocation, and grabs MEGA activity.
// Cached for 30 minutes.
const { Router } = require("express")
const { resolveXHandle } = require("../services/ethos")
const { getAllocation } = require("../services/dune")
const { getActivity } = require("../services/blockscout")
const { FEATURED } = require("../config/featured")
const { ICO_PRICE_USDT, usdtToMega } = require("../config/megaeth")

const router = Router()

const CACHE_MS = 30 * 60 * 1000
let cache = { at: 0, data: null }

async function buildOne(spec) {
  const profile = await resolveXHandle(spec.handle).catch(() => null)
  // Prefer the explicit wallet override if provided
  const wallet = (spec.walletAddress || profile?.wallets?.[spec.walletIndex || 0] || "").toLowerCase()
  const out = {
    handle: profile?.handle || spec.handle,
    displayName: profile?.displayName || null,
    avatarUrl: profile?.avatarUrl || null,
    score: profile?.score ?? null,
    profileLink: profile?.profileLink || `https://app.ethos.network/profile/x/${encodeURIComponent(spec.handle)}`,
    wallet,
    allocation: null,
    sold: null,
    claimed: null,
  }
  if (!wallet) return out

  const row = getAllocation(wallet)
  if (row) {
    out.allocation = {
      usdtAllocated: row.usdtAllocated,
      megaAllocation: usdtToMega(row.usdtAllocated),
      icoPriceUsdt: ICO_PRICE_USDT,
      category: row.category,
    }
  }
  // Activity is optional in the carousel — keep it light: don't block on it
  try {
    const act = await getActivity(wallet, out.allocation?.megaAllocation || 0)
    out.claimed = !!act?.claim
    out.sold = act?.totals ? {
      soldPct: act.totals.soldPct,
      transferredPct: act.totals.transferredPct,
      heldPct: act.totals.heldPct,
    } : null
  } catch (_) { /* ignore */ }
  return out
}

router.get("/", async (_req, res) => {
  const now = Date.now()
  if (cache.data && now - cache.at < CACHE_MS) return res.json(cache.data)
  try {
    const items = await Promise.all(FEATURED.map(buildOne))
    cache = { at: now, data: items }
    res.json(items)
  } catch (e) {
    res.status(502).json({ error: e.message })
  }
})

module.exports = router
