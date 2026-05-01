import { ArrowUpRight, ExternalLink } from 'lucide-react'
import { fmtUsd, fmtNumber, shortAddr } from '@/lib/types'

export type Featured = {
  handle: string
  displayName: string | null
  avatarUrl: string | null
  score: number | null
  profileLink: string
  wallet: string
  allocation: {
    usdtAllocated: number
    megaAllocation: number
    icoPriceUsdt: number
    category: string | null
  } | null
  sold: { soldPct: number; transferredPct: number; heldPct: number } | null
  claimed: boolean | null
}

type Props = {
  item: Featured | null
  loading?: boolean
  onOpen: (handle: string, wallet?: string) => void
}

export default function LivePreview({ item, loading, onOpen }: Props) {
  if (loading || !item) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 min-h-[220px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-emerald-500">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live preview
          </div>
        </div>
        <div className="mt-6 h-12 w-3/4 rounded bg-muted/60 animate-pulse" />
        <div className="mt-3 h-4 w-1/2 rounded bg-muted/40 animate-pulse" />
        <div className="mt-8 h-10 w-2/3 rounded bg-muted/40 animate-pulse" />
      </div>
    )
  }

  const initials = item.displayName?.[0]?.toUpperCase() || item.handle[0]?.toUpperCase() || '·'
  const usdt = item.allocation?.usdtAllocated ?? 0
  const mega = item.allocation?.megaAllocation ?? 0
  return (
    <button
      type="button"
      onClick={() => onOpen('@' + item.handle, item.wallet)}
      className="group block w-full text-left rounded-2xl border border-border/60 bg-card p-5 sm:p-6 hover:border-primary/40 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-emerald-500">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Live preview
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </div>

      <div className="mt-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 shrink-0 rounded-full bg-muted overflow-hidden flex items-center justify-center text-sm font-semibold">
            {item.avatarUrl ? (
              <img src={item.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-muted-foreground">{initials}</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="font-semibold truncate">{item.displayName || item.handle}</div>
            <div className="text-xs text-muted-foreground truncate">@{item.handle}</div>
          </div>
        </div>
        {item.score != null && (
          <div className="text-right shrink-0">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Ethos</div>
            <div className="text-base font-semibold tabular-nums">{fmtNumber(item.score, 0)}</div>
          </div>
        )}
      </div>

      <div className="mt-5">
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground">USDT allocation</div>
        <div className="mt-1 text-3xl sm:text-4xl font-semibold tabular-nums">{fmtUsd(usdt)}</div>
        <div className="mt-1 text-xs text-muted-foreground tabular-nums">
          ≈ {fmtNumber(mega, 0)} MEGA
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-mono select-none">{shortAddr(item.wallet)}</span>
        <span className="inline-flex items-center gap-1 group-hover:text-foreground transition-colors">
          click to open <ExternalLink className="h-3 w-3" />
        </span>
      </div>
    </button>
  )
}
