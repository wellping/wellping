import AsyncStorage from "@react-native-async-storage/async-storage";
import { Answer } from "@wellping/study-file/lib/answerTypes";
import { PingId, QuestionId } from "@wellping/study-file/lib/types";

import { logAndThrowError } from "../debug";
import { getASKeyAsync } from "./asyncStorage";
import { getPingsListAsync, PingsList } from "./pingsList";
import { getUnuploadedPingsListAsync } from "./unuploadedPingsList";

export type AnswerPingIdQuestionId = [PingId, QuestionId];
export type AnswersPingIdsQuestionIdsList = AnswerPingIdQuestionId[];
export type AnswersQuestionIdsListForPing = QuestionId[];

const ANSWERS_LIST_PREFIX = `answersList/`;
const getKey = (pingId: PingId) => `${ANSWERS_LIST_PREFIX}/${pingId}`;

export async function addToAnswersQuestionIdsListForPingIfNeededAsync(
  answer: Answer,
) {
  try {
    const currentAnswersQuestionIdsListForPing =
      await getAnswersQuestionIdsListForPingAsync(answer.pingId);
    if (currentAnswersQuestionIdsListForPing.includes(answer.questionId)) {
      // Do not add it to the list if it is in the list already.
      return;
    }

    currentAnswersQuestionIdsListForPing.push(answer.questionId);
    await AsyncStorage.setItem(
      await getASKeyAsync(getKey(answer.pingId)),
      JSON.stringify(currentAnswersQuestionIdsListForPing),
    );
  } catch (error) {
    logAndThrowError(error);
  }
}

export async function clearAnswersQuestionIdsListForPingAsync(pingId: PingId) {
  try {
    await AsyncStorage.removeItem(await getASKeyAsync(getKey(pingId)));
  } catch (error) {
    logAndThrowError(error);
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
    logAndThrowError(error);
  }
}

export async function getAnswersPingIdsQuestionIdsListAsync({
  unuploadedOnly = false,
}: {
  unuploadedOnly?: boolean;
} = {}): Promise<AnswersPingIdsQuestionIdsList> {
  let pingsList: PingsList;
  if (unuploadedOnly) {
    pingsList = await getUnuploadedPingsListAsync();
  } else {
    pingsList = await getPingsListAsync();
  }

  // https://stackoverflow.com/q/28066429/2603230
  const answersQuestionIdsNested: AnswersPingIdsQuestionIdsList[] =
    await Promise.all(
      pingsList.map(async (pingId) => {
        const answersQuestionIdsForPing =
          await getAnswersQuestionIdsListForPingAsync(pingId);
        return answersQuestionIdsForPing.map<AnswerPingIdQuestionId>(
          (answerQuestionId) => [pingId, answerQuestionId],
        );
      }),
    );

  // As currently `answersQuestionIdsNested` stores e.g.
  // `[ [[pingId1, qId1], [pingId1, qId2]], [[pingId2, qId1], [pingId2, qId2]] ]`
  // , we have to flatten it.
  const answersQuestionIds = answersQuestionIdsNested.flat();
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
