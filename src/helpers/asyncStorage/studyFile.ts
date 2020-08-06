import { AsyncStorage } from "react-native";

import { logError } from "../debug";
import { parseJsonToStreams } from "../schemas/Stream";
import {
  parseJsonToStudyInfo,
  parseJsonToExtraData,
} from "../schemas/StudyFile";
import { StudyFile, Streams, StudyInfo, ExtraData } from "../types";

const STUDY_INFO_KEY = `currentStudyFile_StudyInfo`;
const STREAMS_KEY = `currentStudyFile_Streams`;
const EXTRA_DATA_KEY = `currentStudyFile_ExtraData`;

export async function storeCurrentStudyFileAsync(studyFile: StudyFile) {
  try {
    await AsyncStorage.setItem(
      STUDY_INFO_KEY,
      JSON.stringify(studyFile.studyInfo),
    );
    await AsyncStorage.setItem(STREAMS_KEY, JSON.stringify(studyFile.streams));
    await AsyncStorage.setItem(
      EXTRA_DATA_KEY,
      JSON.stringify(studyFile.extraData),
    );
  } catch (error) {
    // Error saving data
    logError(error);
  }
}

export async function clearCurrentStudyFileAsync() {
  try {
    await AsyncStorage.removeItem(STUDY_INFO_KEY);
    await AsyncStorage.removeItem(STREAMS_KEY);
    await AsyncStorage.removeItem(EXTRA_DATA_KEY);
  } catch (error) {
    // Error saving data
    logError(error);
  }
}

export async function getCurrentStudyInfoAsync(): Promise<StudyInfo | null> {
  try {
    const value = await AsyncStorage.getItem(STUDY_INFO_KEY);
    if (value == null) {
      return null;
    }
    const studyInfo: StudyInfo = parseJsonToStudyInfo(JSON.parse(value));
    return studyInfo;
  } catch (error) {
    // We don't want this ill-formatted study file to be stored.
    await clearCurrentStudyFileAsync();
    logError(error);
    return null;
  }
}

export async function getCurrentStreamsAsync(): Promise<Streams | null> {
  try {
    const value = await AsyncStorage.getItem(STREAMS_KEY);
    if (value == null) {
      return null;
    }
    const streams: Streams = parseJsonToStreams(JSON.parse(value));
    return streams;
  } catch (error) {
    // We don't want this ill-formatted study file to be stored.
    await clearCurrentStudyFileAsync();
    logError(error);
    return null;
  }
}

export async function getCurrentExtraDataAsync(): Promise<ExtraData | null> {
  try {
    const value = await AsyncStorage.getItem(EXTRA_DATA_KEY);
    if (value == null) {
      return null;
    }
    const extraData: ExtraData = parseJsonToExtraData(JSON.parse(value));
    return extraData;
  } catch (error) {
    // We don't want this ill-formatted study file to be stored.
    await clearCurrentStudyFileAsync();
    logError(error);
    return null;
  }
}
