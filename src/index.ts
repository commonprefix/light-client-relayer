import { getEnv } from './utils.js';
import { EthAPI } from './eth.js';
import { LightClientAPI } from './lightclient.js';
import { UserInput, serializeBlockVerificationData } from './types.js';

const CONTRACT_ADDRESS = getEnv("CONTRACT_ADDRESS")

const main = async () => {
	const api = new EthAPI()
	const lightClient = new LightClientAPI(CONTRACT_ADDRESS);
	await lightClient.init()

	const verData = await api.getBlockVerificationData(7061551)
	const blocks = serializeBlockVerificationData(verData)
	const json = JSON.stringify(blocks)

	console.log(json)

	const input: UserInput = {
		blockNumber: 17875570,
		transactionHash: '0x022edd6e5e56c918b0ec5177ec41569e606957af7d16d9e9e65174ed522830dc',
		topic: '0xa945e51eec50ab98c161376f0db4cf2aeba3ec92755fe2fcd388bdbbb80ff196'
	};

	console.log(await lightClient.verifyTopicInTransaction(api, input));

	// const t = await api.getBeaconBlock(7061552);
	// const update = await api.getUpdate(864);
	// await lightClient.applyNewUpdate(update, 864);

	// const t = await api.getBootstrap('0x96a656e639a065de1a9ec04baeffa7c4d9246a23bb78b1c7d0cc0878f23e5a23')
	// console.log(t)
	// console.log(t)
}

main()
