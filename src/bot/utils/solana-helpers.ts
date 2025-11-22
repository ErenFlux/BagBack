/**
 * Solana Helper Utilities
 * Common functions for Solana blockchain interactions
 */

import { Connection, PublicKey, Keypair, Transaction, sendAndConfirmTransaction } from "@solana/web3.js"
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from "@solana/spl-token"
import bs58 from "bs58"

/**
 * Create a connection to Solana network
 */
export function createConnection(rpcUrl: string): Connection {
  return new Connection(rpcUrl, "confirmed")
}

/**
 * Load keypair from base58 encoded private key
 */
export function loadKeypairFromPrivateKey(privateKey: string): Keypair {
  if (!privateKey) {
    throw new Error("Private key is required")
  }

  try {
    const decodedKey = bs58.decode(privateKey)
    return Keypair.fromSecretKey(decodedKey)
  } catch (error) {
    throw new Error(`Failed to load keypair: ${error}`)
  }
}

/**
 * Get or create associated token account
 */
export async function getOrCreateAssociatedTokenAccount(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  owner: PublicKey,
): Promise<PublicKey> {
  const associatedToken = await getAssociatedTokenAddress(mint, owner)

  try {
    // Check if account exists
    const accountInfo = await connection.getAccountInfo(associatedToken)

    if (!accountInfo) {
      // Create the account
      const transaction = new Transaction().add(
        createAssociatedTokenAccountInstruction(payer.publicKey, associatedToken, owner, mint),
      )

      await sendAndConfirmTransaction(connection, transaction, [payer])
      console.log(`✅ Created associated token account: ${associatedToken.toBase58()}`)
    }

    return associatedToken
  } catch (error) {
    throw new Error(`Failed to get/create associated token account: ${error}`)
  }
}

/**
 * Validate Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address)
    return true
  } catch {
    return false
  }
}

/**
 * Format token amount with decimals
 */
export function formatTokenAmount(amount: number, decimals: number): bigint {
  return BigInt(Math.floor(amount * Math.pow(10, decimals)))
}

/**
 * Parse token amount from raw value
 */
export function parseTokenAmount(rawAmount: bigint, decimals: number): number {
  return Number(rawAmount) / Math.pow(10, decimals)
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> {
  let lastError: Error | undefined

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      const delay = baseDelay * Math.pow(2, i)
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`)
      await sleep(delay)
    }
  }

  throw lastError || new Error("Max retries reached")
}
