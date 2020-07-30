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

  let mathRandomSpy: any;
  beforeEach(() => {
    mathRandomSpy = jest
      .spyOn(global.Math, "random")
      .mockReturnValue(0.123456789);
  });
  afterEach(() => {
    DateMock.clear();
    mathRandomSpy.mockRestore();
  });

  describe("setNotificationsAsync", () => {
    test("after the study already ends", async () => {
      DateMock.advanceTo(+new Date("2010-08-08T20:08:08Z"));

      const spyCancelAllScheduledNotificationsAsync = jest.spyOn(
        Notifications,
        "cancelAllScheduledNotificationsAsync",
      );

      const spyScheduleLocalNotificationAsync = jest.spyOn(
        Notifications,
        "scheduleLocalNotificationAsync",
      );

      const studyInfo: StudyInfo = PINGS_STUDY_INFO;

      await setNotificationsAsync(studyInfo);

      expect(spyCancelAllScheduledNotificationsAsync).toBeCalledTimes(1);

      expect(spyScheduleLocalNotificationAsync).toBeCalledTimes(0);

      spyCancelAllScheduledNotificationsAsync.mockRestore();
      spyScheduleLocalNotificationAsync.mockRestore();
    });

    test("before the study starts", async () => {
      DateMock.advanceTo(+new Date("2010-04-20T20:08:08Z"));

      const spyCancelAllScheduledNotificationsAsync = jest.spyOn(
        Notifications,
        "cancelAllScheduledNotificationsAsync",
      );

      const spyScheduleLocalNotificationAsync = jest.spyOn(
        Notifications,
        "scheduleLocalNotificationAsync",
      );

      const studyInfo: StudyInfo = PINGS_STUDY_INFO;

      await setNotificationsAsync(studyInfo);

      expect(spyCancelAllScheduledNotificationsAsync).toBeCalledTimes(1);

      // 24 = Math.floor(28 / studyInfo.frequency.hoursEveryday.length) * studyInfo.frequency.hoursEveryday.length
      expect(spyScheduleLocalNotificationAsync).toBeCalledTimes(24);
      // TODO: CHECK IF SNAPSHOT IS CORRECT.
      expect(spyScheduleLocalNotificationAsync.mock.calls).toMatchSnapshot();

      spyCancelAllScheduledNotificationsAsync.mockRestore();
      spyScheduleLocalNotificationAsync.mockRestore();
    });

    test("during the survey (still haven't reached bonus) (jump to next week)", async () => {
      DateMock.advanceTo(+new Date("2010-05-01T11:00:00Z"));

      const spyCancelAllScheduledNotificationsAsync = jest.spyOn(
        Notifications,
        "cancelAllScheduledNotificationsAsync",
      );

      const spyScheduleLocalNotificationAsync = jest.spyOn(
        Notifications,
        "scheduleLocalNotificationAsync",
      );

      const studyInfo: StudyInfo = PINGS_STUDY_INFO;

      await setNotificationsAsync(studyInfo);

      expect(spyCancelAllScheduledNotificationsAsync).toBeCalledTimes(1);

      // 22 = Math.floor(28 / studyInfo.frequency.hoursEveryday.length) * studyInfo.frequency.hoursEveryday.length - shown notification today (2)
      expect(spyScheduleLocalNotificationAsync).toBeCalledTimes(22);
      // TODO: CHECK IF SNAPSHOT IS CORRECT.
      expect(spyScheduleLocalNotificationAsync.mock.calls).toMatchSnapshot();

      spyCancelAllScheduledNotificationsAsync.mockRestore();
      spyScheduleLocalNotificationAsync.mockRestore();
    });
  });
};
