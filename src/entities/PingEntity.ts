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
  endTime?: Date;

  @Column()
  tzOffset: number;

  @Column({ type: "varchar" })
  streamName: StreamName;

  @OneToMany((type) => AnswerEntity, (answer) => answer.ping)
  answers: AnswerEntity[];
}
