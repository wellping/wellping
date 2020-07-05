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

export async function getPingsAsync(): Promise<PingEntity[]> {
  const pings = await PingEntity.createQueryBuilder()
    .orderBy("startTime", "ASC")
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
