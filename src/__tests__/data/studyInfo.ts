import { StudyInfo } from "../../helpers/types";

export const BASE_STUDY_INFO = {
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

  streamInCaseOfError: "errorStream",
};
