import * as firebase from "firebase/app";

import { clearCurrentStudyFileAsync } from "./asyncStorage/studyFile";
import { storeUserAsync, User, clearUserAsync } from "./asyncStorage/user";
import { backupDatabaseFileAsync } from "./database";
import {
  firebaseLoginAsync,
  firebaseLogoutAsync,
  firebaseInitialized,
} from "./firebase";
import { getStudyInfoAsync, studyFileExistsAsync } from "./studyFile";
import { StudyInfo } from "./types";

export async function loginAsync(user: User, studyInfo: StudyInfo) {
  await firebaseLoginAsync(studyInfo, user);
  await storeUserAsync(user);
}

export async function logoutAsync() {
  if (firebaseInitialized()) {
    await firebaseLogoutAsync();
    await firebase.app().delete();
  }

  if (await studyFileExistsAsync()) {
    const studyInfo = await getStudyInfoAsync();
    // Backup the database file.
    await backupDatabaseFileAsync(studyInfo.id);
  }

  await clearUserAsync();
  await clearCurrentStudyFileAsync();
}
