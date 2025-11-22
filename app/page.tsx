export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-6xl font-bold tracking-tight">🎒 BagBack</h1>
            <p className="text-2xl text-muted-foreground">The more you bag, the more you get back.</p>
          </div>

          <div className="bg-card border rounded-lg p-8 space-y-6 text-left">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Concept</h2>
              <p className="text-muted-foreground">
                BagBack ($BB) is a supply-return experiment where half of the supply is locked and later given back to
                holders in a proportional airdrop once the circulating half is fully bought.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-semibold">How It Works</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex gap-2">
                  <span>•</span>
                  <span>
                    <strong>Total Supply:</strong> 1,000,000,000 tokens
                  </span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>
                    <strong>Initial Purchase:</strong> Dev buys 500M tokens from pump.fun
                  </span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>
                    <strong>Locked Amount:</strong> 490M tokens locked via Streamflow
                  </span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>
                    <strong>Unlock Trigger:</strong> When 490M circulating tokens are sold
                  </span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>
                    <strong>Airdrop:</strong> Proportional distribution to all holders
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-muted/50 rounded-lg p-6 space-y-2">
              <h4 className="font-semibold">Example</h4>
              <p className="text-sm text-muted-foreground">
                If you hold 10M tokens when the threshold is reached, you'll receive an additional 10M tokens in the
                airdrop. Your bag doubles!
              </p>
            </div>
          </div>

          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="https://x.com/i/communities/1992071293148287015"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Join Community on X
            </a>
            <a
              href="https://github.com/ErenFlux/BagBack"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 border rounded-lg font-semibold hover:bg-accent transition-colors"
            >
              View on GitHub
            </a>
          </div>

          <div className="text-sm text-muted-foreground pt-8">
            <p>Automated bot monitors circulation and handles proportional airdrops.</p>
            <p className="mt-2">Built on Solana with Helius RPC and Streamflow integration.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
