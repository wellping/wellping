import { isToday } from "date-fns";

import { getPingsListAsync } from "./asyncStorage/pingsList";
import { PingSchema } from "./schemas/Ping";
import { secureStorePingAsync, secureGetPingAsync } from "./secureStore/ping";
import { isTimeThisWeekAsync, getAllStreamNamesAsync } from "./studyFile";
import { StreamName, Ping } from "./types";

export async function getNumberOfPingsForStreamNameAsync(
  streamName: StreamName,
): Promise<number> {
  const pingsList = await getPingsListAsync();
  return pingsList.filter((pingId) => {
    // If the ping ID is of this stream.
    return pingId.startsWith(streamName);
  }).length;
}

export type NumbersOfPingsForAllStreamNames = {
  [stream: string /* actually StreamName */]: number;
};
export async function getNumbersOfPingsForAllStreamNamesAsync(): Promise<
  NumbersOfPingsForAllStreamNames
> {
  const streamNames = await getAllStreamNamesAsync();

  const results: NumbersOfPingsForAllStreamNames = {};

  await Promise.all(
    streamNames.map(async (streamName) => {
      results[streamName] = await getNumberOfPingsForStreamNameAsync(
        streamName,
      );
    }),
  );

  return results;
}

export async function insertPingAsync({
  notificationTime,
  startTime,
  streamName,
}: {
  notificationTime: Date;
  startTime: Date;
  streamName: StreamName;
}): Promise<Ping> {
  const newIndex = (await getNumberOfPingsForStreamNameAsync(streamName)) + 1;
  const pingId = `${streamName}${newIndex}`;
  const tzOffset = startTime.getTimezoneOffset();

  const ping = PingSchema.parse({
    id: pingId,
    notificationTime,
    startTime,
    endTime: null,
    streamName,
    tzOffset,
  });

  await secureStorePingAsync(ping, true);

  return ping;
}

export async function addEndTimeToPingAsync(
  pingId: string,
  endTime: Date,
): Promise<Ping> {
  const ping = await secureGetPingAsync(pingId);
  if (ping == null) {
    throw new Error(`pingId ${pingId} not found in getPingsAsync.`);
  }

  ping.endTime = endTime;
  await secureStorePingAsync(ping, false);

  return ping;
}

export async function getLatestPingAsync(): Promise<Ping | null> {
  const pingsList = await getPingsListAsync();
  if (pingsList.length === 0) {
    return null;
  }
  const latestPingId = pingsList[pingsList.length - 1];
  return await secureGetPingAsync(latestPingId);
}

export async function getPingsAsync(
  order: "ASC" | "DESC" = "ASC",
): Promise<Ping[]> {
  const pingsList = await getPingsListAsync();
  const pings: Ping[] = [];

  for (const pingId of pingsList) {
    pings.push((await secureGetPingAsync(pingId))!);
  }

  return pings;
}

// Returns all pings in the order of `order` until the `untilAsync`
// condition is met.
// The returning pings are always in `order` order.
export async function getPingsUntilAsync(
  untilAsync: (ping: Ping) => Promise<boolean> | boolean,
  order: "ASC" | "DESC",
): Promise<Ping[]> {
  const allPings = await getPingsAsync(order);
  const resultsPings: Ping[] = [];
  for (const ping of allPings) {
    if (ping.notificationTime > new Date()) {
      // It is almost impossible to get this, because finished pings
      // cannot be in the future.
      continue;
    }
    if (await untilAsync(ping)) {
      // Stops when the condition is met.
      break;
    }
    resultsPings.push(ping);
  }
  return resultsPings;
}

export async function getTodayPingsAsync(): Promise<Ping[]> {
  // Stops when the finished ping was in yesterday.
  const todayPings = await getPingsUntilAsync(
    (ping) => !isToday(ping.notificationTime),
    "DESC",
  );
  todayPings.reverse(); // So that pings are in ascending order.
  return todayPings;
}

export async function getThisWeekPingsAsync(): Promise<Ping[]> {
  // Stops when the finished ping was last week.
  const thisWeekPings = await getPingsUntilAsync(
    async (ping) => !(await isTimeThisWeekAsync(ping.notificationTime)),
    "DESC",
  );
  thisWeekPings.reverse(); // So that pings are in ascending order.
  return thisWeekPings;
}
