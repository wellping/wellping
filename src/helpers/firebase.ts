import * as firebase from "firebase/app";

import { UploadData } from "./apiManager";
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
  data: UploadData,
  startUploading: () => void,
  // `errorSymbol` will be shown alongside the JS version at the top of the screen.
  endUploading: (symbol: string, isError: boolean) => void,
) {
  startUploading();

  const user = firebase.auth().currentUser;
  if (user === null) {
    // Stops if the user is not logged in to Firebase as they won't have
    // permission to upload.
    endUploading("DB: U=N", true);
    return;
  }

  try {
    // We need to store plain object in Firebase.
    const dataPlain = JSON.parse(JSON.stringify(data));
    await firebase.database().ref(`users/${user.uid}`).set(dataPlain);
    endUploading(
      HOME_SCREEN_DEBUG_VIEW_SYMBOLS.FIREBASE_DATABASE.END_SUCCESS,
      false,
    );
  } catch (e) {
    const error = e as firebase.FirebaseError;
    endUploading(`DB: ${error.code}`, true);
  }
}
