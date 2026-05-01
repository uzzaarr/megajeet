// Curated featured ICO participants. The user gave us specific
// X-handle → wallet-position pairs because Ethos returns multiple
// wallets per user and only one of them holds the ICO allocation.
// `walletIndex` is the 0-based position in the address-userkeys we
// extract from Ethos (and `walletAddress` is the explicit override
// when we know the exact wallet).

exports.FEATURED = [
  { handle: "JoestarCrypto", walletIndex: 0,
    walletAddress: "0x6e6dFbD557bCC90a5F743aB2BcFD24F7454992c9" },
  { handle: "Xeer", walletIndex: 1,
    walletAddress: "0x8f2df56bCeCB03e9118a8c78b454e7eCf1592872" },
  { handle: "waleswoosh", walletIndex: 2,
    walletAddress: "0xA6A279Ae513d06ACD243EbA5406e3CeBEd342FB8" },
  { handle: "heycape_", walletIndex: 1,
    walletAddress: "0x9d3F56186CE4bA86214AE9127e07491f2449D698" },
  { handle: "mteamisloading", walletIndex: 0,
    walletAddress: "0x35F95dDec37A8b6FAA795B143cbcF233D468f66F" },
]
