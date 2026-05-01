// ICO allocation snapshot — loaded from bundled JSON, no API calls needed.
// Data is static (ICO already completed); re-run scripts/fetch-snapshot.js
// only if the source data ever needs to be updated.

const rows = require("../data/allocations.json")

const map = new Map()
for (const row of rows) map.set(row.wallet, row)

function getAllocation(address) {
  if (!address) return null
  return map.get(address.toLowerCase()) || null
}

function snapshotMeta() {
  return { loaded: true, rowCount: map.size }
}

module.exports = { getAllocation, snapshotMeta }
