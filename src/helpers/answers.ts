import { AnswerData, Answer } from "./answerTypes";
import { getAnswersListAsync } from "./asyncStorage/answersList";
import { AnswerSchema } from "./schemas/Answer";
import {
  secureGetAnswerAsync,
  secureStoreAnswerAsync,
} from "./secureStore/answer";
import { Question, Ping } from "./types";

export async function getAnswersAsync(): Promise<Answer[]> {
  const answersList = await getAnswersListAsync();
  const answers: Answer[] = [];

  for (const pingIdAndQuestionId of answersList) {
    answers.push(
      (await secureGetAnswerAsync(
        pingIdAndQuestionId[0],
        pingIdAndQuestionId[1],
      ))!,
    );
  }

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

  await secureStoreAnswerAsync(answer, true);

  return answer;
}
