import { addSeconds } from "date-fns";
import * as Notifications from "expo-notifications";
import * as DateMock from "jest-date-mock";

import * as notificationTimesAsyncStorage from "../../helpers/asyncStorage/notificationTimes";
import {
  setNotificationsAsync,
  getCurrentNotificationTimeAsync,
  getIncomingNotificationTimeAsync,
  ANDROID_CHANNEL_NAME,
} from "../../helpers/notifications";
import { StudyInfo } from "../../helpers/types";
import { PINGS_STUDY_INFO } from "../data/pings";
import { mockCurrentStudyInfo } from "../helper";
import { FunctionSpyInstance } from "../jestHelper";

// https://stackoverflow.com/a/63374190/2603230
jest.mock("expo-notifications", () => ({
  __esModule: true,
  ...(jest.requireActual("expo-notifications") as any),
}));

function getMockNotificationTimesInfo(
  notificationTime: Date,
  expireAfterSeconds: number = 30 * 60, // 00:30:00 is defined in `PINGS_STUDY_INFO`.
): notificationTimesAsyncStorage.NotificationDateWithExpirationDate {
  return {
    notificationDate: notificationTime,
    expirationDate: addSeconds(notificationTime, expireAfterSeconds),
  };
}
function getMockNotificationTimesInfos(
  notificationTimes: Date[],
  expireAfterSeconds?: number,
): notificationTimesAsyncStorage.NotificationDateWithExpirationDate[] {
  return notificationTimes.map((notificationTime) =>
    getMockNotificationTimesInfo(notificationTime),
  );
}

// https://github.com/facebook/jest/issues/6194#issuecomment-419837314
export const notificationsTest = () => {
  let mathRandomSpy: FunctionSpyInstance<typeof global.Math.random>;

  beforeEach(() => {
    /*
    // TODO: we no longer use Math.random (https://github.com/wellping/wellping/pull/92). Instead, we should mock `seedrandom`.
    mathRandomSpy = jest
      .spyOn(global.Math, "random")
      .mockReturnValue(0.123456789);
    */

    mockCurrentStudyInfo(PINGS_STUDY_INFO);
  });
  afterEach(async () => {
    DateMock.clear();

    // So that previous test's notifications will not interfere with later tests.
    await notificationTimesAsyncStorage.clearNotificationTimesAsync();
  });

  describe("setNotificationsAsync", () => {
    let spyCancelAllScheduledNotificationsAsync: FunctionSpyInstance<typeof Notifications.cancelAllScheduledNotificationsAsync>;
    let spyScheduleNotificationAsync: FunctionSpyInstance<typeof Notifications.scheduleNotificationAsync>;
    beforeEach(() => {
      spyScheduleNotificationAsync = jest.spyOn(
        Notifications,
        "scheduleNotificationAsync",
      );
      spyCancelAllScheduledNotificationsAsync = jest.spyOn(
        Notifications,
        "cancelAllScheduledNotificationsAsync",
      );
    });

    test("after the study already ends", async () => {
      DateMock.advanceTo(+new Date("2010-08-08T20:08:08Z"));

      await setNotificationsAsync();

      expect(spyCancelAllScheduledNotificationsAsync).toBeCalledTimes(1);

      expect(spyScheduleNotificationAsync).toBeCalledTimes(0);
    });

    test("before the study starts", async () => {
      DateMock.advanceTo(+new Date("2010-04-20T20:08:08Z"));

      await setNotificationsAsync();

      expect(spyCancelAllScheduledNotificationsAsync).toBeCalledTimes(1);

      // 24 = Math.floor(28 / studyInfo.pingsFrequency.length) * studyInfo.pingsFrequency.length
      expect(spyScheduleNotificationAsync).toBeCalledTimes(24);
      // TODO: CHECK IF SNAPSHOT IS CORRECT.
      expect(spyScheduleNotificationAsync.mock.calls).toMatchSnapshot();
    });

    test("near study ends", async () => {
      DateMock.advanceTo(+new Date("2010-05-28T20:08:08Z"));

      await setNotificationsAsync();

      expect(spyCancelAllScheduledNotificationsAsync).toBeCalledTimes(1);

      // 1 + 6 + 5 = 12 remaining pings
      expect(spyScheduleNotificationAsync).toBeCalledTimes(12);
      // TODO: CHECK IF SNAPSHOT IS CORRECT.
      expect(spyScheduleNotificationAsync.mock.calls).toMatchSnapshot();
    });

    describe("with existing notifications", () => {
      const notificationTimes = getMockNotificationTimesInfos([
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
      ]);

      let spyGetNotificationTimesAsync: FunctionSpyInstance<typeof notificationTimesAsyncStorage.getNotificationTimesAsync>;
      beforeEach(() => {
        spyGetNotificationTimesAsync = jest
          .spyOn(notificationTimesAsyncStorage, "getNotificationTimesAsync")
          .mockImplementation(async () => notificationTimes);
      });

      test("(at the start of the day)", async () => {
        DateMock.advanceTo(+new Date("2010-05-11T08:00:00Z"));

        await setNotificationsAsync();

        expect(spyCancelAllScheduledNotificationsAsync).toBeCalledTimes(1);

        // 24 = Math.floor(28 / studyInfo.pingsFrequency.length) * studyInfo.pingsFrequency.length - shown notification today (0)
        expect(spyScheduleNotificationAsync).toBeCalledTimes(24);

        for (let i = 0; i < 6; i++) {
          expect(
            spyScheduleNotificationAsync.mock.calls[i]?.[0].trigger,
          ).toStrictEqual({
            date: notificationTimes[i].notificationDate,
            channelId: ANDROID_CHANNEL_NAME,
          });
        }

        // TODO: CHECK IF SNAPSHOT IS CORRECT.
        expect(spyScheduleNotificationAsync.mock.calls).toMatchSnapshot();
      });

      test("(in the middle of the day)", async () => {
        DateMock.advanceTo(+new Date("2010-05-11T13:00:00Z"));

        await setNotificationsAsync();

        expect(spyCancelAllScheduledNotificationsAsync).toBeCalledTimes(1);

        // 21 = Math.floor(28 / studyInfo.pingsFrequency.length) * studyInfo.pingsFrequency.length - shown notification today (3)
        expect(spyScheduleNotificationAsync).toBeCalledTimes(21);

        for (let i = 3; i < 6; i++) {
          expect(
            spyScheduleNotificationAsync.mock.calls[i - 3][0]?.trigger,
          ).toStrictEqual({
            date: notificationTimes[i].notificationDate,
            channelId: ANDROID_CHANNEL_NAME,
          });
        }

        // TODO: CHECK IF SNAPSHOT IS CORRECT.
        expect(spyScheduleNotificationAsync.mock.calls).toMatchSnapshot();
      });
    });

    describe("during the survey", () => {
      describe("(still haven't reached bonus)", () => {
        test("(stay in current week)", async () => {
          DateMock.advanceTo(+new Date("2010-05-03T10:01:00Z"));

          await setNotificationsAsync();

          expect(spyCancelAllScheduledNotificationsAsync).toBeCalledTimes(1);

          // 22 = Math.floor(28 / studyInfo.pingsFrequency.length) * studyInfo.pingsFrequency.length - shown notification today (1)
          expect(spyScheduleNotificationAsync).toBeCalledTimes(23);
          // TODO: CHECK IF SNAPSHOT IS CORRECT.
          expect(spyScheduleNotificationAsync.mock.calls).toMatchSnapshot();
        });

        test("(jump to next week)", async () => {
          DateMock.advanceTo(+new Date("2010-05-01T11:00:00Z"));

          await setNotificationsAsync();

          expect(spyCancelAllScheduledNotificationsAsync).toBeCalledTimes(1);

          // 22 = Math.floor(28 / studyInfo.pingsFrequency.length) * studyInfo.pingsFrequency.length - shown notification today (2)
          expect(spyScheduleNotificationAsync).toBeCalledTimes(22);
          // TODO: CHECK IF SNAPSHOT IS CORRECT.
          expect(spyScheduleNotificationAsync.mock.calls).toMatchSnapshot();
        });
      });

      test("(1 ping from reaching bonus)", async () => {
        DateMock.advanceTo(+new Date("2010-05-11T13:29:30Z"));

        await setNotificationsAsync();

        expect(spyCancelAllScheduledNotificationsAsync).toBeCalledTimes(1);

        // 21 = Math.floor(28 / studyInfo.pingsFrequency.length) * studyInfo.pingsFrequency.length - shown notification today (3)
        expect(spyScheduleNotificationAsync).toBeCalledTimes(21);
        // TODO: CHECK IF SNAPSHOT IS CORRECT.
        expect(spyScheduleNotificationAsync.mock.calls).toMatchSnapshot();
      });

      describe("(reached bonus)", () => {
        test("(stay in current week)", async () => {
          DateMock.advanceTo(+new Date("2010-05-11T17:29:30Z"));

          await setNotificationsAsync();

          expect(spyCancelAllScheduledNotificationsAsync).toBeCalledTimes(1);

          // 20 = Math.floor(28 / studyInfo.pingsFrequency.length) * studyInfo.pingsFrequency.length - shown notification today (4)
          expect(spyScheduleNotificationAsync).toBeCalledTimes(20);
          // TODO: CHECK IF SNAPSHOT IS CORRECT.
          expect(spyScheduleNotificationAsync.mock.calls).toMatchSnapshot();
        });

        test("(jump to next week)", async () => {
          DateMock.advanceTo(+new Date("2010-05-15T14:01:00Z"));

          await setNotificationsAsync();

          expect(spyCancelAllScheduledNotificationsAsync).toBeCalledTimes(1);

          // 21 = Math.floor(28 / studyInfo.pingsFrequency.length) * studyInfo.pingsFrequency.length - shown notification today (3)
          expect(spyScheduleNotificationAsync).toBeCalledTimes(21);
          // TODO: CHECK IF SNAPSHOT IS CORRECT.
          expect(spyScheduleNotificationAsync.mock.calls).toMatchSnapshot();
        });
      });

      describe("(no bonus is set)", () => {
        const PINGS_STUDY_INFO_WITH_NO_BONUS: StudyInfo = {
          ...PINGS_STUDY_INFO,
          notificationContent: {
            ...PINGS_STUDY_INFO.notificationContent,
            bonus: undefined,
          },
        };

        beforeEach(() => {
          mockCurrentStudyInfo(PINGS_STUDY_INFO_WITH_NO_BONUS);
        });

        test("(stay in current week)", async () => {
          DateMock.advanceTo(+new Date("2010-05-11T17:29:30Z"));

          await setNotificationsAsync();

          expect(spyCancelAllScheduledNotificationsAsync).toBeCalledTimes(1);

          // 20 = Math.floor(28 / studyInfo.pingsFrequency.length) * studyInfo.pingsFrequency.length - shown notification today (4)
          expect(spyScheduleNotificationAsync).toBeCalledTimes(20);

          for (const eachCall of spyScheduleNotificationAsync.mock.calls) {
            expect(
              eachCall[0].content.title ===
                PINGS_STUDY_INFO_WITH_NO_BONUS.notificationContent.default
                  .title,
            );
            expect(
              eachCall[0].content.body ===
                PINGS_STUDY_INFO_WITH_NO_BONUS.notificationContent.default.body,
            );
          }

          // TODO: CHECK IF SNAPSHOT IS CORRECT.
          expect(spyScheduleNotificationAsync.mock.calls).toMatchSnapshot();
        });

        test("(jump to next week)", async () => {
          DateMock.advanceTo(+new Date("2010-05-15T14:01:00Z"));

          await setNotificationsAsync();

          expect(spyCancelAllScheduledNotificationsAsync).toBeCalledTimes(1);

          // 21 = Math.floor(28 / studyInfo.pingsFrequency.length) * studyInfo.pingsFrequency.length - shown notification today (3)
          expect(spyScheduleNotificationAsync).toBeCalledTimes(21);

          for (const eachCall of spyScheduleNotificationAsync.mock.calls) {
            expect(
              eachCall[0].content.title ===
                PINGS_STUDY_INFO_WITH_NO_BONUS.notificationContent.default
                  .title,
            );
            expect(
              eachCall[0].content.body ===
                PINGS_STUDY_INFO_WITH_NO_BONUS.notificationContent.default.body,
            );
          }

          // TODO: CHECK IF SNAPSHOT IS CORRECT.
          expect(spyScheduleNotificationAsync.mock.calls).toMatchSnapshot();
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
            return getMockNotificationTimesInfos([
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
            ]);
          });
      });

      test("before and after a ping", async () => {
        DateMock.advanceTo(+new Date("2010-05-12T12:57:00Z"));
        expect(await getCurrentNotificationTimeAsync()).toMatchInlineSnapshot(
          `null`,
        );

        DateMock.advanceTo(+new Date("2010-05-12T12:57:08Z"));
        expect(await getCurrentNotificationTimeAsync()).toMatchInlineSnapshot(
          `2010-05-12T12:57:07.000Z`,
        );

        DateMock.advanceTo(+new Date("2010-05-12T13:00:08Z"));
        expect(await getCurrentNotificationTimeAsync()).toMatchInlineSnapshot(
          `2010-05-12T12:57:07.000Z`,
        );

        DateMock.advanceTo(+new Date("2010-05-12T13:26:59Z"));
        expect(await getCurrentNotificationTimeAsync()).toMatchInlineSnapshot(
          `2010-05-12T12:57:07.000Z`,
        );

        DateMock.advanceTo(+new Date("2010-05-12T13:27:08Z"));
        expect(await getCurrentNotificationTimeAsync()).toMatchInlineSnapshot(
          `null`,
        );
      });

      test("expired ping", async () => {
        DateMock.advanceTo(+new Date("2010-05-12T14:01:00Z"));
        expect(await getCurrentNotificationTimeAsync()).toMatchInlineSnapshot(
          `null`,
        );
      });
    });

    test("without stored notification times", async () => {
      DateMock.advanceTo(+new Date("2010-05-12T13:00:08Z"));
      expect(await getCurrentNotificationTimeAsync()).toMatchInlineSnapshot(
        `null`,
      );
    });
  });

  describe("getIncomingNotificationTimeAsync", () => {
    describe("with stored notification times", () => {
      let spyGetNotificationTimesAsync: FunctionSpyInstance<typeof notificationTimesAsyncStorage.getNotificationTimesAsync>;
      beforeEach(() => {
        spyGetNotificationTimesAsync = jest
          .spyOn(notificationTimesAsyncStorage, "getNotificationTimesAsync")
          .mockImplementation(async () => {
            return getMockNotificationTimesInfos([
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
            ]);
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
