import { HOME_SCREEN_DEBUG_VIEW_SYMBOLS } from "./debug";
import { StudyInfo, FirebaseServerConfig, BeiweServerConfig } from "./types";

export type ServerType = "firebase" | "beiwe";

// If the server returns `new_pings_count` and/or `new_answers_count`
// then we could check them locally to see if the data is consistent.
export type DataUploadServerResponse = {
  new_pings_count?: number;
  new_answers_count?: number;
  saved_to?: string;
};

/**
 * If Firebase is used as the backend server.
 */
export function isUsingFirebase(studyInfo: StudyInfo): boolean {
  return studyInfo.server.firebase !== undefined;
}

/**
 * Returns the server config for Firebase.
 *
 * Throws an error if Firebase is not the server type used.
 */
export function getFirebaseServerConfig(
  studyInfo: StudyInfo,
): FirebaseServerConfig {
  if (!isUsingFirebase(studyInfo)) {
    throw new Error("getFirebaseServerConfig: Firebase is not used.");
  }
  return studyInfo.server.firebase!;
}

/**
 * If Beiwe is used as the backend server.
 */
export function isUsingBeiwe(studyInfo: StudyInfo): boolean {
  return studyInfo.server.beiwe !== undefined;
}

/**
 * Returns the server config for Beiwe.
 *
 * Throws an error if Beiwe is not the server type used.
 */
export function getBeiweServerConfig(studyInfo: StudyInfo): BeiweServerConfig {
  if (!isUsingBeiwe(studyInfo)) {
    throw new Error("getBeiweServerConfig: Beiwe is not used.");
  }
  return studyInfo.server.beiwe!;
}

/**
 * If a server (no matter if it's Firebase or Beiwe) is used.
 *
 * See `MARK: NO_SERVER_NOTE`.
 */
export function isUsingServer(studyInfo: StudyInfo): boolean {
  return Object.keys(studyInfo.server).length > 0;
}

/**
 * Returns the type(s) of server used.
 */
export function getServerTypeUsed(studyInfo: StudyInfo): ServerType[] {
  const serverTypes: ServerType[] = [];
  if (isUsingServer(studyInfo)) {
    if (isUsingFirebase(studyInfo)) {
      serverTypes.push("firebase");
    }
    if (isUsingBeiwe(studyInfo)) {
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
  if (serverTypes.length === 0) {
    return HOME_SCREEN_DEBUG_VIEW_SYMBOLS.SERVER_USED.NO_SERVER;
  }
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
