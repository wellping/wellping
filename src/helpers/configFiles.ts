import { isThisWeek } from "date-fns";

import { _DEBUG_CONFIGS } from "../../config/debug";
import {
  getCurrentStudyFileAsync,
  storeCurrentStudyFileAsync,
  clearCurrentStudyFileAsync,
} from "./asyncStorage/studyFile";
import { parseJsonToStudyFile } from "./schemas/StudyFile";
import { StudyFile, Names, StudyInfo, StreamName } from "./types";

/**
 * Returns whether the study file should be downloaded (or redownloaded if
 * already exists).
 */
export async function shouldDownloadStudyFileAsync(): Promise<boolean> {
  if (__DEV__ && _DEBUG_CONFIGS().alwaysRedownloadStudyFile) {
    return true;
  }

  const currentStudyFile = await getCurrentStudyFileAsync();
  if (currentStudyFile === null) {
    return true;
  }
  // TODO: MAYBE ADD A FIELD IN STUDY INFO SUCH THAT WE WILL FETCH THAT URL
  // TO CHECK MD5 TO DETERMINE IF THE FILE SHOULD BE REDOWNLOADED.
  return false;
}

/**
 * Downloads a study file (in JSON format) from `url`.
 * If the study file is successfully downloaded, parsed, and stored, stores
 * the downloaded study file in Async Storage.
 * Returns `null` if the whole process is successful.
 * Returns the error message if any part of the process is unsuccessful.
 */
export async function downloadStudyFileAsync(
  url: string,
): Promise<string | null> {
  try {
    // TODO: ACTUAL DOWNLOAD PROCESS.
    const study = require("../../config/survey.json");

    const parsedStudy = parseJsonToStudyFile(study);
    await storeCurrentStudyFileAsync(parsedStudy);
    return null;
  } catch (e) {
    await clearCurrentStudyFileAsync();

    if (e instanceof Error) {
      return `**${e.name}**\n${e.message}`;
    } else {
      return `Unknown error: ${e}`;
    }
  }
}

/**
 * Returns the current study file.
 * Throws an error if there isn't any current study file stored.
 */
export async function getStudyFileAsync(): Promise<StudyFile> {
  const currentStudyFile = await getCurrentStudyFileAsync();
  if (currentStudyFile === null) {
    throw new Error("getCurrentStudyFileAsync = null");
  }

  return currentStudyFile;
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
