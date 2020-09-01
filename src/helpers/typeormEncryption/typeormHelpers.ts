// Ref: https://github.com/Ed-ITSolutions/typeorm-encrypted-column/blob/d1634cb224f1520b744ba35370418ba1c372fbcc/src/events.ts#L1
import { getMetadataArgsStorage, ObjectLiteral } from "typeorm";

import { EncryptedColumnOptions } from "./EncryptedColumn";

/**
 * For all columns that have encryption options run the supplied function.
 *
 * @param entity The typeorm Entity.
 * @param cb Function to run for matching columns.
 * @param includeProperties filter encrypted properties by propertyName
 */
export const forMatchingColumns = (
  entity: ObjectLiteral,
  cb: (propertyName: string) => void,
  includeProperties: string[] = [],
) => {
  // Iterate through all columns in Typeorm
  let validColumns = getMetadataArgsStorage()
    .columns.filter(({ options, mode, target, propertyName }) => {
      const { encryptWithUsernamePassword } = options as EncryptedColumnOptions;

      return (
        entity[propertyName] &&
        mode === "regular" &&
        encryptWithUsernamePassword &&
        (encrypt.looseMatching || entity.constructor === target)
      );
    })
    // dedup
    .filter(
      (item, pos, self) =>
        self.findIndex((v) => v.propertyName === item.propertyName) === pos,
    );

  // encrypt only the requested properties (property changes on update)
  if (includeProperties.length > 0) {
    validColumns = validColumns.filter(({ propertyName }) =>
      includeProperties.includes(propertyName),
    );
  }

  validColumns.forEach(({ propertyName, options }) => {
    const { encrypt } = options as EncryptedColumnOptions;
    cb(propertyName, encrypt);
  });
};

const encrypt = <T extends ObjectLiteral>(
  entity: T,
  includeProperties: string[] = [],
): T => {
  if (!entity) return entity;

  forMatchingColumns(
    entity,
    (propertyName, options) => {
      // For any matching columns encrypt the property
      (entity as any)[propertyName as any] = encryptString(
        entity[propertyName],
        options,
      );
    },
    includeProperties,
  );

  return entity;
};
