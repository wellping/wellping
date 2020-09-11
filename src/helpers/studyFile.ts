import { isThisWeek } from "date-fns";

import { _DEBUG_CONFIGS } from "../../config/debug";
import {
  storeCurrentStudyFileAsync,
  clearCurrentStudyFileAsync,
  getCurrentStudyInfoAsync,
  getCurrentStreamsAsync,
  getCurrentExtraDataAsync,
} from "./asyncStorage/studyFile";
import { validateAndInitializeFirebaseWithConfig } from "./firebase";
import { parseJsonToStudyFile } from "./schemas/StudyFile";
import { useFirebase } from "./server";
import {
  StudyFile,
  StudyInfo,
  StreamName,
  Streams,
  ExtraData,
  ChoicesList,
} from "./types";

export const WELLPING_LOCAL_DEBUG_URL =
  "https://wellping_local__.ssnl.stanford.edu/debug.json";

export async function isLocalStudyFileAsync(): Promise<boolean> {
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

  const extraData = await getCurrentExtraDataAsync();
  if (extraData === null) {
    return false;
  }

  return true;
}

/**
 * Downloads a study file (in JSON format) from `url`.
 * Returns the content of the file (as a string).
 * Throws an error if the download process failed.
 */
export async function downloadStudyFileAsync(url: string): Promise<string> {
  if (url === WELLPING_LOCAL_DEBUG_URL) {
    await new Promise((r) => setTimeout(r, 3000)); // Simulate loading.
    const rawJsonString = JSON.stringify(
      require("../../config/debug_study.json"),
    );
    return rawJsonString;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      cache: "no-cache",
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    throw e;
  }

  const responseText = await response.text();

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("json")) {
    // It is a JSON file.
    return responseText;
  } else {
    // Try if YAML can parse it.
    // "every JSON file is also a valid YAML file."
    // https://yaml.org/spec/1.2/spec.html#id2759572
    try {
      const yaml = require("js-yaml");
      const doc = yaml.safeLoad(responseText);
      return JSON.stringify(doc);
    } catch (e) {
      throw e;
    }
  }
}

/**
 * Parses a study file from `rawJsonString` (a string that can be parsed to a
 * JSON object).
 * If the study file is successfully parsed and the Firebase config is validated,
 * initializes Firebase and stores the downloaded study file in Async Storage.
 * Returns `null` if all processes are successful.
 * Returns the error message if any process is unsuccessful.
 */
export async function parseAndStoreStudyFileAsync(
  rawJsonString: string,
): Promise<string | null> {
  try {
    const parsedStudy = parseJsonToStudyFile(JSON.parse(rawJsonString));
    if (useFirebase(parsedStudy.studyInfo)) {
      validateAndInitializeFirebaseWithConfig(parsedStudy.studyInfo);
    }
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
 * Returns the stored extra data.
 * Throws an error if there isn't any current study file stored.
 */
export async function getExtraDataAsync(): Promise<ExtraData> {
  const currentExtraData = await getCurrentExtraDataAsync();
  if (currentExtraData === null) {
    throw new Error("getCurrentExtraDataAsync = null");
  }

  return currentExtraData;
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
  const extraData = await getExtraDataAsync();

  return { studyInfo, streams, extraData };
}

/**
 * Returns a choices list keyed `key` in `reusableChoices` in `extraData`.
 * Returns `null` if no such choices list is found.
 */
export async function getReusableChoicesAsync(
  key: string,
): Promise<ChoicesList | null> {
  const extraData = await getExtraDataAsync();
  if (extraData.reusableChoices) {
    if (extraData.reusableChoices[key]) {
      return extraData.reusableChoices[key];
    }
  }
  return null;
}

/**
 * Returns a choices list keyed `key` in `reusableChoices` in `extraData`.
 * If no such choices list is found, returns an array containing a single
 * string explaining the error.
 */
export async function getReusableChoicesIncludeErrorAsync(
  key: string,
): Promise<ChoicesList> {
  const reusableChoices = await getReusableChoicesAsync(key);
  if (reusableChoices === null) {
    return [`ERROR: reusable choices with key "${key}" is not found.`];
  } else {
    return reusableChoices;
  }
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
