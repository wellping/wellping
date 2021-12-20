import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ping } from "wellping-study-file/lib/types";

import { logAndThrowError } from "../debug";
import { getASKeyAsync } from "./asyncStorage";
import { PingsList } from "./pingsList";

const UNUPLOADED_PINGS_LIST = `unuploadedPingsList`;

async function _setUnuploadedPingsListIfNeededAsync(pingsList: PingsList) {
  await AsyncStorage.setItem(
    await getASKeyAsync(UNUPLOADED_PINGS_LIST),
    JSON.stringify(pingsList),
  );
}

export async function addToUnuploadedPingsListIfNeededAsync(ping: Ping) {
  try {
    const currentUnuploadedPingsList = await getUnuploadedPingsListAsync();
    if (currentUnuploadedPingsList.includes(ping.id)) {
      // Do not add it to the list if it is in the list already.
      return;
    }

    currentUnuploadedPingsList.push(ping.id);
    await _setUnuploadedPingsListIfNeededAsync(currentUnuploadedPingsList);
  } catch (error) {
    logAndThrowError(error);
  }
}

export async function clearUnuploadedPingsListAsync() {
  try {
    await AsyncStorage.removeItem(await getASKeyAsync(UNUPLOADED_PINGS_LIST));
  } catch (error) {
    logAndThrowError(error);
  }
}

export async function removeFromUnuploadedPingsListAsync(
  toBeRemoved: PingsList,
) {
  try {
    const currentUnuploadedPingsList = await getUnuploadedPingsListAsync();
    // https://stackoverflow.com/a/1723220/2603230
    const newUnuploadedPingsList = currentUnuploadedPingsList.filter(
      (x) => !toBeRemoved.includes(x),
    );
    await _setUnuploadedPingsListIfNeededAsync(newUnuploadedPingsList);
  } catch (error) {
    logAndThrowError(error);
  }
}

export async function getUnuploadedPingsListAsync(): Promise<PingsList> {
  try {
    const value = await AsyncStorage.getItem(
      await getASKeyAsync(UNUPLOADED_PINGS_LIST),
    );
    if (value == null) {
      return [];
    }
    return JSON.parse(value);
  } catch (error) {
    logAndThrowError(error);
  }
}
