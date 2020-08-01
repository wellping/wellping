import { Share } from "react-native";

export const VERSION_NUMBER = "1.1.0";

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
  return `Version: ${VERSION_NUMBER}`;
}

export function shareDebugText(debugText: string) {
  Share.share({
    message: `${debugText}\n\n====\n${getUsefulDebugInfo()}`,
  });
}
