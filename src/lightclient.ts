import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing'
import { getEnv } from './utils.js'
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate"
import { GasPrice } from '@cosmjs/stargate'
import * as capella from '@lodestar/types/capella'

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

	private async query(msg: any): Promise<any> {
		return await this.client.queryContractSmart(this.address, msg)
	}

	private async execute(msg: any): Promise<any> {
		return await this.client.execute(this.myAddress, this.address, msg, 'auto')
	}
}