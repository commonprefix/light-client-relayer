import { getEnv } from './utils.js'
import { EthAPI } from './eth.js';
import * as capella from '@lodestar/types/capella';
import * as phase0 from '@lodestar/types/phase0';
import {verifyMerkleBranch} from '@lodestar/utils'
import { CompactMultiProof, ProofType, SingleProof, Tree, createNodeFromProof, deserializeProof, serializeProof} from '@chainsafe/persistent-merkle-tree'
import { ssz } from "@lodestar/types"

const merkleProofThatWorks = async () => {
	let now = Date.now()
	const api = new EthAPI()

	const EXECUTION_STATE_ROOT_GINDEX = ssz.capella.BeaconBlock.getPathInfo(['body', 'executionPayload']).gindex

	const res = await api.getBlockProof('head', EXECUTION_STATE_ROOT_GINDEX) as CompactMultiProof
	const tree = Tree.createFromProof(res);

	const proof: SingleProof = tree.getProof({
		type: ProofType.single,
		gindex: EXECUTION_STATE_ROOT_GINDEX,
	}) as SingleProof;

	console.log("Weve got an proof", proof)
	const header = await api.getBeaconBlock('head')
	const root = capella.ssz.BeaconBlock.hashTreeRoot(header) 
	const leaf = capella.ssz.ExecutionPayload.hashTreeRoot(header.body.executionPayload)

	const depth = Math.floor(Math.log2(Number(EXECUTION_STATE_ROOT_GINDEX)))
	const index = Number(EXECUTION_STATE_ROOT_GINDEX) % (2 ** depth)

	const merkle_valid = verifyMerkleBranch(
		leaf,
		proof.witnesses,
		depth,
		index,
		root
	)
	console.log(merkle_valid)

}
const main = async () => {

	let now = Date.now()
	const api = new EthAPI()

	const EXECUTION_STATE_ROOT_GINDEX = ssz.capella.BeaconState.getPathInfo(['blockRoots']).gindex
	const state = await api.getState("head");

	const res = await api.getStateProof('head', EXECUTION_STATE_ROOT_GINDEX) as CompactMultiProof
	const tree = Tree.createFromProof(res);

	const proof: SingleProof = tree.getProof({
		type: ProofType.single,
		gindex: EXECUTION_STATE_ROOT_GINDEX,
	}) as SingleProof;

	console.log("Weve got an proof", proof)

	const depth = Math.floor(Math.log2(Number(EXECUTION_STATE_ROOT_GINDEX)))
	const index = Number(EXECUTION_STATE_ROOT_GINDEX) % (2 ** depth)

	const merkle_valid = verifyMerkleBranch(
		phase0.ssz.HistoricalBlockRoots.hashTreeRoot(state.blockRoots),
		proof.witnesses,
		depth,
		index,
		capella.ssz.BeaconState.hashTreeRoot(state)
	)
	console.log(merkle_valid)


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