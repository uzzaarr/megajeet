import { Card } from '@/components/ui/card'
import { Activity, Allocation, fmtMega, fmtTime, shortAddr } from '@/lib/types'
import { CheckCircle2, Clock } from 'lucide-react'

type Props = {
  activity: Activity | null
  allocation: Allocation | null
  loading?: boolean
}

const TGE_TS = Math.floor(new Date('2026-04-30T00:00:00Z').getTime() / 1000)

export default function ClaimBadge({ activity, allocation, loading }: Props) {
  if (loading) {
    return (
      <Card className="p-5">
        <div className="h-5 w-40 bg-muted rounded animate-pulse" />
        <div className="mt-3 h-12 bg-muted/60 rounded animate-pulse" />
      </Card>
    )
  }

  const claim = activity?.claim
  const firstInbound = activity?.firstInbound
  const expectedMega = allocation?.megaAllocation ?? 0
  const claimedToday = !!claim && claim.ts >= TGE_TS

  // Cases:
  //   1. Claimed today → show ✅ + tx
  //   2. Has inbound MEGA, but before TGE date → unusual, show with warning
  //   3. No inbound MEGA at all → not claimed yet
  //   4. No allocation expected at all → just show "Holds MEGA" or nothing
  return (
    <Card className="p-5">
      <div className="text-sm font-medium uppercase tracking-wide text-muted-foreground">TGE claim</div>
      {claimedToday ? (
        <div className="mt-3">
          <div className="flex items-center gap-2 text-emerald-500">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Claimed on TGE day</span>
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Amount received</div>
              <div className="tabular-nums">{fmtMega(claim!.amount)}</div>
              {expectedMega > 0 && (
                <div className="text-xs text-muted-foreground">
                  expected {fmtMega(expectedMega)} ({((claim!.amount / expectedMega) * 100).toFixed(1)}%)
                </div>
              )}
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Time</div>
              <div>{fmtTime(claim!.ts)}</div>
            </div>
            <div className="sm:col-span-2 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">From</span>
              <span className="font-mono text-xs select-none">{shortAddr(claim!.from)}</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="font-mono text-xs select-none">{shortAddr(claim!.hash)}</span>
            </div>
          </div>
        </div>
      ) : firstInbound ? (
        <div className="mt-3">
          <div className="flex items-center gap-2 text-amber-500">
            <Clock className="h-5 w-5" />
            <span className="font-medium">First MEGA received before TGE date</span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {fmtTime(firstInbound.ts)} — {fmtMega(firstInbound.amount)}
          </div>
        </div>
      ) : expectedMega > 0 ? (
        <div className="mt-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-5 w-5" />
            <span className="font-medium">Not claimed yet</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            No inbound MEGA on MegaETH L2 for this wallet. Expected {fmtMega(expectedMega)}.
          </div>
        </div>
      ) : (
        <div className="mt-3 text-sm text-muted-foreground">No claim activity.</div>
      )}
    </Card>
  )
}
