# BagBack Bot Deployment Guide

## Prerequisites

1. **Node.js**: Version 18 or higher
2. **Helius API Key**: Get from [helius.dev](https://helius.dev)
3. **Solana Wallet**: With SOL for transaction fees
4. **Token Creation**: Deploy your token on pump.fun
5. **Streamflow Lock**: Set up token lock on streamflow.finance

## Step-by-Step Setup

### 1. Create Token on pump.fun

1. Go to pump.fun and create your BagBack token
2. Set total supply to 1,000,000,000 (1 billion)
3. Purchase 500,000,000 tokens as dev
4. Save the token contract address

### 2. Lock Tokens on Streamflow

1. Go to streamflow.finance
2. Create a new vesting stream
3. Lock 490,000,000 tokens
4. Set unlock conditions (time-based or manual)
5. Save the stream ID

### 3. Configure Bot

1. Clone the repository and install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Copy and configure environment file:
\`\`\`bash
cp .env.example .env
\`\`\`

3. Edit `.env` with your values:
\`\`\`env
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
TOKEN_ADDRESS=YOUR_TOKEN_ADDRESS
DISTRIBUTION_WALLET_PRIVATE_KEY=YOUR_PRIVATE_KEY_BASE58
STREAMFLOW_STREAM_ID=YOUR_STREAM_ID
\`\`\`

4. Update `src/config/constants.ts` if needed

### 4. Test Configuration

\`\`\`bash
# Build the project
npm run build

# Take a test snapshot
npm start snapshot
\`\`\`

### 5. Start Monitoring

\`\`\`bash
# Start the bot in monitoring mode
npm start
# or
npm start monitor
\`\`\`

## Usage Modes

### Automatic Monitoring (Default)
\`\`\`bash
npm start
\`\`\`
Continuously monitors token sales and automatically triggers airdrop when threshold is reached.

### Manual Snapshot
\`\`\`bash
npm start snapshot
\`\`\`
Takes a snapshot of current holders without executing airdrop.

### Manual Airdrop
\`\`\`bash
npm start airdrop snapshot-1234567890.json
\`\`\`
Executes airdrop using a previously saved snapshot file.

## Production Deployment

### Using PM2 (Recommended)

1. Install PM2:
\`\`\`bash
npm install -g pm2
\`\`\`

2. Start bot with PM2:
\`\`\`bash
pm2 start npm --name "bagback-bot" -- start
\`\`\`

3. Monitor logs:
\`\`\`bash
pm2 logs bagback-bot
\`\`\`

4. Set up auto-restart:
\`\`\`bash
pm2 startup
pm2 save
\`\`\`

### Using Docker

1. Create Dockerfile:
\`\`\`dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "start"]
\`\`\`

2. Build and run:
\`\`\`bash
docker build -t bagback-bot .
docker run -d --name bagback --env-file .env bagback-bot
\`\`\`

## Monitoring and Maintenance

### Check Bot Status
\`\`\`bash
pm2 status
pm2 logs bagback-bot --lines 100
\`\`\`

### View Snapshots
All snapshots are saved as JSON files with timestamps.

### View Distribution Results
Distribution results are saved with transaction signatures and success status.

## Security Best Practices

1. **Private Keys**: Never commit `.env` file or expose private keys
2. **Dedicated Wallet**: Use a separate wallet for distribution
3. **Test First**: Always test on devnet before mainnet
4. **Backup**: Keep backups of snapshot and distribution files
5. **Monitor Logs**: Regularly check logs for errors
6. **SOL Balance**: Ensure distribution wallet has enough SOL for fees

## Troubleshooting

### Bot Won't Start
- Check all environment variables are set
- Verify token address is correct
- Ensure Helius RPC URL is valid

### Snapshot Fails
- Check Helius API key is active
- Verify token has holders
- Check network connectivity

### Airdrop Fails
- Verify distribution wallet has sufficient tokens
- Ensure enough SOL for transaction fees
- Check token account exists for recipients

### Streamflow Integration Issues
- Verify stream ID is correct
- Check unlock conditions are met
- Ensure wallet has permission to withdraw

## Support

For issues or questions:
1. Check logs for detailed error messages
2. Verify all configuration values
3. Test components individually using manual modes
4. Review transaction signatures on Solana explorer

---

**Remember**: This is a mainnet production bot handling real tokens. Always test thoroughly before deploying.
\`\`\`
