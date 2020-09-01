// Ref: https://github.com/Ed-ITSolutions/typeorm-encrypted-column/blob/d1634cb224f1520b744ba35370418ba1c372fbcc/src/interfaces.ts#L20
import { ColumnOptions, Column } from "typeorm";

export interface EncryptedColumnOptions extends ColumnOptions {
  encryptWithUsernamePassword?: true;
}

export const EncryptedColumn = (options: EncryptedColumnOptions) => {
  if (!options.type) {
    options.type = "varchar";
  }

  options.encryptWithUsernamePassword = true;

  return Column(options);
};
