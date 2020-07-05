import { Connection, createConnection } from "typeorm";

import { entities } from "../../helpers/database";

export const getTestDatabaseFilename = (filename: string) =>
  `./src/__tests__/data/db/${filename}.db`;

export async function connectTestDatabaseAsync(
  databaseFilename: string,
): Promise<Connection> {
  return await createConnection({
    type: "sqlite",
    database: databaseFilename,
    entities,
    synchronize: true,
    //logging: true,
  });
}
