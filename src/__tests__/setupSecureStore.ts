// Refs when researching about how to mock - not necessarily related to the code
// below:
// https://stackoverflow.com/a/40957570/2603230
// https://stackoverflow.com/a/61052583/2603230
// https://stackoverflow.com/a/50080250/2603230
// https://stackoverflow.com/a/41469576/2603230

// Most code is structured from
// https://github.com/react-native-community/async-storage/blob/b1b5bcf9a1aa4c55590e731535c0af22bd2e71d6/jest/async-storage-mock.js

const mockSecureStore: any = {
  __INTERNAL_MOCK_STORAGE__: {} as { [key: string]: any },

  setItemAsync: jest.fn((key, value) => {
    //console.log(`expo-secure-store setItemAsync(${key}, ${value})`);
    return new Promise((resolve, reject) => {
      if (typeof key !== "string" || typeof value !== "string") {
        reject(new Error("key and value must be string"));
      } else {
        mockSecureStore.__INTERNAL_MOCK_STORAGE__[key] = value;
        resolve();
      }
    });
  }),
  getItemAsync: jest.fn((key) => {
    //console.log(`expo-secure-store getItemAsync(${key})`);
    return new Promise((resolve, reject) => {
      if (mockSecureStore.__INTERNAL_MOCK_STORAGE__.hasOwnProperty(key)) {
        resolve(mockSecureStore.__INTERNAL_MOCK_STORAGE__[key]);
      } else {
        resolve(null);
      }
    });
  }),
  deleteItemAsync: jest.fn((key) => {
    //console.log(`expo-secure-store deleteItemAsync(${key})`);
    return new Promise((resolve, reject) => {
      if (mockSecureStore.__INTERNAL_MOCK_STORAGE__.hasOwnProperty(key)) {
        resolve(delete mockSecureStore.__INTERNAL_MOCK_STORAGE__[key]);
      } else {
        reject(new Error("No such key!"));
      }
    });
  }),
};

jest.mock("expo-secure-store", () => mockSecureStore);
