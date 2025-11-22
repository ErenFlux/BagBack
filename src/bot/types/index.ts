/**
 * Type definitions for BagBack bot
 */

export interface TokenHolder {
  address: string
  balance: number
  percentage: number
}

export interface SnapshotData {
  timestamp: number
  totalHolders: number
  totalCirculating: number
  holders: TokenHolder[]
}

export interface AirdropRecipient {
  address: string
  amount: number
}

export interface DistributionResult {
  success: boolean
  txSignature?: string
  error?: string
  recipient: string
  amount: number
}

export interface BotState {
  isMonitoring: boolean
  thresholdReached: boolean
  snapshotTaken: boolean
  airdropCompleted: boolean
  currentCirculating: number
  lastChecked: number
}
