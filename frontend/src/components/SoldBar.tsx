import { Card } from '@/components/ui/card'
import { Activity, fmtMega } from '@/lib/types'

type Props = {
  activity: Activity | null
  loading?: boolean
}

export default function SoldBar({ activity, loading }: Props) {
  if (loading) {
    return (
      <Card className="p-5">
        <div className="h-5 w-32 bg-muted rounded animate-pulse" />
        <div className="mt-4 h-3 bg-muted/60 rounded animate-pulse" />
        <div className="mt-3 h-8 bg-muted/40 rounded animate-pulse" />
      </Card>
    )
  }

  // Pre-claim: nothing on-chain yet, so disposition is undefined.
  if (activity && activity.hasClaimed === false) {
    return (
      <Card className="p-5">
        <div className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Disposition</div>
        <div className="mt-3 text-sm text-muted-foreground">
          Wallet hasn't claimed MEGA on MegaETH L2 yet — nothing to dispose.
        </div>
      </Card>
    )
  }

  const t = activity?.totals
  if (!t || t.megaAllocation <= 0) {
    return (
      <Card className="p-5">
        <div className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Disposition</div>
        <div className="mt-3 text-sm text-muted-foreground">
          No allocation reference — can't compute % held vs sold.
        </div>
      </Card>
    )
  }
  // Cap percentages at 100 visually for the bar (when activity exceeds allocation,
  // e.g. wallet bought more on top).
  const sold = Math.min(100, Math.max(0, t.soldPct))
  const transferred = Math.min(100 - sold, Math.max(0, t.transferredPct))
  const held = Math.max(0, 100 - sold - transferred)

  return (
    <Card className="p-5">
      <div className="flex items-baseline justify-between">
        <div className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Disposition</div>
        <div className="text-xs text-muted-foreground tabular-nums">
          of {fmtMega(t.megaAllocation)} allocated
        </div>
      </div>
      <div className="mt-4 h-3 w-full rounded-full overflow-hidden bg-muted flex">
        {sold > 0 && <div className="h-full bg-rose-500" style={{ width: `${sold}%` }} />}
        {transferred > 0 && <div className="h-full bg-amber-400" style={{ width: `${transferred}%` }} />}
        {held > 0 && <div className="h-full bg-emerald-500" style={{ width: `${held}%` }} />}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat label="Net sold" pct={t.soldPct} mega={t.soldMega} dotClass="bg-rose-500" />
        <Stat label="Net transferred" pct={t.transferredPct} mega={t.transferredMega} dotClass="bg-amber-400" />
        <Stat label="Currently held" pct={t.heldPct} mega={t.heldMega} dotClass="bg-emerald-500" />
      </div>
      <div className="mt-3 text-xs text-muted-foreground leading-relaxed">
        Net-balance method: <span className="text-foreground">held</span> is the wallet's current MEGA balance,
        <span className="text-foreground"> disposed</span> = allocation − held, then split into sold vs transferred
        by the swap-vs-transfer ratio of outflows. Buybacks reduce "net sold".
        {t.boughtBack && (
          <span className="block mt-1 text-emerald-500">
            ↑ Wallet currently holds more MEGA than allocated (bought back / additional accumulation).
          </span>
        )}
      </div>
    </Card>
  )
}

function Stat({ label, pct, mega, dotClass }: { label: string; pct: number; mega: number; dotClass: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className={`inline-block h-2 w-2 rounded-full ${dotClass}`} />
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{pct.toFixed(1)}%</div>
      <div className="text-xs text-muted-foreground tabular-nums">{fmtMega(mega)}</div>
    </div>
  )
}
