import { X, Clock } from 'lucide-react'

type Props = {
  items: string[]
  onPick: (s: string) => void
  onRemove: (s: string) => void
}

export default function RecentSearches({ items, onPick, onRemove }: Props) {
  if (!items.length) return null
  return (
    <div className="mt-3 flex items-center gap-2 flex-wrap">
      <span className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground">
        <Clock className="h-3 w-3" /> Recent
      </span>
      {items.map((s) => (
        <span
          key={s}
          className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card pl-2.5 pr-1 py-1 text-xs hover:border-primary/40 transition-colors"
        >
          <button
            type="button"
            onClick={() => onPick(s)}
            className="text-foreground/80 hover:text-foreground select-none"
          >
            {s.startsWith('0x') ? `${s.slice(0, 6)}…${s.slice(-4)}` : s}
          </button>
          <button
            type="button"
            onClick={() => onRemove(s)}
            aria-label="Remove"
            className="ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  )
}
