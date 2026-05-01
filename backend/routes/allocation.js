// GET /api/allocation?address=<wallet>
//   → { wallet, usdtAllocated, megaAllocation, usdValueAtSale, category, lockupStatus }
const { Router } = require("express")
const { getAllocation, snapshotMeta } = require("../services/dune")
const { ICO_PRICE_USDT, usdtToMega } = require("../config/megaeth")

const router = Router()

router.get("/_meta", (_req, res) => res.json(snapshotMeta()))

router.get("/", async (req, res) => {
  const address = String(req.query.address || "").trim()
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return res.status(400).json({ error: "invalid address" })
  }
  try {
    const row = await getAllocation(address)
    if (!row) {
      return res.status(404).json({
        error: "Wallet not in MegaETH ICO snapshot",
        wallet: address.toLowerCase(),
      })
    }
    res.json({
      wallet: row.wallet,
      usdtAllocated: row.usdtAllocated,
      usdtBid: row.usdtBid,
      usdtRefund: row.usdtRefund,
      megaAllocation: usdtToMega(row.usdtAllocated),
      usdValueAtSale: row.usdtAllocated, // sale price denominated USD ≈ USDT
      icoPriceUsdt: ICO_PRICE_USDT,
      category: row.category,
      lockupStatus: row.lockupStatus,
    })
  } catch (e) {
    if (e.code === "DUNE_UNAVAILABLE") {
      return res.status(503).json({ error: e.message, code: "DUNE_UNAVAILABLE" })
    }
    res.status(502).json({ error: e.message })
  }
})

module.exports = router
