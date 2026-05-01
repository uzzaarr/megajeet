// GET /api/activity?address=<wallet>&megaAllocation=<number>
//   → { claim, totals, timeline[], transferCount }
const { Router } = require("express")
const { getActivity } = require("../services/blockscout")

const router = Router()

router.get("/", async (req, res) => {
  const address = String(req.query.address || "").trim()
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return res.status(400).json({ error: "invalid address" })
  }
  const allocRaw = req.query.megaAllocation
  const megaAllocation = allocRaw == null ? 0 : Number(allocRaw)
  try {
    const result = await getActivity(address, megaAllocation || 0)
    res.json(result)
  } catch (e) {
    res.status(502).json({ error: e.message })
  }
})

module.exports = router
