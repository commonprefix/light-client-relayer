import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate"
import { GasPrice } from "@cosmjs/stargate"
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing"
import { getUpdate } from "./rpc"
import { getEnv } from './utils'

const RPC_URL = getEnv("AXELAR_RPC_URL")
const CONTRACT_ADDRESS = getEnv("CONTRACT_ADDRESS")
const MNEMONIC = getEnv("MNEMONIC")

const applyNewUpdate = async (myAddress: string, client: SigningCosmWasmClient, period: number) => {
	console.log("Fetching update for period", period)
	const update = await getUpdate(period)
	if (!update) {
		console.log("No update found for period", period)
		return false
	}
	console.log("Applying update for period", period)

	try {
		const res = await client.execute(myAddress, CONTRACT_ADDRESS, { LightClientUpdate: { update, period }}, 'auto')
		console.log(`Update applied for period ${period} with gas: ${res.gasUsed} uwasm`)
	}
	catch (e) {
		console.log("Error applying update for period", period, e)
		return false
	}

	const contractPeriod = await getPeriodOfContract(client)
	console.log("Current contract period after update", contractPeriod)

	return true
}

const getPeriodOfContract = async (client: SigningCosmWasmClient) => {
	const res = await client.queryContractSmart(CONTRACT_ADDRESS, { light_client_state: {} })
	return Math.floor(res.finalized_header.slot / 32 / 256)
}

const main = async () => {
	const wallet = await DirectSecp256k1HdWallet.fromMnemonic(MNEMONIC, { prefix: "axelar" })
	const [{address: myAddress}] = await wallet.getAccounts()
	const gasPrice = GasPrice.fromString("0.1uwasm")
	const client = await SigningCosmWasmClient.connectWithSigner(RPC_URL, wallet, { gasPrice })

	const contractPeriod = await getPeriodOfContract(client)
	console.log("Current contract period", contractPeriod)

 	await applyNewUpdate(myAddress, client, contractPeriod + 1)
}

main()
