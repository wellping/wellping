import { isThisWeek } from "date-fns";

import { StudyFile, Names, StudyInfo, StreamName } from "./types";

export async function getSurveyFileAsync(): Promise<StudyFile> {
  // TODO: if error
  //alert(getCriticalProblemTextForUser("getSurveyFileAsync"));

  const survey: StudyFile = require("../../config/survey.json");
  return survey;
}

// TODO: DECOUPLE FUNCTIONS LIKE THIS
export async function getNamesFileAsync(): Promise<Names> {
  const names: Names = require("../../config/names.json");
  return names;
}

export function getAllStreamNames(survey: StudyFile): StreamName[] {
  return Object.keys(survey.meta.startingQuestionIds) as StreamName[];
}
export async function getAllStreamNamesAsync(): Promise<StreamName[]> {
  return getAllStreamNames(await getSurveyFileAsync());
}

export function isTimeThisWeek(time: Date, studyInfo: StudyInfo): boolean {
  return isThisWeek(time, {
    weekStartsOn: studyInfo.weekStartsOn,
  });
}
export async function isTimeThisWeekAsync(time: Date): Promise<boolean> {
  return isTimeThisWeek(time, (await getSurveyFileAsync()).studyInfo);
}
