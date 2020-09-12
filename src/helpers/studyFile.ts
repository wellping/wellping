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
  "https://debug.local.wellping.ssnl.stanford.edu/DEBUG_STUDY.json";
const WELLPING_LOCAL_DEBUG_FILEPATH = "../../local/debug/DEBUG_STUDY.json";

export const WELLPING_LOCAL_PRIVATE_URL =
  "https://local.wellping.ssnl.stanford.edu/study.json";
const WELLPING_LOCAL_PRIVATE_FILEPATH = "../../local/private/study.json";

export type LocalStudyFileType = "debug" | "private";
export function getLocalStudyFileType(
  studyFileURL: string,
): LocalStudyFileType | null {
  if (studyFileURL === WELLPING_LOCAL_DEBUG_URL) {
    return "debug";
  }
  if (studyFileURL === WELLPING_LOCAL_PRIVATE_URL) {
    return "private";
  }
  return null;
}

export async function getLocalStudyFileTypeAsync(): Promise<LocalStudyFileType | null> {
  return getLocalStudyFileType((await getStudyInfoAsync()).studyFileURL);
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
 * Downloads a study file (in JSON or YAML format) from `url`.
 * Returns the content of the file (as a string) if the file is a JSON file,
 * or returns a JSON-stringified parsed YAML object.
 * Throws an error if the download process (or YAML parsing process if any)
 * failed.
 */
export async function downloadStudyFileAsync(url: string): Promise<string> {
  const localStudyFilePath = getLocalStudyFileType(url);
  if (localStudyFilePath !== null) {
    await new Promise((r) => setTimeout(r, 1000)); // Simulate loading.
    let rawJsonString: string;
    switch (localStudyFilePath) {
      case "debug":
        rawJsonString = JSON.stringify(require(WELLPING_LOCAL_DEBUG_FILEPATH));
        break;

      case "private":
        rawJsonString = JSON.stringify(
          require(WELLPING_LOCAL_PRIVATE_FILEPATH),
        );
        break;
    }
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
    // Notice that since "every JSON file is also a valid YAML file."
    // (https://yaml.org/spec/1.2/spec.html#id2759572), this will also handle
    // the case if the JSON file has a wrong content type.
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
