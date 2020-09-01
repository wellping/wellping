// Refs when researching about how to mock - not necessarily related to the code
// below:
// https://stackoverflow.com/a/40957570/2603230
// https://stackoverflow.com/a/61052583/2603230
// https://stackoverflow.com/a/50080250/2603230
// https://stackoverflow.com/a/41469576/2603230

const mockSecureItems: { [key: string]: any } = {};
jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn((key, value) => {
    //console.log(`expo-secure-store setItemAsync(${key}, ${value})`);
    return new Promise((resolve, reject) => {
      return typeof key !== "string" || typeof value !== "string"
        ? reject(new Error("key and value must be string"))
        : resolve((mockSecureItems[key] = value));
    });
  }),
  getItemAsync: jest.fn((key) => {
    //console.log(`expo-secure-store getItemAsync(${key})`);
    return new Promise((resolve, reject) => {
      return mockSecureItems.hasOwnProperty(key)
        ? resolve(mockSecureItems[key])
        : resolve(null);
    });
  }),
  deleteItemAsync: jest.fn((key) => {
    //console.log(`expo-secure-store deleteItemAsync(${key})`);
    return new Promise((resolve, reject) => {
      return mockSecureItems.hasOwnProperty(key)
        ? resolve(delete mockSecureItems[key])
        : reject(new Error("No such key!"));
    });
  }),
}));
