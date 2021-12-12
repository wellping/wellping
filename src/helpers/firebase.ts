/**
 * Unless otherwise noted, precondition for every function in the file is:
 * `useFirebase(studyInfo) === true`.
 */

import firebase from "firebase/app";

import { UploadData } from "./dataUpload";
import { getLoginSessionID } from "./loginSession";
import { User } from "./secureStore/user";
import { DataUploadServerResponse, getFirebaseServerConfig } from "./server";
import { StudyInfo } from "./types";

/**
 * Firebase requires to use an email as the user's login name.
 * So we add a fictional email domain to the actual username.
 */
const FIREBASE_LOGIN_EMAIL_DOMAIN = "@user.wellpingssnl";
const getFirebaseLoginEmail = (username: string): string =>
  username + FIREBASE_LOGIN_EMAIL_DOMAIN;

export function validateAndInitializeFirebaseWithConfig(studyInfo: StudyInfo) {
  if (firebase.apps.length === 0) {
    firebase.initializeApp(getFirebaseServerConfig(studyInfo).config);
  }

  try {
    // Just running an arbitrary to check if the Firebase config is correct.
    firebase.auth();
  } catch (e) {
    const message = `**Firebase config object is incorrect.**\n\n${e}`;
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
    const userCredential = await firebase
      .auth()
      .signInWithEmailAndPassword(
        getFirebaseLoginEmail(user.username),
        user.password,
      );
    if (!userCredential.user?.emailVerified) {
      // If the email is not verified, we know that this is not a pre-imported
      // user (as all pre-imported users have a verified fictional email
      // address). And they should not use the app.
      // See `MARK: FIREBASE_AUTH_VERIFIED_FICTIONAL_EMAIL_NOTE`.
      throw new Error(":( Why are you doing this?");
    }
    return userCredential;
  } catch (error) {
    throw new Error(`**Login error**\n\n${error}`);
  }
}

/**
 * Special precondition: `firebaseInitialized() === true`. We don't need to
 * check for `useFirebase(studyInfo)` for this function.
 */
export async function firebaseLogoutAndDeleteAppAsync(): Promise<void> {
  try {
    if (firebase.auth().currentUser !== null) {
      await firebase.auth().signOut();
    }
    await firebase.app().delete();
  } catch (error) {
    throw error;
  }
}

// TODO: support upload unuploaded
/**
 * Returns a `DataUploadServerResponse` if successful.
 * Throws an error otherwise.
 */
export async function firebaseUploadDataForUserAsync(
  data: UploadData,
  localUser: User,
  startUploading: () => void,
  endUploading: (errorMessage?: string) => void,
): Promise<DataUploadServerResponse> {
  startUploading();

  const user = firebase.auth().currentUser;
  if (user === null) {
    // Stops if the user is not logged in to Firebase as they won't have
    // permission to upload.
    endUploading("FDB: U=N");
    throw new Error(
      "firebase.auth().currentUser === null in firebaseUploadDataForUserAsync",
    );
  }

  try {
    // We need to store plain object in Firebase.
    const dataPlain = JSON.parse(JSON.stringify(data));
    await firebase
      .database()
      // TODO: verify getLoginSessionID is working correctly here
      .ref(`users/${user.uid}/${getLoginSessionID(localUser)}`)
      .set(dataPlain);
    endUploading();
    // TODO: support new_pings_count` and `new_answers_count.
    return {};
  } catch (e) {
    const error = e as firebase.FirebaseError;
    endUploading(`FDB: ${error.code}`);
    throw error;
  }
}
