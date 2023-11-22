import { getEnv } from './utils.js'
import { EthAPI } from './eth.js';
import * as capella from '@lodestar/types/capella';

const main = async () => {
	let now = Date.now()
	const api = new EthAPI()

	console.log("Weve got an api")

	const state = await api.getState("head")
	console.log("Weve got an state", Date.now() - now)
	now = Date.now()
	const lala = capella.ssz.BeaconState.hashTreeRoot(state);
	console.log("parse", Date.now() - now)
	console.log(lala)
	// const lightClient = new LightClientAPI(CONTRACT_ADDRESS);
	// await lightClient.init()

	// const verData = await api.getBlockVerificationData(7061551)
	// const blocks = serializeBlockVerificationData(verData)
	// const json = JSON.stringify(blocks)

	// console.log(json)

	// const update = await api.getUpdate(864);
	// await lightClient.applyNewUpdate(update, 864);

	// const t = await api.getBootstrap('0x96a656e639a065de1a9ec04baeffa7c4d9246a23bb78b1c7d0cc0878f23e5a23')
	// console.log(t)
	// console.log(t)
}

main()