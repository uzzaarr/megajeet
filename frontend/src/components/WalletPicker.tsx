import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { shortAddr } from '@/lib/types'

type Props = {
  open: boolean
  wallets: string[]
  handle: string | null
  onPick: (wallet: string) => void
  onClose: () => void
}

export default function WalletPicker({ open, wallets, handle, onPick, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pick a wallet</DialogTitle>
          <DialogDescription>
            {handle ? <>Multiple wallets linked to <span className="font-medium">@{handle}</span> participated in the sale. Choose which one to inspect.</> : 'Multiple participating wallets found. Pick one.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 mt-2">
          {wallets.map((w) => (
            <Button
              key={w}
              variant="outline"
              className="w-full justify-between font-mono select-none"
              onClick={() => onPick(w)}
            >
              <span className="select-none">{shortAddr(w)}</span>
              <span className="text-xs text-muted-foreground select-none">{w.slice(0, 14)}…</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
