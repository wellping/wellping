import { BaseEntity, Entity, PrimaryColumn, Column, ManyToOne } from "typeorm";

import { QuestionType } from "../helpers/helpers";
import { QuestionId } from "../helpers/types";
import PingEntity from "./PingEntity";

@Entity()
export default class AnswerEntity extends BaseEntity {
  @PrimaryColumn()
  @ManyToOne((type) => PingEntity, (ping) => ping.id)
  pingId: string;

  @PrimaryColumn({ type: "varchar" })
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
