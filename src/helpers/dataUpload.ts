import { AnswerEntity } from "../entities/AnswerEntity";
import { PingEntity } from "../entities/PingEntity";
import { getAnswersAsync } from "./answers";
import { getUserAsync } from "./asyncStorage/user";
import { HOME_SCREEN_DEBUG_VIEW_SYMBOLS } from "./debug";
import { firebaseUploadDataForUserAsync } from "./firebase";
import { getPingsAsync } from "./pings";

export type UploadData = {
  username: string;
  pings: PingEntity[];
  answers: AnswerEntity[];
};

export async function getAllDataAsync(): Promise<UploadData> {
  const user = await getUserAsync();
  const pings = await getPingsAsync();
  const answers = await getAnswersAsync();

  const data = {
    username: user!.username,
    pings,
    answers,
  };
  return data;
}

export async function uploadDataAsync(
  setFirebaseUploadStatusSymbol: (symbol: string) => void,
) {
  const data = await getAllDataAsync();

  await firebaseUploadDataForUserAsync(
    data,
    () => {
      setFirebaseUploadStatusSymbol(
        HOME_SCREEN_DEBUG_VIEW_SYMBOLS.FIREBASE_DATABASE.UPLOADING,
      );
    },
    (symbol, isError) => {
      setFirebaseUploadStatusSymbol(symbol);
      setTimeout(
        () => {
          setFirebaseUploadStatusSymbol(
            HOME_SCREEN_DEBUG_VIEW_SYMBOLS.FIREBASE_DATABASE.INITIAL,
          );
        },
        isError ? 10000 : 3000 /* reset symbol in 3 (of 10 if error) seconds */,
      );
    },
  );
}
