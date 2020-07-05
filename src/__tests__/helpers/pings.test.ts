import * as DateMock from "jest-date-mock";
import { Connection } from "typeorm";

import {
  getPingsAsync,
  getTodayPingsAsync,
  insertPingAsync,
  addEndTimeToPingAsync,
  getThisWeekPingsAsync,
} from "../../helpers/pings";
import {
  connectTestDatabaseAsync,
  getTestDatabaseFilename,
} from "../data/database_helper";
import { PINGS, PINGS_DICT } from "../data/pings";

let connection: Connection;
const DB_NAME = "pings";
const DB_FILENAME = getTestDatabaseFilename(DB_NAME);
beforeAll(async () => {
  connection = await connectTestDatabaseAsync(DB_FILENAME);

  // Reset database on start.
  await connection.dropDatabase();
  await connection.synchronize();
});
afterAll(async () => {
  const allPings = await getPingsAsync();
  expect(allPings).toMatchSnapshot();

  await connection.close();
});

test("insert pings and set end date", async () => {
  for (let i = 0; i < PINGS.length; i++) {
    const ping = PINGS[i];

    const addedPing = await insertPingAsync({
      notificationTime: ping.notificationTime,
      startTime: ping.startTime,
      streamName: ping.streamName,
    });
    expect(addedPing).toEqual({
      ...ping,
      endTime: null, // Doesn't have end time yet.
    });

    if (ping.endTime) {
      const updatedEndedPing = await addEndTimeToPingAsync(
        ping.id,
        ping.endTime,
      );
      expect(updatedEndedPing).toEqual(ping);
    }

    expect(await getPingsAsync()).toEqual(PINGS.slice(0, i + 1));
  }
});

test("set end date to non-existent ping", async () => {
  // https://github.com/facebook/jest/issues/1700
  expect(
    (async () => {
      await addEndTimeToPingAsync("_OwO_", new Date());
    })(),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"pingId _OwO_ not found in getPingsAsync."`,
  );

  // The pings data should not be changed.
  expect(await getPingsAsync()).toEqual(PINGS);
});

test("get today's ping", async () => {
  DateMock.advanceTo(+new Date("2010-04-30T08:08:08Z"));
  expect(await getTodayPingsAsync()).toEqual([]);

  DateMock.advanceTo(+new Date("2010-05-01T08:08:08Z"));
  expect(await getTodayPingsAsync()).toEqual([]);

  DateMock.advanceTo(+new Date("2010-05-01T10:00:08Z"));
  expect(await getThisWeekPingsAsync()).toEqual([PINGS_DICT["cat1"]]);

  DateMock.advanceTo(+new Date("2010-05-01T18:58:08Z"));
  expect(await getThisWeekPingsAsync()).toEqual([
    PINGS_DICT["cat1"],
    PINGS_DICT["dog1"],
  ]);

  DateMock.advanceTo(+new Date("2010-05-01T22:46:08Z"));
  expect(await getThisWeekPingsAsync()).toEqual([
    PINGS_DICT["cat1"],
    PINGS_DICT["dog1"],
    PINGS_DICT["wolf1"],
  ]);

  DateMock.advanceTo(+new Date("2010-05-02T08:08:08Z"));
  expect(await getTodayPingsAsync()).toEqual([]);

  DateMock.advanceTo(+new Date("2010-05-02T14:08:08Z"));
  expect(await getTodayPingsAsync()).toEqual([PINGS_DICT["cat2"]]);

  DateMock.advanceTo(+new Date("2010-05-03T08:08:08Z"));
  expect(await getTodayPingsAsync()).toEqual([]);

  DateMock.advanceTo(+new Date("2010-05-03T09:30:00Z"));
  expect(await getTodayPingsAsync()).toEqual([PINGS_DICT["cat3"]]);

  DateMock.advanceTo(+new Date("2010-05-05T08:08:08Z"));
  expect(await getTodayPingsAsync()).toEqual([]);

  DateMock.advanceTo(+new Date("2010-05-10T23:00:08Z"));
  expect(await getTodayPingsAsync()).toEqual([]);

  DateMock.advanceTo(+new Date("2010-05-10T23:59:59Z"));
  expect(await getTodayPingsAsync()).toEqual([PINGS_DICT["cat4"]]);

  DateMock.advanceTo(+new Date("2010-05-11T00:00:01Z"));
  expect(await getTodayPingsAsync()).toEqual([]);

  DateMock.advanceTo(+new Date("2011-01-01T08:08:08Z"));
  expect(await getTodayPingsAsync()).toEqual([]);

  DateMock.clear();
});

test("get this week's ping", async () => {
  // TODO: weekStartsOn IS NOT CONSIDERED HERE.

  DateMock.advanceTo(+new Date("2010-04-30T08:08:08Z"));
  expect(await getThisWeekPingsAsync()).toEqual([]);

  DateMock.advanceTo(+new Date("2010-05-01T08:08:08Z"));
  expect(await getThisWeekPingsAsync()).toEqual([]);

  DateMock.advanceTo(+new Date("2010-05-01T10:08:08Z"));
  expect(await getThisWeekPingsAsync()).toEqual([PINGS_DICT["cat1"]]);

  DateMock.advanceTo(+new Date("2010-05-01T18:08:08Z"));
  expect(await getThisWeekPingsAsync()).toEqual([
    PINGS_DICT["cat1"],
    PINGS_DICT["dog1"],
  ]);

  DateMock.advanceTo(+new Date("2010-05-01T22:08:08Z"));
  expect(await getThisWeekPingsAsync()).toEqual([
    PINGS_DICT["cat1"],
    PINGS_DICT["dog1"],
    PINGS_DICT["wolf1"],
  ]);

  DateMock.advanceTo(+new Date("2010-05-02T08:08:08Z"));
  expect(await getThisWeekPingsAsync()).toEqual([
    PINGS_DICT["cat1"],
    PINGS_DICT["dog1"],
    PINGS_DICT["wolf1"],
  ]);

  DateMock.advanceTo(+new Date("2010-05-02T15:08:08Z"));
  expect(await getThisWeekPingsAsync()).toEqual([
    PINGS_DICT["cat1"],
    PINGS_DICT["dog1"],
    PINGS_DICT["wolf1"],
    PINGS_DICT["cat2"],
  ]);

  DateMock.advanceTo(+new Date("2010-05-03T08:08:08Z"));
  expect(await getThisWeekPingsAsync()).toEqual([]);

  DateMock.advanceTo(+new Date("2010-05-03T10:08:08Z"));
  expect(await getThisWeekPingsAsync()).toEqual([PINGS_DICT["cat3"]]);

  DateMock.advanceTo(+new Date("2010-05-09T23:59:59Z"));
  expect(await getThisWeekPingsAsync()).toEqual([PINGS_DICT["cat3"]]);

  DateMock.advanceTo(+new Date("2010-05-10T00:00:01Z"));
  expect(await getThisWeekPingsAsync()).toEqual([]);

  DateMock.advanceTo(+new Date("2010-05-11T08:08:08Z"));
  expect(await getThisWeekPingsAsync()).toEqual([PINGS_DICT["cat4"]]);

  DateMock.advanceTo(+new Date("2011-01-01T08:08:08Z"));
  expect(await getThisWeekPingsAsync()).toEqual([]);

  DateMock.clear();
});
