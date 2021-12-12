/**
 * Unless otherwise noted, precondition for every function in the file is:
 * `useFirebase(studyInfo) === true`.
 */

import {
  initializeApp as firebaseInitializeApp,
  getApp as firebaseGetApp,
  deleteApp as firebaseDeleteApp,
  FirebaseApp,
  FirebaseError,
} from "firebase/app";
import {
  getAuth as firebaseGetAuth,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  signOut as firebaseSignOut,
  Auth as FirebaseAuth,
  UserCredential as FirebaseUserCredential,
} from "firebase/auth";
import {
  getDatabase as firebaseGetDatabase,
  ref as firebaseRef,
  set as firebaseSet,
  Database as FirebaseDatabase,
} from "firebase/database";

import { UploadData } from "./dataUpload";
import { getLoginSessionIDAsync } from "./loginSession";
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

export function getFirebaseApp(): FirebaseApp {
  try {
    return firebaseGetApp();
  } catch (e) {
    throw new Error(`firebaseApp not initialized!`);
  }
}
async function deleteFirebaseAppAsync(): Promise<void> {
  await firebaseDeleteApp(getFirebaseApp());
}

export function getFirebaseAuth(): FirebaseAuth {
  return firebaseGetAuth(getFirebaseApp());
}

export function getFirebaseDatabase(): FirebaseDatabase {
  return firebaseGetDatabase();
}

export function validateAndInitializeFirebaseWithConfig(studyInfo: StudyInfo) {
  if (!firebaseInitialized()) {
    firebaseInitializeApp(getFirebaseServerConfig(studyInfo).config);
  }

  try {
    // Just running an arbitrary to check if the Firebase config is correct.
    const _ = getFirebaseAuth();
  } catch (e) {
    const message = `**Firebase config object is incorrect.**\n\n${e}`;
    throw new Error(message);
  }
}

export function firebaseInitialized(): boolean {
  try {
    firebaseGetApp();
    return true;
  } catch (e) {
    return false;
  }
}

export async function firebaseLoginAsync(
  user: User,
): Promise<FirebaseUserCredential> {
  try {
    const auth = getFirebaseAuth();
    const userCredential = await firebaseSignInWithEmailAndPassword(
      auth,
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
    const auth = getFirebaseAuth();
    if (auth.currentUser !== null) {
      await firebaseSignOut(auth);
    }
    await deleteFirebaseAppAsync();
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

  const user = getFirebaseAuth().currentUser;
  if (user === null) {
    // Stops if the user is not logged in to Firebase as they won't have
    // permission to upload.
    endUploading("FDB: U=N");
    throw new Error(
      "getFirebaseAuth().currentUser === null in firebaseUploadDataForUserAsync",
    );
  }

  try {
    // We need to store plain object in Firebase.
    const dataPlain = JSON.parse(JSON.stringify(data));
    const database = getFirebaseDatabase();
    // TODO: verify getLoginSessionIDAsync is working correctly here
    firebaseSet(
      firebaseRef(
        database,
        `users/${user.uid}/${await getLoginSessionIDAsync(localUser)}`,
      ),
      dataPlain,
    );

    endUploading();
    // TODO: support new_pings_count` and `new_answers_count.
    return {};
  } catch (e) {
    const error = e as FirebaseError;
    endUploading(`FDB: ${error.code}`);
    throw error;
  }
}
