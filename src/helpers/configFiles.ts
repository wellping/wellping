import { isThisWeek } from "date-fns";

import { getCriticalProblemTextForUser } from "./debug";
import { parseJsonToStudyFile } from "./schemas/StudyFile";
import { StudyFile, Names, StudyInfo, StreamName } from "./types";

export async function getStudyFileAsync(): Promise<StudyFile> {
  const survey = require("../../config/survey.json");

  return parseJsonToStudyFile(survey);
  /*try {
    const survey = require("../../config/survey.json");

    return parseJsonToStudyFile(survey);
  } catch (e) {
    console.warn("Your study file has problem:");
    console.warn(e.message);
    alert(getCriticalProblemTextForUser("getStudyFileAsync"));
  }*/
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
  return getAllStreamNames(await getStudyFileAsync());
}

export function isTimeThisWeek(time: Date, studyInfo: StudyInfo): boolean {
  return isThisWeek(time, {
    weekStartsOn: studyInfo.weekStartsOn,
  });
}
export async function isTimeThisWeekAsync(time: Date): Promise<boolean> {
  return isTimeThisWeek(time, (await getStudyFileAsync()).studyInfo);
}
