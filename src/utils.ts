import "dotenv/config"
import { Receipt } from "./types"

export const getEnv = (key: string, defaultValue ?: string): string => {
	if (!process.env[key] && !defaultValue) {
		throw new Error(`Environment variable ${key} not set`)
	}

	// @ts-ignore
	return process.env[key] || defaultValue
}

export const bytesToHex = (bytes: Uint8Array): string => {
	return Buffer.from(bytes).toString('hex');
}

export const formatReceipt = (receipt: any): Receipt => {
  return {
    ...receipt,
    cumulativeBlockGasUsed: parseInt(receipt.cumulativeGasUsed, 16),
    bitvector: receipt.logsBloom,
    logs: receipt.logs.map((log: any) => [log.address, log.topics, log.data]),
    type: parseInt(receipt.type, 16),
    status: parseInt(receipt.status, 16),
  };
}