import { Answer } from "./answerTypes";
import { getAnswersAsync } from "./answers";
import { beiweUploadDataForUserAsync } from "./beiwe";
import {
  UserInstallationInfo,
  HOME_SCREEN_DEBUG_VIEW_SYMBOLS,
  USER_INSTALLATION_INFO,
} from "./debug";
import { firebaseUploadDataForUserAsync } from "./firebase";
import { getPingsAsync } from "./pings";
import { secureGetUserAsync } from "./secureStore/user";
import { useFirebase, useServer, useBeiwe } from "./server";
import { StudyInfo, Ping } from "./types";

export type UploadData = {
  user: {
    username: string;
    installation: UserInstallationInfo;
  };
  pings: Ping[];
  answers: Answer[];
};

export async function getAllDataAsync(): Promise<UploadData> {
  const user = await secureGetUserAsync();
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
  setUploadStatusSymbol: (symbol: string) => void,
): Promise<Error | null> {
  const data = await getAllDataAsync();

  const startUploading = (): void => {
    setUploadStatusSymbol(HOME_SCREEN_DEBUG_VIEW_SYMBOLS.UPLOAD.UPLOADING);
  };
  const endUploading = (errorMessage?: string): void => {
    setUploadStatusSymbol(
      errorMessage || HOME_SCREEN_DEBUG_VIEW_SYMBOLS.UPLOAD.END_SUCCESS,
    );

    // Reset symbol in 3 seconds if no error, and 10 if there was error.
    setTimeout(
      () => {
        setUploadStatusSymbol(HOME_SCREEN_DEBUG_VIEW_SYMBOLS.UPLOAD.INITIAL);
      },
      errorMessage ? 10000 : 3000,
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
      const error = await beiweUploadDataForUserAsync(
        data,
        startUploading,
        endUploading,
      );
      if (error) {
        return error;
      }
    }
  } else {
    startUploading();
    await new Promise((r) => setTimeout(r, 1000)); // Simulate loading.
    endUploading(`No Server Set`);
  }
  return null;
}
