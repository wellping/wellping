import { Share } from "react-native";

// Notice that this version number is different from the app version number
// which is the number submitted App Store and Google Store.
// This is the JS version number which can be updated OTA.
// Format: YYMMDD-[the number of version on that day].
export const JS_VERSION_NUMBER = "200802-1";

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

export function getUsefulDebugInfo(): string {
  return `Version: ${JS_VERSION_NUMBER}`;
}

export function shareDebugText(debugText: string) {
  Share.share({
    message: `${debugText}\n\n====\n${getUsefulDebugInfo()}`,
  });
}
