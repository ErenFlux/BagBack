/**
 * Helius RPC Client
 * Enhanced RPC methods for better token data access
 */

import axios, { type AxiosInstance } from "axios"

export interface HeliusTokenAccount {
  address: string
  owner: string
  amount: number
  decimals: number
  mint: string
}

export class HeliusClient {
  private client: AxiosInstance
  private rpcUrl: string

  constructor(apiKey: string) {
    this.rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${apiKey}`
    this.client = axios.create({
      baseURL: this.rpcUrl,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000,
    })
  }

  /**
   * Get all token accounts for a specific mint
   */
  async getTokenAccounts(mint: string, options?: { page?: number; limit?: number }): Promise<HeliusTokenAccount[]> {
    try {
      const response = await this.client.post("", {
        jsonrpc: "2.0",
        id: "helius-token-accounts",
        method: "getTokenAccounts",
        params: {
          mint,
          page: options?.page || 1,
          limit: options?.limit || 1000,
        },
      })

      if (response.data.error) {
        throw new Error(response.data.error.message)
      }

      return response.data.result?.token_accounts || []
    } catch (error) {
      console.error("Helius getTokenAccounts error:", error)
      throw error
    }
  }

  /**
   * Get asset information
   */
  async getAsset(assetId: string): Promise<any> {
    try {
      const response = await this.client.post("", {
        jsonrpc: "2.0",
        id: "helius-asset",
        method: "getAsset",
        params: {
          id: assetId,
        },
      })

      if (response.data.error) {
        throw new Error(response.data.error.message)
      }

      return response.data.result
    } catch (error) {
      console.error("Helius getAsset error:", error)
      throw error
    }
  }

  /**
   * Get multiple assets by owner
   */
  async getAssetsByOwner(ownerAddress: string, options?: { page?: number; limit?: number }): Promise<any[]> {
    try {
      const response = await this.client.post("", {
        jsonrpc: "2.0",
        id: "helius-assets-by-owner",
        method: "getAssetsByOwner",
        params: {
          ownerAddress,
          page: options?.page || 1,
          limit: options?.limit || 1000,
        },
      })

      if (response.data.error) {
        throw new Error(response.data.error.message)
      }

      return response.data.result?.items || []
    } catch (error) {
      console.error("Helius getAssetsByOwner error:", error)
      throw error
    }
  }

  /**
   * Enhanced transaction history
   */
  async getTransactionHistory(address: string, options?: { limit?: number }): Promise<any[]> {
    try {
      const response = await this.client.post("", {
        jsonrpc: "2.0",
        id: "helius-tx-history",
        method: "getTransactionHistory",
        params: {
          address,
          limit: options?.limit || 100,
        },
      })

      if (response.data.error) {
        throw new Error(response.data.error.message)
      }

      return response.data.result || []
    } catch (error) {
      console.error("Helius getTransactionHistory error:", error)
      throw error
    }
  }
}
