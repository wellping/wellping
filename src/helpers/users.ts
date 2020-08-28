import { clearCurrentStudyFileAsync } from "./asyncStorage/studyFile";
import { storeUserAsync, User, clearUserAsync } from "./asyncStorage/user";
import { beiweLoginAsync } from "./beiwe";
import { backupDatabaseFileAsync } from "./database";
import {
  firebaseLoginAsync,
  firebaseLogoutAndDeleteAppAsync,
  firebaseInitialized,
} from "./firebase";
import { useFirebase, useBeiwe, useServer } from "./server";
import { getStudyInfoAsync, studyFileExistsAsync } from "./studyFile";
import { StudyInfo } from "./types";

/**
 * Throws an error if the login is unsuccessful.
 */
export async function loginAsync(user: User, studyInfo: StudyInfo) {
  if (useServer(studyInfo)) {
    if (useFirebase(studyInfo)) {
      await firebaseLoginAsync(user);
    }
    if (useBeiwe(studyInfo)) {
      await beiweLoginAsync(user);
    }
  } else {
    await new Promise((r) => setTimeout(r, 3000)); // Simulate loading.
  }

  await storeUserAsync(user);
}

export async function logoutAsync() {
  if (firebaseInitialized()) {
    await firebaseLogoutAndDeleteAppAsync();
  }

  if (await studyFileExistsAsync()) {
    const studyInfo = await getStudyInfoAsync();

    // Backup the database file.
    await backupDatabaseFileAsync(studyInfo.id);
  }

  await clearUserAsync();
  await clearCurrentStudyFileAsync();
}
