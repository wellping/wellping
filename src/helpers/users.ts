import * as firebase from "firebase/app";

import { clearCurrentStudyFileAsync } from "./asyncStorage/studyFile";
import { storeUserAsync, User, clearUserAsync } from "./asyncStorage/user";
import {
  firebaseLoginAsync,
  firebaseLogoutAsync,
  firebaseInitialized,
} from "./firebase";
import { StudyInfo } from "./types";

export async function loginAsync(user: User, studyInfo: StudyInfo) {
  await firebaseLoginAsync(studyInfo, user);
  await storeUserAsync(user);
}

export async function logoutAsync() {
  await clearUserAsync();
  await clearCurrentStudyFileAsync();

  if (firebaseInitialized()) {
    await firebaseLogoutAsync();
    await firebase.app().delete();
  }
}
