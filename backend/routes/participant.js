// GET /api/participant?input=<wallet|@handle>&wallet=<optional override>
//
// Orchestrates Ethos → Dune → Blockscout into a single payload:
//   { identity, allocation, activity, errors }
// Each source can fail independently; the corresponding field is null with an
// entry under `errors`.
const { Router } = require("express")
const { resolveXHandle } = require("../services/ethos")
const { getAllocation } = require("../services/dune")
const { getActivity } = require("../services/blockscout")
const {
  ICO_PRICE_USDT,
  usdtToMega,
  MEGA_TOKEN_ADDRESS,
  MEGAETH_EXPLORER_ADDR,
} = require("../config/megaeth")

const router = Router()

const ADDR_RE = /^0x[a-fA-F0-9]{40}$/

router.get("/", async (req, res) => {
  const input = String(req.query.input || "").trim()
  const walletOverride = String(req.query.wallet || "").trim().toLowerCase()
  if (!input && !walletOverride) {
    return res.status(400).json({ error: "missing input" })
  }

  const errors = {}
  let identity = null
  let wallet = null

  if (walletOverride && ADDR_RE.test(walletOverride)) {
    wallet = walletOverride
    if (!ADDR_RE.test(input)) {
      // X handle that came in alongside an explicit wallet — resolve identity for display
      try {
        identity = await resolveXHandle(input)
      } catch (e) { errors.ethos = e.message }
    }
  } else if (ADDR_RE.test(input)) {
    wallet = input.toLowerCase()
  } else {
    // Treat as X handle.
    try {
      identity = await resolveXHandle(input)
    } catch (e) { errors.ethos = e.message }

    if (!identity) {
      return res.status(404).json({ error: `No Ethos profile for "${input}"` })
    }
    if (identity.wallets.length === 0) {
      return res.json({
        identity,
        wallets: [],
        wallet: null,
        allocation: null,
        activity: null,
        errors: { wallets: "Ethos has no wallets linked to this X account" },
      })
    }

    // Filter Ethos's wallet list down to ones that actually participated in
    // the sale. If Ethos returns 5 wallets but only 1 has an allocation, we
    // skip the picker entirely and lock onto the participating wallet.
    const allocLookups = await Promise.all(
      identity.wallets.map(async (w) => {
        try {
          const row = await getAllocation(w)
          return row ? w : null
        } catch { return null }
      })
    )
    const participatingWallets = allocLookups.filter(Boolean)

    if (participatingWallets.length === 0) {
      return res.json({
        identity,
        wallets: identity.wallets,
        wallet: null,
        allocation: null,
        activity: null,
        noParticipation: true,
        errors: { wallets: `@${identity.handle} has no wallets that participated in the MegaETH ICO sale` },
      })
    }

    if (participatingWallets.length > 1) {
      return res.json({
        identity,
        wallets: participatingWallets,
        wallet: null,
        allocation: null,
        activity: null,
        needsWalletPick: true,
        errors,
      })
    }

    wallet = participatingWallets[0]
  }

  // Allocation
  let allocation = null
  try {
    const row = await getAllocation(wallet)
    if (row) {
      allocation = {
        wallet: row.wallet,
        usdtAllocated: row.usdtAllocated,
        usdtBid: row.usdtBid,
        usdtRefund: row.usdtRefund,
        megaAllocation: usdtToMega(row.usdtAllocated),
        usdValueAtSale: row.usdtAllocated,
        icoPriceUsdt: ICO_PRICE_USDT,
        category: row.category,
        lockupStatus: row.lockupStatus,
      }
    }
  } catch (e) {
    errors.allocation = e.message
  }

  // Activity (always fetched — even non-participants might still hold MEGA)
  let activity = null
  try {
    activity = await getActivity(wallet, allocation?.megaAllocation || 0)
  } catch (e) {
    errors.activity = e.message
  }

  res.json({
    wallet,
    identity,
    wallets: identity?.wallets || [wallet],
    allocation,
    activity,
    explorer: MEGAETH_EXPLORER_ADDR(wallet),
    tokenContract: MEGA_TOKEN_ADDRESS,
    errors,
  })
})

module.exports = router
