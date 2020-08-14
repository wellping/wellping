import * as firebase from "firebase/app";

import { clearCurrentStudyFileAsync } from "./asyncStorage/studyFile";
import { storeUserAsync, User, clearUserAsync } from "./asyncStorage/user";
import {
  firebaseLoginAsync,
  firebaseLogoutAsync,
  firebaseInitialized,
} from "./firebase";

export async function loginAsync(user: User) {
  await firebaseLoginAsync(user);
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
