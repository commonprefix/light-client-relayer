import { getEnv } from './utils.js'
import { EthAPI } from './eth.js';
import * as capella from '@lodestar/types/capella';
import * as bellatrix from '@lodestar/types/bellatrix';
import * as phase0 from '@lodestar/types/phase0';
import {verifyMerkleBranch} from '@lodestar/utils'
import {executionPayloadToPayloadHeader} from '@lodestar/state-transition'
import { CompactMultiProof, ProofType, SingleProof, Tree, createNodeFromProof, createProof, deserializeProof, serializeProof} from '@chainsafe/persistent-merkle-tree'
import { ssz } from "@lodestar/types"
import { toHexString } from '@chainsafe/ssz';
import fs from 'fs';
import {
	 keccak_256
  } from '@noble/hashes/sha3';
import { bytesToHex as toHex } from '@noble/hashes/utils';
import axios from 'axios'

const readState = () => {
	const state = fs.readFileSync('state-ssz')
	return bellatrix.ssz.BeaconState.deserialize(state)
}

const getBlockRoot = async (slot: number) => {
	const req = await axios.get(`http://nimbus-mainnet.commonprefix.com/eth/v1/beacon/blocks/${slot}/root`)
	return req.data.data.root;
}

const main = async () => {
	let now = Date.now()
	const api = new EthAPI()
	// array of 10000 
	const root = await getBlockRoot(7857200);
	console.log(root)

	const getHistoricalRange = async (start: number, end: number) => {
		const slots = Array.from({length: end - start + 1}, (_, i) => i + start)
		const arr = await Promise.allSettled(slots.map(getBlockRoot))

		const blockRoots = phase0.ssz.HistoricalBlockRoots.fromJson(arr);
		console.log('hashed', phase0.ssz.HistoricalBlockRoots.hashTreeRoot(blockRoots))
		return blockRoots
	}


	// console.log(res)
	// const res = await Promise.allSettled(arr.map((match)=>{
	// 		return axios.get('http://nimbus-mainnet.commonprefix.com/eth/v1/beacon/blocks/head/root').then(t => t.data.data.value);
	// }))

	// console.log(res)

	// const recentHeader = await api.getBeaconBlock('head');
	// const recentSlot = recentHeader.slot;

	// const targetBlock = await api.getBeaconBlock(recentSlot - 100000);
	const CAPELLA_FORK_EPOCH = 194048;
	const SLOT_PER_EPOCH = 32;
	const CAPELLA_FORK_SLOT = CAPELLA_FORK_EPOCH * SLOT_PER_EPOCH;
	const SLOTS_PER_HISTORICAL_ROOT = 8192

	// let historicalS = Math.floor((targetBlock.slot - CAPELLA_FORK_EPOCH * SLOT_PER_EPOCH) / SLOTS_PER_HISTORICAL_ROOT)
	const gindex = capella.ssz.BeaconState.getPathInfo(['historical_summaries', 0, 'block_summary_root']).gindex
	console.log(gindex)
	const proof = await api.getStateProof('head', gindex) as CompactMultiProof
	const tree = Tree.createFromProof(proof as CompactMultiProof);
	const p: SingleProof = tree.getProof({
		type: ProofType.single,
		gindex: gindex,
	}) as SingleProof;
	console.log("EXPECTED BLOCK ROOT", toHexString(p.leaf))

	const res = getHistoricalRange(CAPELLA_FORK_SLOT, CAPELLA_FORK_SLOT + SLOTS_PER_HISTORICAL_ROOT)

	// let suspectedStateSLot =  historicalS * SLOTS_PER_HISTORICAL_ROOT - 1;
	// let suspectHeader = await api.getBeaconBlockHeader(suspectedStateSLot);
	// let suspectStateId = toHexString(suspectHeader.stateRoot);
	// console.log("SUSPECT STATE ID", suspectStateId)
	// const state = readState()
	// //const state = await api.getState('head');
	// const blockRoot = phase0.ssz.HistoricalBlockRoots.hashTreeRoot(state.blockRoots)
	// console.log("BLOCK ROOT", blockRoot)


	// console.log(historicalS)

	// let blockThatHasBlockRoots = await api.getBeaconBlock((historicalSummariesIndex + CAPELLA_FORK_SLOT)

	// console.log("Recent slot", recentSlot)

	// console.log(historicalSummariesIndex)
	// let epoch = Math.floor(state.slot / 32)

	// const SLOTS_PER_HISTORICAL_ROOT = 8192;
	// for (let i = 0; i < SLOTS_PER_HISTORICAL_ROOT; i++) {
	// 	let blockRootsState = toHexString(state.stateRoots[i])
	// 	let stateRootLatest = toHexString(block.stateRoot) 
	// 	// console.log(blockRootsState, stateRootLatest)
	// 	if (blockRootsState === stateRootLatest) {
	// 		console.log('FOUND', i)
	// 	}
	// }


	// const gindex = ssz.capella.BeaconBlock.getPathInfo(['body', 'executionPayload', 'transactions', '15']).gindex
	// console.log(gindex)

	// let blockRoot = '0x7d6b5bbdd7de1273eb399ca4135896cecd6bbc63d4a221c43e230b9ad1eafa3b'
	// let block = await api.getBeaconBlock(blockRoot)
	// console.log("SLOT", block.slot)

	// let transaction = block.body.executionPayload.transactions[15]

	// console.log("TX HASH", toHex(keccak_256(transaction))); // ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad
	// console.log("NODE TX", toHexString(ssz.bellatrix.Transaction.hashTreeRoot(transaction)))
	// const res = await api.getBlockProof(blockRoot, [gindex]) as CompactMultiProof
	// const tree = Tree.createFromProof(res);

	// const proof: SingleProof = tree.getProof({
	// 	type: ProofType.single,
	//  	gindex: gindex
	// }) as SingleProof;

	// const depth = Math.floor(Math.log2(Number(gindex)))
	// const index = Number(gindex) % (2 ** depth)

	// const merkle_valid = verifyMerkleBranch(
	// 	proof.leaf,
	// 	proof.witnesses,
	// 	depth,
	// 	index,
	// 	block_hash
	// )

	// console.log("LEAF" ,toHexString(proof.leaf))
	// console.log('Is valid merkle',merkle_valid)

	// console.log(gindex)
	// const beaconBlock = await api.getBeaconBlock('head')
	// const executionPayloadRoot = capella.ssz.ExecutionPayload.hashTreeRoot(beaconBlock.body.executionPayload)

	// const EXECUTION_STATE_ROOT_GINDEX = ssz.capella.BeaconBlock.getPathInfo(['body', 'executionPayload', 'transactions', 0]).gindex
	// console.log(EXECUTION_STATE_ROOT_GINDEX)
	// // sssz_verify_multiproof(proof)

	// enum ForkSeq {
	// 	phase0 = 0,
	// 	altair = 1,
	// 	bellatrix = 2,
	// 	capella = 3,
	// 	deneb = 4
	// }

	// const header = await api.getBeaconBlock('head')
	// const executionPayload = header.body.executionPayload;
	// const payloadHeader = executionPayloadToPayloadHeader(ForkSeq.capella, executionPayload);
	// const txRoot = toHexString(payloadHeader.transactionsRoot)
	// console.log(header.slot)
	// console.log(txRoot)


	// // console.log(merkle_valid)


	// const state = await api.getState("head")
	// console.log("Weve got an state", Date.now() - now)
	// now = Date.now()
	// const lala = capella.ssz.BeaconState.hashTreeRoot(state);
	// console.log("parse", Date.now() - now)
	// console.log(lala)
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