import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing'
import { getEnv } from './utils.js'
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate"
import { GasPrice } from '@cosmjs/stargate'
import { AllForksSSZTypes } from '@lodestar/types/lib/allForks/types.js'
import { LightClientUpdate } from '@lodestar/types/lib/altair/types.js'

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

	async applyNewUpdate(update: LightClientUpdate, period: number)  {
		if (!update) {
			console.log("No update found for period", period)
			return false
		}
		console.log("Applying update for period", period)
	
		try {
			const res = await this.execute({ LightClientUpdate: { update, period }})
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

	async getPeriod() {
		const res = await this.query({ light_client_state: {} })
		return Math.floor(res.finalized_header.slot / 32 / 256)
	}

	private async query(msg: any) {
		return await this.client.queryContractSmart(this.address, msg)
	}

	private async execute(msg: any) {
		return await this.client.execute(this.myAddress, this.address, msg, 'auto')
	}
}