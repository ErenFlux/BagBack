/**
 * Airdrop Distribution Service
 * Handles proportional token distribution to holders
 */

import {
  type Connection,
  type Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  ComputeBudgetProgram,
} from "@solana/web3.js"
import { createTransferInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import type { SnapshotData, AirdropRecipient, DistributionResult } from "../types"
import { MESSAGES } from "../config/constants"
import { getOrCreateAssociatedTokenAccount, sleep, retryWithBackoff } from "../utils/solana-helpers"

export class AirdropService {
  private connection: Connection
  private distributionWallet: Keypair
  private tokenMint: PublicKey

  constructor(connection: Connection, distributionWallet: Keypair, tokenMint: string) {
    this.connection = connection
    this.distributionWallet = distributionWallet
    this.tokenMint = new PublicKey(tokenMint)
  }

  /**
   * Calculate airdrop amounts based on snapshot
   * Each holder receives the same amount they currently hold (1:1 ratio)
   */
  calculateAirdropAmounts(snapshot: SnapshotData): AirdropRecipient[] {
    console.log("\n=== Calculating Airdrop Amounts ===")

    const recipients: AirdropRecipient[] = snapshot.holders.map((holder) => ({
      address: holder.address,
      amount: holder.balance, // 1:1 ratio - if you hold 10M, you get 10M
    }))

    // Log summary
    const totalAirdrop = recipients.reduce((sum, r) => sum + r.amount, 0)
    console.log(`Total recipients: ${recipients.length}`)
    console.log(`Total airdrop amount: ${totalAirdrop.toLocaleString()}`)
    console.log("===================================\n")

    return recipients
  }

  /**
   * Distribute tokens to all recipients
   * Uses batching to optimize transaction costs
   */
  async distributeAirdrop(recipients: AirdropRecipient[]): Promise<DistributionResult[]> {
    console.log(MESSAGES.AIRDROP_STARTED)

    const results: DistributionResult[] = []
    const batchSize = 5 // Process 5 recipients at a time to avoid rate limits

    // Get token decimals
    const mintInfo = await this.connection.getParsedAccountInfo(this.tokenMint)
    const decimals = (mintInfo.value?.data as any)?.parsed?.info?.decimals || 9

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize)

      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(recipients.length / batchSize)}`)

      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map((recipient) => this.sendAirdrop(recipient.address, recipient.amount, decimals)),
      )

      results.push(...batchResults)

      // Add delay between batches to avoid rate limiting
      if (i + batchSize < recipients.length) {
        await sleep(2000)
      }
    }

    this.logDistributionSummary(results)
    return results
  }

  /**
   * Send airdrop to a single recipient
   */
  private async sendAirdrop(recipientAddress: string, amount: number, decimals: number): Promise<DistributionResult> {
    try {
      // Convert amount to raw token units
      const rawAmount = BigInt(Math.floor(amount * Math.pow(10, decimals)))

      if (rawAmount === BigInt(0)) {
        return {
          success: false,
          error: "Amount is zero",
          recipient: recipientAddress,
          amount,
        }
      }

      // Get source and destination token accounts
      const sourceTokenAccount = await getAssociatedTokenAddress(this.tokenMint, this.distributionWallet.publicKey)

      const recipientPubkey = new PublicKey(recipientAddress)
      const destinationTokenAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        this.distributionWallet,
        this.tokenMint,
        recipientPubkey,
      )

      // Create transfer transaction with priority fee
      const transaction = new Transaction()

      // Add compute budget for priority
      transaction.add(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: 1000,
        }),
      )

      // Add transfer instruction
      transaction.add(
        createTransferInstruction(
          sourceTokenAccount,
          destinationTokenAccount,
          this.distributionWallet.publicKey,
          rawAmount,
          [],
          TOKEN_PROGRAM_ID,
        ),
      )

      // Send with retry logic
      const signature = await retryWithBackoff(async () => {
        return await sendAndConfirmTransaction(this.connection, transaction, [this.distributionWallet], {
          commitment: "confirmed",
          maxRetries: 3,
        })
      })

      console.log(`✅ Sent ${amount.toLocaleString()} tokens to ${recipientAddress.slice(0, 8)}...`)

      return {
        success: true,
        txSignature: signature,
        recipient: recipientAddress,
        amount,
      }
    } catch (error: any) {
      console.error(`❌ Failed to send to ${recipientAddress.slice(0, 8)}...: ${error.message}`)

      return {
        success: false,
        error: error.message,
        recipient: recipientAddress,
        amount,
      }
    }
  }

  /**
   * Log distribution summary
   */
  private logDistributionSummary(results: DistributionResult[]): void {
    const successful = results.filter((r) => r.success)
    const failed = results.filter((r) => !r.success)
    const totalDistributed = successful.reduce((sum, r) => sum + r.amount, 0)

    console.log("\n=== Distribution Summary ===")
    console.log(`Total recipients: ${results.length}`)
    console.log(`Successful: ${successful.length}`)
    console.log(`Failed: ${failed.length}`)
    console.log(`Total distributed: ${totalDistributed.toLocaleString()} tokens`)

    if (failed.length > 0) {
      console.log("\nFailed distributions:")
      failed.forEach((result) => {
        console.log(`- ${result.recipient.slice(0, 8)}... (${result.amount.toLocaleString()}): ${result.error}`)
      })
    }

    console.log("============================\n")
  }

  /**
   * Verify distribution wallet has sufficient balance
   */
  async verifyBalance(requiredAmount: number): Promise<boolean> {
    try {
      const tokenAccount = await getAssociatedTokenAddress(this.tokenMint, this.distributionWallet.publicKey)

      const accountInfo = await this.connection.getTokenAccountBalance(tokenAccount)
      const balance = Number(accountInfo.value.amount) / Math.pow(10, accountInfo.value.decimals)

      console.log(`Distribution wallet balance: ${balance.toLocaleString()}`)
      console.log(`Required amount: ${requiredAmount.toLocaleString()}`)

      if (balance < requiredAmount) {
        console.error("❌ Insufficient balance for airdrop")
        return false
      }

      console.log("✅ Sufficient balance confirmed")
      return true
    } catch (error) {
      console.error("Error verifying balance:", error)
      return false
    }
  }

  /**
   * Save distribution results to file
   */
  async saveResults(results: DistributionResult[], filename: string): Promise<void> {
    const fs = await import("fs/promises")
    try {
      await fs.writeFile(
        filename,
        JSON.stringify(
          {
            timestamp: Date.now(),
            results,
            summary: {
              total: results.length,
              successful: results.filter((r) => r.success).length,
              failed: results.filter((r) => !r.success).length,
            },
          },
          null,
          2,
        ),
      )
      console.log(`✅ Results saved to ${filename}`)
    } catch (error) {
      console.error("Error saving results:", error)
      throw error
    }
  }
}
