/**
 * The study file is downloaded from the studyFileJsonUrl at every start in the
 * background.
 * This stores the downloaded file, which will be loaded (and replace the normal
 * study file) at the next start.
 * This is so that the downloaded file will not interfere with the user in the
 * middle of some process.
 */
import AsyncStorage from "@react-native-community/async-storage";

import { logAndThrowError } from "../debug";
import { getASKeyAsync } from "./asyncStorage";

const TEMP_STUDY_FILE = `tempStudyFile`;

export async function storeTempStudyFileAsync(responseString: string) {
  try {
    await AsyncStorage.setItem(
      await getASKeyAsync(TEMP_STUDY_FILE),
      responseString,
    );
  } catch (error) {
    logAndThrowError(error);
  }
}

export async function clearTempStudyFileAsync() {
  try {
    await AsyncStorage.removeItem(await getASKeyAsync(TEMP_STUDY_FILE));
  } catch (error) {
    logAndThrowError(error);
  }
}

export async function getTempStudyFileAsync(): Promise<string | null> {
  try {
    const value = await AsyncStorage.getItem(
      await getASKeyAsync(TEMP_STUDY_FILE),
    );
    if (value == null) {
      return null;
    }
    return value;
  } catch (error) {
    logAndThrowError(error);
  }
}
