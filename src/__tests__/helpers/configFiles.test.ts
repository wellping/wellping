import * as DateMock from "jest-date-mock";

import { isTimeThisWeek } from "../../helpers/studyFile";

describe("isTimeThisWeek", () => {
  beforeEach(() => {
    DateMock.advanceTo(+new Date("2008-08-08"));
  });

  afterEach(() => {
    DateMock.clear();
  });

  test("weekStartsOn: 0", async () => {
    const studyInfo = {
      weekStartsOn: 0,
    } as any;

    expect(isTimeThisWeek(new Date(), studyInfo)).toBe(true);

    expect(isTimeThisWeek(new Date("2008-08-01"), studyInfo)).toBe(false);
    expect(isTimeThisWeek(new Date("2008-08-02"), studyInfo)).toBe(false);

    expect(isTimeThisWeek(new Date("2008-08-03"), studyInfo)).toBe(true);
    expect(isTimeThisWeek(new Date("2008-08-04"), studyInfo)).toBe(true);
    expect(isTimeThisWeek(new Date("2008-08-05"), studyInfo)).toBe(true);
    expect(isTimeThisWeek(new Date("2008-08-06"), studyInfo)).toBe(true);
    expect(isTimeThisWeek(new Date("2008-08-07"), studyInfo)).toBe(true);
    expect(isTimeThisWeek(new Date("2008-08-08"), studyInfo)).toBe(true);
    expect(isTimeThisWeek(new Date("2008-08-09"), studyInfo)).toBe(true);

    expect(isTimeThisWeek(new Date("2008-08-10"), studyInfo)).toBe(false);
    expect(isTimeThisWeek(new Date("2008-08-11"), studyInfo)).toBe(false);

    expect(isTimeThisWeek(new Date("2009-08-08"), studyInfo)).toBe(false);
  });

  test("weekStartsOn: 1", async () => {
    const studyInfo = {
      weekStartsOn: 1,
    } as any;

    expect(isTimeThisWeek(new Date(), studyInfo)).toBe(true);

    expect(isTimeThisWeek(new Date("2008-08-02"), studyInfo)).toBe(false);
    expect(isTimeThisWeek(new Date("2008-08-03"), studyInfo)).toBe(false);

    expect(isTimeThisWeek(new Date("2008-08-04"), studyInfo)).toBe(true);
    expect(isTimeThisWeek(new Date("2008-08-05"), studyInfo)).toBe(true);
    expect(isTimeThisWeek(new Date("2008-08-06"), studyInfo)).toBe(true);
    expect(isTimeThisWeek(new Date("2008-08-07"), studyInfo)).toBe(true);
    expect(isTimeThisWeek(new Date("2008-08-08"), studyInfo)).toBe(true);
    expect(isTimeThisWeek(new Date("2008-08-09"), studyInfo)).toBe(true);
    expect(isTimeThisWeek(new Date("2008-08-10"), studyInfo)).toBe(true);

    expect(isTimeThisWeek(new Date("2008-08-11"), studyInfo)).toBe(false);
    expect(isTimeThisWeek(new Date("2008-08-12"), studyInfo)).toBe(false);

    expect(isTimeThisWeek(new Date("2009-08-08"), studyInfo)).toBe(false);
  });

  test("weekStartsOn: 3", async () => {
    const studyInfo = {
      weekStartsOn: 3,
    } as any;

    expect(isTimeThisWeek(new Date(), studyInfo)).toBe(true);

    expect(isTimeThisWeek(new Date("2008-08-04"), studyInfo)).toBe(false);
    expect(isTimeThisWeek(new Date("2008-08-05"), studyInfo)).toBe(false);

    expect(isTimeThisWeek(new Date("2008-08-06"), studyInfo)).toBe(true);
    expect(isTimeThisWeek(new Date("2008-08-07"), studyInfo)).toBe(true);
    expect(isTimeThisWeek(new Date("2008-08-08"), studyInfo)).toBe(true);
    expect(isTimeThisWeek(new Date("2008-08-09"), studyInfo)).toBe(true);
    expect(isTimeThisWeek(new Date("2008-08-10"), studyInfo)).toBe(true);
    expect(isTimeThisWeek(new Date("2008-08-11"), studyInfo)).toBe(true);
    expect(isTimeThisWeek(new Date("2008-08-12"), studyInfo)).toBe(true);

    expect(isTimeThisWeek(new Date("2008-08-13"), studyInfo)).toBe(false);
    expect(isTimeThisWeek(new Date("2008-08-14"), studyInfo)).toBe(false);

    expect(isTimeThisWeek(new Date("2009-08-08"), studyInfo)).toBe(false);
  });

  test("weekStartsOn: 5", async () => {
    const studyInfo = {
      weekStartsOn: 5,
    } as any;

    expect(isTimeThisWeek(new Date(), studyInfo)).toBe(true);

    expect(isTimeThisWeek(new Date("2008-08-06"), studyInfo)).toBe(false);
    expect(isTimeThisWeek(new Date("2008-08-07"), studyInfo)).toBe(false);

    expect(isTimeThisWeek(new Date("2008-08-08"), studyInfo)).toBe(true);
    expect(isTimeThisWeek(new Date("2008-08-09"), studyInfo)).toBe(true);
    expect(isTimeThisWeek(new Date("2008-08-10"), studyInfo)).toBe(true);
    expect(isTimeThisWeek(new Date("2008-08-11"), studyInfo)).toBe(true);
    expect(isTimeThisWeek(new Date("2008-08-12"), studyInfo)).toBe(true);
    expect(isTimeThisWeek(new Date("2008-08-13"), studyInfo)).toBe(true);
    expect(isTimeThisWeek(new Date("2008-08-14"), studyInfo)).toBe(true);

    expect(isTimeThisWeek(new Date("2008-08-15"), studyInfo)).toBe(false);
    expect(isTimeThisWeek(new Date("2008-08-16"), studyInfo)).toBe(false);

    expect(isTimeThisWeek(new Date("2009-08-08"), studyInfo)).toBe(false);
  });
});
