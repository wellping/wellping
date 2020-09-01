import AsyncStorage from "@react-native-community/async-storage";

import { Answer } from "../answerTypes";
import { logError } from "../debug";
import { PingId, QuestionId } from "../types";
import { getASKeyAsync } from "./asyncStorage";

export type AnswersList = [PingId, QuestionId][];

const ANSWERS_LIST = `answersList`;

export async function addToAnswersListAsync(answer: Answer) {
  try {
    const currentAnswersList = await getAnswersListAsync();
    currentAnswersList.push([answer.pingId, answer.questionId]);
    await AsyncStorage.setItem(
      await getASKeyAsync(ANSWERS_LIST),
      JSON.stringify(currentAnswersList),
    );
  } catch (error) {
    logError(error);
  }
}

export async function clearAnswersListAsync() {
  try {
    await AsyncStorage.removeItem(await getASKeyAsync(ANSWERS_LIST));
  } catch (error) {
    logError(error);
  }
}

export async function getAnswersListAsync(): Promise<AnswersList> {
  try {
    const value = await AsyncStorage.getItem(await getASKeyAsync(ANSWERS_LIST));
    if (value == null) {
      return [];
    }
    return JSON.parse(value);
  } catch (error) {
    logError(error);
    return [];
  }
}
