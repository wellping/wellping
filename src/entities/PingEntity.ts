import { BaseEntity, Entity, PrimaryColumn, Column, OneToMany } from "typeorm";

import { StreamName } from "../helpers/types";
import AnswerEntity from "./AnswerEntity";

@Entity()
export default class PingEntity extends BaseEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  notificationTime: Date;

  @Column()
  startTime: Date;

  @Column({ nullable: true })
  endTime: Date | null;

  @Column()
  tzOffset: number;

  @Column({ type: "varchar" })
  streamName: StreamName;

  // https://github.com/typeorm/typeorm/issues/4190
  @OneToMany("AnswerEntity", "ping")
  answers: AnswerEntity[];
}
