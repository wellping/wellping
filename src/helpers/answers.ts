import { AnswerEntity } from "../entities/AnswerEntity";

export async function getAnswersAsync(): Promise<AnswerEntity[]> {
  const answers = await AnswerEntity.createQueryBuilder()
    .orderBy("lastUpdateDate", "ASC")
    .getMany();
  return answers;
}
