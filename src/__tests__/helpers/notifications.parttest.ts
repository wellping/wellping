import { Notifications } from "expo";
import * as DateMock from "jest-date-mock";
import { Connection } from "typeorm";

import { setNotificationsAsync } from "../../helpers/notifications";
import { StudyInfo } from "../../helpers/types";
import {
  getTestDatabaseFilename,
  connectTestDatabaseAsync,
} from "../data/database_helper";
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

  const BASE_STUDY_INFO = {
    id: "myStudy",
    consentFormUrl: "https://example.com/",
    serverURL: "https://example.com/",

    weekStartsOn: 1 as StudyInfo["weekStartsOn"],
    notificationContent: {
      default: {
        title: "New survey!",
        body: "Do it now!",
      },
      bonus: {
        title: "You can earn bonus!",
        body: "You are #n_ping# away from the weekly bonus.",
        numberOfCompletionEachWeek: 10,
      },
    },

    // Not important for `notifications.ts` test purpose.
    streamsOrder: {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
    },
    streamInCaseOfError: "myStream",
  };

  describe("setNotificationsAsync", () => {
    test("after the study already ends", async () => {
      DateMock.advanceTo(+new Date("2008-08-08T20:08:08Z"));

      const spyCancelAllScheduledNotificationsAsync = jest.spyOn(
        Notifications,
        "cancelAllScheduledNotificationsAsync",
      );

      const spyScheduleLocalNotificationAsync = jest.spyOn(
        Notifications,
        "scheduleLocalNotificationAsync",
      );

      const frequency = {
        hoursEveryday: [8, 10, 12, 14, 16, 18],
        randomMinuteAddition: { min: 0, max: 59 },
      };
      const studyInfo: StudyInfo = {
        ...BASE_STUDY_INFO,
        frequency,
        startDate: new Date("2008-06-08T20:08:08Z"),
        endDate: new Date("2008-08-08T08:08:08Z"),
      };

      await setNotificationsAsync(studyInfo);

      expect(spyCancelAllScheduledNotificationsAsync).toBeCalledTimes(1);

      expect(spyScheduleLocalNotificationAsync).toBeCalledTimes(0);

      spyCancelAllScheduledNotificationsAsync.mockRestore();
      spyScheduleLocalNotificationAsync.mockRestore();
    });

    test("before the study starts", async () => {
      DateMock.advanceTo(+new Date("2008-08-08T20:08:08Z"));

      const spyCancelAllScheduledNotificationsAsync = jest.spyOn(
        Notifications,
        "cancelAllScheduledNotificationsAsync",
      );

      const spyScheduleLocalNotificationAsync = jest.spyOn(
        Notifications,
        "scheduleLocalNotificationAsync",
      );

      const frequency = {
        hoursEveryday: [8, 12, 16, 20],
        randomMinuteAddition: { min: 0, max: 59 },
      };
      const studyInfo: StudyInfo = {
        ...BASE_STUDY_INFO,
        frequency,
        // TODO: use times that match pings data
        startDate: new Date("2008-08-10T19:00:00Z"),
        endDate: new Date("2008-09-10T19:00:00Z"),
      };

      await setNotificationsAsync(studyInfo);

      expect(spyCancelAllScheduledNotificationsAsync).toBeCalledTimes(1);

      expect(spyScheduleLocalNotificationAsync).toBeCalledTimes(28);
      // TODO: CHECK IF SNAPSHOT IS CORRECT.
      expect(spyScheduleLocalNotificationAsync.mock.calls).toMatchSnapshot();

      spyCancelAllScheduledNotificationsAsync.mockRestore();
      spyScheduleLocalNotificationAsync.mockRestore();
    });
  });
};
