export type Identity = {
  handle: string
  displayName: string | null
  avatarUrl: string | null
  score: number | null
  profileLink: string
  wallets: string[]
}

export type Allocation = {
  wallet: string
  usdtAllocated: number
  usdtBid: number
  usdtRefund: number
  megaAllocation: number
  usdValueAtSale: number
  icoPriceUsdt: number
  category: string | null
  lockupStatus: string | null
}

export type Transfer = {
  hash: string
  blockNumber: number | null
  ts: number
  from: string
  to: string
  amount: number
  flow: 'in' | 'out' | 'other'
  functionName: string
  classification: 'received' | 'sold' | 'transferred' | 'other'
}

export type Activity = {
  claim: Transfer | null
  firstInbound: Transfer | null
  hasClaimed: boolean
  currentBalance: number | null
  totals: {
    megaAllocation: number
    currentBalance: number
    soldMega: number
    transferredMega: number
    heldMega: number
    soldPct: number
    transferredPct: number
    heldPct: number
    boughtBack: boolean
  } | null
  timeline: Transfer[]
  transferCount: number
}

export type Participant = {
  wallet: string | null
  identity: Identity | null
  wallets: string[]
  allocation: Allocation | null
  activity: Activity | null
  explorer?: string
  tokenContract?: string
  needsWalletPick?: boolean
  noParticipation?: boolean
  errors: Record<string, string>
}

export function fmtNumber(n: number | null | undefined, max = 2) {
  if (n == null || !isFinite(n)) return '—'
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: max }).format(n)
}

export function fmtUsd(n: number | null | undefined) {
  if (n == null || !isFinite(n)) return '—'
  return '$' + new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n)
}

export function fmtMega(n: number | null | undefined) {
  if (n == null || !isFinite(n)) return '—'
  return fmtNumber(n) + ' MEGA'
}

export function shortAddr(a: string | null | undefined) {
  if (!a) return ''
  return a.slice(0, 6) + '…' + a.slice(-4)
}

export function fmtTime(unixSec: number | null | undefined) {
  if (!unixSec) return '—'
  const d = new Date(unixSec * 1000)
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

export function megaExplorerTx(hash: string) {
  return `https://megaeth.blockscout.com/tx/${hash}`
}

export function megaExplorerAddr(addr: string) {
  return `https://megaeth.blockscout.com/address/${addr}`
}
