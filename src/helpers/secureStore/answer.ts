import { parseJSON } from "date-fns";
import * as SecureStore from "expo-secure-store";

import { Answer } from "../answerTypes";
import {
  addToAnswersQuestionIdsListForPingAsync,
  getAnswersPingIdsQuestionIdsListAsync,
  clearAnswersPingIdsQuestionIdsListAsync,
} from "../asyncStorage/answersPingIdsQuestionIdsList";
import { logError } from "../debug";
import { AnswerSchema } from "../schemas/Answer";
import { PingId, QuestionId } from "../types";
import { getSSKeyAsync } from "./secureStore";

const ANSWER_PREFIX = `answer.`;
const getKey = (pingId: PingId, questionId: QuestionId) =>
  `${ANSWER_PREFIX}${pingId}.${questionId}`;

export async function secureStoreAnswerAsync(answer: Answer, isNew: boolean) {
  try {
    await SecureStore.setItemAsync(
      await getSSKeyAsync(getKey(answer.pingId, answer.questionId)),
      JSON.stringify(answer),
    );
    if (isNew) {
      await addToAnswersQuestionIdsListForPingAsync(answer);
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

    // TODO: CONSIDER BETTER WAY TO DO THIS (INSTEAD OF HARDCODING).
    const parsedValue = JSON.parse(value);
    parsedValue.date = parsedValue.date ? parseJSON(parsedValue.date) : null;

    return AnswerSchema.parse(parsedValue);
  } catch (error) {
    logError(error);
    return null;
  }
}

export async function secureRemoveAllAnswersAsync() {
  try {
    const answersList = await getAnswersPingIdsQuestionIdsListAsync();
    for (const pingIdAndQuestionId of answersList) {
      await SecureStore.deleteItemAsync(
        await getSSKeyAsync(
          getKey(pingIdAndQuestionId[0], pingIdAndQuestionId[1]),
        ),
      );
    }
    await clearAnswersPingIdsQuestionIdsListAsync();
  } catch (error) {
    logError(error);
  }
}
