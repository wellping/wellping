import {
  addDays,
  addHours,
  addMinutes,
  setHours,
  setMinutes,
  setSeconds,
  min,
  isSameDay,
  addSeconds,
  max,
} from "date-fns";
import { Notifications } from "expo";
import * as Permissions from "expo-permissions";
import { LocalNotification } from "expo/build/Notifications/Notifications.types";
import { Platform } from "react-native";

import { _DEBUG_CONFIGS } from "../../config/debug";
import { StudyInfo } from "../../types";
import {
  storeNotificationTimesAsync,
  getNotificationTimesAsync,
  getThisWeekPingsAsync,
} from "./asyncStorage";
import { isTimeThisWeek } from "./configFiles";

const ANDROID_CHANNEL_NAME = "ssnlPingChannel";

export async function setupNotificationsPermissionAsync(): Promise<boolean> {
  const { status: existingStatus } = await Permissions.getAsync(
    Permissions.USER_FACING_NOTIFICATIONS,
  );
  let finalStatus = existingStatus;

  // only ask if permissions have not already been determined, because
  // iOS won't necessarily prompt the user a second time.
  if (existingStatus !== "granted") {
    const { status } = await Permissions.askAsync(
      Permissions.USER_FACING_NOTIFICATIONS,
    );
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return false;
  } else {
    if (Platform.OS === "android") {
      Notifications.createChannelAndroidAsync(ANDROID_CHANNEL_NAME, {
        name: "Pings",
        description: "Pings from WellPing.",
        sound: true,
        priority: "high",
        vibrate: true,
        badge: true,
      });
    }

    return true;
  }
}

export async function setNotificationsAsync(studyInfo: StudyInfo) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const hoursEveryday = studyInfo.frequency.hoursEveryday;

  // https://stackoverflow.com/a/3894087/2603230
  const thisMorning = new Date();
  thisMorning.setHours(1, 0, 0, 0); // 1AM this morning

  const startDate = max([new Date(studyInfo.startDate), thisMorning]);
  const studyEndDate = new Date(studyInfo.endDate);
  // You can only schedule at most 64 local notifications on iOS.
  // Some say on Android, the limit is even lower: 50 (https://stackoverflow.com/a/36677835/2603230)
  // To be safe, we schedule at most 28 notifications, which means 7 days.
  const setNotificationsUntil = min([addDays(startDate, 7), studyEndDate]);
  const notificationTimes: Date[] = [];

  const currentlySetNotifications = (await getNotificationTimesAsync()) || [];
  for (const currentlySetNotificationTime of currentlySetNotifications) {
    if (isSameDay(currentlySetNotificationTime, startDate)) {
      notificationTimes.push(currentlySetNotificationTime);
    } else if (currentlySetNotificationTime > startDate) {
      break;
    }
  }

  for (
    let date =
      currentlySetNotifications.length === 0
        ? startDate
        : addDays(startDate, 1);
    date < setNotificationsUntil;
    date = addDays(date, 1)
  ) {
    for (const hour of hoursEveryday) {
      let notificationTime = setHours(setMinutes(date, 0), hour);

      // Randomly add `randomMinMinuteAddition` to `randomMaxMinuteAddition` minutes (inclusive) to the notification time.
      const randomMinMinuteAddition =
        studyInfo.frequency.randomMinuteAddition.min;
      const randomMaxMinuteAddition =
        studyInfo.frequency.randomMinuteAddition.max;
      const randomMinuteAddition =
        Math.floor(
          Math.random() *
            (randomMaxMinuteAddition + 1 - randomMinMinuteAddition),
        ) + randomMinMinuteAddition;
      notificationTime = addMinutes(notificationTime, randomMinuteAddition);

      const randomSecond = Math.floor(Math.random() * 60) + 1;
      notificationTime = setSeconds(notificationTime, randomSecond);

      if (notificationTime < new Date()) {
        continue;
      }

      notificationTimes.push(notificationTime);
    }
  }

  // TODO: THIS FUNCTION NEED MORE TEST
  const startedPingsThisWeek = await getThisWeekPingsAsync();
  const numberOfPingsStartedThisWeek = startedPingsThisWeek.length;

  await Promise.all(
    notificationTimes.map(async (notificationTime) => {
      if (notificationTime >= new Date()) {
        const configNotificationContent = studyInfo.notificationContent;

        let remainingPingCount =
          configNotificationContent.bonus.numberOfCompletionEachWeek;
        let shouldUseDefaultContent = false;
        if (isTimeThisWeek(notificationTime)) {
          if (
            numberOfPingsStartedThisWeek <
            configNotificationContent.bonus.numberOfCompletionEachWeek
          ) {
            remainingPingCount =
              configNotificationContent.bonus.numberOfCompletionEachWeek -
              numberOfPingsStartedThisWeek;
          } else {
            shouldUseDefaultContent = true;
          }
        }

        let notificationTitle: string, notificationBody: string;
        if (shouldUseDefaultContent) {
          notificationTitle = configNotificationContent.default.title;
          notificationBody = configNotificationContent.default.body;
        } else {
          const nPingKeyword = "#n_ping#";
          let mPingText = `${remainingPingCount} pings`;
          if (remainingPingCount == 1) {
            mPingText = `1 ping`;
          }

          // https://stackoverflow.com/a/1145525/2603230
          notificationTitle = configNotificationContent.bonus.title
            .split(nPingKeyword)
            .join(mPingText);
          notificationBody = configNotificationContent.bonus.body
            .split(nPingKeyword)
            .join(mPingText);
        }

        console.warn(`${notificationBody} for ${notificationTime}`);

        const notification: LocalNotification = {
          title: notificationTitle,
          body: notificationBody,
          android: {
            channelId: ANDROID_CHANNEL_NAME,
          },
        };

        await Notifications.scheduleLocalNotificationAsync(notification, {
          time: notificationTime,
        });
      }
    }),
  );

  await storeNotificationTimesAsync(notificationTimes);

  //console.warn("NEW NOTIFICATION SET!");
}

function getCurrentTime(): Date {
  const currentTime = new Date();

  // DEBUG
  //let currentTime = addMinutes(new Date(), 30);
  //currentTime = addHours(currentTime, 1);

  return currentTime;
}

// If `null` is returned, it means that currently there's no active ping.
export async function getCurrentNotificationTimeAsync(): Promise<Date | null> {
  // DEBUG
  if (__DEV__ && _DEBUG_CONFIGS().ignoreNotificationTime) {
    const fakeNotificationTime = addMinutes(new Date(), -10);
    return fakeNotificationTime;
  }

  const notificationsTimes = await getNotificationTimesAsync();

  // DEBUG
  /*notificationsTimes.forEach(element => {
    console.log(format(element, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"));
  });*/

  for (const notificationsTime of notificationsTimes) {
    const expirationTime = addHours(notificationsTime, 2);
    const currentTime = getCurrentTime();

    if (currentTime >= notificationsTime && currentTime <= expirationTime) {
      return notificationsTime;
    }
  }
  return null;
}

// DEBUG ONLY
// If `null` is returned, it means there's no next ping
export async function getIncomingNotificationTimeAsync(): Promise<Date | null> {
  const notificationsTimes = await getNotificationTimesAsync();

  const currentTime = getCurrentTime();

  const currentIndex = notificationsTimes.findIndex(
    (notificationsTime) => currentTime < notificationsTime,
  );

  if (currentIndex === -1) {
    return null;
  }

  return notificationsTimes[currentIndex];
}

export async function _sendTestNotificationAsync() {
  await Notifications.scheduleLocalNotificationAsync(
    {
      title: "TEST!",
      body: "YOU RECEIVED IT!",
      android: {
        channelId: ANDROID_CHANNEL_NAME,
      },
    },
    {
      time: addSeconds(new Date(), 5),
    },
  );
}
