import { BaseEntity } from "typeorm";

export const PINGS: any[] = [
  {
    id: "cat1",
    notificationTime: new Date("2010-05-01T08:25:05+08:00"),
    startTime: new Date("2010-05-01T08:30:01+08:00"),
    endTime: new Date("2010-05-01T08:39:40+08:00"),
    tzOffset: -480,
    streamName: "cat",
    answers: [],
  },
  {
    id: "dog1",
    notificationTime: new Date("2010-05-01T10:20:00+08:00"),
    startTime: new Date("2010-05-01T10:20:05+08:00"),
    endTime: null,
    tzOffset: -480,
    streamName: "dog",
    answers: [],
  },
  {
    id: "wolf1",
    notificationTime: new Date("2010-05-01T19:00:05+08:00"),
    startTime: new Date("2010-05-01T20:06:21+08:00"),
    endTime: null,
    tzOffset: -480,
    streamName: "wolf",
    answers: [],
  },
  {
    id: "cat2",
    notificationTime: new Date("2010-05-02T13:08:04+08:00"),
    startTime: new Date("2010-05-02T14:59:01+08:00"),
    endTime: null,
    tzOffset: -480,
    streamName: "cat",
    answers: [],
  },
  {
    id: "cat3",
    notificationTime: new Date("2010-05-03T09:08:07+08:00"),
    startTime: new Date("2010-05-03T09:26:00+08:00"),
    endTime: null,
    tzOffset: -480,
    streamName: "cat",
    answers: [],
  },
  {
    id: "cat4",
    notificationTime: new Date("2010-05-10T23:08:07+08:00"),
    startTime: new Date("2010-05-10T23:09:09+08:00"),
    endTime: null,
    tzOffset: -480,
    streamName: "cat",
    answers: [],
  },
];

export const PINGS_DICT = PINGS.reduce((map, value) => {
  map[value.id] = value;
  return map;
}, {});

export function mockPingEntityCreateQueryBuilder(
  chains: {
    [functionName: string]: () => any;
  } = {},
) {
  const orderBySpy = jest.fn().mockReturnThis();
  const getManySpy = jest.fn().mockReturnValue(PINGS);

  const spy = jest.spyOn(BaseEntity, "createQueryBuilder");
  spy.mockReturnValue({
    orderBy: orderBySpy,
    getMany: getManySpy,
    ...chains,
  } as any);
  return spy;
}
