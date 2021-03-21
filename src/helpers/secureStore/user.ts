import * as SecureStore from "expo-secure-store";

import { _DEBUG_CONFIGS } from "../../../config/debug";
import { logAndThrowError } from "../debug";
import { getSSKeyAsync } from "./secureStore";

export type User = {
  username: string;
  password: string;
  /**
   * The date when the user first logged in. This will be used in conjuction
   * with the installation ID to unique determine a user's login session.
   *
   * We store `number` (from `.getTime()`) instead of `Date` because we don't
   * have to convert it back to `Date` when `secureGetUserAsync()`.
   */
  loginDate: number;
};

const USER_KEY = `user`;

export async function secureStoreUserAsync(user: User) {
  try {
    await SecureStore.setItemAsync(
      await getSSKeyAsync(USER_KEY),
      JSON.stringify(user),
    );
  } catch (error) {
    logAndThrowError(error);
  }
}

export async function secureClearUserAsync() {
  try {
    await SecureStore.deleteItemAsync(await getSSKeyAsync(USER_KEY));
  } catch (error) {
    logAndThrowError(error);
  }
}

export async function secureGetUserAsync(): Promise<User | null> {
  try {
    const value = await SecureStore.getItemAsync(await getSSKeyAsync(USER_KEY));
    if (value == null) {
      return null;
    }
    const user: User = JSON.parse(value);
    return user;
  } catch (error) {
    logAndThrowError(error);
  }
}
