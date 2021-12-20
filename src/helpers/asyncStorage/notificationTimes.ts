import AsyncStorage from "@react-native-async-storage/async-storage";

import { logAndThrowError } from "../debug";
import { getASKeyAsync } from "./asyncStorage";

const NOTIFICATION_TIMES_KEY = `NotificationTime`;

export type NotificationDateWithExpirationDate = {
  notificationDate: Date;
  expirationDate: Date;
};

export async function storeNotificationTimesAsync(
  times: NotificationDateWithExpirationDate[],
) {
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

export async function getNotificationTimesAsync(): Promise<
  NotificationDateWithExpirationDate[] | null
> {
  try {
    const value = await AsyncStorage.getItem(
      await getASKeyAsync(NOTIFICATION_TIMES_KEY),
    );
    if (value == null) {
      return null;
    }
    const timesInfoString: {
      notificationDate: string;
      expirationDate: string;
    }[] = JSON.parse(value);
    const timesInfo: NotificationDateWithExpirationDate[] = timesInfoString.map(
      (dateInfoString) => {
        return {
          notificationDate: new Date(dateInfoString.notificationDate),
          expirationDate: new Date(dateInfoString.expirationDate),
        };
      },
    );
    return timesInfo;
  } catch (error) {
    logAndThrowError(error);
  }
}
