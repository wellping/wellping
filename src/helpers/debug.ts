import Constants from "expo-constants";
import * as Device from "expo-device";
import { Share, Alert, AlertButton } from "react-native";

// Notice that this version number is different from the app version number
// which is the number submitted App Store and Google Store.
// This is the JS version number which can be updated OTA.
// Format: js.[year - 2019].month.day.[the number of version on that day].
// We use "js." prefix instead of "v." prefix so that it will be not confused
// with the native version name.
export const JS_VERSION_NUMBER = "js.2.10.27.1";
export const NATIVE_VERSION_NUMBER = Constants.nativeAppVersion;
export const NATIVE_BUILD_NUMBER = Constants.nativeBuildVersion;
export const EXPO_VERSION = Constants.expoVersion;
export const INSTALLATION_ID = Constants.installationId;

export type UserInstallationInfo = {
  app: {
    installationId: typeof INSTALLATION_ID;
    jsVersion: typeof JS_VERSION_NUMBER;
    nativeVersion: typeof NATIVE_VERSION_NUMBER;
    nativeBuild: typeof NATIVE_BUILD_NUMBER;
    expoVersion: typeof EXPO_VERSION;
  };
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
};
export const USER_INSTALLATION_INFO: UserInstallationInfo = {
  app: {
    installationId: INSTALLATION_ID,
    jsVersion: JS_VERSION_NUMBER,
    nativeVersion: NATIVE_VERSION_NUMBER,
    nativeBuild: NATIVE_BUILD_NUMBER,
    expoVersion: EXPO_VERSION,
  },
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
};

export const HOME_SCREEN_DEBUG_VIEW_SYMBOLS = {
  SERVER_USED: {
    FIREBASE: "F",
    BEIWE: "B",
    NO_SERVER: "N!",
  },
  FIREBASE_AUTH: {
    LOGGED_IN: "",
    NOT_LOGGED_IN: "*",
  },
  UPLOAD: {
    INITIAL: "",
    UPLOADING: "~",
    END_SUCCESS: "v",
  },
};

export function logError(error: Error) {
  console.error(error);
}

// https://stackoverflow.com/a/49435648/2603230
export function logAndThrowError(error: Error): never {
  logError(error);
  throw error;
}

// Use this function for non-critical error so the user can inform the study staff.
export function getNonCriticalProblemTextForUser(problem: string) {
  return (
    `[INTERNAL ERROR (Please screenshot this page and send it to the study staff): ${problem}]` +
    `\n\n[However, you may continue to complete this survey as normal.]`
  );
}

export function getCriticalProblemTextForUser(problem: string) {
  return `[CRITICAL ERROR (Please screenshot this page and send it to the study staff as soon as possible): ${problem}]`;
}

export function alertWithShareButtonContainingDebugInfo(
  text: string,
  title: string = "Alert",
  moreButtons: AlertButton[] = [],
) {
  Alert.alert(title, text, [
    ...moreButtons,
    {
      text: "Share Data with Research Staff",
      onPress: () => {
        shareDebugText(text);
      },
    },
    {
      text: "Close",
      style: "cancel",
    },
  ]);
}

export function getUsefulDebugInfo(): string {
  return JSON.stringify(USER_INSTALLATION_INFO);
}

export function shareDebugText(debugText: string) {
  Share.share({
    message:
      `Please enter any additional information here:\n\n\n\n` +
      `====\n${debugText}\n\n====\n${getUsefulDebugInfo()}`,
  });
}
