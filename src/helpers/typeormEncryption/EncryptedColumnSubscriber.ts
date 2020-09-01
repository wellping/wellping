// Ref: https://github.com/Ed-ITSolutions/typeorm-encrypted-column/blob/d1634cb224f1520b744ba35370418ba1c372fbcc/src/subscriber.ts

import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  ObjectLiteral,
  UpdateEvent,
  getConnection,
  getMetadataArgsStorage,
} from "typeorm";

import { encryptStringAsync, decryptStringAsync } from "./stringEncryption";
import { AnswerEntity } from "../../entities/AnswerEntity";

@EventSubscriber()
export class EncryptedColumnSubscriber implements EntitySubscriberInterface {
  listenTo() {
    return AnswerEntity;
  }

  async beforeInsert(event: InsertEvent<ObjectLiteral>) {
    for (const entityKey of Object.keys(event.entity)) {
      if (entityKey !== "data") {
        continue;
      }
      event.entity[entityKey] = await encryptStringAsync(
        event.entity[entityKey],
      );
    }
  }

  async afterInsert(event: InsertEvent<ObjectLiteral>): Promise<any | void> {
    for (const entityKey of Object.keys(event.entity)) {
      if (entityKey !== "data") {
        continue;
      }
      event.entity[entityKey] = await decryptStringAsync(
        event.entity[entityKey],
      );
    }
  }

  /*beforeUpdate(event: UpdateEvent<ObjectLiteral>) {
    const updatedColumns = event.updatedColumns.map(
      ({ propertyName }) => propertyName,
    );
    encrypt(event.entity, updatedColumns);
  }

  afterUpdate(event: UpdateEvent<ObjectLiteral>) {
    const updatedColumns = event.updatedColumns.map(
      ({ propertyName }) => propertyName,
    );
    decrypt(event.entity, updatedColumns);
  }*/

  // https://github.com/typeorm/typeorm/issues/674
  async afterLoad(entity: ObjectLiteral) {
    for (const entityKey of Object.keys(entity)) {
      if (entityKey !== "data") {
        continue;
      }
      if (entity[entityKey] == null) {
        continue;
      }
      entity[entityKey] = await decryptStringAsync(entity[entityKey]);
      /*entity[entityKey] = getConnection().driver.prepareHydratedValue(
        entity[entityKey],
        getConnection()
          .getMetadata(PingEntity)
          .columns.find((column) => column.propertyName === entityKey)!,
      );*/
    }
  }
}
