/**
 * BagBack Bot Entry Point
 */

import { BagBackBot } from "./bot"
import { CONFIG } from "./config/constants"

async function main() {
  console.log("========================================")
  console.log("🎒 BagBack - Supply Return Experiment")
  console.log("========================================")
  console.log(`Token: ${CONFIG.TOKEN_SYMBOL}`)
  console.log(`Total Supply: ${CONFIG.TOTAL_SUPPLY.toLocaleString()}`)
  console.log(`Locked Amount: ${CONFIG.LOCKED_AMOUNT.toLocaleString()}`)
  console.log(`Trigger Threshold: ${CONFIG.TRIGGER_THRESHOLD.toLocaleString()}`)
  console.log("========================================\n")

  const bot = new BagBackBot()

  // Check command line arguments
  const args = process.argv.slice(2)
  const command = args[0]

  try {
    switch (command) {
      case "snapshot":
        // Take manual snapshot
        await bot.takeManualSnapshot()
        break

      case "airdrop":
        // Execute manual airdrop with snapshot file
        const snapshotFile = args[1]
        if (!snapshotFile) {
          console.error("Error: Snapshot file required for manual airdrop")
          console.log("Usage: npm start airdrop <snapshot-file.json>")
          process.exit(1)
        }
        await bot.executeManualAirdrop(snapshotFile)
        break

      case "monitor":
      default:
        // Start normal monitoring mode
        await bot.start()
        break
    }
  } catch (error) {
    console.error("Fatal error:", error)
    process.exit(1)
  }
}

// Handle uncaught errors
process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error)
  process.exit(1)
})

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error)
  process.exit(1)
})

// Start the bot
main()
