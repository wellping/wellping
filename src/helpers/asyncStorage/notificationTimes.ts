import AsyncStorage from "@react-native-async-storage/async-storage";

import { logAndThrowError } from "../debug";
import { getASKeyAsync } from "./asyncStorage";

const NOTIFICATION_TIMES_KEY = `NotificationTime`;

export async function storeNotificationTimesAsync(times: Date[]) {
  try {
    await AsyncStorage.setItem(
      await getASKeyAsync(NOTIFICATION_TIMES_KEY),
      JSON.stringify(times),
    );
  } catch (error) {
    logAndThrowError(error);
  }
}

export async function clearNotificationTimesAsync() {
  try {
    await AsyncStorage.removeItem(await getASKeyAsync(NOTIFICATION_TIMES_KEY));
  } catch (error) {
    logAndThrowError(error);
  }
}

export async function getNotificationTimesAsync(): Promise<Date[] | null> {
  try {
    const value = await AsyncStorage.getItem(
      await getASKeyAsync(NOTIFICATION_TIMES_KEY),
    );
    if (value == null) {
      return null;
    }
    const timesString: string[] = JSON.parse(value);
    const times = timesString.map((dateString) => new Date(dateString));
    return times;
  } catch (error) {
    logAndThrowError(error);
  }
}
