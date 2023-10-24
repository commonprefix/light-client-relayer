import { getEnv } from './utils.js'
import { EthAPI } from './eth.js';
import { LightClientAPI } from './lightclient.js';
import { serializeBlockVerificationData } from './types.js';
import { toHexString } from '@chainsafe/ssz';
import * as capella from '@lodestar/types/capella';

const CONTRACT_ADDRESS = getEnv("CONTRACT_ADDRESS") 

const main = async () => {
	const api = new EthAPI()
	const lightClient = new LightClientAPI(CONTRACT_ADDRESS);
	await lightClient.init()

	const verData = await api.getBlockVerificationData(7061551)
	const blocks = serializeBlockVerificationData(verData)
	const json = JSON.stringify(blocks)

	console.log(json)

	// const update = await api.getUpdate(864);
	// await lightClient.applyNewUpdate(update, 864);

	// const t = await api.getBootstrap('0x96a656e639a065de1a9ec04baeffa7c4d9246a23bb78b1c7d0cc0878f23e5a23')
	// console.log(t)
	// console.log(t)
}

main()
