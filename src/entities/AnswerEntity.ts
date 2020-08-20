import {
  BaseEntity,
  Entity,
  ChildEntity,
  Column,
  ManyToOne,
  RelationId,
  TableInheritance,
} from "typeorm";

import {
  AnswerData,
  SliderAnswerData,
  ChoicesWithSingleAnswerAnswerData,
  ChoicesWithMultipleAnswersAnswerData,
  YesNoAnswerData,
  MultipleTextAnswerData,
  HowLongAgoAnswerData,
} from "../helpers/answerTypes";
import { QuestionType } from "../helpers/helpers";
import { QuestionId, QuestionTypeType } from "../helpers/types";
import { PingEntity } from "./PingEntity";

@Entity("answer")
@TableInheritance({
  column: { type: "simple-enum", name: "questionType", enum: QuestionType },
})
export abstract class AnswerEntity extends BaseEntity {
  // https://github.com/typeorm/typeorm/issues/4190
  // TODO: remove me once typeorm is updated to a newer version
  @ManyToOne("PingEntity", "answers", { primary: true })
  ping: PingEntity;

  @RelationId((answer: AnswerEntity) => answer.ping)
  pingId: number;

  @Column({ type: "varchar", primary: true })
  questionId: QuestionId;

  /**
   * MARK: WHY_PNA_TRUE_OR_NULL
   *
   * It should not be set to `false`. Instead, it should be either `null` or
   * `false`. This is because using `null` means this key will not be stored in
   * Firebase and hence saving the storage needed for each question.
   */
  @Column({ nullable: true })
  preferNotToAnswer: true | null;

  /**
   * If `null` (and `preferNotToAnswer` is not true), it means that the user
   * clicks "Next" without answering.
   */
  @Column({ type: "simple-json", nullable: true })
  data: AnswerData | null;

  /**
   * The last update date for the answer (i.e., the last time the user interact
   * with this question - usually when the user clicks "Next").
   */
  @Column()
  date: Date;

  // https://github.com/microsoft/TypeScript/issues/5863#issuecomment-169173943
  static async findAnswerInPingAsync<T extends AnswerEntity>(
    ping: PingEntity,
    questionId: QuestionId,
  ): Promise<T | null> {
    const answer = await this.findOne({
      ping: { id: ping.id },
      questionId,
    });
    if (answer == null) {
      return null;
    }
    return answer as T;
  }
}

@ChildEntity(QuestionType.Slider)
export class SliderAnswerEntity extends AnswerEntity {
  data: SliderAnswerData | null;
}

@ChildEntity(QuestionType.ChoicesWithSingleAnswer)
export class ChoicesWithSingleAnswerAnswerEntity extends AnswerEntity {
  data: ChoicesWithSingleAnswerAnswerData | null;
}

@ChildEntity(QuestionType.ChoicesWithMultipleAnswers)
export class ChoicesWithMultipleAnswersAnswerEntity extends AnswerEntity {
  data: ChoicesWithMultipleAnswersAnswerData | null;
}

@ChildEntity(QuestionType.YesNo)
export class YesNoAnswerEntity extends AnswerEntity {
  data: YesNoAnswerData | null;
}

@ChildEntity(QuestionType.MultipleText)
export class MultipleTextAnswerEntity extends AnswerEntity {
  data: MultipleTextAnswerData | null;
}

@ChildEntity(QuestionType.HowLongAgo)
export class HowLongAgoAnswerEntity extends AnswerEntity {
  data: HowLongAgoAnswerData | null;
}

export function getAnswerEntity(questionType: QuestionTypeType): AnswerEntity {
  switch (questionType) {
    case QuestionType.Slider:
      return new SliderAnswerEntity();
    case QuestionType.ChoicesWithSingleAnswer:
      return new ChoicesWithSingleAnswerAnswerEntity();
    case QuestionType.ChoicesWithMultipleAnswers:
      return new ChoicesWithMultipleAnswersAnswerEntity();
    case QuestionType.YesNo:
      return new YesNoAnswerEntity();
    case QuestionType.MultipleText:
      return new MultipleTextAnswerEntity();
    case QuestionType.HowLongAgo:
      return new HowLongAgoAnswerEntity();
    default:
      throw new Error(`Unsupported question type ${questionType}`);
  }
}
