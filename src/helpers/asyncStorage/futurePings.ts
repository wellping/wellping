import AsyncStorage from "@react-native-async-storage/async-storage";
import { StreamName } from "@wellping/study-file/lib/types";

import { logAndThrowError } from "../debug";
import { getASKeyAsync } from "./asyncStorage";

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
    logAndThrowError(error);
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
    logAndThrowError(error);
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
        logAndThrowError(error);
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
    logAndThrowError(error);
  }
}
