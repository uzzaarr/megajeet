// MegaETH ICO dashboard constants
exports.MEGA_TOKEN_ADDRESS = "0x28B7E77f82B25B95953825F1E3eA0E36c1c29861"
exports.MEGA_DECIMALS = 18
exports.MEGA_SYMBOL = "MEGA"
exports.ICO_PRICE_USDT = 0.0999
exports.TGE_DATE_ISO = "2026-04-30"
exports.TGE_DATE_TS = Math.floor(new Date("2026-04-30T00:00:00Z").getTime() / 1000)
exports.DISTRIBUTOR_ADDRESS = "0x847f754511d10f603e950359461c78fcc72075ee"

exports.BLOCKSCOUT_BASE_URL = "https://megaeth.blockscout.com"
exports.BLOCKSCOUT_API_KEY = process.env.BLOCKSCOUT_API_KEY
exports.MEGAETH_EXPLORER_TX = (hash) => `https://megaeth.blockscout.com/tx/${hash}`
exports.MEGAETH_EXPLORER_ADDR = (addr) => `https://megaeth.blockscout.com/address/${addr}`

exports.DUNE_QUERY_ID = 6275079
exports.DUNE_API_KEY = process.env.DUNE_API_KEY

// Patterns matched against tokentx.functionName from Blockscout to classify outflows.
// Anything matching these = swap/sold; everything else = transferred.
exports.SWAP_METHOD_PATTERNS = [
  /^multicall\b/i,
  /^swap/i,
  /^exactInput/i,
  /^exactOutput/i,
  /^execute\b/i, // universal router
]

exports.classifyOutflow = (functionName) => {
  if (!functionName) return "transferred"
  for (const re of exports.SWAP_METHOD_PATTERNS) if (re.test(functionName)) return "sold"
  return "transferred"
}

exports.usdtToMega = (usdt) => Number(usdt) / exports.ICO_PRICE_USDT
