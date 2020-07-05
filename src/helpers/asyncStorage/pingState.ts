import { AsyncStorage } from "react-native";

import { SurveyScreenState } from "../../SurveyScreen";
import { logError } from "../debug";
import { getASKeyAsync } from "./asyncStorage";

/** SURVEYSTATE TABLE (stores ping answers and other states) **/
const PINGS_STATE_PREFIX = `PingsState:`;

export async function storePingStateAsync(
  pingId: string,
  state: SurveyScreenState,
) {
  try {
    await AsyncStorage.setItem(
      `${await getASKeyAsync(PINGS_STATE_PREFIX)}${pingId}`,
      JSON.stringify(state),
    );
  } catch (error) {
    // Error saving data
    logError(error);
    throw error;
  }
}

export async function getPingStateAsync(
  pingId: string,
): Promise<SurveyScreenState> {
  try {
    const keyName = `${await getASKeyAsync(PINGS_STATE_PREFIX)}${pingId}`;
    const value = await AsyncStorage.getItem(keyName);
    if (value == null) {
      return {
        currentQuestionId: `ERROR: getPingStateAsync is null for ${keyName}`,
        extraMetaData: {},
        nextStack: [],
        currentQuestionAnswers: {},
        lastUploadDate: new Date(0),
      };
    }
    const state: SurveyScreenState = JSON.parse(value);
    if (state.lastUploadDate) {
      state.lastUploadDate = new Date(state.lastUploadDate);
    }
    return state;
  } catch (error) {
    // Error retrieving data
    logError(error);
    throw error;
  }
}

export async function clearPingStateAsync(pingId: string) {
  try {
    await AsyncStorage.removeItem(
      `${await getASKeyAsync(PINGS_STATE_PREFIX)}${pingId}`,
    );
  } catch (error) {
    // Error saving data
    logError(error);
  }
}
