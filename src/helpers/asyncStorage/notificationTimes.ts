import { Notifications } from "expo";
import { AsyncStorage } from "react-native";

import { logError } from "../debug";
import { getASKeyAsync } from "./asyncStorage";

const NOTIFICATION_TIMES_KEY = `NotificationTime`;

export async function storeNotificationTimesAsync(times: Date[]) {
  try {
    await AsyncStorage.setItem(
      await getASKeyAsync(NOTIFICATION_TIMES_KEY),
      JSON.stringify(times),
    );
  } catch (error) {
    // Error saving data
    logError(error);
  }
}

export async function clearNotificationTimesAsync() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem(await getASKeyAsync(NOTIFICATION_TIMES_KEY));
  } catch (error) {
    // Error saving data
    logError(error);
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
    // Error retrieving data
    logError(error);
    return null;
  }
}
