import * as SecureStore from "expo-secure-store";

import {
  addToPingsListAsync,
  getPingsListAsync,
  clearPingsListAsync,
} from "../asyncStorage/pingsList";
import { logError } from "../debug";
import { PingSchema } from "../schemas/Ping";
import { Ping, PingId } from "../types";
import { getSSKeyAsync } from "./secureStore";

const PING_PREFIX = `ping/`;
const getKey = (pingId: PingId) => `${PING_PREFIX}${pingId}`;

export async function secureStorePingAsync(ping: Ping, isNew: boolean) {
  try {
    await SecureStore.setItemAsync(
      await getSSKeyAsync(getKey(ping.id)),
      JSON.stringify(ping),
    );
    if (isNew) {
      await addToPingsListAsync(ping);
    }
  } catch (error) {
    logError(error);
  }
}

export async function secureGetPingAsync(pingId: PingId): Promise<Ping | null> {
  try {
    const value = await SecureStore.getItemAsync(
      await getSSKeyAsync(getKey(pingId)),
    );
    if (value == null) {
      return null;
    }
    return PingSchema.parse(value);
  } catch (error) {
    logError(error);
    return null;
  }
}

export async function secureRemoveAllPingsAsync() {
  try {
    const pingsList = await getPingsListAsync();
    for (const pingId of pingsList) {
      await SecureStore.deleteItemAsync(await getSSKeyAsync(getKey(pingId)));
    }
    await clearPingsListAsync();
  } catch (error) {
    logError(error);
  }
}
