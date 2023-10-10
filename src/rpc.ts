import axios from 'axios'
import { getEnv } from "./utils";

const BEACON_CHAIN_API_URL = getEnv("BEACON_API")

export async function getBootstrap(blockRoot: string) {
    const req = `${BEACON_CHAIN_API_URL}/eth/v1/beacon/light_client/bootstrap/${blockRoot}`;

    try {
        const response = await axios.get(req);
        return response.data.data;
    } catch (error) {
        throw new Error(`Error fetching or parsing bootstrap data: ${error}`);
    }
}

export async function getUpdate(period: number) {
    const req = `${BEACON_CHAIN_API_URL}/eth/v1/beacon/light_client/updates?start_period=${period}&count=1`;

    try {
        const response = await axios.get(req);
        return response.data.length ? response.data[0].data : null;
    } catch (error) {
        // If error response is available from server, use it, otherwise use the error message
        throw new Error(`Error fetching or parsing update data: ${error}`);
    }
}
