import axios, { Axios } from 'axios'
import { getEnv } from "./utils.js";
import { ssz } from "@lodestar/types"
import { LightClientUpdate } from '@lodestar/types/lib/altair/types.js';

type BeaconBlock = typeof ssz.altair.BeaconBlock
type BlockWithProof = [
    block: BeaconBlock,
    syncAggregate: typeof ssz.altair.SyncAggregate,
    chain?: typeof ssz.altair.LightClientHeader[]
]

export class BeaconAPI {
    api: Axios
    constructor(baseURL = getEnv("BEACON_API")) {
        this.api = axios.create({ baseURL }) 
    }

    async getBootstrap(blockRoot: string) {
        try {
            const res = await this.api.get(`/eth/v1/beacon/light_client/bootstrap/${blockRoot}`);
            return res.data.data;
        } catch (error) {
            throw new Error(`Error fetching or parsing bootstrap data: ${error}`);
        }
    }

    async getUpdates(period: number, count = 1) {
        try {
            const res = await this.api.get(`/eth/v1/beacon/light_client/updates?start_period=${period}&count=${count}`);
            return res.data.length ? res.data : null;
        } catch (error) {
            // If error response is available from server, use it, otherwise use the error message
            throw new Error(`Error fetching or parsing update data: ${error}`);
        }
    }

    async getUpdate(period: number) {
        try {
            const res = await this.getUpdates(period); 
            return res ? res[0].data : null;
        }
        catch (error) {
            throw new Error(`Error fetching or parsing update data: ${error}`);
        }
    }
}

// // Convert hex to binary
// function countBits(hex: string) {
//     let bin = BigInt(hex).toString(2).padStart(hex.length * 4, '0');
//     return (bin.match(/1/g) || []).length;
// }
