import * as FileSystem from "expo-file-system";
import { Share } from "react-native";
import { createConnection, Connection } from "typeorm";

import AnswerEntity, {
  SliderAnswerEntity,
  ChoicesWithSingleAnswerAnswerEntity,
  ChoicesWithMultipleAnswersAnswerEntity,
  YesNoAnswerEntity,
  MultipleTextAnswerEntity,
  HowLongAgoAnswerEntity,
} from "../entities/AnswerEntity";
import PingEntity from "../entities/PingEntity";

const getDatabaseFilename = (databaseName: string) => `${databaseName}.db`;

export async function connectDatabaseAsync(
  databaseName: string,
): Promise<Connection> {
  return await createConnection({
    type: "expo",
    driver: require("expo-sqlite"),
    database: getDatabaseFilename(databaseName),
    entities: [
      AnswerEntity,
      SliderAnswerEntity,
      ChoicesWithSingleAnswerAnswerEntity,
      ChoicesWithMultipleAnswersAnswerEntity,
      YesNoAnswerEntity,
      MultipleTextAnswerEntity,
      HowLongAgoAnswerEntity,
      PingEntity,
    ],
    synchronize: true,
    logging: true,
  });
}

export function getDatabaseFileUrl(databaseName: string): string {
  // https://forums.expo.io/t/how-to-upload-sqlite-db-dump/2315/3
  return `${FileSystem.documentDirectory}/SQLite/${getDatabaseFilename(
    databaseName,
  )}`;
}

export async function shareDatabaseFileAsync(databaseName: string) {
  // https://forums.expo.io/t/how-to-upload-sqlite-db-dump/2315/3
  Share.share({
    url: getDatabaseFileUrl(databaseName),
  });
}

export async function deleteDatabaseFileAsync(databaseName: string) {
  await FileSystem.deleteAsync(getDatabaseFileUrl(databaseName));
}
