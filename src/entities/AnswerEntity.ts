import { BaseEntity, Entity, Column, ManyToOne } from "typeorm";

import { QuestionType } from "../helpers/helpers";
import { QuestionId } from "../helpers/types";
import PingEntity from "./PingEntity";

@Entity()
export default class AnswerEntity extends BaseEntity {
  // https://github.com/typeorm/typeorm/issues/4190
  // TODO: remove me once typeorm is updated to a newer version
  @ManyToOne("PingEntity", "answers", { primary: true })
  ping: PingEntity;

  @Column({ type: "varchar", primary: true })
  questionId: QuestionId;

  @Column({ type: "simple-enum" })
  questionType: QuestionType;

  @Column()
  preferNotToAnswer: boolean;

  @Column()
  nextWithoutOption: boolean;

  @Column({ type: "simple-json", nullable: true })
  data: {
    value: any;
    [key: string]: any;
  } | null;

  @Column()
  lastUpdateDate: Date;
}
