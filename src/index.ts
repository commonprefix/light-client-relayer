import { getEnv } from './utils.js'
import { BeaconAPI } from './eth.js';
import { LightClientAPI } from './lightclient.js';

const CONTRACT_ADDRESS = getEnv("CONTRACT_ADDRESS") 
const main = async () => {
	const api = new BeaconAPI()

	const lightClient = new LightClientAPI(CONTRACT_ADDRESS);
	await lightClient.init()

	// const update = await api.getUpdate(863);
	// await lightClient.applyNewUpdate(update, 863);

	// const t = await api.getBootstrap('0x96a656e639a065de1a9ec04baeffa7c4d9246a23bb78b1c7d0cc0878f23e5a23')
	// console.log(t)
}

main()
