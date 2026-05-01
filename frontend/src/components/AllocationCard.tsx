import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Allocation, fmtMega, fmtNumber, fmtUsd } from '@/lib/types'

type Props = {
  allocation: Allocation | null
  loading?: boolean
  notFound?: boolean
}

export default function AllocationCard({ allocation, loading, notFound }: Props) {
  if (loading) {
    return (
      <Card className="p-5">
        <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="h-16 bg-muted/60 rounded animate-pulse" />
          <div className="h-16 bg-muted/60 rounded animate-pulse" />
          <div className="h-16 bg-muted/60 rounded animate-pulse" />
        </div>
      </Card>
    )
  }
  if (notFound || !allocation) {
    return (
      <Card className="p-5">
        <div className="text-sm font-medium uppercase tracking-wide text-muted-foreground">ICO allocation</div>
        <div className="mt-3 text-base">This wallet didn't participate in the MegaETH public sale.</div>
        <div className="mt-1 text-xs text-muted-foreground">Not found in the snapshot of public-sale bidders.</div>
      </Card>
    )
  }
  return (
    <Card className="p-5">
      <div className="flex items-baseline justify-between">
        <div className="text-sm font-medium uppercase tracking-wide text-muted-foreground">ICO allocation</div>
        {allocation.category && <Badge variant="outline" className="text-xs font-normal">{allocation.category}</Badge>}
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <div className="text-xs text-muted-foreground">USDT allocated</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{fmtUsd(allocation.usdtAllocated)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">MEGA tokens</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{fmtNumber(allocation.megaAllocation, 0)}</div>
          <div className="text-xs text-muted-foreground">at ${allocation.icoPriceUsdt.toFixed(4)} / MEGA</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Bid → Refund</div>
          <div className="mt-1 text-base tabular-nums">{fmtUsd(allocation.usdtBid)}</div>
          <div className="text-xs text-muted-foreground">refunded {fmtUsd(allocation.usdtRefund)}</div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
        {allocation.lockupStatus && <span>Lockup: <span className="text-foreground">{allocation.lockupStatus}</span></span>}
      </div>
    </Card>
  )
}

export function AllocationCardSkeleton() {
  return <AllocationCard allocation={null} loading />
}
