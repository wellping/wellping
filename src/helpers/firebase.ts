import * as firebase from "firebase/app";

import { User } from "./asyncStorage/user";

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
