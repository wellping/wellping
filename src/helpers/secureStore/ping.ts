import { parseJSON } from "date-fns";
import * as SecureStore from "expo-secure-store";

import { addToPingsListIfNeededAsync } from "../asyncStorage/pingsList";
import { logError } from "../debug";
import { PingSchema } from "../schemas/Ping";
import { Ping, PingId } from "../types";
import { getSSKeyAsync } from "./secureStore";

const PING_PREFIX = `ping.`;
const getKey = (pingId: PingId) => `${PING_PREFIX}${pingId}`;

export async function secureStorePingAsync(ping: Ping) {
  try {
    await SecureStore.setItemAsync(
      await getSSKeyAsync(getKey(ping.id)),
      JSON.stringify(ping),
    );
    await addToPingsListIfNeededAsync(ping);
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

    // TODO: CONSIDER BETTER WAY TO DO THIS (INSTEAD OF HARDCODING).
    const parsedValue = JSON.parse(value);
    parsedValue.startTime = parsedValue.startTime
      ? parseJSON(parsedValue.startTime)
      : null;
    parsedValue.notificationTime = parsedValue.notificationTime
      ? parseJSON(parsedValue.notificationTime)
      : null;
    parsedValue.endTime = parsedValue.endTime
      ? parseJSON(parsedValue.endTime)
      : null;

    return PingSchema.parse(parsedValue);
  } catch (error) {
    logError(error);
    return null;
  }
}

export async function secureRemovePingAsync(pingId: PingId) {
  try {
    if ((await secureGetPingAsync(pingId)) !== null) {
      await SecureStore.deleteItemAsync(await getSSKeyAsync(getKey(pingId)));
    }
  } catch (error) {
    logError(error);
  }
}
