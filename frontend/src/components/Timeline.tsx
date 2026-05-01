import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Transfer, fmtMega, fmtTime, shortAddr } from '@/lib/types'
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { useState } from 'react'

type Props = {
  activity: Activity | null
  walletAddress: string | null
  loading?: boolean
}

const PAGE = 20

export default function Timeline({ activity, walletAddress, loading }: Props) {
  const [shown, setShown] = useState(PAGE)
  if (loading) {
    return (
      <Card className="p-5">
        <div className="h-5 w-28 bg-muted rounded animate-pulse" />
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 bg-muted/40 rounded animate-pulse" />
          ))}
        </div>
      </Card>
    )
  }
  const items = (activity?.timeline || []).slice().reverse() // newest first
  if (items.length === 0) {
    return (
      <Card className="p-5">
        <div className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Activity</div>
        <div className="mt-3 text-sm text-muted-foreground">No MEGA token activity on MegaETH L2.</div>
      </Card>
    )
  }
  return (
    <Card className="p-5">
      <div className="flex items-baseline justify-between">
        <div className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Activity</div>
        <div className="text-xs text-muted-foreground tabular-nums">{items.length} events</div>
      </div>
      <ul className="mt-4 divide-y divide-border">
        {items.slice(0, shown).map((t) => (
          <Row key={t.hash + t.from + t.to + t.amount} t={t} wallet={walletAddress} />
        ))}
      </ul>
      {shown < items.length && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setShown((s) => s + PAGE)}
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            Show {Math.min(PAGE, items.length - shown)} more
          </button>
        </div>
      )}
    </Card>
  )
}

function classBadge(c: Transfer['classification']) {
  if (c === 'sold') return { label: 'Sold', cls: 'border-rose-500/40 text-rose-500 bg-rose-500/5' }
  if (c === 'transferred') return { label: 'Transferred', cls: 'border-amber-400/40 text-amber-400 bg-amber-400/5' }
  if (c === 'received') return { label: 'Received', cls: 'border-emerald-500/40 text-emerald-500 bg-emerald-500/5' }
  return { label: 'Other', cls: 'border-muted-foreground/30 text-muted-foreground' }
}

function Row({ t, wallet }: { t: Transfer; wallet: string | null }) {
  const cb = classBadge(t.classification)
  const isOut = t.flow === 'out'
  const counterparty = isOut ? t.to : t.from
  return (
    <li className="py-3 flex items-center gap-3 text-sm">
      <span className="shrink-0 text-muted-foreground">
        {isOut ? <ArrowUpFromLine className="h-4 w-4" /> : <ArrowDownToLine className="h-4 w-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="tabular-nums font-medium">
            {isOut ? '−' : '+'}{fmtMega(t.amount)}
          </span>
          <Badge variant="outline" className={`text-[10px] font-normal ${cb.cls}`}>{cb.label}</Badge>
          {t.functionName && (
            <span className="font-mono text-[11px] text-muted-foreground truncate" title={t.functionName}>
              {t.functionName.split('(')[0]}
            </span>
          )}
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
          <span>{fmtTime(t.ts)}</span>
          <span>·</span>
          <span>{isOut ? 'to' : 'from'} <span className="font-mono select-none">{shortAddr(counterparty)}</span></span>
        </div>
      </div>
    </li>
  )
}
