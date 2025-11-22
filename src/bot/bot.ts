/**
 * BagBack Main Bot Orchestrator
 * Coordinates all services to execute the airdrop mechanism
 */

import dotenv from "dotenv"
import { Connection } from "@solana/web3.js"
import { TokenMonitor } from "./services/token-monitor"
import { SnapshotService } from "./services/snapshot-service"
import { AirdropService } from "./services/airdrop-service"
import { StreamflowService } from "./services/streamflow-service"
import type { BotState } from "./types"
import { CONFIG, MESSAGES } from "./config/constants"
import { loadKeypairFromPrivateKey, sleep } from "./utils/solana-helpers"

// Load environment variables
dotenv.config()

export class BagBackBot {
  private state: BotState
  private tokenMonitor: TokenMonitor
  private snapshotService: SnapshotService
  private airdropService: AirdropService | null = null
  private streamflowService: StreamflowService | null = null
  private connection: Connection

  constructor() {
    // Initialize bot state
    this.state = {
      isMonitoring: false,
      thresholdReached: false,
      snapshotTaken: false,
      airdropCompleted: false,
      currentCirculating: 0,
      lastChecked: 0,
    }

    // Initialize connection
    this.connection = new Connection(CONFIG.SOLANA_RPC_URL, "confirmed")

    // Initialize services
    this.tokenMonitor = new TokenMonitor(CONFIG.SOLANA_RPC_URL)
    this.snapshotService = new SnapshotService(CONFIG.HELIUS_RPC_URL)

    console.log("🎒 BagBack Bot initialized")
  }

  /**
   * Start the bot
   */
  async start(): Promise<void> {
    try {
      // Validate configuration
      this.validateConfig()

      // Initialize token monitor
      await this.tokenMonitor.initialize(CONFIG.TOKEN_ADDRESS)

      // Initialize distribution services if keys are provided
      if (CONFIG.DISTRIBUTION_WALLET_PRIVATE_KEY) {
        const wallet = loadKeypairFromPrivateKey(CONFIG.DISTRIBUTION_WALLET_PRIVATE_KEY)

        this.airdropService = new AirdropService(this.connection, wallet, CONFIG.TOKEN_ADDRESS)

        this.streamflowService = new StreamflowService(this.connection, wallet)

        console.log(`Distribution wallet: ${wallet.publicKey.toBase58()}`)
      }

      // Start monitoring
      this.state.isMonitoring = true
      await this.tokenMonitor.startMonitoring(() => this.onThresholdReached(), CONFIG.POLL_INTERVAL_MS)
    } catch (error) {
      console.error(`${MESSAGES.ERROR} Starting bot:`, error)
      throw error
    }
  }

  /**
   * Handle threshold reached event
   */
  private async onThresholdReached(): Promise<void> {
    try {
      console.log(MESSAGES.THRESHOLD_REACHED)
      this.state.thresholdReached = true

      // Step 1: Unlock tokens from Streamflow
      if (this.streamflowService && CONFIG.STREAMFLOW_STREAM_ID) {
        console.log("🔓 Unlocking tokens from Streamflow...")
        const signature = await this.streamflowService.withdrawFromStream(CONFIG.STREAMFLOW_STREAM_ID)

        if (signature) {
          console.log(`✅ Tokens unlocked. TX: ${signature}`)
        } else {
          console.log("⚠️  No Streamflow integration configured, skipping unlock")
        }

        // Wait for tokens to arrive
        await sleep(CONFIG.SNAPSHOT_DELAY_MS)
      }

      // Step 2: Take holder snapshot
      console.log(MESSAGES.SNAPSHOT_STARTED)
      const snapshot = await this.snapshotService.takeSnapshot(CONFIG.TOKEN_ADDRESS)
      this.state.snapshotTaken = true

      // Save snapshot for records
      await this.snapshotService.saveSnapshot(snapshot, `snapshot-${Date.now()}.json`)

      // Step 3: Calculate and execute airdrop
      if (this.airdropService) {
        const recipients = this.airdropService.calculateAirdropAmounts(snapshot)
        const totalRequired = recipients.reduce((sum, r) => sum + r.amount, 0)

        // Verify sufficient balance
        const hasBalance = await this.airdropService.verifyBalance(totalRequired)

        if (!hasBalance) {
          throw new Error("Insufficient balance for airdrop distribution")
        }

        // Execute distribution
        console.log(MESSAGES.AIRDROP_STARTED)
        const results = await this.airdropService.distributeAirdrop(recipients)
        this.state.airdropCompleted = true

        // Save results
        await this.airdropService.saveResults(results, `distribution-${Date.now()}.json`)

        console.log(MESSAGES.AIRDROP_COMPLETE)
      } else {
        console.log("⚠️  No distribution wallet configured, skipping airdrop")
      }

      // Bot completion
      this.state.isMonitoring = false
      console.log("\n✅ BagBack bot completed successfully!")
      process.exit(0)
    } catch (error) {
      console.error(`${MESSAGES.ERROR} During execution:`, error)
      this.state.isMonitoring = false
      throw error
    }
  }

  /**
   * Validate configuration
   */
  private validateConfig(): void {
    const required = [
      { key: "TOKEN_ADDRESS", value: CONFIG.TOKEN_ADDRESS },
      { key: "HELIUS_RPC_URL", value: CONFIG.HELIUS_RPC_URL },
    ]

    const missing = required.filter((item) => !item.value)

    if (missing.length > 0) {
      throw new Error(`Missing required configuration: ${missing.map((m) => m.key).join(", ")}`)
    }

    // Warnings for optional but important config
    if (!CONFIG.DISTRIBUTION_WALLET_PRIVATE_KEY) {
      console.warn("⚠️  WARNING: No distribution wallet private key configured")
      console.warn("⚠️  Bot will monitor and snapshot, but cannot execute airdrop")
    }

    if (!CONFIG.STREAMFLOW_STREAM_ID) {
      console.warn("⚠️  WARNING: No Streamflow stream ID configured")
      console.warn("⚠️  Bot will skip Streamflow unlock step")
    }
  }

  /**
   * Get current bot state
   */
  getState(): BotState {
    return { ...this.state }
  }

  /**
   * Manual snapshot (for testing)
   */
  async takeManualSnapshot(): Promise<void> {
    console.log("Taking manual snapshot...")
    const snapshot = await this.snapshotService.takeSnapshot(CONFIG.TOKEN_ADDRESS)
    await this.snapshotService.saveSnapshot(snapshot, `manual-snapshot-${Date.now()}.json`)
    console.log("Manual snapshot complete!")
  }

  /**
   * Manual airdrop (for testing with existing snapshot)
   */
  async executeManualAirdrop(snapshotFile: string): Promise<void> {
    if (!this.airdropService) {
      throw new Error("Airdrop service not initialized")
    }

    console.log("Loading snapshot...")
    const snapshot = await this.snapshotService.loadSnapshot(snapshotFile)

    console.log("Calculating recipients...")
    const recipients = this.airdropService.calculateAirdropAmounts(snapshot)

    console.log("Verifying balance...")
    const totalRequired = recipients.reduce((sum, r) => sum + r.amount, 0)
    const hasBalance = await this.airdropService.verifyBalance(totalRequired)

    if (!hasBalance) {
      throw new Error("Insufficient balance")
    }

    console.log("Executing airdrop...")
    const results = await this.airdropService.distributeAirdrop(recipients)

    await this.airdropService.saveResults(results, `manual-distribution-${Date.now()}.json`)

    console.log("Manual airdrop complete!")
  }
}
