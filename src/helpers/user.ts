import { AsyncStorage } from "react-native";

import { _DEBUG_CONFIGS, logError } from "../../config/debug";
import { ASYNC_STORAGE_PREFIX } from "./asyncStorage";

export type User = {
  patientId: string;
  password: string;
};

const USER_KEY = `${ASYNC_STORAGE_PREFIX}user`;

export async function storeUserAsync(user: User) {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    // Error saving data
    logError(error);
  }
}

export async function clearUserAsync() {
  try {
    await AsyncStorage.removeItem(USER_KEY);
  } catch (error) {
    // Error saving data
    logError(error);
  }
}

export async function getUserAsync(): Promise<User | null> {
  // DEBUG
  if (__DEV__ && _DEBUG_CONFIGS().ignoreLogin) {
    return {
      patientId: "_DEBUGGING_USERNAME_",
      password: "_DEBUGGING_PASSWORD_",
    };
  }

  try {
    const value = await AsyncStorage.getItem(USER_KEY);
    if (value == null) {
      return null;
    }
    const user: User = JSON.parse(value);
    return user;
  } catch (error) {
    // Error retrieving data
    logError(error);
  }
}
