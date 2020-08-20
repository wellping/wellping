import { AnswerEntity, getAnswerEntity } from "../entities/AnswerEntity";
import { PingEntity } from "../entities/PingEntity";
import { AnswerData } from "./answerTypes";
import { Question } from "./types";

export async function getAnswersAsync(): Promise<AnswerEntity[]> {
  const answers = await AnswerEntity.createQueryBuilder()
    .orderBy("date", "ASC")
    .getMany();
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
  ping: PingEntity;
  question: Question;
  realQuestionId: string;
  preferNotToAnswer: true | null; // See `MARK: WHY_PNA_TRUE_OR_NULL`.
  data: AnswerData | null;
  date: Date;
}): Promise<AnswerEntity> {
  const answer = getAnswerEntity(question.type);
  answer.ping = ping;
  answer.questionId = realQuestionId;
  answer.preferNotToAnswer = preferNotToAnswer;
  answer.data = data;
  answer.date = date;
  await answer.save();

  // Make sure state and database are consistent.
  await answer.reload();

  return answer;
}
