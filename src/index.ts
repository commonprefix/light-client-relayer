import { bytesToHex, formatReceipt, getEnv } from './utils.js';
import { EthAPI } from './eth.js';
import { LightClientAPI } from './lightclient.js';
import { serializeBlockVerificationData } from './types.js';
import { TrieWrapper} from './triewrapper.js';
import { Receipt, UserInput } from './types.js';
import assert from 'assert';

const CONTRACT_ADDRESS = getEnv("CONTRACT_ADDRESS") 

async function isTopicInTransaction(api: EthAPI, lightClient: LightClientAPI, input: UserInput) {
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

	const isValidReceipt = true;
	// const isValidReceipt = await lightClient.verify_receipt(
	// 	block.receiptsRoot.slice(2),
	// 	proof.map((p) => bytesToHex(p)),
	// 	TrieWrapper.encodeKey(transactionIndex)
	// );

	if (isValidReceipt) {
		return requestedTxReceipt.logs.find(log => log[1].includes(input.topic)) !== undefined;
	}
}

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
