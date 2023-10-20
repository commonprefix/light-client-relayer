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
    targetBlockHeaders: BlockHeaders //the block we want to verify,
    syncAggregateSig: SyncAggregate, // the signature of the sync committee to the latest block of the intermediate chain or the target block if there is no intermediate chain
    intermediateChain: BeaconBlockHeader[] // the chain of blocks from the target block to the block that has been signed with the latestCommitteeSignature
}


export function serializeBlockVerificationData(data: LightClientBlockValidationRequest) {
    return {
        targetBLockHeaders: serializeBlockHeaders(data.targetBlockHeaders),
        syncAggregateSig: altair.ssz.SyncAggregate.toJson(data.syncAggregateSig),
        intermediateChain: data.intermediateChain.map(header => phase0.ssz.BeaconBlockHeader.toJson(header))
    }
}

export function serializeBlockHeaders(data: BlockHeaders) {
    return {
        beaconHeader: phase0.ssz.BeaconBlockHeader.toJson(data.beaconHeader),
        executionHeader: data.executionHeader,
    }
}