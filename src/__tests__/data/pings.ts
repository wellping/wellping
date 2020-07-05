import { BaseEntity } from "typeorm";

const PINGS_PARTIAL = [
  {
    id: "cat1",
    notificationTime: new Date("2010-05-01T08:25:05+08:00"),
    startTime: new Date("2010-05-01T08:30:01+08:00"),
    endTime: new Date("2010-05-01T08:39:40+08:00"),
    streamName: "cat",
  },
  {
    id: "dog1",
    notificationTime: new Date("2010-05-01T10:20:00+08:00"),
    startTime: new Date("2010-05-01T10:20:05+08:00"),
    endTime: null,
    streamName: "dog",
  },
  {
    id: "wolf1",
    notificationTime: new Date("2010-05-01T19:00:05+08:00"),
    startTime: new Date("2010-05-01T20:06:21+08:00"),
    endTime: new Date("2010-05-01T20:59:20+08:00"),
    streamName: "wolf",
  },
  {
    id: "cat2",
    notificationTime: new Date("2010-05-02T13:08:04+08:00"),
    startTime: new Date("2010-05-02T14:59:01+08:00"),
    endTime: null,
    streamName: "cat",
  },
  {
    id: "cat3",
    notificationTime: new Date("2010-05-03T09:08:07+08:00"),
    startTime: new Date("2010-05-03T09:26:00+08:00"),
    endTime: new Date("2010-05-03T09:26:02+08:00"),
    streamName: "cat",
  },
  {
    id: "cat4",
    notificationTime: new Date("2010-05-10T23:08:07+08:00"),
    startTime: new Date("2010-05-10T23:09:09+08:00"),
    endTime: new Date("2010-05-10T23:59:59+08:00"),
    streamName: "cat",
  },
];
export const PINGS = PINGS_PARTIAL.map((value) => {
  return {
    ...value,
    tzOffset: value.startTime.getTimezoneOffset(),
    answers: undefined, // Unused.
  };
});

export const PINGS_DICT = PINGS.reduce((map, value) => {
  map[value.id] = value;
  return map;
}, {} as any);
