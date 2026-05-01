import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink } from 'lucide-react'
import { Identity, shortAddr, megaExplorerAddr } from '@/lib/types'

type Props = {
  wallet: string | null
  identity: Identity | null
}

export default function IdentityCard({ wallet, identity }: Props) {
  const initials = identity?.displayName?.[0]?.toUpperCase() || identity?.handle?.[0]?.toUpperCase() || '·'
  return (
    <Card className="p-5">
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 shrink-0 rounded-full bg-muted overflow-hidden flex items-center justify-center text-xl font-semibold">
          {identity?.avatarUrl ? (
            <img src={identity.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-muted-foreground">{initials}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {identity?.displayName && (
              <h2 className="text-lg font-semibold truncate">{identity.displayName}</h2>
            )}
            {identity?.handle && (
              <a
                href={identity.profileLink}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                @{identity.handle}
              </a>
            )}
            {identity?.score != null && (
              <Badge variant="secondary" className="text-xs">Ethos {identity.score}</Badge>
            )}
          </div>
          {wallet && (
            <div className="mt-1 flex items-center gap-1 font-mono text-sm text-muted-foreground">
              <span className="select-none">{shortAddr(wallet)}</span>
              <a
                href={megaExplorerAddr(wallet)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="View on MegaETH explorer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
