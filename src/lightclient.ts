import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing'
import { bytesToHex, formatReceipt, getEnv } from './utils.js'
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate"
import { GasPrice, SearchByHeightQuery, SearchTxQuery } from '@cosmjs/stargate'
import * as capella from '@lodestar/types/capella'
import { Receipt, UserInput } from './types.js'
import { EthAPI } from './eth.js'
import { TrieWrapper } from './triewrapper.js'
import assert from 'assert';

export class LightClientAPI {
	private myAddress: string
	private client: SigningCosmWasmClient

	constructor(
		private address: string,
		private mnemonic = getEnv("MNEMONIC"),
		private rpcUrl = getEnv("AXELAR_RPC_URL")
	) {}

	async init()  {
		const wallet = await DirectSecp256k1HdWallet.fromMnemonic(this.mnemonic, { prefix: "axelar" })
		const [{address: myAddress}] = await wallet.getAccounts()
		const gasPrice = GasPrice.fromString("0.1uwasm")

		this.myAddress = myAddress
		this.client = await SigningCosmWasmClient.connectWithSigner(this.rpcUrl, wallet, { gasPrice })
	}

	async applyNewUpdate(update: capella.LightClientUpdate, period: number)  {
		try {
			const updateSerialized = capella.ssz.LightClientUpdate.toJson(update);
			const res = await this.execute({ LightClientUpdate: { update: updateSerialized, period }})
			console.log(`Update applied for period ${period} with gas: ${res.gasUsed} uwasm`)
		}
		catch (e) {
			console.log("Error applying update for period", period, e)
			return false
		}

		const contractPeriod = await this.getPeriod();
		console.log("Current contract period after update", contractPeriod)

		return true
	}

	async getPeriod(): Promise<number> {
		const res = await this.query({ light_client_state: {} })
		return Math.floor(res.finalized_header.slot / 32 / 256)
	}

	async verify_proof(msg: any): Promise<any> {
		return this.execute(msg);
	}

	async verify_topic_inclusion(msg: any): Promise<any> {
		return this.execute(msg);
	}

	private async query(msg: any): Promise<any> {
		return await this.client.queryContractSmart(this.address, msg)
	}

	private async execute(msg: any): Promise<any> {
		return await this.client.execute(this.myAddress, this.address, msg, 'auto')
	}

	async verifyTopicInTransaction(api: EthAPI, input: UserInput): Promise<boolean> {
		const block = await api.getBlock(input.blockNumber);

		const receipts: Receipt[] = (await api.getBlockTransactionReceipts(input.blockNumber)).map(formatReceipt);
		const requestedTxReceipt = receipts.find((r) => r.transactionHash === input.transactionHash);
		if (!requestedTxReceipt) throw new Error(`Could not find receipt for transaction ${input.transactionHash} in block ${input.blockNumber}`);

		const transactionIndex = parseInt(requestedTxReceipt.transactionIndex, 16);
		const receiptsTrie = await TrieWrapper.trieFromReceipts(receipts);
		assert(
			block.receiptsRoot.slice(2) === bytesToHex(receiptsTrie.root()),
			`Expected receipts root (${block.receiptsRoot}) doesn't match the actual (${bytesToHex(receiptsTrie.root())})`);
		const proof = await TrieWrapper.createProof(receiptsTrie, transactionIndex);

		const response = await this.verify_proof({
			VerifyProof: {
				proof: proof.map(n => `0x${Buffer.from(n).toString('hex')}`),
				key: Buffer.from(TrieWrapper.encodeKey(transactionIndex)).toString('hex'),
				root: block.receiptsRoot
			}
		});
		// wanted: 276233
		// used: 211619

		const receiptEncoded = response.events
			.find((event: any) =>
				event.type === 'wasm' &&
				event.attributes.find((a: any) => a.key === 'result')
			)?.attributes.find((a: any) => a.key === 'result')?.value;
		if (parseInt(receiptEncoded, 16) !== 0) {
			const response = await this.verify_topic_inclusion({
				VerifyTopicInclusion: {
					receipt: `0x${receiptEncoded}`,
					topic: input.topic,
				}
			});
			// "gasWanted": 169275,
			// "gasUsed": 135219
			return response.events.find((e: any) => e.type === 'wasm').attributes.find((a: any) => a.key === 'result').value === 'true';
		} else {
			return false;
		}
	}
}