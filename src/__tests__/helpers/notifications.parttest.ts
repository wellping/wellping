import { Notifications } from "expo";
import * as DateMock from "jest-date-mock";
import { Connection } from "typeorm";

import { setNotificationsAsync } from "../../helpers/notifications";
import { StudyInfo } from "../../helpers/types";
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

  const spyCancelAllScheduledNotificationsAsync = jest.spyOn(
    Notifications,
    "cancelAllScheduledNotificationsAsync",
  );
  const spyScheduleLocalNotificationAsync = jest.spyOn(
    Notifications,
    "scheduleLocalNotificationAsync",
  );
  const mathRandomSpy = jest
    .spyOn(global.Math, "random")
    .mockReturnValue(0.123456789);
  afterEach(() => {
    DateMock.clear();

    mathRandomSpy.mockClear();
    spyCancelAllScheduledNotificationsAsync.mockClear();
    spyScheduleLocalNotificationAsync.mockClear();
  });

  describe("setNotificationsAsync", () => {
    test("after the study already ends", async () => {
      DateMock.advanceTo(+new Date("2010-08-08T20:08:08Z"));

      const studyInfo: StudyInfo = PINGS_STUDY_INFO;

      await setNotificationsAsync(studyInfo);

      expect(spyCancelAllScheduledNotificationsAsync).toBeCalledTimes(1);

      expect(spyScheduleLocalNotificationAsync).toBeCalledTimes(0);
    });

    test("before the study starts", async () => {
      DateMock.advanceTo(+new Date("2010-04-20T20:08:08Z"));

      const studyInfo: StudyInfo = PINGS_STUDY_INFO;

      await setNotificationsAsync(studyInfo);

      expect(spyCancelAllScheduledNotificationsAsync).toBeCalledTimes(1);

      // 24 = Math.floor(28 / studyInfo.frequency.hoursEveryday.length) * studyInfo.frequency.hoursEveryday.length
      expect(spyScheduleLocalNotificationAsync).toBeCalledTimes(24);
      // TODO: CHECK IF SNAPSHOT IS CORRECT.
      expect(spyScheduleLocalNotificationAsync.mock.calls).toMatchSnapshot();
    });

    test("near study ends", async () => {
      DateMock.advanceTo(+new Date("2010-05-28T20:08:08Z"));

      const studyInfo: StudyInfo = PINGS_STUDY_INFO;

      await setNotificationsAsync(studyInfo);

      expect(spyCancelAllScheduledNotificationsAsync).toBeCalledTimes(1);

      // 1 + 6 + 5 = 12 remaining pings
      expect(spyScheduleLocalNotificationAsync).toBeCalledTimes(12);
      // TODO: CHECK IF SNAPSHOT IS CORRECT.
      expect(spyScheduleLocalNotificationAsync.mock.calls).toMatchSnapshot();
    });

    describe("during the survey", () => {
      describe("(still haven't reached bonus)", () => {
        test("(stay in current week)", async () => {
          DateMock.advanceTo(+new Date("2010-05-03T10:01:00Z"));

          const studyInfo: StudyInfo = PINGS_STUDY_INFO;

          await setNotificationsAsync(studyInfo);

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

          const studyInfo: StudyInfo = PINGS_STUDY_INFO;

          await setNotificationsAsync(studyInfo);

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

        const studyInfo: StudyInfo = PINGS_STUDY_INFO;

        await setNotificationsAsync(studyInfo);

        expect(spyCancelAllScheduledNotificationsAsync).toBeCalledTimes(1);

        // 21 = Math.floor(28 / studyInfo.frequency.hoursEveryday.length) * studyInfo.frequency.hoursEveryday.length - shown notification today (3)
        expect(spyScheduleLocalNotificationAsync).toBeCalledTimes(21);
        // TODO: CHECK IF SNAPSHOT IS CORRECT.
        expect(spyScheduleLocalNotificationAsync.mock.calls).toMatchSnapshot();
      });

      describe("(reached bonus)", () => {
        test("(stay in current week)", async () => {
          DateMock.advanceTo(+new Date("2010-05-11T17:01:00Z"));

          const studyInfo: StudyInfo = PINGS_STUDY_INFO;

          await setNotificationsAsync(studyInfo);

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

          const studyInfo: StudyInfo = PINGS_STUDY_INFO;

          await setNotificationsAsync(studyInfo);

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
