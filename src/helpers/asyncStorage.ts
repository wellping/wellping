import { isToday, addDays } from "date-fns";
import { Notifications } from "expo";
import { AsyncStorage } from "react-native";

import { SurveyScreenState } from "../SurveyScreen";
import PingEntity from "../entities/PingEntity";
import {
  isTimeThisWeekAsync,
  getAllStreamNamesAsync,
  getSurveyFileAsync,
} from "./configFiles";
import { logError } from "./debug";
import { StreamName } from "./types";

export async function getASKeyAsync(key: string = ""): Promise<string> {
  const studyId = (await getSurveyFileAsync()).studyInfo.id;
  return `@WELLPING:Study_${studyId}/${key}`; //TODO: ADD ENCODED URL HERE
}

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

/** TYPEPING TABLE (stored number of pings answered for each type) **/
export async function getNumberOfPingsForStreamName(
  streamName: StreamName,
): Promise<number> {
  const countRaw: {
    count: number;
  } = await PingEntity.createQueryBuilder()
    .select("COUNT(id) as count")
    .where("streamName = :streamName", { streamName })
    .getRawOne();
  return countRaw.count;
}

type NumbersOfPingsForAllStreamNames = {
  [stream: string /* actually StreamName */]: number;
};
export async function getNumbersOfPingsForAllStreamNames(): Promise<
  NumbersOfPingsForAllStreamNames
> {
  const pingsGroupByStreamNameRaw: {
    streamName: StreamName;
    count: number;
  }[] = await PingEntity.createQueryBuilder()
    .select("streamName, COUNT(id) as count")
    .groupBy("streamName")
    .getRawMany();

  return pingsGroupByStreamNameRaw.reduce((map, row) => {
    map[row.streamName] = row.count;
    return map;
  }, {} as NumbersOfPingsForAllStreamNames);
}

/** PING TABLE (stored started ping) **/
export async function insertPingAsync({
  notificationTime,
  startTime,
  streamName,
}: {
  notificationTime: Date;
  startTime: Date;
  streamName: StreamName;
}): Promise<PingEntity> {
  const newIndex = (await getNumberOfPingsForStreamName(streamName)) + 1;
  const pingId = `${streamName}${newIndex}`;
  const tzOffset = startTime.getTimezoneOffset();

  const pingEntity = new PingEntity();
  pingEntity.id = pingId;
  pingEntity.notificationTime = notificationTime;
  pingEntity.startTime = startTime;
  pingEntity.streamName = streamName;
  pingEntity.tzOffset = tzOffset;
  await pingEntity.save();

  return pingEntity;
}

export async function addEndTimeToPingAsync(
  pingId: string,
  endTime: Date,
): Promise<PingEntity> {
  const ping = await PingEntity.createQueryBuilder()
    .where("id = :pingId", { pingId })
    .getOne();
  if (ping == null) {
    throw new Error(`pingId ${pingId} not found in getPingsAsync.`);
  }

  ping.endTime = endTime;
  await ping.save();

  return ping;
}

export async function getLatestPingAsync(): Promise<PingEntity | null> {
  const latestPing = await PingEntity.createQueryBuilder()
    .orderBy("startTime", "DESC")
    .take(1)
    .getOne();
  if (!latestPing) {
    return null;
  }
  return latestPing;
}

export async function getPingsAsync(): Promise<PingEntity[]> {
  const pings = await PingEntity.createQueryBuilder()
    .orderBy("startTime", "DESC")
    .getMany();
  return pings;
}

export async function getTodayPingsAsync(): Promise<PingEntity[]> {
  const allPings = await getPingsAsync();
  const todayPings: PingEntity[] = [];
  // TODO: USE SQL HERE? (MAKE SURE TIMEZONE PROBLEM)
  for (const ping of allPings) {
    if (isToday(ping.notificationTime)) {
      todayPings.push(ping);
    }
    if (ping.notificationTime > addDays(new Date(), 1)) {
      break;
    }
  }
  return todayPings;
}

export async function getThisWeekPingsAsync(): Promise<PingEntity[]> {
  const allPings = await getPingsAsync();
  const thisWeekPings: PingEntity[] = [];
  // TODO: USE SQL HERE? (MAKE SURE TIMEZONE PROBLEM)
  for (const ping of allPings) {
    if (await isTimeThisWeekAsync(ping.notificationTime)) {
      thisWeekPings.push(ping);
    }
    if (ping.notificationTime > new Date()) {
      // Stop when the notification time is in the future.
      break;
    }
  }
  return thisWeekPings;
}

/** SURVEYSTATE TABLE (stores ping answers and other states) **/
const PINGS_STATE_PREFIX = `PingsState:`;

export async function storePingStateAsync(
  pingId: string,
  state: SurveyScreenState,
) {
  try {
    await AsyncStorage.setItem(
      `${await getASKeyAsync(PINGS_STATE_PREFIX)}${pingId}`,
      JSON.stringify(state),
    );
  } catch (error) {
    // Error saving data
    logError(error);
    throw error;
  }
}

export async function getPingStateAsync(
  pingId: string,
): Promise<SurveyScreenState> {
  try {
    const keyName = `${await getASKeyAsync(PINGS_STATE_PREFIX)}${pingId}`;
    const value = await AsyncStorage.getItem(keyName);
    if (value == null) {
      return {
        currentQuestionId: `ERROR: getPingStateAsync is null for ${keyName}`,
        extraMetaData: {},
        nextStack: [],
        currentQuestionAnswers: {},
        lastUploadDate: new Date(0),
      };
    }
    const state: SurveyScreenState = JSON.parse(value);
    if (state.lastUploadDate) {
      state.lastUploadDate = new Date(state.lastUploadDate);
    }
    return state;
  } catch (error) {
    // Error retrieving data
    logError(error);
    throw error;
  }
}

export async function clearPingStateAsync(pingId: string) {
  try {
    await AsyncStorage.removeItem(
      `${await getASKeyAsync(PINGS_STATE_PREFIX)}${pingId}`,
    );
  } catch (error) {
    // Error saving data
    logError(error);
  }
}

/** FUTURE PING QUEUE TABLE (used for storing follow-up streams) **/
const FUTURE_PING_QUEUE_KEY = `FuturePingQueue:`;

export type FuturePing = {
  afterDate: Date;
  streamName: StreamName;
};

type FuturePingJSON = {
  afterDate: string;
  streamName: string;
};

export async function initFuturePingQueueAsync() {
  try {
    await AsyncStorage.setItem(
      await getASKeyAsync(FUTURE_PING_QUEUE_KEY),
      JSON.stringify([]),
    );
  } catch (error) {
    // Error saving data
    logError(error);
  }
}

export async function enqueueToFuturePingQueue(futurePing: FuturePing) {
  const futurePings = await getFuturePingsQueue();
  if (futurePings == null) {
    throw new Error("futurePings == null in enqueueToFuturePingQueue");
  }
  futurePings.push(futurePing);
  //console.warn(`oy ${JSON.stringify(futurePings)}`);
  try {
    await AsyncStorage.setItem(
      await getASKeyAsync(FUTURE_PING_QUEUE_KEY),
      JSON.stringify(futurePings),
    );
  } catch (error) {
    // Error saving data
    logError(error);
  }
}

export async function dequeueFuturePingIfAny(): Promise<FuturePing | null> {
  const futurePings = await getFuturePingsQueue();
  if (futurePings == null) {
    throw new Error("futurePings == null in dequeueFuturePingIfAny");
  }
  for (const futurePing of futurePings) {
    if (new Date() > futurePing.afterDate) {
      futurePings.shift();
      try {
        await AsyncStorage.setItem(
          await getASKeyAsync(FUTURE_PING_QUEUE_KEY),
          JSON.stringify(futurePings),
        );
      } catch (error) {
        // Error saving data
        logError(error);
        return null;
      }
      return futurePing;
    }
  }
  return null;
}

export async function getFuturePingsQueue(): Promise<FuturePing[]> {
  try {
    const getValueAsync = async () => {
      return await AsyncStorage.getItem(
        await getASKeyAsync(FUTURE_PING_QUEUE_KEY),
      );
    };
    let value = await getValueAsync();
    if (value == null) {
      await initFuturePingQueueAsync();
      value = await getValueAsync();
    }

    if (value == null) {
      throw new Error(
        `${await getASKeyAsync(
          FUTURE_PING_QUEUE_KEY,
        )} is still null after initFuturePingQueueAsync()`,
      );
    }

    const futurePingsJSON: FuturePingJSON[] = JSON.parse(value);
    const futurePings: FuturePing[] = futurePingsJSON.map((futurePingJson) => ({
      ...futurePingJson,
      afterDate: new Date(futurePingJson.afterDate),
      streamName: futurePingJson.streamName,
    }));
    return futurePings;
  } catch (error) {
    // Error retrieving data
    logError(error);
    throw error;
  }
}
