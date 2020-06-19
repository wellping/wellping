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
const TYPES_OF_PINGS_ANSWERED_KEY = `TypesOfPingsAnswered`;
type TypesOfPingsAnswered = {
  [stream: string /* actually StreamName */]: number;
};

async function initTypesOfPingsAnsweredAsync() {
  const initCount: TypesOfPingsAnswered = {};
  (await getAllStreamNamesAsync()).map((key) => {
    initCount[key] = 0;
  });

  //console.warn(initCount);

  try {
    await AsyncStorage.setItem(
      await getASKeyAsync(TYPES_OF_PINGS_ANSWERED_KEY),
      JSON.stringify(initCount),
    );
  } catch (error) {
    // Error saving data
    logError(error);
  }
}

async function incrementTypesOfPingsAnsweredAsync(
  type: StreamName,
): Promise<number> {
  const currentTypesOfPingsAnswered = await getTypesOfPingsAnsweredAsync();
  if (currentTypesOfPingsAnswered == null) {
    throw new Error("currentTypesOfPingsAnswered == null");
  }

  currentTypesOfPingsAnswered[type] += 1;
  try {
    await AsyncStorage.setItem(
      await getASKeyAsync(TYPES_OF_PINGS_ANSWERED_KEY),
      JSON.stringify(currentTypesOfPingsAnswered),
    );
  } catch (error) {
    // Error saving data
    logError(error);
  }
  return currentTypesOfPingsAnswered[type];
}

async function clearTypesOfPingsAnsweredAsync() {
  try {
    await AsyncStorage.removeItem(
      await getASKeyAsync(TYPES_OF_PINGS_ANSWERED_KEY),
    );
  } catch (error) {
    // Error saving data
    logError(error);
  }
}

export async function getTypesOfPingsAnsweredAsync(): Promise<TypesOfPingsAnswered | null> {
  try {
    const value = await AsyncStorage.getItem(
      await getASKeyAsync(TYPES_OF_PINGS_ANSWERED_KEY),
    );
    if (value == null) {
      throw new Error(
        "getTypesOfPingsAnsweredAsync is null! You should call initTypesOfPingsAnsweredAsync.",
      );
    }
    return JSON.parse(value);
  } catch (error) {
    // Error retrieving data
    logError(error);
    return null;
  }
}

/** PING TABLE (stored started ping) **/
const PINGS_KEY = `Pings`;

export type PingInfo = {
  id: string;
  notificationTime: Date;
  startTime: Date;
  endTime?: Date;
  tzOffset: number;
  streamName: StreamName;
};

type PingInfoJSON = {
  id: string;
  notificationTime: string;
  startTime: string;
  endTime?: string;
  tzOffset: string;
  streamName: string;
};

export async function initPingAsync() {
  await initTypesOfPingsAnsweredAsync();

  try {
    await AsyncStorage.setItem(
      await getASKeyAsync(PINGS_KEY),
      JSON.stringify([]),
    );
  } catch (error) {
    // Error saving data
    logError(error);
  }
}

export async function insertPingAsync({
  notificationTime,
  startTime,
  streamName,
}: {
  notificationTime: Date;
  startTime: Date;
  streamName: StreamName;
}): Promise<PingInfo> {
  const newIndex = await incrementTypesOfPingsAnsweredAsync(streamName);
  const pingId = `${streamName}${newIndex}`;
  const tzOffset = startTime.getTimezoneOffset();

  const pingEntity = new PingEntity();
  pingEntity.id = pingId;
  pingEntity.notificationTime = notificationTime;
  pingEntity.startTime = startTime;
  pingEntity.streamName = streamName;
  pingEntity.tzOffset = tzOffset;
  await pingEntity.save();


  const currentPingInfos = await getPingsAsync();
  const newPingInfo: PingInfo = {
    id: pingId,
    notificationTime,
    startTime,
    tzOffset,
    streamName,
  };
  currentPingInfos.push(newPingInfo);
  try {
    await AsyncStorage.setItem(
      await getASKeyAsync(PINGS_KEY),
      JSON.stringify(currentPingInfos),
    );
  } catch (error) {
    // Error saving data
    logError(error);
  }

  return newPingInfo;
}

export async function addEndTimeToPingAsync(
  pingId: string,
  endTime: Date,
): Promise<PingInfo> {
  const currentPingInfos = await getPingsAsync();

  const indexOfPingId = currentPingInfos.findIndex(
    (pingInfo) => pingInfo.id === pingId,
  );
  if (indexOfPingId === -1) {
    throw new Error(`pingId ${pingId} not found in getPingsAsync.`);
  }

  currentPingInfos[indexOfPingId].endTime = endTime;
  //console.warn(JSON.stringify(currentPingInfos));
  try {
    await AsyncStorage.setItem(
      await getASKeyAsync(PINGS_KEY),
      JSON.stringify(currentPingInfos),
    );
  } catch (error) {
    // Error saving data
    logError(error);
  }

  return currentPingInfos[indexOfPingId];
}

export async function clearPingsAsync() {
  await clearTypesOfPingsAnsweredAsync();

  try {
    await AsyncStorage.removeItem(await getASKeyAsync(PINGS_KEY));
  } catch (error) {
    // Error saving data
    logError(error);
  }
}

export async function getLatestStartedPingAsync(): Promise<PingInfo | null> {
  const currentPingInfos = await getPingsAsync();
  //console.warn(currentPingInfos);
  if (currentPingInfos.length === 0) {
    return null;
  }
  return currentPingInfos[currentPingInfos.length - 1];
}

export async function getPingsAsync(): Promise<PingInfo[]> {
  try {
    const getValueAsync = async () => {
      return await AsyncStorage.getItem(await getASKeyAsync(PINGS_KEY));
    };
    let value = await getValueAsync();
    if (value == null) {
      initPingAsync();
      value = await getValueAsync();
    }

    if (value == null) {
      throw new Error(
        `${await getASKeyAsync(PINGS_KEY)} is still null after initPingAsync()`,
      );
    }

    const pingInfosJSON: PingInfoJSON[] = JSON.parse(value);

    const pingInfos = pingInfosJSON.map(
      (infoJson): PingInfo => ({
        ...infoJson,
        notificationTime: new Date(infoJson.notificationTime),
        startTime: new Date(infoJson.startTime),
        endTime: infoJson.endTime ? new Date(infoJson.endTime) : undefined,
        tzOffset: Number(infoJson.tzOffset),
        streamName: infoJson.streamName,
      }),
    );

    return pingInfos;
  } catch (error) {
    // Error retrieving data
    logError(error);
    throw error;
  }
}

export async function getTodayPingsAsync(): Promise<PingInfo[]> {
  const allPings = await getPingsAsync();
  const todayPings: PingInfo[] = [];
  for (const ping of allPings) {
    if (isToday(ping.notificationTime)) {
      todayPings.push(ping);
    }
    if (ping.notificationTime > addDays(new Date(), 1)) {
      // TODO: WE PROBABLY DON'T NEED THIS CHECK BECAUSE PING WILL NEVER BE FUTURE
      break;
    }
  }
  return todayPings;
}

export async function getThisWeekPingsAsync(): Promise<PingInfo[]> {
  const allPings = await getPingsAsync();
  const thisWeekPings: PingInfo[] = [];
  for (const ping of allPings) {
    if (await isTimeThisWeekAsync(ping.notificationTime)) {
      thisWeekPings.push(ping);
    }
    if (ping.notificationTime > new Date()) {
      // TODO: WE PROBABLY DON'T NEED THIS CHECK BECAUSE PING WILL NEVER BE FUTURE
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
