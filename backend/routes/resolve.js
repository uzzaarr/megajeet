// GET /api/resolve?handle=<x_handle>
//   → { handle, displayName, avatarUrl, score, profileLink, wallets[] }
const { Router } = require("express")
const { resolveXHandle } = require("../services/ethos")

const router = Router()

router.get("/", async (req, res) => {
  const handle = String(req.query.handle || "").trim()
  if (!handle) return res.status(400).json({ error: "missing handle" })
  try {
    const profile = await resolveXHandle(handle)
    if (!profile) return res.status(404).json({ error: "X user not found on Ethos" })
    res.json(profile)
  } catch (e) {
    res.status(502).json({ error: e.message })
  }
})

module.exports = router
