import { BaseEntity, Entity, PrimaryColumn, Column } from "typeorm";

import { StreamName } from "../helpers/types";

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
}
