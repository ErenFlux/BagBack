/**
 * Holder Snapshot Service
 * Takes snapshots of token holders using Helius RPC
 */

import axios from "axios"
import { Connection, PublicKey } from "@solana/web3.js"
import type { TokenHolder, SnapshotData } from "../types"
import { MESSAGES } from "../config/constants"

export class SnapshotService {
  private heliusUrl: string
  private connection: Connection

  constructor(heliusUrl: string) {
    if (!heliusUrl) {
      throw new Error("Helius RPC URL is required")
    }
    this.heliusUrl = heliusUrl
    this.connection = new Connection(heliusUrl, "confirmed")
  }

  /**
   * Get all token holders using Helius RPC
   * Uses the getTokenAccounts method for comprehensive data
   */
  async getAllHolders(tokenMint: string): Promise<TokenHolder[]> {
    console.log(MESSAGES.SNAPSHOT_STARTED)

    try {
      const holders: TokenHolder[] = []
      let page = 1
      let hasMore = true

      // Helius Enhanced API for token accounts
      while (hasMore) {
        const response = await this.fetchTokenAccounts(tokenMint, page)

        if (!response || response.length === 0) {
          hasMore = false
          break
        }

        // Process each token account
        for (const account of response) {
          if (account.amount && account.amount > 0) {
            holders.push({
              address: account.owner,
              balance: account.amount,
              percentage: 0, // Will be calculated later
            })
          }
        }

        page++

        // Helius typically returns 1000 results per page
        if (response.length < 1000) {
          hasMore = false
        }

        // Add small delay to avoid rate limiting
        await this.sleep(100)
      }

      console.log(`${MESSAGES.SNAPSHOT_COMPLETE} ${holders.length}`)
      return holders
    } catch (error) {
      console.error(`${MESSAGES.ERROR} Taking snapshot:`, error)
      throw error
    }
  }

  /**
   * Fetch token accounts from Helius RPC
   */
  private async fetchTokenAccounts(tokenMint: string, page: number): Promise<any[]> {
    try {
      // Use Helius DAS (Digital Asset Standard) API
      const response = await axios.post(this.heliusUrl, {
        jsonrpc: "2.0",
        id: `snapshot-${page}`,
        method: "getTokenAccounts",
        params: {
          mint: tokenMint,
          page,
          limit: 1000,
        },
      })

      if (response.data.error) {
        throw new Error(response.data.error.message)
      }

      return response.data.result?.token_accounts || []
    } catch (error: any) {
      // Fallback to standard RPC if DAS API is not available
      if (error.response?.status === 404 || error.message.includes("Method not found")) {
        return await this.fetchTokenAccountsFallback(tokenMint)
      }
      throw error
    }
  }

  /**
   * Fallback method using standard Solana RPC
   */
  private async fetchTokenAccountsFallback(tokenMint: string): Promise<any[]> {
    try {
      const mintPubkey = new PublicKey(tokenMint)
      const accounts = await this.connection.getProgramAccounts(
        new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"), // Token program
        {
          filters: [
            {
              dataSize: 165, // Size of token account
            },
            {
              memcmp: {
                offset: 0,
                bytes: mintPubkey.toBase58(),
              },
            },
          ],
        },
      )

      return accounts.map((account) => {
        // Parse token account data
        const data = account.account.data
        const owner = new PublicKey(data.slice(32, 64)).toBase58()
        const amount = Number(data.readBigUInt64LE(64))

        return {
          owner,
          amount,
        }
      })
    } catch (error) {
      console.error("Fallback method failed:", error)
      return []
    }
  }

  /**
   * Take a complete snapshot with calculations
   */
  async takeSnapshot(tokenMint: string): Promise<SnapshotData> {
    const holders = await this.getAllHolders(tokenMint)

    // Calculate total circulating among holders
    const totalCirculating = holders.reduce((sum, holder) => sum + holder.balance, 0)

    // Calculate percentages
    const holdersWithPercentage = holders.map((holder) => ({
      ...holder,
      percentage: (holder.balance / totalCirculating) * 100,
    }))

    // Sort by balance descending
    holdersWithPercentage.sort((a, b) => b.balance - a.balance)

    const snapshot: SnapshotData = {
      timestamp: Date.now(),
      totalHolders: holders.length,
      totalCirculating,
      holders: holdersWithPercentage,
    }

    // Log snapshot summary
    this.logSnapshotSummary(snapshot)

    return snapshot
  }

  /**
   * Log snapshot summary
   */
  private logSnapshotSummary(snapshot: SnapshotData): void {
    console.log("\n=== Snapshot Summary ===")
    console.log(`Timestamp: ${new Date(snapshot.timestamp).toISOString()}`)
    console.log(`Total Holders: ${snapshot.totalHolders}`)
    console.log(`Total Circulating: ${snapshot.totalCirculating.toLocaleString()}`)
    console.log("\nTop 10 Holders:")

    snapshot.holders.slice(0, 10).forEach((holder, index) => {
      console.log(
        `${index + 1}. ${holder.address.slice(0, 8)}... - ${holder.balance.toLocaleString()} (${holder.percentage.toFixed(2)}%)`,
      )
    })
    console.log("=======================\n")
  }

  /**
   * Save snapshot to file
   */
  async saveSnapshot(snapshot: SnapshotData, filename: string): Promise<void> {
    const fs = await import("fs/promises")
    try {
      await fs.writeFile(filename, JSON.stringify(snapshot, null, 2))
      console.log(`✅ Snapshot saved to ${filename}`)
    } catch (error) {
      console.error(`${MESSAGES.ERROR} Saving snapshot:`, error)
      throw error
    }
  }

  /**
   * Load snapshot from file
   */
  async loadSnapshot(filename: string): Promise<SnapshotData> {
    const fs = await import("fs/promises")
    try {
      const data = await fs.readFile(filename, "utf-8")
      return JSON.parse(data)
    } catch (error) {
      console.error(`${MESSAGES.ERROR} Loading snapshot:`, error)
      throw error
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
