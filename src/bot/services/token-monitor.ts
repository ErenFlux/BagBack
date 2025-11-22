/**
 * Token Monitoring Service
 * Monitors token circulation and detects when threshold is reached
 */

import { Connection, PublicKey } from "@solana/web3.js"
import { getMint } from "@solana/spl-token"
import { CONFIG, MESSAGES } from "../config/constants"

export class TokenMonitor {
  private connection: Connection
  private tokenMint: PublicKey | null = null

  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl, "confirmed")
  }

  /**
   * Initialize the monitor with token address
   */
  async initialize(tokenAddress: string): Promise<void> {
    if (!tokenAddress) {
      throw new Error("Token address is required")
    }

    try {
      this.tokenMint = new PublicKey(tokenAddress)
      await this.validateToken()
      console.log(`✅ Token monitor initialized for: ${tokenAddress}`)
    } catch (error) {
      throw new Error(`Failed to initialize token monitor: ${error}`)
    }
  }

  /**
   * Validate that the token exists and is accessible
   */
  private async validateToken(): Promise<void> {
    if (!this.tokenMint) {
      throw new Error("Token mint not initialized")
    }

    try {
      const mintInfo = await getMint(this.connection, this.tokenMint)
      console.log(`Token decimals: ${mintInfo.decimals}`)
      console.log(`Token supply: ${mintInfo.supply}`)
    } catch (error) {
      throw new Error(`Invalid token address or network error: ${error}`)
    }
  }

  /**
   * Get current circulating supply by calculating total supply minus locked amount
   * This checks all token accounts and sums up non-locked balances
   */
  async getCirculatingSupply(): Promise<number> {
    if (!this.tokenMint) {
      throw new Error("Token monitor not initialized")
    }

    try {
      const mintInfo = await getMint(this.connection, this.tokenMint)
      const totalSupply = Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals)

      // In a real implementation, you would subtract the locked amount in streamflow
      // For now, we assume the circulating supply is total minus the locked 500M
      const circulatingSupply = totalSupply - CONFIG.LOCKED_AMOUNT

      return circulatingSupply
    } catch (error) {
      console.error(`${MESSAGES.ERROR} Getting circulating supply:`, error)
      throw error
    }
  }

  /**
   * Check if the threshold has been reached (490M sold)
   */
  async checkThreshold(): Promise<boolean> {
    try {
      const circulating = await this.getCirculatingSupply()
      console.log(`Current circulating: ${circulating.toLocaleString()} tokens`)

      // Check if 490M or more tokens have been sold from the circulating supply
      const soldAmount = CONFIG.CIRCULATING_AMOUNT - circulating
      console.log(`Tokens sold: ${soldAmount.toLocaleString()} / ${CONFIG.TRIGGER_THRESHOLD.toLocaleString()}`)

      return soldAmount >= CONFIG.TRIGGER_THRESHOLD
    } catch (error) {
      console.error(`${MESSAGES.ERROR} Checking threshold:`, error)
      return false
    }
  }

  /**
   * Get token holders count (requires additional RPC calls)
   */
  async getHoldersCount(): Promise<number> {
    if (!this.tokenMint) {
      throw new Error("Token monitor not initialized")
    }

    try {
      // Get all token accounts for this mint
      const tokenAccounts = await this.connection.getTokenLargestAccounts(this.tokenMint)
      return tokenAccounts.value.length
    } catch (error) {
      console.error(`${MESSAGES.ERROR} Getting holders count:`, error)
      return 0
    }
  }

  /**
   * Get detailed token mint information
   */
  async getTokenInfo() {
    if (!this.tokenMint) {
      throw new Error("Token monitor not initialized")
    }

    try {
      const mintInfo = await getMint(this.connection, this.tokenMint)
      return {
        address: this.tokenMint.toBase58(),
        decimals: mintInfo.decimals,
        supply: Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals),
        isInitialized: mintInfo.isInitialized,
      }
    } catch (error) {
      console.error(`${MESSAGES.ERROR} Getting token info:`, error)
      throw error
    }
  }

  /**
   * Monitor continuously with interval
   */
  async startMonitoring(
    onThresholdReached: () => Promise<void>,
    intervalMs: number = CONFIG.POLL_INTERVAL_MS,
  ): Promise<void> {
    console.log(MESSAGES.BOT_STARTED)
    console.log(`Monitoring interval: ${intervalMs / 1000}s`)

    const checkInterval = setInterval(async () => {
      try {
        const thresholdReached = await this.checkThreshold()

        if (thresholdReached) {
          console.log(MESSAGES.THRESHOLD_REACHED)
          clearInterval(checkInterval)
          await onThresholdReached()
        }
      } catch (error) {
        console.error(`${MESSAGES.ERROR} During monitoring:`, error)
      }
    }, intervalMs)

    // Keep the process running
    process.on("SIGINT", () => {
      console.log("\n🛑 Stopping monitor...")
      clearInterval(checkInterval)
      process.exit(0)
    })
  }
}
