import AsyncStorage from "@react-native-community/async-storage";

import { Answer } from "../answerTypes";
import { logError } from "../debug";
import { PingId, QuestionId } from "../types";
import { getASKeyAsync } from "./asyncStorage";
import { getPingsListAsync } from "./pingsList";

export type AnswerPingIdQuestionId = [PingId, QuestionId];
export type AnswersPingIdsQuestionIdsList = AnswerPingIdQuestionId[];
export type AnswersQuestionIdsListForPing = QuestionId[];

const ANSWERS_LIST_PREFIX = `answersList/`;
const getKey = (pingId: PingId) => `${ANSWERS_LIST_PREFIX}/${pingId}`;

export async function addToAnswersQuestionIdsListForPingAsync(answer: Answer) {
  try {
    const currentAnswersQuestionIdsListForPing = await getAnswersQuestionIdsListForPingAsync(
      answer.pingId,
    );
    currentAnswersQuestionIdsListForPing.push(answer.questionId);
    await AsyncStorage.setItem(
      await getASKeyAsync(getKey(answer.pingId)),
      JSON.stringify(currentAnswersQuestionIdsListForPing),
    );
  } catch (error) {
    logError(error);
  }
}

export async function clearAnswersQuestionIdsListForPingAsync(pingId: PingId) {
  try {
    await AsyncStorage.removeItem(await getASKeyAsync(getKey(pingId)));
  } catch (error) {
    logError(error);
  }
}

export async function getAnswersQuestionIdsListForPingAsync(
  pingId: PingId,
): Promise<AnswersQuestionIdsListForPing> {
  try {
    const value = await AsyncStorage.getItem(
      await getASKeyAsync(getKey(pingId)),
    );
    if (value == null) {
      return [];
    }
    return JSON.parse(value);
  } catch (error) {
    logError(error);
    return [];
  }
}

export async function getAnswersPingIdsQuestionIdsListAsync(): Promise<
  AnswersPingIdsQuestionIdsList
> {
  // TODO: USE Promise.all
  const answersQuestionIds: AnswersPingIdsQuestionIdsList = [];
  const pingsList = await getPingsListAsync();
  for (const pingId of pingsList) {
    const answersQuestionIdsForPing = await getAnswersQuestionIdsListForPingAsync(
      pingId,
    );
    answersQuestionIds.push(
      ...answersQuestionIdsForPing.map<AnswerPingIdQuestionId>(
        (answerQuestionId) => [pingId, answerQuestionId],
      ),
    );
  }
  return answersQuestionIds;
}

export async function clearAnswersPingIdsQuestionIdsListAsync() {
  const pingsList = await getPingsListAsync();
  await Promise.all(
    pingsList.map(async (pingId) => {
      await clearAnswersQuestionIdsListForPingAsync(pingId);
    }),
  );
}
