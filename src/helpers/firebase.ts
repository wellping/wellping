import * as firebase from "firebase/app";

import {
  alertWithShareButtonContainingDebugInfo,
  getCriticalProblemTextForUser,
} from "./debug";
import { StudyInfo } from "./types";

export function initializeFirebase(studyInfo: StudyInfo) {
  if (firebase.apps.length === 0) {
    firebase.initializeApp(studyInfo.firebaseConfig);
  }

  try {
    // Just running an arbitrary to check if the `firebaseConfig` is correct.
    firebase.auth();
  } catch (e) {
    const message = `firebaseConfig is incorrect.\n\n${e}`;
    alertWithShareButtonContainingDebugInfo(
      getCriticalProblemTextForUser(message),
    );
    throw new Error(message);
  }
}
