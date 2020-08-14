import * as firebase from "firebase/app";

import { User } from "./asyncStorage/user";
import { HOME_SCREEN_DEBUG_VIEW_SYMBOLS } from "./debug";

const FIREBASE_LOGIN_EMAIL_DOMAIN = "@wellping.ssnl.stanford.edu";

export function validateAndInitializeFirebaseWithConfig(firebaseConfig: any) {
  if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
  }

  try {
    // Just running an arbitrary to check if the `firebaseConfig` is correct.
    firebase.auth();
  } catch (e) {
    const message = `**firebaseConfig is incorrect.**\n\n${e}`;
    throw new Error(message);
  }
}

export function firebaseInitialized(): boolean {
  try {
    firebase.app();
    return true;
  } catch (e) {
    return false;
  }
}

export async function firebaseLoginAsync(
  user: User,
): Promise<firebase.auth.UserCredential> {
  try {
    return await firebase
      .auth()
      .signInWithEmailAndPassword(
        user.username + FIREBASE_LOGIN_EMAIL_DOMAIN,
        user.password,
      );
  } catch (error) {
    throw new Error(`**Login error**\n\n${error}`);
  }
}

export async function firebaseLogoutAsync(): Promise<void> {
  try {
    await firebase.auth().signOut();
  } catch (error) {
    throw error;
  }
}

export async function firebaseUploadDataForUserAsync(
  data: any,
  startUploading: () => void,
  // `errorSymbol` will be shown alongside the JS version at the top of the screen.
  endUploading: (symbol: string) => void,
) {
  startUploading();

  const user = firebase.auth().currentUser;
  if (user === null) {
    // Only do it when the user is actually logged in to Firebase.
    // Else they won't have the permission to upload anyway.
    endUploading(
      HOME_SCREEN_DEBUG_VIEW_SYMBOLS.FIREBASE_DATABASE.END_ERROR_NOT_LOGGED_IN,
    );
    return;
  }

  try {
    await firebase.database().ref(`users/${user.uid}`).set(data);
    endUploading(HOME_SCREEN_DEBUG_VIEW_SYMBOLS.FIREBASE_DATABASE.END_SUCCESS);
  } catch (e) {
    // TODO:
    endUploading(
      HOME_SCREEN_DEBUG_VIEW_SYMBOLS.FIREBASE_DATABASE.END_ERROR_UNKNOWN,
    );
    throw e;
  }
}
