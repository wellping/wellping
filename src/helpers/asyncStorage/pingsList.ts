import AsyncStorage from "@react-native-community/async-storage";

import { logError } from "../debug";
import { Ping, PingId } from "../types";
import { getASKeyAsync } from "./asyncStorage";

export type PingsList = PingId[];

const PINGS_LIST = `pingsList`;

export async function addToPingsListAsync(ping: Ping) {
  try {
    const currentPingsList = await getPingsListAsync();
    currentPingsList.push(ping.id);
    await AsyncStorage.setItem(
      await getASKeyAsync(PINGS_LIST),
      JSON.stringify(currentPingsList),
    );
  } catch (error) {
    logError(error);
  }
}

export async function clearPingsListAsync() {
  try {
    await AsyncStorage.removeItem(await getASKeyAsync(PINGS_LIST));
  } catch (error) {
    logError(error);
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
    logError(error);
    return [];
  }
}
