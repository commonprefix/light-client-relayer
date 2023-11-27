import axios, { Axios } from 'axios'
import { getEnv } from "./utils.js";
import { phase0, ssz } from "@lodestar/types"
import * as capella from "@lodestar/types/capella"
import { Api, getClient } from "@lodestar/api";
import { config } from "@lodestar/config/default";
import { SyncAggregate } from '@lodestar/types/lib/altair/types.js';
import { BeaconBlockHeader } from '@lodestar/types/lib/phase0/types.js';
import { LightClientBlockValidationRequest} from './types.js';
import { BeaconBlock, BeaconBlockBody } from '@lodestar/types/lib/phase0/sszTypes.js';
import {Proof, computeDescriptor} from "@chainsafe/persistent-merkle-tree";
import {verifyMerkleBranch} from '@lodestar/utils'
import { toHexString } from '@chainsafe/ssz';

const MIN_SYNC_COMMITTEE_PARTICIPATION = 450

export class EthAPI {
    private consensus: Api
    private execution: Axios

    constructor(beaconURL = getEnv("BEACON_API"), executionURL = getEnv("EXECUTION_RPC")) {
        this.consensus = getClient({ baseUrl: beaconURL }, {config})
        this.execution = axios.create({ baseURL: executionURL })
    }

    async getBootstrap(blockRoot: string) {
        const res = await this.consensus.lightclient.getBootstrap(blockRoot)
        if (res.error) {
            console.error(res.error)
            throw new Error(`Error fetching or parsing bootstrap data`)
        }

        return true
    }

    async getBlockRoot(slot: number): Promise<string> {
        const res = await this.consensus.beacon.getBlockRoot(slot)
        if (res.error) {
            console.error(res.error)
            throw new Error(`Error fetching or parsing block root data`)
        }

        return toHexString(res.response.data.root)
    }

    async getUpdates(period: number, count = 1): Promise<capella.LightClientUpdate[]> {
        const res = await this.consensus.lightclient.getUpdates(period, count)
        if (res.error) {
            console.error(res.error)
            throw new Error(`Error fetching or parsing update data`)
        }

        return res.response.map((r) => r.data as capella.LightClientUpdate);
    }

    async getUpdate(period: number): Promise<capella.LightClientUpdate> {
        const res = await this.consensus.lightclient.getUpdates(period, 1)
        if (res.error) {
            console.error(res.error)
            throw new Error(`Error fetching or parsing update data`)
        }

        return res.response[0].data as capella.LightClientUpdate;
    }

    async getState(blockRoot: string): Promise<capella.BeaconState> {
        const res = await this.consensus.debug.getStateV2(blockRoot)

        if (res.error) {
            console.error(res.error)
            throw new Error(`Error fetching or parsing update data`)
        }

        return res.response.data as capella.BeaconState
    }

    async getStateProof(stateId: string, g_index: any) {
        const descriptor = computeDescriptor([g_index])
        const res = await this.consensus.proof.getStateProof(stateId, descriptor)
        console.log(res)

        return res.response?.data as Proof
    }

    async getBlockProof(blockRoot: string, g_index: any[]) {
        const descriptor = computeDescriptor(g_index)
        const res = await this.consensus.proof.getBlockProof(blockRoot, descriptor)
        console.log(res)
        return res.response?.data as Proof
    }

    async getExecutionBlockHeader(hash: string): Promise<any> { 
        const res = await this.execution.post('/', {
            jsonrpc: '2.0',
            method: 'eth_getHeaderByHash',
            params: [hash],
            id: 1,
        })
        const h = res.data.result

        return h
    }

    async getBeaconBlock(slot: number | string): Promise<capella.BeaconBlock> {
        const res = await this.consensus.beacon.getBlockV2(slot)
        if (res.error) {
            console.error(res.error)
            throw new Error(`Error fetching or parsing block data.`)
        }

        return res.response.data.message as capella.BeaconBlock
    }

    async getBeaconBlockHeader(slot: number | string): Promise<phase0.BeaconBlockHeader> {
        const res = await this.consensus.beacon.getBlockHeader(slot)
        if (res.error) {
            console.error(res.error)
            throw new Error(`Error fetching or parsing block header data.`)
        }

        return res.response.data.header.message
    }

    toBlockHeader(block: capella.BeaconBlock): BeaconBlockHeader {
        return {
            slot: block.slot,
            proposerIndex: block.proposerIndex,
            parentRoot: block.parentRoot,
            stateRoot: block.stateRoot,
            bodyRoot: capella.ssz.BeaconBlockBody.hashTreeRoot(block.body),
          };
    }

    async getBlockVerificationData(slot: number): Promise<LightClientBlockValidationRequest> {
        let syncAggregate: SyncAggregate | null = null
        let intermediateChain: BeaconBlockHeader[] = []
        let sigSlot: number

        const targetBlock = await this.getBeaconBlock(slot)
        while (true) {
            slot++
            const block = await this.getBeaconBlock(slot)
            const isValidSyncAggregate = await this.verifySyncAggregate(block, targetBlock.body.syncAggregate)

            if (isValidSyncAggregate) {
                syncAggregate = block.body.syncAggregate
                sigSlot = block.slot
                break
            }

            const header = this.toBlockHeader(block)
            intermediateChain.push(header)
        }

        return {
            targetBlock,
            intermediateChain,
            syncAggregate,
            sigSlot,
        };
    }

    /**
     * TODO: Verify that sync aggregate is actually valid and refers to the previous block
    */
    public async verifySyncAggregate(attestedBlock: capella.BeaconBlock, syncAggregate: SyncAggregate) {
        const participation = syncAggregate.syncCommitteeBits.getTrueBitIndexes().length
        return participation >= MIN_SYNC_COMMITTEE_PARTICIPATION
    }
}
