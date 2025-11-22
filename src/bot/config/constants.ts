/**
 * BagBack Project Constants
 * Configuration for the token distribution bot
 */

export const CONFIG = {
  // Token Configuration
  TOKEN_ADDRESS: "", // Leave blank - to be filled when token is created
  TOTAL_SUPPLY: 1_000_000_000, // 1 billion tokens
  LOCKED_AMOUNT: 500_000_000, // 500 million locked
  CIRCULATING_AMOUNT: 500_000_000, // 500 million circulating
  TRIGGER_THRESHOLD: 490_000_000, // Unlock when 490M are sold

  // Wallet Configuration
  DISTRIBUTION_WALLET_PUBLIC_KEY: "", // Leave blank - will receive unlocked tokens
  DISTRIBUTION_WALLET_PRIVATE_KEY: "", // Leave blank - for signing transactions

  // RPC Configuration
  HELIUS_RPC_URL: process.env.HELIUS_RPC_URL || "",
  SOLANA_RPC_URL: process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",

  // Monitoring Configuration
  POLL_INTERVAL_MS: 60000, // Check every 60 seconds
  SNAPSHOT_DELAY_MS: 5000, // Wait 5 seconds before taking snapshot

  // Streamflow Configuration
  STREAMFLOW_STREAM_ID: "", // Leave blank - to be filled after lock is created

  // Project Info
  PROJECT_NAME: "BagBack",
  TOKEN_SYMBOL: "BB",
  DESCRIPTION: "The more you bag, the more you get back.",
}

export const MESSAGES = {
  BOT_STARTED: "🎒 BagBack Bot Started - Monitoring token sales...",
  THRESHOLD_REACHED: "🚀 Threshold reached! 490M tokens sold. Initiating unlock and airdrop...",
  SNAPSHOT_STARTED: "📸 Taking holder snapshot via Helius RPC...",
  SNAPSHOT_COMPLETE: "✅ Snapshot complete. Total holders:",
  AIRDROP_STARTED: "💰 Starting proportional airdrop distribution...",
  AIRDROP_COMPLETE: "🎉 Airdrop distribution complete!",
  ERROR: "❌ Error occurred:",
}
