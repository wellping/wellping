import * as SecureStore from "expo-secure-store";

import { Answer } from "../answerTypes";
import {
  addToAnswersListAsync,
  getAnswersListAsync,
  clearAnswersListAsync,
} from "../asyncStorage/answersList";
import { logError } from "../debug";
import { AnswerSchema } from "../schemas/Answer";
import { PingId, QuestionId } from "../types";
import { getSSKeyAsync } from "./secureStore";

const ANSWER_PREFIX = `answer/`;
const getKey = (pingId: PingId, questionId: QuestionId) =>
  `${ANSWER_PREFIX}${pingId}/${questionId}`;

export async function secureStoreAnswerAsync(answer: Answer, isNew: boolean) {
  try {
    await SecureStore.setItemAsync(
      await getSSKeyAsync(getKey(answer.pingId, answer.questionId)),
      JSON.stringify(answer),
    );
    if (isNew) {
      await addToAnswersListAsync(answer);
    }
  } catch (error) {
    logError(error);
  }
}

export async function secureGetAnswerAsync(
  pingId: PingId,
  questionId: QuestionId,
): Promise<Answer | null> {
  try {
    const value = await SecureStore.getItemAsync(
      await getSSKeyAsync(getKey(pingId, questionId)),
    );
    if (value == null) {
      return null;
    }
    return AnswerSchema.parse(value);
  } catch (error) {
    logError(error);
    return null;
  }
}

export async function secureRemoveAllAnswersAsync() {
  try {
    const answersList = await getAnswersListAsync();
    for (const pingIdAndQuestionId of answersList) {
      await SecureStore.deleteItemAsync(
        await getSSKeyAsync(
          getKey(pingIdAndQuestionId[0], pingIdAndQuestionId[1]),
        ),
      );
    }
    await clearAnswersListAsync();
  } catch (error) {
    logError(error);
  }
}
