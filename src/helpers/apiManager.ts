import Constants from "expo-constants";
import * as Crypto from "expo-crypto";
import * as Device from "expo-device";
import { Platform } from "react-native";

import { AnswerEntity } from "../entities/AnswerEntity";
import { PingEntity } from "../entities/PingEntity";
import { getAnswersAsync } from "./answers";
import { User, storeUserAsync, getUserAsync } from "./asyncStorage/user";
import { HOME_SCREEN_DEBUG_VIEW_SYMBOLS } from "./debug";
import { firebaseUploadDataForUserAsync } from "./firebase";
import { getPingsAsync } from "./pings";
import { getStudyInfoAsync, isLocalStudyFile } from "./studyFile";

export type UploadData = {
  username: string;
  pings: PingEntity[];
  answers: AnswerEntity[];
};

// If success, return `null`. Else return error message.
/*export async function registerUserAsync(user: User): Promise<string | null> {
  if (!user.username || !user.password) {
    return "You should enter both User ID and password.";
  }

  const request: { [key: string]: any } = {
    new_password: user.password, // Do not reset password
    phone_number: "1234567890",
    device_os: Device.osName,
    os_version: Device.osVersion,
    product: Device.modelName,
    brand: Device.brand,
    manufacturer: Device.manufacturer,
    model: Device.modelId,
    beiwe_version: "1.6.0",
  };

  try {
    let endpoint = "/register_user";
    if (Platform.OS === "ios") {
      endpoint += "/ios/";
    }
    await makePostRequestAsync(endpoint, request, {}, user);
  } catch (e) {
    return `Request error: ${e}.`;
  }

  await storeUserAsync(user);
  return null;
}*/

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
  //const user = (await getUserAsync())!;
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

  /*try {
    let endpoint = "/ssnl_upload";
    if (Platform.OS === "ios") {
      endpoint += "/ios/";
    }
    const response = await makePostRequestAsync(endpoint, {}, data, user);
    //console.warn(`YAYA ${JSON.stringify(response)}`);
    return { status: "success", response };
  } catch (e) {
    return { status: "error", error: `Request error: ${e}.` };
  }*/
}
