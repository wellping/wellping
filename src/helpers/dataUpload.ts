import { AnswerEntity } from "../entities/AnswerEntity";
import { PingEntity } from "../entities/PingEntity";
import { getAnswersAsync } from "./answers";
import { getUserAsync } from "./asyncStorage/user";
import {
  UserInstallationInfo,
  HOME_SCREEN_DEBUG_VIEW_SYMBOLS,
  USER_INSTALLATION_INFO,
} from "./debug";
import { firebaseUploadDataForUserAsync } from "./firebase";
import { getPingsAsync } from "./pings";
import { useFirebase, useServer, useBeiwe } from "./server";
import { StudyInfo } from "./types";

export type UploadData = {
  user: {
    username: string;
    installation: UserInstallationInfo;
  };
  pings: PingEntity[];
  answers: AnswerEntity[];
};

export async function getAllDataAsync(): Promise<UploadData> {
  const user = await getUserAsync();
  const pings = await getPingsAsync();
  const answers = await getAnswersAsync();

  if (user === null) {
    throw new Error("user === null in getAllDataAsync");
  }

  const data: UploadData = {
    user: {
      username: user.username,
      installation: USER_INSTALLATION_INFO,
    },
    pings,
    answers,
  };
  return data;
}

export async function uploadDataAsync(
  studyInfo: StudyInfo,
  setFirebaseUploadStatusSymbol: (symbol: string) => void,
): Promise<Error | null> {
  const data = await getAllDataAsync();

  const startUploading: () => void = () => {
    setFirebaseUploadStatusSymbol(
      HOME_SCREEN_DEBUG_VIEW_SYMBOLS.FIREBASE_DATABASE.UPLOADING,
    );
  };
  const endUploading: (symbol: string, isError: boolean) => void = (
    // `errorSymbol` will be shown alongside the JS version at the top of the
    // screen.
    symbol,
    isError,
  ) => {
    setFirebaseUploadStatusSymbol(symbol);
    setTimeout(
      () => {
        setFirebaseUploadStatusSymbol(
          HOME_SCREEN_DEBUG_VIEW_SYMBOLS.FIREBASE_DATABASE.INITIAL,
        );
      },
      isError ? 10000 : 3000 /* reset symbol in 3 (of 10 if error) seconds */,
    );
  };

  if (useServer(studyInfo)) {
    if (useFirebase(studyInfo)) {
      const error = await firebaseUploadDataForUserAsync(
        data,
        startUploading,
        endUploading,
      );
      if (error) {
        return error;
      }
    }
    if (useBeiwe(studyInfo)) {
      // TODO
      return new Error("TODO: NOT IMPLETEMENTED");
    }
  } else {
    startUploading();
    await new Promise((r) => setTimeout(r, 1000)); // Simulate loading.
    endUploading(`No Server Set`, true);
  }
  return null;
}
