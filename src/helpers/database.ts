import * as FileSystem from "expo-file-system";
import { Share } from "react-native";
import { createConnection, Connection, getConnection } from "typeorm";

import {
  AnswerEntity,
  SliderAnswerEntity,
  ChoicesWithSingleAnswerAnswerEntity,
  ChoicesWithMultipleAnswersAnswerEntity,
  YesNoAnswerEntity,
  MultipleTextAnswerEntity,
  HowLongAgoAnswerEntity,
} from "../entities/AnswerEntity";
import { PingEntity } from "../entities/PingEntity";
import { EncryptedColumnSubscriber } from "../helpers/typeormEncryption/EncryptedColumnSubscriber";
import {
  getCriticalProblemTextForUser,
  alertWithShareButtonContainingDebugInfo,
} from "./debug";

// TODO: remove me once typeorm is updated to a newer version (https://github.com/typeorm/typeorm/issues/6233)

const getDatabaseFilename = (databaseName: string) => `${databaseName}.db`;

export const entities = [
  AnswerEntity,
  SliderAnswerEntity,
  ChoicesWithSingleAnswerAnswerEntity,
  ChoicesWithMultipleAnswersAnswerEntity,
  YesNoAnswerEntity,
  MultipleTextAnswerEntity,
  HowLongAgoAnswerEntity,
  PingEntity,
];

export async function connectDatabaseAsync(
  databaseName: string,
): Promise<Connection> {
  try {
    return getConnection();
  } catch (e) {
    try {
      return await createConnection({
        type: "expo",
        driver: require("expo-sqlite"),
        database: getDatabaseFilename(databaseName),
        entities,
        subscribers: [EncryptedColumnSubscriber],
        synchronize: true,
        logging: __DEV__, // Only log in dev mode.
      });
    } catch (e) {
      alertWithShareButtonContainingDebugInfo(
        getCriticalProblemTextForUser(`connectDatabaseAsync: ${e}`),
      );
      throw e;
    }
  }
}

export function getDatabaseFolderUrl(): string {
  // https://forums.expo.io/t/how-to-upload-sqlite-db-dump/2315/3
  return `${FileSystem.documentDirectory}/SQLite/`;
}
export function getDatabaseFileUrl(databaseName: string): string {
  // https://forums.expo.io/t/how-to-upload-sqlite-db-dump/2315/3
  return `${getDatabaseFolderUrl()}${getDatabaseFilename(databaseName)}`;
}

export async function databaseFileExistsAsync(
  databaseName: string,
): Promise<boolean> {
  return (await FileSystem.getInfoAsync(getDatabaseFileUrl(databaseName)))
    .exists;
}

export async function shareDatabaseFileAsync(databaseName: string) {
  if (!(await databaseFileExistsAsync(databaseName))) {
    alert(`Database "${databaseName}" does not exists!`);
  }

  // https://forums.expo.io/t/how-to-upload-sqlite-db-dump/2315/3
  Share.share({
    url: getDatabaseFileUrl(databaseName),
  });
}

export async function deleteDatabaseFileAsync(databaseName: string) {
  if (!(await databaseFileExistsAsync(databaseName))) {
    return;
  }

  await FileSystem.deleteAsync(getDatabaseFileUrl(databaseName));
}

export async function backupDatabaseFileAsync(databaseName: string) {
  if (!(await databaseFileExistsAsync(databaseName))) {
    // Don't do anything if the database file does not exists.
    return;
  }

  await FileSystem.copyAsync({
    from: getDatabaseFileUrl(databaseName),
    to: getDatabaseFileUrl(`${databaseName}.${new Date().getTime()}.bk`),
  });
}

export async function getDatabaseFolderFilelistAsync() {
  return await FileSystem.readDirectoryAsync(getDatabaseFolderUrl());
}
