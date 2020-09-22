import {
  addDays,
  addMinutes,
  setHours,
  setMinutes,
  setSeconds,
  min,
  isSameDay,
  addSeconds,
  max,
} from "date-fns";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { _DEBUG_CONFIGS } from "../../config/debug";
import {
  getNotificationTimesAsync,
  storeNotificationTimesAsync,
} from "./asyncStorage/notificationTimes";
import { getThisWeekPingsAsync } from "./pings";
import {
  isTimeThisWeekAsync,
  getStudyInfoAsync,
  getStudyStartDate,
  getStudyEndDate,
} from "./studyFile";

const ANDROID_CHANNEL_NAME = "ssnlPingChannel";

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
  // TODO: https://github.com/expo/expo/issues/9155
  const notification: Notifications.NotificationRequestInput = {
    content: {
      badge: 1,
      ...content,
    },
    trigger: date,
  };
  return notification;
}

export async function setNotificationsAsync() {
  const studyInfo = await getStudyInfoAsync();

  await Notifications.cancelAllScheduledNotificationsAsync();

  const hoursEveryday = studyInfo.frequency.hoursEveryday;

  // https://stackoverflow.com/a/3894087/2603230
  const thisMorning = new Date();
  thisMorning.setHours(1, 0, 0, 0); // 1AM this morning

  const startDate = max([getStudyStartDate(studyInfo), thisMorning]);
  const studyEndDate = getStudyEndDate(studyInfo);
  // You can only schedule at most 64 local notifications on iOS.
  // Some say on Android, the limit is even lower: 50 (https://stackoverflow.com/a/36677835/2603230)
  // To be safe, we schedule at most 28 notifications, which means (28 / hoursEveryday.length) days.
  const setNotificationsUntil = min([
    addDays(startDate, Math.floor(28 / hoursEveryday.length)),
    studyEndDate,
  ]);
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

      if (notificationTime >= studyEndDate) {
        break;
      }

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

  const startedPingsThisWeek = await getThisWeekPingsAsync();
  const numberOfPingsStartedThisWeek = startedPingsThisWeek.length;

  await Promise.all(
    notificationTimes.map(async (notificationTime) => {
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

  const studyInfo = await getStudyInfoAsync();

  const notificationsTimes = (await getNotificationTimesAsync()) || [];

  // DEBUG
  /*notificationsTimes.forEach(element => {
    console.log(format(element, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"));
  });*/

  for (const notificationsTime of notificationsTimes) {
    const expirationTime = addMinutes(
      notificationsTime,
      studyInfo.frequency.expireAfterMinutes,
    );
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
    (notificationsTime) => currentTime < notificationsTime,
  );

  if (currentIndex === -1) {
    return null;
  }

  return notificationsTimes[currentIndex];
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
        title: "TEST!",
        body: "YOU RECEIVED IT!",
      },
      addSeconds(new Date(), 5),
    ),
  );
}
