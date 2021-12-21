import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ping, PingId } from "@wellping/study-schemas/lib/types";

import { logAndThrowError } from "../debug";
import { getASKeyAsync } from "./asyncStorage";

export type PingsList = PingId[];

const PINGS_LIST = `pingsList`;

export async function addToPingsListIfNeededAsync(ping: Ping) {
  try {
    const currentPingsList = await getPingsListAsync();
    if (currentPingsList.includes(ping.id)) {
      // Do not add it to the list if it is in the list already.
      return;
    }

    currentPingsList.push(ping.id);
    await AsyncStorage.setItem(
      await getASKeyAsync(PINGS_LIST),
      JSON.stringify(currentPingsList),
    );
  } catch (error) {
    logAndThrowError(error);
  }
}

export async function clearPingsListAsync() {
  try {
    await AsyncStorage.removeItem(await getASKeyAsync(PINGS_LIST));
  } catch (error) {
    logAndThrowError(error);
  }
}

export async function getPingsListAsync(): Promise<PingsList> {
  try {
    const value = await AsyncStorage.getItem(await getASKeyAsync(PINGS_LIST));
    if (value == null) {
      return [];
    }
    return JSON.parse(value);
  } catch (error) {
    logAndThrowError(error);
  }
}
