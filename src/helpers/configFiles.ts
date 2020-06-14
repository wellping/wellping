import { isThisWeek } from "date-fns";

import { SurveyFile, Names, StudyID, StudyInfo, StreamName } from "./types";

export function getSurveyFile(): SurveyFile {
  const survey: SurveyFile = require("../../config/survey.json");
  return survey;
}

// TODO: DECOUPLE FUNCTIONS LIKE THIS
export function getNamesFile(): Names {
  const names: Names = require("../../config/names.json");
  return names;
}

export function getStudyInfo(): StudyInfo {
  return getSurveyFile().studyInfo;
}

export function getAllStreamNames(): StreamName[] {
  return Object.keys(getSurveyFile().meta.startingQuestionIds) as StreamName[];
}

export function getStudyId(): StudyID {
  return getStudyInfo().id;
}

export function isTimeThisWeek(time: Date): boolean {
  return isThisWeek(time, { weekStartsOn: getStudyInfo().weekStartsOn });
}
