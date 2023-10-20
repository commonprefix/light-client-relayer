import axios, { Axios } from 'axios'
import { getEnv } from "./utils.js";
import { phase0 } from "@lodestar/types"
import * as capella from "@lodestar/types/capella"
import { Api, getClient } from "@lodestar/api";
import { config } from "@lodestar/config/default";
import { SyncAggregate } from '@lodestar/types/lib/altair/types.js';
import { toBlockHeader } from '@lodestar/light-client/utils';
import { BeaconBlockHeader } from '@lodestar/types/lib/phase0/types.js';
import { BlockHeaders, LightClientBlockValidationRequest, serializeBlockVerificationData } from './types.js';
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

    async getBeaconBlock(slot: number): Promise<capella.SignedBeaconBlock> {
        const res = await this.consensus.beacon.getBlockV2(slot)
        if (res.error) {
            console.error(res.error)
            throw new Error(`Error fetching or parsing block data.`)
        }

        return res.response.data 
    }

    async getBeaconBlockHeader(slot: number): Promise<phase0.BeaconBlockHeader> {
        const res = await this.consensus.beacon.getBlockHeader(slot)
        if (res.error) {
            console.error(res.error)
            throw new Error(`Error fetching or parsing block header data.`)
        }

        return res.response.data.header.message
    }

    async getBlockVerificationData(slot: number): Promise<LightClientBlockValidationRequest> {
        let syncAggregateSig: SyncAggregate | null = null
        let intermediateChain: BeaconBlockHeader[] = []

        const targetBlock = await this.getBeaconBlock(slot)
        const executionBlockHash = toHexString(targetBlock.message.body.eth1Data.blockHash)
        const targetBlockHeaders: BlockHeaders = {
            beaconHeader: toBlockHeader(targetBlock.message),
            executionHeader: await this.getExecutionBlockHeader(executionBlockHash)
        } 
    
        while (true) {
            const block = await this.getBeaconBlock(slot++)
            const isValidSyncAggregate = await this.verifySyncAggregate(block, targetBlock.message.body.syncAggregate)

            if (isValidSyncAggregate) {
                syncAggregateSig = block.message.body.syncAggregate
                break
            }

            const header = toBlockHeader(block.message)
            intermediateChain.push(header)
        }

        return {
            targetBlockHeaders,
            syncAggregateSig,
            intermediateChain,
        };
    }

    /**
     * TODO: Verify that sync aggregate is actually valid and refers to the previous block
    */
    public async verifySyncAggregate(attestedBlock: capella.SignedBeaconBlock, syncAggregate: SyncAggregate) {
        const participation = syncAggregate.syncCommitteeBits.getTrueBitIndexes().length
        return participation >= MIN_SYNC_COMMITTEE_PARTICIPATION
    }
}
