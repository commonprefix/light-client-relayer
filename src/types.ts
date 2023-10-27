import * as capella from "@lodestar/types/capella"
import * as altair from "@lodestar/types/altair"
import * as phase0 from "@lodestar/types/phase0"
import { SyncAggregate } from "@lodestar/types/altair"
import { BeaconBlockHeader } from "@lodestar/types/phase0"
import * as deneb from "@lodestar/types/deneb"


export type BlockHeaders = {
    beaconHeader: phase0.BeaconBlockHeader,
    executionHeader: deneb.ExecutionPayloadHeader,
}

export type LightClientBlockValidationRequest = {
    targetBlock: capella.BeaconBlock, //the block we want to verify,
    intermediateChain: BeaconBlockHeader[], // the chain of blocks from the target block to the block that has been signed with the latestCommitteeSignature
    syncAggregate: SyncAggregate // the chain of blocks from the target block to the block that has been signed with the latestCommitteeSignature
    sigSlot: number
}

export function serializeBlockVerificationData(data: LightClientBlockValidationRequest) {
    return {
        target_block: capella.ssz.BeaconBlock.toJson(data.targetBlock),
        sync_aggregate: altair.ssz.SyncAggregate.toJson(data.syncAggregate),
        sig_slot: data.sigSlot.toString(),
        intermediate_chain: data.intermediateChain.map((header) => phase0.ssz.BeaconBlockHeader.toJson(header))
    }
}

export function serializeBlockHeaders(data: BlockHeaders) {
    return {
        beaconHeader: phase0.ssz.BeaconBlockHeader.toJson(data.beaconHeader),
        executionHeader: data.executionHeader,
    }
}

export type UserInput = {
	blockNumber: number;
	transactionHash: string;
	topic: string;
};

export type Receipt = {
	transactionHash: string;
	blockHash: string;
	blockNumber: string;
	logs: [string, string[], string];
	contractAddress: null | string;
	effectiveGasPrice: string;
	cumulativeBlockGasUsed: number;
	from: string;
	gasUsed: string;
	logsBloom: string;
	status: 0 | 1;
	to: string;
	transactionIndex: string;
	type: 0 | 1 | 2 | 3;
}