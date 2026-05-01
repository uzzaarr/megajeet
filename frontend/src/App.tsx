import { useState, useMemo, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Search, AlertCircle, Calendar } from 'lucide-react'
import { api } from '@/lib/api'
import { Participant } from '@/lib/types'
import IdentityCard from '@/components/IdentityCard'
import AllocationCard from '@/components/AllocationCard'
import ClaimBadge from '@/components/ClaimBadge'
import SoldBar from '@/components/SoldBar'
import Timeline from '@/components/Timeline'
import WalletPicker from '@/components/WalletPicker'
import LivePreview, { Featured } from '@/components/LivePreview'
import FeaturedMarquee from '@/components/FeaturedMarquee'
import RecentSearches from '@/components/RecentSearches'

type SearchKey = { input: string; wallet?: string } | null

const RECENT_KEY = 'megaeth-ico-recent'
const RECENT_MAX = 6

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string').slice(0, RECENT_MAX) : []
  } catch { return [] }
}
function saveRecent(list: string[]) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_MAX))) } catch { /* */ }
}

export default function App() {
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState<SearchKey>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [recent, setRecent] = useState<string[]>(() => typeof window !== 'undefined' ? loadRecent() : [])

  // Featured list (for live preview + marquee)
  const { data: featuredList = [], isLoading: featuredLoading } = useQuery<Featured[]>({
    queryKey: ['featured'],
    queryFn: async () => {
      const res = await fetch(api('featured'))
      if (!res.ok) throw new Error(`featured ${res.status}`)
      return res.json()
    },
    staleTime: 5 * 60_000,
  })

  // Rotate the live preview through the featured list every 6s
  const [livePreviewIdx, setLivePreviewIdx] = useState(0)
  useEffect(() => {
    if (!featuredList.length) return
    const t = setInterval(() => {
      setLivePreviewIdx((i) => (i + 1) % featuredList.length)
    }, 6000)
    return () => clearInterval(t)
  }, [featuredList.length])
  const livePreview = featuredList[livePreviewIdx] ?? featuredList[0] ?? null

  // Detail query
  const queryString = useMemo(() => {
    if (!query) return ''
    const p = new URLSearchParams({ input: query.input })
    if (query.wallet) p.set('wallet', query.wallet)
    return p.toString()
  }, [query])

  const { data, isLoading, isError, error, refetch } = useQuery<Participant>({
    queryKey: ['participant', queryString],
    queryFn: async () => {
      const res = await fetch(api(`participant?${queryString}`))
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`)
      return json as Participant
    },
    enabled: !!queryString,
    staleTime: 60_000,
  })

  useEffect(() => {
    if (data?.needsWalletPick && (data.wallets?.length ?? 0) > 1) setPickerOpen(true)
  }, [data])

  const submit = useCallback((raw: string, wallet?: string) => {
    const value = raw.trim()
    if (!value) return
    setDraft(value)
    setQuery({ input: value, wallet })
    setPickerOpen(false)
    setRecent((prev) => {
      const next = [value, ...prev.filter((x) => x.toLowerCase() !== value.toLowerCase())].slice(0, RECENT_MAX)
      saveRecent(next)
      return next
    })
    // scroll to results after a frame
    requestAnimationFrame(() => {
      document.getElementById('results-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  const removeRecent = (s: string) => {
    setRecent((prev) => {
      const next = prev.filter((x) => x !== s)
      saveRecent(next)
      return next
    })
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
        {/* Top eyebrow */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="inline-flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="uppercase tracking-widest">MegaETH ICO Dashboard</span>
          </div>
          <span className="hidden sm:inline">Powered by Dune · Ethos · Blockscout</span>
        </div>

        {/* Hero: two-column on lg */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 lg:gap-10 items-start">
          {/* Left column */}
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
              Track any wallet's <span className="text-brand-100">MegaETH ICO</span> allocation
            </h1>
            <p className="mt-4 inline-flex items-start gap-2 text-base text-muted-foreground max-w-xl">
              <Calendar className="h-4 w-4 mt-1 shrink-0" />
              <span>
                Enter an X handle or wallet. We resolve linked wallets through Ethos,
                pull the public-sale allocation from Dune, then show what's claimed,
                sold, and held on MegaETH L2 since TGE.
              </span>
            </p>

            <form
              onSubmit={(e) => { e.preventDefault(); submit(draft) }}
              className="mt-6 group relative rounded-xl border-2 border-brand-100/70 bg-card focus-within:border-brand-100 transition-colors"
            >
              <div className="flex items-center pl-4 pr-1 py-1">
                <Search className="h-4 w-4 text-muted-foreground" />
                <span className="ml-2 text-muted-foreground select-none">@</span>
                <Input
                  value={draft.startsWith('@') ? draft.slice(1) : draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Escape') setDraft('') }}
                  placeholder="username or 0xabc…"
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base h-12 placeholder:text-muted-foreground/60"
                />
                <Button
                  type="submit"
                  disabled={!draft.trim() || isLoading}
                  className="h-10 px-5 shrink-0 bg-brand-100 hover:bg-brand-100/90 text-white"
                >
                  {isLoading ? 'Loading…' : 'Search'}
                </Button>
              </div>
            </form>

            <RecentSearches items={recent} onPick={submit} onRemove={removeRecent} />
          </div>

          {/* Right column: live preview */}
          <LivePreview item={livePreview} loading={featuredLoading} onOpen={submit} />
        </div>

        {/* Try one of these: marquee */}
        <section className="mt-12">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3 px-1">
            Try one of these
          </div>
          <FeaturedMarquee items={featuredList} onOpen={submit} />
        </section>

        <div id="results-anchor" />

        {/* Error state */}
        {isError && (
          <div className="mt-8">
            <Card className="p-5 border-destructive/40">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">{(error as Error)?.message || 'Failed to load.'}</span>
              </div>
              <div className="mt-2">
                <Button variant="outline" size="sm" onClick={() => refetch()}>Try again</Button>
              </div>
            </Card>
          </div>
        )}

        {/* No-participation state — handle resolved, but none of their wallets bid */}
        {data?.noParticipation && !isLoading && !isError && (
          <div className="mt-12">
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 shrink-0 rounded-full bg-muted overflow-hidden flex items-center justify-center text-lg font-semibold">
                  {data.identity?.avatarUrl ? (
                    <img src={data.identity.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-muted-foreground">
                      {data.identity?.handle?.[0]?.toUpperCase() || '·'}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm uppercase tracking-widest text-muted-foreground">Did not participate</div>
                  <div className="mt-1 text-lg font-semibold">
                    @{data.identity?.handle} has no wallets in the MegaETH public sale
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Ethos linked {data.wallets.length} wallet{data.wallets.length === 1 ? '' : 's'} to this account, but none of them appear in the Dune allocation snapshot.
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Detail */}
        {(query || isLoading) && !isError && !data?.noParticipation && !data?.needsWalletPick && (
          <div className="mt-12 space-y-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground px-1">
              Result
            </div>
            <IdentityCard wallet={data?.wallet ?? null} identity={data?.identity ?? null} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <AllocationCard
                allocation={data?.allocation ?? null}
                loading={isLoading}
                notFound={!isLoading && !!data && !data.allocation && !data.errors?.allocation}
              />
              <ClaimBadge
                activity={data?.activity ?? null}
                allocation={data?.allocation ?? null}
                loading={isLoading}
              />
            </div>
            <SoldBar activity={data?.activity ?? null} loading={isLoading} />
            <Timeline
              activity={data?.activity ?? null}
              walletAddress={data?.wallet ?? null}
              loading={isLoading}
            />

            {data?.errors?.allocation && (
              <Card className="p-4 border-amber-500/30 text-sm text-amber-400">
                Allocation source error: {data.errors.allocation}
              </Card>
            )}
            {data?.errors?.activity && (
              <Card className="p-4 border-amber-500/30 text-sm text-amber-400">
                Activity source error: {data.errors.activity}
              </Card>
            )}
            {data?.errors?.wallets && (
              <Card className="p-4 border-amber-500/30 text-sm text-amber-400">
                {data.errors.wallets} — try entering a wallet address directly.
              </Card>
            )}
          </div>
        )}

        <footer className="mt-20 pt-6 border-t border-border/40 text-xs text-muted-foreground flex flex-wrap justify-between gap-2">
          <span>Allocation from Dune query 6275079 · X→wallet via Ethos · MEGA activity from megaeth.blockscout.com.</span>
          <span>TGE: 30 Apr 2026</span>
        </footer>
      </div>

      <WalletPicker
        open={pickerOpen}
        wallets={data?.wallets ?? []}
        handle={data?.identity?.handle ?? null}
        onPick={(w) => {
          if (!query) return
          setQuery({ input: query.input, wallet: w })
          setPickerOpen(false)
        }}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  )
}
