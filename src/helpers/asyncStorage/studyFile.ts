import { AsyncStorage } from "react-native";

import { logError } from "../debug";
import { parseJsonToStudyFile } from "../schemas/StudyFile";
import { StudyFile } from "../types";

const STUDY_FILE_KEY = `currentStudyFile`;

export async function storeCurrentStudyFileAsync(studyFile: StudyFile) {
  try {
    await AsyncStorage.setItem(STUDY_FILE_KEY, JSON.stringify(studyFile));
  } catch (error) {
    // Error saving data
    logError(error);
  }
}

export async function clearCurrentStudyFileAsync() {
  try {
    await AsyncStorage.removeItem(STUDY_FILE_KEY);
  } catch (error) {
    // Error saving data
    logError(error);
  }
}

export async function getCurrentStudyFileAsync(): Promise<StudyFile | null> {
  try {
    const value = await AsyncStorage.getItem(STUDY_FILE_KEY);
    if (value == null) {
      return null;
    }
    const studyFile: StudyFile = parseJsonToStudyFile(JSON.parse(value));
    return studyFile;
  } catch (error) {
    // Error retrieving data
    logError(error);
    return null;
  }
}
