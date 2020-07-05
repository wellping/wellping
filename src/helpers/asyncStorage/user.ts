import { AsyncStorage } from "react-native";

import { _DEBUG_CONFIGS } from "../../../config/debug";
import { logError } from "../debug";
import { getASKeyAsync } from "./asyncStorage";

export type User = {
  patientId: string;
  password: string;
};

const USER_KEY = `user`;

export async function storeUserAsync(user: User) {
  try {
    await AsyncStorage.setItem(
      await getASKeyAsync(USER_KEY),
      JSON.stringify(user),
    );
  } catch (error) {
    // Error saving data
    logError(error);
  }
}

export async function clearUserAsync() {
  try {
    await AsyncStorage.removeItem(await getASKeyAsync(USER_KEY));
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
    const value = await AsyncStorage.getItem(await getASKeyAsync(USER_KEY));
    if (value == null) {
      return null;
    }
    const user: User = JSON.parse(value);
    return user;
  } catch (error) {
    // Error retrieving data
    logError(error);
    return null;
  }
}
