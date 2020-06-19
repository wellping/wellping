import { BaseEntity, Entity, JoinColumn, Column, ManyToOne } from "typeorm";

import { QuestionType } from "../helpers/helpers";
import { QuestionId } from "../helpers/types";
import PingEntity from "./PingEntity";

@Entity()
export default class AnswerEntity extends BaseEntity {
  @ManyToOne((type) => PingEntity, (ping) => ping.id, { primary: true })
  @JoinColumn()
  ping: PingEntity;

  @Column({ type: "varchar", primary: true })
  questionId: QuestionId;

  @Column({ type: "varchar" })
  type: QuestionType;

  @Column()
  preferNotToAnswer: boolean;

  @Column()
  nextWithoutOption: boolean;

  @Column("simple-json")
  data: {
    value?: any;
    [key: string]: any;
  };

  @Column()
  lastUpdateDate: Date;
}
