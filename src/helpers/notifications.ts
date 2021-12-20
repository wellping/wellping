import {
  addDays,
  addMinutes,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  min,
  isSameDay,
  addSeconds,
  max,
  format,
} from "date-fns";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { _DEBUG_CONFIGS } from "../../config/debug";
import {
  getNotificationTimesAsync,
  storeNotificationTimesAsync,
  NotificationDateWithExpirationDate,
} from "./asyncStorage/notificationTimes";
import { getThisWeekPingsAsync } from "./pings";
import { secureGetUserAsync } from "./secureStore/user";
import {
  isTimeThisWeekAsync,
  getStudyInfoAsync,
  getStudyStartDate,
  getStudyEndDate,
} from "./studyFile";

export const ANDROID_CHANNEL_NAME = "ssnlPingChannel";

export async function setupNotificationsPermissionAsync(): Promise<boolean> {
  const existingPermission = await Notifications.getPermissionsAsync();
  let finalPermission = existingPermission;

  // only ask if permissions have not already been determined, because
  // iOS won't necessarily prompt the user a second time.
  if (!finalPermission.granted) {
    const results = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowAnnouncements: true,
      },
    });
    finalPermission = results;
  }

  let finalGranted = finalPermission.granted;
  if (Platform.OS === "ios") {
    finalGranted = !!finalPermission.ios?.allowsAlert;
  }

  if (!finalGranted) {
    return false;
  } else {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_NAME, {
        name: "Well Pings",
        importance: Notifications.AndroidImportance.HIGH,
        bypassDnd: true,
        description: "Pings from WellPing.",
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
        showBadge: true,
        sound: "default",
        enableLights: true,
        enableVibrate: true,
      });
    }

    return true;
  }
}

function getNotificationRequestInput(
  content: Notifications.NotificationContentInput,
  date: Date,
) {
  const notification: Notifications.NotificationRequestInput = {
    content: {
      badge: 1,
      ...content,
    },
    trigger: {
      date,
      channelId: ANDROID_CHANNEL_NAME,
    },
  };
  return notification;
}

const seedrandom = require("seedrandom");
export async function setNotificationsAsync() {
  const user = await secureGetUserAsync();
  const seedValue_username = user?.username ?? "defaultusername";

  const studyInfo = await getStudyInfoAsync();

  await Notifications.cancelAllScheduledNotificationsAsync();

  const pingsFrequency = studyInfo.pingsFrequency;

  // https://stackoverflow.com/a/3894087/2603230
  const thisMorning = new Date();
  thisMorning.setHours(1, 0, 0, 0); // 1AM this morning

  const startDate = max([getStudyStartDate(studyInfo), thisMorning]);
  const studyEndDate = getStudyEndDate(studyInfo);
  // You can only schedule at most 64 local notifications on iOS.
  // Some say on Android, the limit is even lower: 50 (https://stackoverflow.com/a/36677835/2603230)
  // To be safe, we schedule at most 28 notifications, which means (28 / hoursEveryday.length) days.
  const setNotificationsUntil = min([
    addDays(startDate, Math.floor(28 / pingsFrequency.length)),
    studyEndDate,
  ]);
  const notificationTimes: NotificationDateWithExpirationDate[] = [];

  const currentlySetNotifications = (await getNotificationTimesAsync()) || [];
  for (const currentlySetNotificationTimeInfo of currentlySetNotifications) {
    const currentlySetNotificationTime =
      currentlySetNotificationTimeInfo.notificationDate;
    if (isSameDay(currentlySetNotificationTime, startDate)) {
      notificationTimes.push(currentlySetNotificationTimeInfo);
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
    const dateMidnight = setHours(
      setMinutes(setSeconds(setMilliseconds(date, 0), 0), 0),
      0,
    );

    const seedValue_date = format(date, "yyyy-MM-dd");
    for (const pingTimeInfo of pingsFrequency) {
      const earliestPingNotificationTimeSinceMidnight =
        pingTimeInfo.earliestPingNotificationTime;

      const seedValue_secondsSinceMidnight =
        earliestPingNotificationTimeSinceMidnight;
      const seedValue =
        seedValue_username + seedValue_date + seedValue_secondsSinceMidnight;
      const rng = seedrandom(seedValue);

      let selectedNotificationTimeSinceMidnight: number;
      if (pingTimeInfo.latestPingNotificationTime !== undefined) {
        const latestPingNotificationTimeSinceMidnight =
          pingTimeInfo.latestPingNotificationTime;

        // Randomly select a time between
        // `earliestPingNotificationTimeSinceMidnight` and
        // `latestPingNotificationTimeSinceMidnight` (inclusive).
        // https://stackoverflow.com/a/1527834/2603230
        selectedNotificationTimeSinceMidnight =
          Math.floor(
            rng() *
              (latestPingNotificationTimeSinceMidnight -
                earliestPingNotificationTimeSinceMidnight +
                1),
          ) + earliestPingNotificationTimeSinceMidnight;
      } else {
        selectedNotificationTimeSinceMidnight =
          pingTimeInfo.earliestPingNotificationTime;
      }

      const notificationTime: Date = addSeconds(
        dateMidnight,
        selectedNotificationTimeSinceMidnight,
      );

      if (notificationTime >= studyEndDate) {
        break;
      }

      if (notificationTime < new Date()) {
        continue;
      }

      const expirationTime: Date = addSeconds(
        notificationTime,
        pingTimeInfo.expireAfterTime,
      );

      notificationTimes.push({
        notificationDate: notificationTime,
        expirationDate: expirationTime,
      });
    }
  }

  const startedPingsThisWeek = await getThisWeekPingsAsync();
  const numberOfPingsStartedThisWeek = startedPingsThisWeek.length;

  await Promise.all(
    notificationTimes.map(async (notificationTimeInfo) => {
      const notificationTime = notificationTimeInfo.notificationDate;
      if (notificationTime >= new Date()) {
        const configNotificationContent = studyInfo.notificationContent;

        let notificationTitle = configNotificationContent.default.title;
        let notificationBody = configNotificationContent.default.body;

        if (configNotificationContent.bonus) {
          let remainingPingCount =
            configNotificationContent.bonus.numberOfCompletionEachWeek;
          let shouldUseDefaultContent = false;
          if (await isTimeThisWeekAsync(notificationTime)) {
            if (
              numberOfPingsStartedThisWeek <
              configNotificationContent.bonus.numberOfCompletionEachWeek
            ) {
              remainingPingCount =
                configNotificationContent.bonus.numberOfCompletionEachWeek -
                numberOfPingsStartedThisWeek;
            } else {
              // The user has already completed enough pings for bonus this week.
              // There is no need to use the "bonus" notification content.
              shouldUseDefaultContent = true;
            }
          }

          if (!shouldUseDefaultContent) {
            const nPingKeyword = "#n_ping#";
            let mPingText = `${remainingPingCount} pings`;
            if (remainingPingCount === 1) {
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
        }

        //console.warn(`${notificationBody} for ${notificationTime}`);

        const notification = getNotificationRequestInput(
          {
            title: notificationTitle,
            body: notificationBody,
          },
          notificationTime,
        );

        await Notifications.scheduleNotificationAsync(notification);
      }
    }),
  );

  await storeNotificationTimesAsync(notificationTimes);

  //console.warn("NEW NOTIFICATION SET!");
}

// If `null` is returned, it means that currently there's no active ping.
export async function getCurrentNotificationTimeAsync(): Promise<Date | null> {
  // DEBUG
  /* istanbul ignore if */
  if (__DEV__ && _DEBUG_CONFIGS().ignoreNotificationTime) {
    const fakeNotificationTime = addMinutes(new Date(), -10);
    return fakeNotificationTime;
  }

  const notificationsTimes = (await getNotificationTimesAsync()) || [];

  // DEBUG
  /*notificationsTimes.forEach(element => {
    console.log(format(element, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"));
  });*/

  for (const notificationsTimeInfo of notificationsTimes) {
    const notificationsTime = notificationsTimeInfo.notificationDate;
    const expirationTime = notificationsTimeInfo.expirationDate;
    const currentTime = new Date();

    if (currentTime >= notificationsTime && currentTime <= expirationTime) {
      return notificationsTime;
    }
  }
  return null;
}

// DEBUG ONLY
// If `null` is returned, it means there's no next ping
export async function getIncomingNotificationTimeAsync(): Promise<Date | null> {
  const notificationsTimes = (await getNotificationTimesAsync()) || [];

  const currentTime = new Date();

  const currentIndex = notificationsTimes.findIndex(
    (notificationsTimeInfo) =>
      currentTime < notificationsTimeInfo.notificationDate,
  );

  if (currentIndex === -1) {
    return null;
  }

  return notificationsTimes[currentIndex].notificationDate;
}

export async function clearSentNotificationsAsync() {
  await Notifications.dismissAllNotificationsAsync();
  await Notifications.setBadgeCountAsync(0);
}

/* istanbul ignore next */
export async function _sendTestNotificationAsync() {
  await Notifications.scheduleNotificationAsync(
    getNotificationRequestInput(
      {
        title: "Hi there!",
        body: "You have received a test notification from Well Ping!",
      },
      addSeconds(new Date(), 5),
    ),
  );
}
