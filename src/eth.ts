import axios, { Axios } from 'axios'
import { getEnv } from "./utils.js";
import { allForks, capella, ssz } from "@lodestar/types"
import {Api, HttpStatusCode, getClient} from "@lodestar/api";
import {config} from "@lodestar/config/default";
import * as types from "@lodestar/types/capella";

type BeaconBlock = typeof ssz.altair.BeaconBlock
type BlockWithProof = [
    block: BeaconBlock,
    syncAggregate: typeof ssz.altair.SyncAggregate,
    chain?: typeof ssz.altair.LightClientHeader[]
]

export class EthAPI {
    private consensus: Api
    private execution: Axios

    constructor(beaconURL = getEnv("BEACON_API"), executionURL = getEnv("EXECUTION_RPC")) {
        this.consensus = getClient({ baseUrl: beaconURL }, {config});
        this.execution = axios.create({ baseURL: executionURL })
    }

    async getBootstrap(blockRoot: string) {
        const res = await this.consensus.lightclient.getBootstrap(blockRoot);
        if (res.error) {
            console.error(res.error);
            throw new Error(`Error fetching or parsing bootstrap data`);
        }

        return true
    }

    async getUpdates(period: number, count = 1): Promise<capella.LightClientUpdate[]> {
        const res = await this.consensus.lightclient.getUpdates(period, count)
        if (res.error) {
            console.error(res.error);
            throw new Error(`Error fetching or parsing update data`);
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

    async getBeaconBlock(slot: number) {
        const res = await this.consensus.beacon.getBlock(slot)
        if (res.error) {
            console.error(res.error)
            throw new Error(`Error fetching or parsing block data. ${res.error}`);
        }

        return res.response.data;
    }

    async getBlockWithProof(period: number) {
    }
}

// // Convert hex to binary
// function countBits(hex: string) {
//     let bin = BigInt(hex).toString(2).padStart(hex.length * 4, '0');
//     return (bin.match(/1/g) || []).length;
// }
