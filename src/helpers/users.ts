import { StudyInfo } from "@wellping/study-schemas/lib/types";

import { clearCurrentStudyFileAsync } from "./asyncStorage/studyFile";
import { clearTempStudyFileAsync } from "./asyncStorage/tempStudyFile";
import { beiweLoginAsync } from "./beiwe";
import { clearAllPingsAndAnswersAsync } from "./cleanup";
import {
  firebaseLoginAsync,
  firebaseLogoutAndDeleteAppAsync,
  firebaseInitialized,
} from "./firebase";
import {
  secureStoreUserAsync,
  secureClearUserAsync,
  User,
} from "./secureStore/user";
import { isUsingFirebase, isUsingBeiwe, isUsingServer } from "./server";
import { getStudyInfoAsync, studyFileExistsAsync } from "./studyFile";

/**
 * Throws an error if the login is unsuccessful.
 */
export async function loginAsync(user: User, studyInfo: StudyInfo) {
  if (isUsingServer(studyInfo)) {
    if (isUsingFirebase(studyInfo)) {
      await firebaseLoginAsync(user);
    }
    if (isUsingBeiwe(studyInfo)) {
      await beiweLoginAsync(user);
    }
  } else {
    await new Promise((r) => setTimeout(r, 3000)); // Simulate loading.
  }

  await secureStoreUserAsync(user);
}

export async function logoutAsync() {
  if (firebaseInitialized()) {
    await firebaseLogoutAndDeleteAppAsync();
  }

  if (await studyFileExistsAsync()) {
    await clearAllPingsAndAnswersAsync();
  }

  await clearTempStudyFileAsync();

  await secureClearUserAsync();
  await clearCurrentStudyFileAsync();
}
