import { Notifications } from "expo";
import * as DateMock from "jest-date-mock";
import { Connection } from "typeorm";

import * as notificationTimesAsyncStorage from "../../helpers/asyncStorage/notificationTimes";
import { setNotificationsAsync } from "../../helpers/notifications";
import {
  getTestDatabaseFilename,
  connectTestDatabaseAsync,
} from "../data/database_helper";
import { PINGS_STUDY_INFO } from "../data/pings";
import { PINGS_DB_NAME } from "./pings.parttest";

// https://github.com/facebook/jest/issues/6194#issuecomment-419837314
export const notificationsTest = () => {
  let connection: Connection;
  const DB_NAME = PINGS_DB_NAME;
  const DB_FILENAME = getTestDatabaseFilename(DB_NAME);
  beforeAll(async () => {
    connection = await connectTestDatabaseAsync(DB_FILENAME);
  });
  afterAll(async () => {
    await connection.close();
  });

  const mathRandomSpy = jest
    .spyOn(global.Math, "random")
    .mockReturnValue(0.123456789);
  afterEach(() => {
    DateMock.clear();
    mathRandomSpy.mockClear();
  });
  afterAll(() => {
    mathRandomSpy.mockRestore();
  });

  describe("setNotificationsAsync", () => {
    const spyCancelAllScheduledNotificationsAsync = jest.spyOn(
      Notifications,
      "cancelAllScheduledNotificationsAsync",
    );
    const spyScheduleLocalNotificationAsync = jest.spyOn(
      Notifications,
      "scheduleLocalNotificationAsync",
    );
    afterEach(() => {
      spyCancelAllScheduledNotificationsAsync.mockClear();
      spyScheduleLocalNotificationAsync.mockClear();
    });
    afterAll(() => {
      spyCancelAllScheduledNotificationsAsync.mockRestore();
      spyScheduleLocalNotificationAsync.mockRestore();
    });

    test("after the study already ends", async () => {
      DateMock.advanceTo(+new Date("2010-08-08T20:08:08Z"));

      await setNotificationsAsync(PINGS_STUDY_INFO);

      expect(spyCancelAllScheduledNotificationsAsync).toBeCalledTimes(1);

      expect(spyScheduleLocalNotificationAsync).toBeCalledTimes(0);
    });

    test("before the study starts", async () => {
      DateMock.advanceTo(+new Date("2010-04-20T20:08:08Z"));

      await setNotificationsAsync(PINGS_STUDY_INFO);

      expect(spyCancelAllScheduledNotificationsAsync).toBeCalledTimes(1);

      // 24 = Math.floor(28 / studyInfo.frequency.hoursEveryday.length) * studyInfo.frequency.hoursEveryday.length
      expect(spyScheduleLocalNotificationAsync).toBeCalledTimes(24);
      // TODO: CHECK IF SNAPSHOT IS CORRECT.
      expect(spyScheduleLocalNotificationAsync.mock.calls).toMatchSnapshot();
    });

    test("near study ends", async () => {
      DateMock.advanceTo(+new Date("2010-05-28T20:08:08Z"));

      await setNotificationsAsync(PINGS_STUDY_INFO);

      expect(spyCancelAllScheduledNotificationsAsync).toBeCalledTimes(1);

      // 1 + 6 + 5 = 12 remaining pings
      expect(spyScheduleLocalNotificationAsync).toBeCalledTimes(12);
      // TODO: CHECK IF SNAPSHOT IS CORRECT.
      expect(spyScheduleLocalNotificationAsync.mock.calls).toMatchSnapshot();
    });

    describe("with existing notifications", () => {
      const spyGetNotificationTimesAsync = jest.spyOn(
        notificationTimesAsyncStorage,
        "getNotificationTimesAsync",
      );
      beforeEach(() => {
        spyGetNotificationTimesAsync.mockImplementation(async () => {
          return [
            new Date("2010-05-11T08:11:07Z"),
            new Date("2010-05-11T10:22:07Z"),
            new Date("2010-05-11T12:33:07Z"),
            new Date("2010-05-11T16:44:07Z"),
            new Date("2010-05-11T18:55:07Z"),
            new Date("2010-05-11T22:44:07Z"),
          ];
        });
      });
      afterEach(() => {
        spyGetNotificationTimesAsync.mockClear();
      });
      afterAll(() => {
        spyGetNotificationTimesAsync.mockRestore();
      });

      test("(at the start of the day)", async () => {
        DateMock.advanceTo(+new Date("2010-05-11T08:00:00Z"));

        await setNotificationsAsync(PINGS_STUDY_INFO);

        expect(spyCancelAllScheduledNotificationsAsync).toBeCalledTimes(1);

        // 24 = Math.floor(28 / studyInfo.frequency.hoursEveryday.length) * studyInfo.frequency.hoursEveryday.length - shown notification today (0)
        expect(spyScheduleLocalNotificationAsync).toBeCalledTimes(24);
        // TODO: CHECK IF SNAPSHOT IS CORRECT.
        expect(spyScheduleLocalNotificationAsync.mock.calls).toMatchSnapshot();
      });

      test("(in the middle of the day)", async () => {
        DateMock.advanceTo(+new Date("2010-05-11T13:00:00Z"));

        await setNotificationsAsync(PINGS_STUDY_INFO);

        expect(spyCancelAllScheduledNotificationsAsync).toBeCalledTimes(1);

        // 21 = Math.floor(28 / studyInfo.frequency.hoursEveryday.length) * studyInfo.frequency.hoursEveryday.length - shown notification today (3)
        expect(spyScheduleLocalNotificationAsync).toBeCalledTimes(21);
        // TODO: CHECK IF SNAPSHOT IS CORRECT.
        expect(spyScheduleLocalNotificationAsync.mock.calls).toMatchSnapshot();
      });
    });

    describe("during the survey", () => {
      describe("(still haven't reached bonus)", () => {
        test("(stay in current week)", async () => {
          DateMock.advanceTo(+new Date("2010-05-03T10:01:00Z"));

          await setNotificationsAsync(PINGS_STUDY_INFO);

          expect(spyCancelAllScheduledNotificationsAsync).toBeCalledTimes(1);

          // 22 = Math.floor(28 / studyInfo.frequency.hoursEveryday.length) * studyInfo.frequency.hoursEveryday.length - shown notification today (1)
          expect(spyScheduleLocalNotificationAsync).toBeCalledTimes(23);
          // TODO: CHECK IF SNAPSHOT IS CORRECT.
          expect(
            spyScheduleLocalNotificationAsync.mock.calls,
          ).toMatchSnapshot();
        });

        test("(jump to next week)", async () => {
          DateMock.advanceTo(+new Date("2010-05-01T11:00:00Z"));

          await setNotificationsAsync(PINGS_STUDY_INFO);

          expect(spyCancelAllScheduledNotificationsAsync).toBeCalledTimes(1);

          // 22 = Math.floor(28 / studyInfo.frequency.hoursEveryday.length) * studyInfo.frequency.hoursEveryday.length - shown notification today (2)
          expect(spyScheduleLocalNotificationAsync).toBeCalledTimes(22);
          // TODO: CHECK IF SNAPSHOT IS CORRECT.
          expect(
            spyScheduleLocalNotificationAsync.mock.calls,
          ).toMatchSnapshot();
        });
      });

      test("(1 ping from reaching bonus)", async () => {
        DateMock.advanceTo(+new Date("2010-05-11T13:01:00Z"));

        await setNotificationsAsync(PINGS_STUDY_INFO);

        expect(spyCancelAllScheduledNotificationsAsync).toBeCalledTimes(1);

        // 21 = Math.floor(28 / studyInfo.frequency.hoursEveryday.length) * studyInfo.frequency.hoursEveryday.length - shown notification today (3)
        expect(spyScheduleLocalNotificationAsync).toBeCalledTimes(21);
        // TODO: CHECK IF SNAPSHOT IS CORRECT.
        expect(spyScheduleLocalNotificationAsync.mock.calls).toMatchSnapshot();
      });

      describe("(reached bonus)", () => {
        test("(stay in current week)", async () => {
          DateMock.advanceTo(+new Date("2010-05-11T17:01:00Z"));

          await setNotificationsAsync(PINGS_STUDY_INFO);

          expect(spyCancelAllScheduledNotificationsAsync).toBeCalledTimes(1);

          // 20 = Math.floor(28 / studyInfo.frequency.hoursEveryday.length) * studyInfo.frequency.hoursEveryday.length - shown notification today (4)
          expect(spyScheduleLocalNotificationAsync).toBeCalledTimes(20);
          // TODO: CHECK IF SNAPSHOT IS CORRECT.
          expect(
            spyScheduleLocalNotificationAsync.mock.calls,
          ).toMatchSnapshot();
        });

        test("(jump to next week)", async () => {
          DateMock.advanceTo(+new Date("2010-05-15T14:01:00Z"));

          await setNotificationsAsync(PINGS_STUDY_INFO);

          expect(spyCancelAllScheduledNotificationsAsync).toBeCalledTimes(1);

          // 21 = Math.floor(28 / studyInfo.frequency.hoursEveryday.length) * studyInfo.frequency.hoursEveryday.length - shown notification today (3)
          expect(spyScheduleLocalNotificationAsync).toBeCalledTimes(21);
          // TODO: CHECK IF SNAPSHOT IS CORRECT.
          expect(
            spyScheduleLocalNotificationAsync.mock.calls,
          ).toMatchSnapshot();
        });
      });
    });
  });
};
