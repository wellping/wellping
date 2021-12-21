import { StudyInfo } from "@wellping/study-schemas/lib/types";

import { getAnswersAsync } from "./answers";
import { removeFromUnuploadedPingsListAsync } from "./asyncStorage/unuploadedPingsList";
import { beiweUploadDataForUserAsync } from "./beiwe";
import {
  UserData,
  UploadData,
  AllData,
  UnuploadedData,
} from "./dataUploadType";
import {
  HOME_SCREEN_DEBUG_VIEW_SYMBOLS,
  getUserInstallationInfoAsync,
} from "./debug";
import { firebaseUploadDataForUserAsync } from "./firebase";
import { getLoginSessionIDAsync } from "./loginSession";
import { getPingsAsync } from "./pings";
import { secureGetUserAsync } from "./secureStore/user";
import {
  isUsingFirebase,
  isUsingServer,
  isUsingBeiwe,
  DataUploadServerResponse,
} from "./server";

async function _getUserDataAsync(): Promise<UserData> {
  const user = await secureGetUserAsync();
  if (user === null) {
    throw new Error("user === null in getAllDataAsync");
  }
  return {
    username: user.username,
    loginSessionId: await getLoginSessionIDAsync(user),
    installation: await getUserInstallationInfoAsync(),
  };
}

export async function getAllDataAsync(): Promise<AllData> {
  const user = await _getUserDataAsync();
  const pings = await getPingsAsync();
  const answers = await getAnswersAsync();

  const data: AllData = {
    user,
    pings,
    answers,
  };
  return data;
}

export async function getUnuploadedDataAsync(): Promise<UnuploadedData> {
  const user = await _getUserDataAsync();
  const unuploadedPings = await getPingsAsync({ unuploadedOnly: true });
  const unuploadedAnswers = await getAnswersAsync({ unuploadedOnly: true });

  const data: UnuploadedData = {
    user,
    unuploadedPings,
    unuploadedAnswers,
  };
  return data;
}

/**
 * Returns a `DataUploadServerResponse` if successful.
 * Throws an error otherwise.
 */
export async function uploadDataAsync(
  studyInfo: StudyInfo,
  setUploadStatusSymbol: (symbol: string) => void,
  {
    unuploadedOnly,
    prefetchedData,
  }: {
    unuploadedOnly: boolean;

    // If we have already gotten the data, we would just use that.
    prefetchedData?: UploadData;
  },
): Promise<DataUploadServerResponse> {
  let data: UploadData;
  if (prefetchedData) {
    data = prefetchedData;
  } else if (unuploadedOnly) {
    data = await getUnuploadedDataAsync();
  } else {
    data = await getAllDataAsync();
  }

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

  const user = await secureGetUserAsync();
  if (user === null) {
    endUploading("User===Null");
    throw new Error("secureGetUserAsync() === null in uploadDataAsync");
  }

  let response: DataUploadServerResponse = {};
  if (isUsingServer(studyInfo)) {
    if (isUsingFirebase(studyInfo)) {
      response = await firebaseUploadDataForUserAsync(
        data,
        user,
        startUploading,
        endUploading,
      );
    }
    if (isUsingBeiwe(studyInfo)) {
      response = await beiweUploadDataForUserAsync(
        data,
        user,
        startUploading,
        endUploading,
      );
    }
  } else {
    startUploading();
    await new Promise((r) => setTimeout(r, 1000)); // Simulate loading.
    endUploading(`No Server Set`);
    response = {};
  }

  // Sucessfully uploaded.
  console.log(`${JSON.stringify(response)}`);

  if (!unuploadedOnly && "pings" in data) {
    // If we have uploaded all the data, we can remove the uploaded pings from
    // the unuploaded pings list.
    const uploadedData = data as AllData;
    const uploadedPingsList = uploadedData.pings.map((ping) => ping.id);
    await removeFromUnuploadedPingsListAsync(uploadedPingsList);
  }

  return response;
}
