import { isToday, addDays } from "date-fns";

import { PingEntity } from "../entities/PingEntity";
import { isTimeThisWeekAsync } from "./configFiles";
import { StreamName } from "./types";

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

export type NumbersOfPingsForAllStreamNames = {
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

  // Make sure state and database are consistent.
  await pingEntity.reload();

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

  // Make sure state and database are consistent.
  ping.reload();

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

export async function getPingsAsync(
  order: "ASC" | "DESC" = "ASC",
): Promise<PingEntity[]> {
  const pings = await PingEntity.createQueryBuilder()
    .orderBy("startTime", order)
    .getMany();
  return pings;
}

// Returns all pings in the order of `order` until the `untilAsync`
// condition is met.
// The returning pings are always in `order` order.
export async function getPingsUntilAsync(
  untilAsync: (ping: PingEntity) => Promise<boolean> | boolean,
  order: "ASC" | "DESC",
): Promise<PingEntity[]> {
  const allPings = await getPingsAsync(order);
  const resultsPings: PingEntity[] = [];
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

export async function getTodayPingsAsync(): Promise<PingEntity[]> {
  // Stops when the finished ping was in yesterday.
  const todayPings = await getPingsUntilAsync(
    (ping) => !isToday(ping.notificationTime),
    "DESC",
  );
  todayPings.reverse(); // So that pings are in ascending order.
  return todayPings;
}

export async function getThisWeekPingsAsync(): Promise<PingEntity[]> {
  // Stops when the finished ping was last week.
  const thisWeekPings = await getPingsUntilAsync(
    async (ping) => !(await isTimeThisWeekAsync(ping.notificationTime)),
    "DESC",
  );
  thisWeekPings.reverse(); // So that pings are in ascending order.
  return thisWeekPings;
}
