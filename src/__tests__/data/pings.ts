import { StudyInfo } from "../../helpers/types";
import { BASE_STUDY_INFO } from "./studyInfo";

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
  {
    id: "cat5",
    notificationTime: new Date("2010-05-11T08:08:07Z"),
    startTime: new Date("2010-05-11T08:09:09Z"),
    endTime: new Date("2010-05-11T08:19:58Z"),
    streamName: "cat",
  },
  {
    id: "dog2",
    notificationTime: new Date("2010-05-11T10:09:07Z"),
    startTime: new Date("2010-05-11T10:10:09Z"),
    endTime: new Date("2010-05-11T10:11:58Z"),
    streamName: "dog",
  },
  {
    id: "wolf2",
    notificationTime: new Date("2010-05-11T12:10:07Z"),
    startTime: new Date("2010-05-11T12:20:09Z"),
    endTime: new Date("2010-05-11T12:30:58Z"),
    streamName: "wolf",
  },
  {
    id: "lynx1",
    notificationTime: new Date("2010-05-11T16:11:07Z"),
    startTime: new Date("2010-05-11T16:22:09Z"),
    endTime: new Date("2010-05-11T16:33:58Z"),
    streamName: "lynx",
  },
  {
    id: "cat6",
    notificationTime: new Date("2010-05-11T18:12:07Z"),
    startTime: new Date("2010-05-11T18:23:09Z"),
    endTime: new Date("2010-05-11T18:34:58Z"),
    streamName: "cat",
  },
  {
    id: "dog3",
    notificationTime: new Date("2010-05-11T22:13:07Z"),
    startTime: new Date("2010-05-11T22:24:09Z"),
    endTime: new Date("2010-05-11T22:35:58Z"),
    streamName: "dog",
  },
  {
    id: "cat7",
    notificationTime: new Date("2010-05-12T12:13:07Z"),
    startTime: new Date("2010-05-12T12:14:09Z"),
    endTime: new Date("2010-05-12T12:15:58Z"),
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

export const PINGS_STUDY_INFO: StudyInfo = {
  ...BASE_STUDY_INFO,
  startDate: new Date("2010-05-01T06:00:00Z"),
  endDate: new Date("2010-05-30T21:00:00Z"),
  weekStartsOn: 1 as StudyInfo["weekStartsOn"],
  notificationContent: {
    default: {
      title: "New survey!",
      body: "Do it now!",
    },
    bonus: {
      title: "You can earn bonus!",
      body: "You are #n_ping# away from the weekly bonus.",
      numberOfCompletionEachWeek: 5,
    },
  },
  frequency: {
    expireAfterMinutes: 30,
    hoursEveryday: [8, 10, 12, 16, 18, 22],
    randomMinuteAddition: { min: 0, max: 89 },
  },
  streamsStartingQuestionIds: {
    cat: "hello_cat",
    dog: "hello_dog",
    wolf: "hello_wolf",
    lynx: "hello_lynx",
  },
  streamsOrder: {
    0: ["cat", "dog", "wolf", "lynx", "cat", "dog"],
    1: ["cat", "dog", "wolf", "lynx", "cat", "dog"],
    2: ["cat", "dog", "wolf", "lynx", "cat", "dog"],
    3: ["cat", "dog", "wolf", "lynx", "cat", "dog"],
    4: ["cat", "dog", "wolf", "lynx", "cat", "dog"],
    5: ["cat", "dog", "wolf", "lynx", "cat", "dog"],
    6: ["cat", "dog", "wolf", "lynx", "cat", "dog"],
  },
  streamsNotReplacedByFollowupStream: [],
};
