import { StudyInfo } from "./types";
import { HOME_SCREEN_DEBUG_VIEW_SYMBOLS } from "./debug";

/**
 * If Firebase is used as the backend server.
 */
export function useFirebase(studyInfo: StudyInfo): boolean {
  return studyInfo.server.firebase !== undefined;
}

/**
 * If Beiwe is used as the backend server.
 */
export function useBeiwe(studyInfo: StudyInfo): boolean {
  return studyInfo.server.beiwe !== undefined;
}

/**
 * If a server (no matter if it's Firebase or Beiwe) is used.
 *
 * See `MARK: NO_SERVER_NOTE`.
 */
export function useServer(studyInfo: StudyInfo): boolean {
  return Object.keys(studyInfo.server).length > 0;
}

export type ServerType = "firebase" | "beiwe";

/**
 * Returns the type(s) of server used.
 */
export function getServerTypeUsed(studyInfo: StudyInfo): ServerType[] {
  const serverTypes: ServerType[] = [];
  if (useServer(studyInfo)) {
    if (useFirebase(studyInfo)) {
      serverTypes.push("firebase");
    }
    if (useBeiwe(studyInfo)) {
      serverTypes.push("beiwe");
    }
  }
  return serverTypes;
}

/**
 * Returns the symbols for type(s) of server used.
 */
export function getSymbolsForServerTypeUsed(studyInfo: StudyInfo): string {
  const serverTypes = getServerTypeUsed(studyInfo);
  return serverTypes
    .map((serverType) => {
      if (serverType === "firebase") {
        return HOME_SCREEN_DEBUG_VIEW_SYMBOLS.SERVER_USED.FIREBASE;
      } else if (serverType === "beiwe") {
        return HOME_SCREEN_DEBUG_VIEW_SYMBOLS.SERVER_USED.BEIWE;
      }
    })
    .join("");
}
