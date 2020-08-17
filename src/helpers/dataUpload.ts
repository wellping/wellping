import Constants from "expo-constants";
import * as Device from "expo-device";

import { AnswerEntity } from "../entities/AnswerEntity";
import { PingEntity } from "../entities/PingEntity";
import { getAnswersAsync } from "./answers";
import { getUserAsync } from "./asyncStorage/user";
import {
  HOME_SCREEN_DEBUG_VIEW_SYMBOLS,
  JS_VERSION_NUMBER,
  NATIVE_VERSION_NUMBER,
  NATIVE_BUILD_NUMBER,
} from "./debug";
import { firebaseUploadDataForUserAsync } from "./firebase";
import { getPingsAsync } from "./pings";

export type UploadData = {
  user: {
    username: string;
    device: {
      brand: typeof Device.brand;
      manufacturer: typeof Device.manufacturer;
      modelName: typeof Device.modelName;
      modelId: typeof Device.modelId;
      designName: typeof Device.designName;
      productName: typeof Device.productName;
      osName: typeof Device.osName;
      osVersion: typeof Device.osVersion;
    };
    app: {
      jsVersion: typeof JS_VERSION_NUMBER;
      nativeVersion: typeof NATIVE_VERSION_NUMBER;
      nativeBuild: typeof NATIVE_BUILD_NUMBER;
      installationId: typeof Constants.installationId;
    };
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
      device: {
        brand: Device.brand,
        manufacturer: Device.manufacturer,
        modelName: Device.modelName,
        modelId: Device.modelId,
        designName: Device.designName,
        productName: Device.productName,
        osName: Device.osName,
        osVersion: Device.osVersion,
      },
      app: {
        jsVersion: JS_VERSION_NUMBER,
        nativeVersion: NATIVE_VERSION_NUMBER,
        nativeBuild: NATIVE_BUILD_NUMBER,
        installationId: Constants.installationId,
      },
    },
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
