//import { AsyncStorage } from "react-native";

import { mockAsyncStorage, mockSecureStore } from "../data/mockStorage";
import { notificationsTest } from "./notifications.parttest";
import { pingsTest } from "./pings.parttest";

// https://stackoverflow.com/a/40957570/2603230
// https://stackoverflow.com/a/61052583/2603230
// https://stackoverflow.com/a/50080250/2603230
// https://stackoverflow.com/a/41469576/2603230

/*const MockedAsyncStorage = new MockAsyncStorage();
jest.setMock("react-native/Libraries/Storage/AsyncStorage", MockedAsyncStorage);

const MockedSecureStore = new MockSecureStore();
jest.setMock("expo-secure-store", MockedSecureStore);*/

/*const mockItems: { [key: string]: any } = {};

jest.mock("react-native/Libraries/Storage/AsyncStorage", () => ({
  setItem: jest.fn((item, value) => {
    return new Promise((resolve, reject) => {
      mockItems[item] = value;
      resolve(value);
    });
  }),
  multiSet: jest.fn((item, value) => {
    return new Promise((resolve, reject) => {
      mockItems[item] = value;
      resolve(value);
    });
  }),
  getItem: jest.fn((item, value) => {
    return new Promise((resolve, reject) => {
      resolve(mockItems[item]);
    });
  }),
  multiGet: jest.fn((item) => {
    return new Promise((resolve, reject) => {
      resolve(mockItems[item]);
    });
  }),
  removeItem: jest.fn((item) => {
    return new Promise((resolve, reject) => {
      resolve(delete mockItems[item]);
    });
  }),
  getAllKeys: jest.fn((items) => {
    return new Promise((resolve) => {
      resolve(items.keys());
    });
  }),
}));*/

const asyncStorageData: { [key: string]: any } = {};

const mockSecureItems: { [key: string]: any } = {};

beforeEach(() => {
  mockAsyncStorage(asyncStorageData);
  //mockSecureStore(mockSecureItems);
});

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn((key, value) => {
    console.log(`expo-secure-store setItemAsync(${key}, ${value})`);
    return new Promise((resolve, reject) => {
      return typeof key !== "string" || typeof value !== "string"
        ? reject(new Error("key and value must be string"))
        : resolve((mockSecureItems[key] = value));
    });
  }),
  getItemAsync: jest.fn((key) => {
    console.log(`expo-secure-store getItemAsync(${key})`);
    return new Promise((resolve, reject) => {
      return mockSecureItems.hasOwnProperty(key)
        ? resolve(mockSecureItems[key])
        : resolve(null);
    });
  }),
  deleteItemAsync: jest.fn((key) => {
    console.log(`expo-secure-store deleteItemAsync(${key})`);
    return new Promise((resolve, reject) => {
      return mockSecureItems.hasOwnProperty(key)
        ? resolve(delete mockSecureItems[key])
        : reject(new Error("No such key!"));
    });
  }),
}));

beforeAll(() => {
  //const yepHaha = new MockAsyncStorage();
  //jest.setMock("react-native/Libraries/Storage/AsyncStorage", yepHaha);
  //const newHaha = new MockSecureStore();
  //jest.setMock("expo-secure-store", newHaha);
});
// https://github.com/facebook/jest/issues/6194#issuecomment-419837314
describe("pings", pingsTest);

describe("notifications", notificationsTest);
