import { StudyInfo } from "./types";

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
  return studyInfo.server.beiwe !== undefined;
}
