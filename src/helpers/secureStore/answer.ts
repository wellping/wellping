import { Answer } from "@wellping/study-schemas/lib/answerTypes";
import { AnswerSchema } from "@wellping/study-schemas/lib/schemas/Answer";
import { PingId, QuestionId } from "@wellping/study-schemas/lib/types";
import { parseJSON } from "date-fns";
import * as SecureStore from "expo-secure-store";

import { addToAnswersQuestionIdsListForPingIfNeededAsync } from "../asyncStorage/answersPingIdsQuestionIdsList";
import { logAndThrowError } from "../debug";
import { getSSKeyAsync } from "./secureStore";

const ANSWER_PREFIX = `answer.`;
const getKey = (pingId: PingId, questionId: QuestionId) =>
  `${ANSWER_PREFIX}${pingId}.${questionId}`;

export async function secureStoreAnswerAsync(answer: Answer) {
  try {
    await SecureStore.setItemAsync(
      await getSSKeyAsync(getKey(answer.pingId, answer.questionId)),
      JSON.stringify(answer),
    );
    await addToAnswersQuestionIdsListForPingIfNeededAsync(answer);
  } catch (error) {
    logAndThrowError(error);
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
    logAndThrowError(error);
  }
}

export async function secureRemoveAnswerAsync(
  pingId: PingId,
  questionId: QuestionId,
) {
  try {
    if ((await secureGetAnswerAsync(pingId, questionId)) !== null) {
      await SecureStore.deleteItemAsync(
        await getSSKeyAsync(getKey(pingId, questionId)),
      );
    }
  } catch (error) {
    logAndThrowError(error);
  }
}
