import { Notifications } from "expo";
import * as DateMock from "jest-date-mock";
import { Connection } from "typeorm";

import * as notificationTimesAsyncStorage from "../../helpers/asyncStorage/notificationTimes";
import {
  setNotificationsAsync,
  getCurrentNotificationTimeAsync,
  getIncomingNotificationTimeAsync,
} from "../../helpers/notifications";
import {
  getTestDatabaseFilename,
  connectTestDatabaseAsync,
} from "../data/database_helper";
import { PINGS_STUDY_INFO } from "../data/pings";
import { FunctionSpyInstance } from "../jestHelper";
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

  let mathRandomSpy: FunctionSpyInstance<typeof global.Math.random>;

  beforeEach(() => {
    mathRandomSpy = jest
      .spyOn(global.Math, "random")
      .mockReturnValue(0.123456789);
  });
  afterEach(() => {
    DateMock.clear();
  });

  describe("setNotificationsAsync", () => {
    let spyCancelAllScheduledNotificationsAsync: FunctionSpyInstance<typeof Notifications.cancelAllScheduledNotificationsAsync>;
    let spyScheduleLocalNotificationAsync: FunctionSpyInstance<typeof Notifications.scheduleLocalNotificationAsync>;
    beforeEach(() => {
      spyScheduleLocalNotificationAsync = jest.spyOn(
        Notifications,
        "scheduleLocalNotificationAsync",
      );
      spyCancelAllScheduledNotificationsAsync = jest.spyOn(
        Notifications,
        "cancelAllScheduledNotificationsAsync",
      );
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
      const notificationTimes = [
        new Date("2010-05-11T08:11:07Z"),
        new Date("2010-05-11T10:22:07Z"),
        new Date("2010-05-11T12:33:07Z"),
        new Date("2010-05-11T16:44:07Z"),
        new Date("2010-05-11T18:55:07Z"),
        new Date("2010-05-11T22:44:07Z"),
        new Date("2010-05-12T08:59:07Z"),
        new Date("2010-05-12T10:58:07Z"),
        new Date("2010-05-12T12:57:07Z"),
        new Date("2010-05-12T16:56:07Z"),
        new Date("2010-05-12T18:55:07Z"),
        new Date("2010-05-12T22:54:07Z"),
      ];

      let spyGetNotificationTimesAsync: FunctionSpyInstance<typeof notificationTimesAsyncStorage.getNotificationTimesAsync>;
      beforeEach(() => {
        spyGetNotificationTimesAsync = jest
          .spyOn(notificationTimesAsyncStorage, "getNotificationTimesAsync")
          .mockImplementation(async () => notificationTimes);
      });

      test("(at the start of the day)", async () => {
        DateMock.advanceTo(+new Date("2010-05-11T08:00:00Z"));

        await setNotificationsAsync(PINGS_STUDY_INFO);

        expect(spyCancelAllScheduledNotificationsAsync).toBeCalledTimes(1);

        // 24 = Math.floor(28 / studyInfo.frequency.hoursEveryday.length) * studyInfo.frequency.hoursEveryday.length - shown notification today (0)
        expect(spyScheduleLocalNotificationAsync).toBeCalledTimes(24);

        for (let i = 0; i < 6; i++) {
          expect(spyScheduleLocalNotificationAsync.mock.calls[i][1]?.time).toBe(
            notificationTimes[i],
          );
        }

        // TODO: CHECK IF SNAPSHOT IS CORRECT.
        expect(spyScheduleLocalNotificationAsync.mock.calls).toMatchSnapshot();
      });

      test("(in the middle of the day)", async () => {
        DateMock.advanceTo(+new Date("2010-05-11T13:00:00Z"));

        await setNotificationsAsync(PINGS_STUDY_INFO);

        expect(spyCancelAllScheduledNotificationsAsync).toBeCalledTimes(1);

        // 21 = Math.floor(28 / studyInfo.frequency.hoursEveryday.length) * studyInfo.frequency.hoursEveryday.length - shown notification today (3)
        expect(spyScheduleLocalNotificationAsync).toBeCalledTimes(21);

        for (let i = 3; i < 6; i++) {
          expect(
            spyScheduleLocalNotificationAsync.mock.calls[i - 3][1]?.time,
          ).toBe(notificationTimes[i]);
        }

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

  describe("getCurrentNotificationTimeAsync", () => {
    describe("with stored notification times", () => {
      let spyGetNotificationTimesAsync: FunctionSpyInstance<typeof notificationTimesAsyncStorage.getNotificationTimesAsync>;
      beforeEach(() => {
        spyGetNotificationTimesAsync = jest
          .spyOn(notificationTimesAsyncStorage, "getNotificationTimesAsync")
          .mockImplementation(async () => {
            return [
              new Date("2010-05-11T08:11:07Z"),
              new Date("2010-05-11T10:22:07Z"),
              new Date("2010-05-11T12:33:07Z"),
              new Date("2010-05-11T16:44:07Z"),
              new Date("2010-05-11T18:55:07Z"),
              new Date("2010-05-11T22:44:07Z"),
              new Date("2010-05-12T08:59:07Z"),
              new Date("2010-05-12T10:58:07Z"),
              new Date("2010-05-12T12:57:07Z"),
              new Date("2010-05-12T16:56:07Z"),
              new Date("2010-05-12T18:55:07Z"),
              new Date("2010-05-12T22:54:07Z"),
            ];
          });
      });

      test("before and after a ping", async () => {
        DateMock.advanceTo(+new Date("2010-05-12T12:57:00Z"));
        expect(
          await getCurrentNotificationTimeAsync(PINGS_STUDY_INFO),
        ).toMatchInlineSnapshot(`null`);

        DateMock.advanceTo(+new Date("2010-05-12T12:57:08Z"));
        expect(
          await getCurrentNotificationTimeAsync(PINGS_STUDY_INFO),
        ).toMatchInlineSnapshot(`2010-05-12T12:57:07.000Z`);

        DateMock.advanceTo(+new Date("2010-05-12T13:00:08Z"));
        expect(
          await getCurrentNotificationTimeAsync(PINGS_STUDY_INFO),
        ).toMatchInlineSnapshot(`2010-05-12T12:57:07.000Z`);

        DateMock.advanceTo(+new Date("2010-05-12T13:26:59Z"));
        expect(
          await getCurrentNotificationTimeAsync(PINGS_STUDY_INFO),
        ).toMatchInlineSnapshot(`2010-05-12T12:57:07.000Z`);

        DateMock.advanceTo(+new Date("2010-05-12T13:27:08Z"));
        expect(
          await getCurrentNotificationTimeAsync(PINGS_STUDY_INFO),
        ).toMatchInlineSnapshot(`null`);
      });

      test("expired ping", async () => {
        DateMock.advanceTo(+new Date("2010-05-12T14:01:00Z"));
        expect(
          await getCurrentNotificationTimeAsync(PINGS_STUDY_INFO),
        ).toMatchInlineSnapshot(`null`);
      });
    });

    test("without stored notification times", async () => {
      DateMock.advanceTo(+new Date("2010-05-12T13:00:08Z"));
      expect(
        await getCurrentNotificationTimeAsync(PINGS_STUDY_INFO),
      ).toMatchInlineSnapshot(`null`);
    });
  });

  describe("getIncomingNotificationTimeAsync", () => {
    describe("with stored notification times", () => {
      let spyGetNotificationTimesAsync: FunctionSpyInstance<typeof notificationTimesAsyncStorage.getNotificationTimesAsync>;
      beforeEach(() => {
        spyGetNotificationTimesAsync = jest
          .spyOn(notificationTimesAsyncStorage, "getNotificationTimesAsync")
          .mockImplementation(async () => {
            return [
              new Date("2010-05-11T08:11:07Z"),
              new Date("2010-05-11T10:22:07Z"),
              new Date("2010-05-11T12:33:07Z"),
              new Date("2010-05-11T16:44:07Z"),
              new Date("2010-05-11T18:55:07Z"),
              new Date("2010-05-11T22:44:07Z"),
              new Date("2010-05-12T08:59:07Z"),
              new Date("2010-05-12T10:58:07Z"),
              new Date("2010-05-12T12:57:07Z"),
              new Date("2010-05-12T16:56:07Z"),
              new Date("2010-05-12T18:55:07Z"),
              new Date("2010-05-12T22:54:07Z"),
            ];
          });
      });

      test("before and after a ping", async () => {
        DateMock.advanceTo(+new Date("2010-05-12T12:57:00Z"));
        expect(await getIncomingNotificationTimeAsync()).toMatchInlineSnapshot(
          `2010-05-12T12:57:07.000Z`,
        );

        DateMock.advanceTo(+new Date("2010-05-12T12:57:08Z"));
        expect(await getIncomingNotificationTimeAsync()).toMatchInlineSnapshot(
          `2010-05-12T16:56:07.000Z`,
        );

        DateMock.advanceTo(+new Date("2010-05-12T13:00:08Z"));
        expect(await getIncomingNotificationTimeAsync()).toMatchInlineSnapshot(
          `2010-05-12T16:56:07.000Z`,
        );

        DateMock.advanceTo(+new Date("2010-05-12T13:26:59Z"));
        expect(await getIncomingNotificationTimeAsync()).toMatchInlineSnapshot(
          `2010-05-12T16:56:07.000Z`,
        );

        DateMock.advanceTo(+new Date("2010-05-12T13:27:08Z"));
        expect(await getIncomingNotificationTimeAsync()).toMatchInlineSnapshot(
          `2010-05-12T16:56:07.000Z`,
        );
      });

      test("before first ping", async () => {
        DateMock.advanceTo(+new Date("2010-05-10T14:01:00Z"));
        expect(await getIncomingNotificationTimeAsync()).toMatchInlineSnapshot(
          `2010-05-11T08:11:07.000Z`,
        );
      });

      test("after last ping", async () => {
        DateMock.advanceTo(+new Date("2010-05-12T23:59:00Z"));
        expect(await getIncomingNotificationTimeAsync()).toMatchInlineSnapshot(
          `null`,
        );
      });
    });

    test("without stored notification times", async () => {
      DateMock.advanceTo(+new Date("2010-05-12T13:00:08Z"));
      expect(await getIncomingNotificationTimeAsync()).toMatchInlineSnapshot(
        `null`,
      );
    });
  });
};
