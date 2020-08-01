import { isThisWeek } from "date-fns";

import { _DEBUG_CONFIGS } from "../../config/debug";
import {
  storeCurrentStudyFileAsync,
  clearCurrentStudyFileAsync,
  getCurrentStudyInfoAsync,
  getCurrentStreamsAsync,
} from "./asyncStorage/studyFile";
import { parseJsonToStudyFile } from "./schemas/StudyFile";
import { StudyFile, Names, StudyInfo, StreamName, Streams } from "./types";

export const WELLPING_LOCAL_DEBUG_URL =
  "https://wellping_local__.ssnl.stanford.edu/debug.json";
// TODO: export const WELLPING_LOCAL_DEMO_URL = "https://wellping_local__.ssnl.stanford.edu/demo.json";

export async function isLocalStudyFile(): Promise<boolean> {
  return (
    (await getStudyInfoAsync()).studyFileJsonURL === WELLPING_LOCAL_DEBUG_URL
  );
}

/**
 * Returns whether of not the study file is stored locally.
 */
export async function studyFileExistsAsync() {
  const currentStudyInfo = await getCurrentStudyInfoAsync();
  if (currentStudyInfo === null) {
    return false;
  }

  const currentStreams = await getCurrentStreamsAsync();
  if (currentStreams === null) {
    return false;
  }

  return true;
}

/**
 * Returns whether the study file should be downloaded (or redownloaded if
 * already exists).
 */
export async function shouldDownloadStudyFileAsync(): Promise<boolean> {
  if (__DEV__ && _DEBUG_CONFIGS().alwaysRedownloadStudyFile) {
    return true;
  }

  if (!(await studyFileExistsAsync())) {
    return true;
  }
  // TODO: MAYBE ADD A FIELD IN STUDY INFO SUCH THAT WE WILL FETCH THAT URL
  // TO CHECK MD5 TO DETERMINE IF THE FILE SHOULD BE REDOWNLOADED.
  return false;
}

/**
 * Downloads a study file (in JSON format) from `url`.
 * Returns the content of the file (as a string).
 * Throws an error if the download process failed.
 */
export async function downloadStudyFileAsync(url: string): Promise<string> {
  if (url === WELLPING_LOCAL_DEBUG_URL) {
    await new Promise((r) => setTimeout(r, 3000)); // Simulate loading.
    const rawJsonString = JSON.stringify(require("../../config/survey.json"));
    return rawJsonString;
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-cache",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return response.text();
  } catch (e) {
    throw e;
  }
}

/**
 * Parses a study file from `rawJsonString` (a string that can be parsed to a
 * JSON object).
 * If the study file is successfully parsed, stores the downloaded study file
 * in Async Storage.
 * Returns `null` if all processes are successful.
 * Returns the error message if any process is unsuccessful.
 */
export async function parseAndStoreStudyFileAsync(
  rawJsonString: string,
): Promise<string | null> {
  try {
    const parsedStudy = parseJsonToStudyFile(JSON.parse(rawJsonString));
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
 * Returns the stored study info.
 * Throws an error if there isn't any current study file stored.
 */
export async function getStudyInfoAsync(): Promise<StudyInfo> {
  const currentStudyInfo = await getCurrentStudyInfoAsync();
  if (currentStudyInfo === null) {
    throw new Error("getCurrentStudyInfoAsync = null");
  }

  return currentStudyInfo;
}

/**
 * Returns the stored streams.
 * Throws an error if there isn't any current study file stored.
 */
export async function getStreamsAsync(): Promise<Streams> {
  const currentStreams = await getCurrentStreamsAsync();
  if (currentStreams === null) {
    throw new Error("getCurrentStreamsAsync = null");
  }

  return currentStreams;
}

/**
 * *** Use the more specific `getStudyInfoAsync()` or `getStreamsAsync()` if
 * possible. ***
 *
 * Returns the stored study file.
 * Throws an error if there isn't any current study file stored.
 */
export async function getStudyFileAsync(): Promise<StudyFile> {
  const studyInfo = await getStudyInfoAsync();
  const streams = await getStreamsAsync();

  return { studyInfo, streams };
}

// TODO: DECOUPLE FUNCTIONS LIKE THIS
// MAYBE AN EXTRA FIELD IN StudyFile to be { studyInfo, extra: { choices: { key: [...] } }, streams }
export async function getNamesFileAsync(): Promise<Names> {
  const names: Names = require("../../config/names.json");
  return names;
}

export function getAllStreamNames(studyInfo: StudyInfo): StreamName[] {
  return Object.keys(studyInfo.streamsStartingQuestionIds) as StreamName[];
}
export async function getAllStreamNamesAsync(): Promise<StreamName[]> {
  return getAllStreamNames(await getStudyInfoAsync());
}

export function isTimeThisWeek(time: Date, studyInfo: StudyInfo): boolean {
  return isThisWeek(time, {
    weekStartsOn: studyInfo.weekStartsOn,
  });
}
export async function isTimeThisWeekAsync(time: Date): Promise<boolean> {
  return isTimeThisWeek(time, await getStudyInfoAsync());
}
