import Constants from "expo-constants";
import { Share, Alert } from "react-native";

// Notice that this version number is different from the app version number
// which is the number submitted App Store and Google Store.
// This is the JS version number which can be updated OTA.
// Format: js.[year - 2019].month.day.[the number of version on that day].
// We use "js." prefix instead of "v." prefix so that it will be not confused
// with the native version name.
export const JS_VERSION_NUMBER = "js.1.8.9.1";
export const NATIVE_VERSION_NUMBER = Constants.nativeAppVersion;
export const NATIVE_BUILD_NUMBER = Constants.nativeBuildVersion;

export const HOME_SCREEN_DEBUG_VIEW_SYMBOLS = {
  FIREBASE_AUTH: {
    LOGGED_IN: "",
    NOT_LOGGED_IN: "*",
  },
  FIREBASE_DATABASE: {
    INITIAL: "",
    UPLOADING: "~",
    END_SUCCESS: "v",
    END_ERROR_NOT_LOGGED_IN: "",
    END_ERROR_NO_PERMISSION: "!",
    END_ERROR_NO_INTERNET: "@",
    END_ERROR_UNKNOWN: "?",
  },
};

export function logError(error: any) {
  console.error(error);
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
) {
  Alert.alert(title, text, [
    {
      text: "Close",
      style: "cancel",
    },
    {
      text: "Share Data with Research Staff",
      style: "default",
      onPress: () => {
        shareDebugText(text);
      },
    },
  ]);
}

export function getUsefulDebugInfo(): string {
  return `JS Version: ${JS_VERSION_NUMBER}
Native Version: ${NATIVE_VERSION_NUMBER}
Native Build Number: ${NATIVE_BUILD_NUMBER}
Platform Info: ${JSON.stringify(Constants.platform)}
Installation ID: ${Constants.installationId}
Expo Version: ${Constants.expoVersion}`;
}

export function shareDebugText(debugText: string) {
  Share.share({
    message:
      `Please enter any additional information here:\n\n\n\n` +
      `====\n${debugText}\n\n====\n${getUsefulDebugInfo()}`,
  });
}
