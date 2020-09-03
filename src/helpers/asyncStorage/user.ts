import AsyncStorage from "@react-native-community/async-storage";

import { _DEBUG_CONFIGS } from "../../../config/debug";
import { logAndThrowError } from "../debug";
import { getASKeyAsync } from "./asyncStorage";

export type User = {
  username: string;
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
    logAndThrowError(error);
  }
}

export async function clearUserAsync() {
  try {
    await AsyncStorage.removeItem(await getASKeyAsync(USER_KEY));
  } catch (error) {
    logAndThrowError(error);
  }
}

export async function getUserAsync(): Promise<User | null> {
  try {
    const value = await AsyncStorage.getItem(await getASKeyAsync(USER_KEY));
    if (value == null) {
      return null;
    }
    const user: User = JSON.parse(value);
    return user;
  } catch (error) {
    logAndThrowError(error);
  }
}
