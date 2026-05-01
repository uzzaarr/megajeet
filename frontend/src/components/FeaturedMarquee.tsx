import type { Featured } from './LivePreview'
import { fmtUsd } from '@/lib/types'

type Props = {
  items: Featured[]
  onOpen: (handle: string, wallet?: string) => void
}

// Infinite horizontal marquee. We render the list 2x; the wrapper is animated
// from 0 to -50% so the second copy slides in seamlessly when the first leaves.
export default function FeaturedMarquee({ items, onOpen }: Props) {
  if (!items?.length) return null
  const doubled = [...items, ...items]
  return (
    <div className="relative overflow-hidden" aria-label="Featured ICO participants">
      {/* edge fade masks */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 sm:w-20 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 sm:w-20 bg-gradient-to-l from-background to-transparent" />

      <div className="marquee-track flex gap-3 w-max">
        {doubled.map((it, idx) => (
          <FeaturedCard key={`${it.handle}-${idx}`} item={it} onOpen={onOpen} />
        ))}
      </div>

      <style>{`
        @keyframes featured-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: featured-marquee 50s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track { animation: none; }
        }
      `}</style>
    </div>
  )
}

function FeaturedCard({ item, onOpen }: { item: Featured; onOpen: (h: string, w?: string) => void }) {
  const initials = item.displayName?.[0]?.toUpperCase() || item.handle[0]?.toUpperCase() || '·'
  const usdt = item.allocation?.usdtAllocated ?? null
  return (
    <button
      type="button"
      onClick={() => onOpen('@' + item.handle, item.wallet)}
      className="group shrink-0 w-[260px] rounded-xl border border-border/60 bg-card hover:bg-card/80 hover:border-primary/40 transition-colors p-3 text-left"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-muted overflow-hidden flex items-center justify-center text-sm font-semibold">
          {item.avatarUrl ? (
            <img src={item.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-muted-foreground">{initials}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">{item.displayName || item.handle}</div>
          <div className="text-xs text-muted-foreground truncate">@{item.handle}</div>
        </div>
        {item.score != null && (
          <div className="text-right shrink-0 leading-tight">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Ethos</div>
            <div className="text-xs font-semibold tabular-nums">{item.score}</div>
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Allocation</span>
        <span className="text-base font-semibold tabular-nums">{usdt != null ? fmtUsd(usdt) : '—'}</span>
      </div>
    </button>
  )
}
