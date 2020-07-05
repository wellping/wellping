// https://stackoverflow.com/a/55193363/2603230
// https://github.com/typeorm/typeorm/issues/1774#issuecomment-374744550
import MockDate from "mockdate";

import { getPingsAsync, getTodayPingsAsync } from "../../helpers/pings";
import {
  PINGS,
  PINGS_DICT,
  mockPingEntityCreateQueryBuilder,
} from "../__data/pings";

describe("getPingsAsync", () => {
  test("basic test", async () => {
    const orderBySpy = jest.fn().mockReturnThis();

    const createQueryBuilderSpy = mockPingEntityCreateQueryBuilder({
      orderBy: orderBySpy,
    });

    const results = await getPingsAsync();

    expect(orderBySpy).toHaveBeenCalledWith("startTime", "ASC");
    expect(results).toBe(PINGS);

    createQueryBuilderSpy.mockRestore();
  });
});

describe("getTodayPingsAsync", () => {
  test("basic test", async () => {
    const createQueryBuilderSpy = mockPingEntityCreateQueryBuilder();

    MockDate.set("2010-04-30T08:08:08+08:00");
    expect(await getTodayPingsAsync()).toStrictEqual([]);

    MockDate.set("2010-05-01T08:08:08+08:00");
    expect(await getTodayPingsAsync()).toStrictEqual([
      PINGS_DICT["cat1"],
      PINGS_DICT["dog1"],
      PINGS_DICT["wolf1"],
    ]);

    MockDate.set("2010-05-02T08:08:08+08:00");
    expect(await getTodayPingsAsync()).toStrictEqual([PINGS_DICT["cat2"]]);

    MockDate.set("2010-05-03T08:08:08+08:00");
    expect(await getTodayPingsAsync()).toStrictEqual([PINGS_DICT["cat3"]]);

    MockDate.set("2010-05-05T08:08:08+08:00");
    expect(await getTodayPingsAsync()).toStrictEqual([]);

    MockDate.set("2010-05-10T08:08:08+08:00");
    expect(await getTodayPingsAsync()).toStrictEqual([PINGS_DICT["cat4"]]);

    MockDate.set("2011-01-01T08:08:08+08:00");
    expect(await getTodayPingsAsync()).toStrictEqual([]);

    createQueryBuilderSpy.mockRestore();
    MockDate.reset();
  });
});
