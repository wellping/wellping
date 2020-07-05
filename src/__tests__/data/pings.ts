const PINGS_PARTIAL = [
  {
    id: "cat1",
    notificationTime: new Date("2010-05-01T08:25:05Z"),
    startTime: new Date("2010-05-01T08:30:01Z"),
    endTime: new Date("2010-05-01T08:39:40Z"),
    streamName: "cat",
  },
  {
    id: "dog1",
    notificationTime: new Date("2010-05-01T10:20:00Z"),
    startTime: new Date("2010-05-01T10:20:05Z"),
    endTime: null,
    streamName: "dog",
  },
  {
    id: "wolf1",
    notificationTime: new Date("2010-05-01T19:00:05Z"),
    startTime: new Date("2010-05-01T20:06:21Z"),
    endTime: new Date("2010-05-01T20:59:20Z"),
    streamName: "wolf",
  },
  {
    id: "cat2",
    notificationTime: new Date("2010-05-02T13:08:04Z"),
    startTime: new Date("2010-05-02T14:59:01Z"),
    endTime: null,
    streamName: "cat",
  },
  {
    id: "cat3",
    notificationTime: new Date("2010-05-03T09:08:07Z"),
    startTime: new Date("2010-05-03T09:26:00Z"),
    endTime: new Date("2010-05-03T09:26:02Z"),
    streamName: "cat",
  },
  {
    id: "cat4",
    notificationTime: new Date("2010-05-10T23:08:07Z"),
    startTime: new Date("2010-05-10T23:09:09Z"),
    endTime: new Date("2010-05-10T23:59:58Z"),
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
