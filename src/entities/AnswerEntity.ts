import { BaseEntity, Entity, JoinColumn, Column, ManyToOne } from "typeorm";

import { QuestionType } from "../helpers/helpers";
import { QuestionId } from "../helpers/types";
import PingEntity from "./PingEntity";

@Entity()
export default class AnswerEntity extends BaseEntity {
  // TODO: https://github.com/typeorm/typeorm/issues/6233 not working right now
  @ManyToOne((type) => PingEntity, (ping) => ping.answers, { primary: true })
  ping: PingEntity;

  @Column({ type: "varchar", primary: true })
  questionId: QuestionId;

  @Column({ type: "varchar" })
  questionType: QuestionType;

  @Column()
  preferNotToAnswer: boolean;

  @Column()
  nextWithoutOption: boolean;

  @Column({ type: "simple-json" })
  data: {
    value?: any;
    [key: string]: any;
  };

  @Column()
  lastUpdateDate: Date;
}
