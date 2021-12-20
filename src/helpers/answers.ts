import { AnswerData, Answer } from "wellping-study-file/lib/answerTypes";
import { AnswerSchema } from "wellping-study-file/lib/schemas/Answer";
import { Question, Ping } from "wellping-study-file/lib/types";

import {
  getAnswersPingIdsQuestionIdsListAsync,
  clearAnswersPingIdsQuestionIdsListAsync,
} from "./asyncStorage/answersPingIdsQuestionIdsList";
import {
  secureGetAnswerAsync,
  secureStoreAnswerAsync,
  secureRemoveAnswerAsync,
} from "./secureStore/answer";

export async function getAnswersAsync({
  unuploadedOnly = false,
}: {
  unuploadedOnly?: boolean;
} = {}): Promise<Answer[]> {
  const answersList = await getAnswersPingIdsQuestionIdsListAsync({
    unuploadedOnly,
  });

  // https://stackoverflow.com/q/28066429/2603230
  const answers: Answer[] = await Promise.all(
    answersList.map(async (pingIdAndQuestionId) => {
      const answer = await secureGetAnswerAsync(
        pingIdAndQuestionId[0],
        pingIdAndQuestionId[1],
      );
      if (answer === null) {
        throw new Error(
          "answer === null in answersList.map in getAnswersAsync.",
        );
      }
      return answer;
    }),
  );

  return answers;
}

export async function insertAnswerAsync({
  ping,
  question,
  realQuestionId,
  preferNotToAnswer,
  data,
  date,
}: {
  ping: Ping;
  question: Question;
  realQuestionId: string;
  preferNotToAnswer: true | null; // See `MARK: WHY_PNA_TRUE_OR_NULL`.
  data: AnswerData | null;
  date: Date;
}): Promise<Answer> {
  const answer = AnswerSchema.parse({
    pingId: ping.id,
    questionId: realQuestionId,
    preferNotToAnswer,
    data,
    date,
  });

  await secureStoreAnswerAsync(answer);

  return answer;
}

export async function clearAllAnswersAsync() {
  const answersList = await getAnswersPingIdsQuestionIdsListAsync();
  await Promise.all(
    answersList.map(async (pingIdAndQuestionId) => {
      await secureRemoveAnswerAsync(
        pingIdAndQuestionId[0],
        pingIdAndQuestionId[1],
      );
    }),
  );
  await clearAnswersPingIdsQuestionIdsListAsync();
}
