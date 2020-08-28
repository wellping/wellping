/**
 * This is a separate file because we want to avoid circular dependency between
 * `studyFile.ts` and `firebase.ts`.
 */
import * as firebase from "firebase/app";

import { getFirebaseServerConfig } from "./server";
import { StudyInfo } from "./types";

/**
 * Precondition: useFirebase() === true
 */
export function validateAndInitializeFirebaseWithConfig(studyInfo: StudyInfo) {
  if (firebase.apps.length === 0) {
    firebase.initializeApp(getFirebaseServerConfig(studyInfo));
  }

  try {
    // Just running an arbitrary to check if the `firebaseConfig` is correct.
    firebase.auth();
  } catch (e) {
    const message = `**firebaseConfig is incorrect.**\n\n${e}`;
    throw new Error(message);
  }
}
