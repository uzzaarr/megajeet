// Resolve an X (Twitter) handle to EVM wallet(s) via the Ethos API.
//   1. GET /api/v2/user/by/x/{handle}  → user object (id, profileId, userkeys[])
//   2. If profileId is set → GET /api/v2/users/profileId:{profileId}/top-quality-wallet
//      returns the canonical wallet
//   3. Also pick out any "address:0x..." entries from userkeys[]
const ETHOS_BASE = "https://api.ethos.network"
const HEADERS = {
  accept: "application/json",
  "X-Ethos-Client": "megaeth-ico-dashboard@1.0",
}

function pushAddr(list, seen, raw) {
  if (!raw || typeof raw !== "string") return
  const a = raw.toLowerCase()
  if (!a.startsWith("0x") || a.length !== 42) return
  if (seen.has(a)) return
  seen.add(a)
  list.push(a)
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: HEADERS })
  if (res.status === 404) return null
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Ethos ${res.status} ${url}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

async function resolveXHandle(handle) {
  const clean = String(handle || "").replace(/^@/, "").trim()
  if (!clean) return null

  const user = await fetchJson(`${ETHOS_BASE}/api/v2/user/by/x/${encodeURIComponent(clean)}`)
  if (!user) return null

  const wallets = []
  const seen = new Set()

  // 1) walk userkeys
  if (Array.isArray(user.userkeys)) {
    for (const k of user.userkeys) {
      if (typeof k === "string" && k.startsWith("address:")) pushAddr(wallets, seen, k.slice(8))
    }
  }

  // 2) top-quality wallet (only when profileId is linked)
  if (user.profileId != null) {
    try {
      const top = await fetchJson(`${ETHOS_BASE}/api/v2/users/profileId:${user.profileId}/top-quality-wallet`)
      if (top?.address) pushAddr(wallets, seen, top.address)
    } catch (_) { /* non-fatal */ }
  }

  return {
    handle: user.username || clean,
    displayName: user.displayName || null,
    avatarUrl: user.avatarUrl || null,
    score: user.score ?? null,
    profileLink: user.links?.profile || `https://app.ethos.network/profile/x/${encodeURIComponent(clean)}`,
    wallets,
  }
}

module.exports = { resolveXHandle }
