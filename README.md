# 🎒 BagBack Bot

**The more you bag, the more you get back.**

## Community

Join our X Community: [BagBack Community](https://x.com/i/communities/1992071293148287015/)

GitHub: [ErenFlux/BagBack](https://github.com/ErenFlux/BagBack)

## Concept

BagBack ($BB) is a supply-return experiment where half of the supply is locked and later given back to holders in a proportional airdrop once the circulating half is fully bought.

## How It Works

1. **Total Supply**: 1 billion $BB tokens
2. **Initial Distribution**: Dev buys 500 million from pump.fun
3. **Lock Mechanism**: 490 million tokens locked on streamflow.finance
4. **Trigger**: When 490M tokens are sold from circulating supply
5. **Snapshot**: Automatic snapshot of all holders via Helius RPC
6. **Airdrop**: Proportional distribution - if you hold 10M, you get 10M more

## Setup

### Prerequisites

- Node.js 18+ installed
- Helius API key for RPC access
- Solana wallet with SOL for transaction fees

### Installation

\`\`\`bash
npm install
\`\`\`

### Configuration

1. Copy `.env.example` to `.env`:
\`\`\`bash
cp .env.example .env
\`\`\`

2. Fill in the required values in `.env`:
   - `HELIUS_RPC_URL`: Your Helius RPC endpoint
   - `TOKEN_ADDRESS`: Your token contract address (after creation)
   - `DISTRIBUTION_WALLET_PRIVATE_KEY`: Private key for airdrop wallet
   - `STREAMFLOW_STREAM_ID`: Stream ID from streamflow.finance

3. Update `src/config/constants.ts` if needed

## Usage

### Run Bot (Automatic Mode)

The bot will automatically monitor, snapshot, and distribute when conditions are met:

\`\`\`bash
# Start bot in monitoring mode
npm run bot

# Or explicitly use monitor mode
npm run bot:monitor
\`\`\`

### Production Deployment (24/7 with PM2)

For continuous operation, use PM2 to keep the bot running:

\`\`\`bash
# Install PM2 globally
npm install -g pm2

# Start bot with PM2
pm2 start npm --name "bagback-bot" -- run bot

# View logs
pm2 logs bagback-bot

# Stop bot
pm2 stop bagback-bot

# Restart bot
pm2 restart bagback-bot

# Setup auto-restart on system reboot
pm2 startup
pm2 save
\`\`\`

### Manual Commands

\`\`\`bash
# Take manual snapshot only
npm run bot:snapshot

# Check token status
npm run bot:status
\`\`\`

### Development Mode

\`\`\`bash
npm run dev
\`\`\`

## Features

- ✅ Real-time monitoring of token circulation
- ✅ Automatic threshold detection (490M sold)
- ✅ Helius RPC integration for holder snapshots
- ✅ Streamflow.finance unlock integration
- ✅ Proportional airdrop distribution (1:1 ratio)
- ✅ Error handling and recovery
- ✅ Comprehensive logging
- ✅ PM2 support for 24/7 operation

## Bot Flow

1. **Monitoring Phase**: Bot continuously monitors circulating supply
2. **Threshold Detection**: Detects when 490M tokens are sold
3. **Unlock**: Triggers streamflow.finance unlock
4. **Snapshot**: Takes holder snapshot via Helius RPC
5. **Distribution**: Calculates and executes proportional airdrops
6. **Completion**: Logs results and stops monitoring

## Security Notes

- Keep your `.env` file secure and never commit it
- Use a dedicated wallet for distribution
- Test on devnet before mainnet deployment
- Ensure sufficient SOL for transaction fees

## Support

- GitHub: [https://github.com/ErenFlux/BagBack](https://github.com/ErenFlux/BagBack)
- X Community: [BagBack Community](https://x.com/i/communities/1992071293148287015/)
- Developer: [ErenFlux](https://github.com/ErenFlux)

---

**BagBack** - A fair distribution experiment on Solana 🚀
