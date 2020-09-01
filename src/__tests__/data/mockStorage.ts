export function mockAsyncStorage(mockStorageRef: { [key: string]: any }) {
  jest.mock("react-native/Libraries/Storage/AsyncStorage", () => ({
    setItem: jest.fn((item, value) => {
      return new Promise((resolve, reject) => {
        mockStorageRef[item] = value;
        resolve(value);
      });
    }),
    multiSet: jest.fn((item, value) => {
      return new Promise((resolve, reject) => {
        mockStorageRef[item] = value;
        resolve(value);
      });
    }),
    getItem: jest.fn((item, value) => {
      return new Promise((resolve, reject) => {
        resolve(mockStorageRef[item]);
      });
    }),
    multiGet: jest.fn((item) => {
      return new Promise((resolve, reject) => {
        resolve(mockStorageRef[item]);
      });
    }),
    removeItem: jest.fn((item) => {
      return new Promise((resolve, reject) => {
        resolve(delete mockStorageRef[item]);
      });
    }),
    getAllKeys: jest.fn((items) => {
      return new Promise((resolve) => {
        resolve(items.keys());
      });
    }),
  }));
}

export function mockSecureStore(mockSecureItems: { [key: string]: any }) {
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
}

// https://stackoverflow.com/a/40957570/2603230
/*export class MockAsyncStorage {
  storageCache: { [key: string]: any };

  constructor(cache = {}) {
    this.storageCache = cache;
  }

  setItem = jest.fn((key, value) => {
    console.warn("yepp");

    return new Promise((resolve, reject) => {
      return typeof key !== "string" || typeof value !== "string"
        ? reject(new Error("key and value must be string"))
        : resolve((this.storageCache[key] = value));
    });
  });

  getItem = jest.fn((key) => {
    return new Promise((resolve) => {
      return this.storageCache.hasOwnProperty(key)
        ? resolve(this.storageCache[key])
        : resolve(null);
    });
  });

  removeItem = jest.fn((key) => {
    return new Promise((resolve, reject) => {
      return this.storageCache.hasOwnProperty(key)
        ? resolve(delete this.storageCache[key])
        : reject(new Error("No such key!"));
    });
  });

  clear = jest.fn((key) => {
    return new Promise((resolve, reject) => resolve((this.storageCache = {})));
  });

  getAllKeys = jest.fn((key) => {
    return new Promise((resolve, reject) =>
      resolve(Object.keys(this.storageCache)),
    );
  });
}

export class MockSecureStore {
  storageCache: { [key: string]: any };

  constructor(cache = {}) {
    this.storageCache = cache;
  }

  setItemAsync = jest.fn((key, value) => {
    console.warn("gogogogo");
    return new Promise((resolve, reject) => {
      return typeof key !== "string" || typeof value !== "string"
        ? reject(new Error("key and value must be string"))
        : resolve((this.storageCache[key] = value));
    });
  });

  getItemAsync = jest.fn((key) => {
    return new Promise((resolve) => {
      return this.storageCache.hasOwnProperty(key)
        ? resolve(this.storageCache[key])
        : resolve(null);
    });
  });

  deleteItemAsync = jest.fn((key) => {
    return new Promise((resolve, reject) => {
      return this.storageCache.hasOwnProperty(key)
        ? resolve(delete this.storageCache[key])
        : reject(new Error("No such key!"));
    });
  });
}

export function mockSecureStore(storage: { [key: string]: any }) {
  return () => ({
    setItemAsync: jest.fn((key, value) => {
      console.log(`expo-secure-store setItemAsync(${key}, ${value})`);
      return new Promise((resolve, reject) => {
        return typeof key !== "string" || typeof value !== "string"
          ? reject(new Error("key and value must be string"))
          : resolve((storage[key] = value));
      });
    }),
    getItemAsync: jest.fn((key) => {
      console.log(`expo-secure-store getItemAsync(${key})`);
      return new Promise((resolve, reject) => {
        return storage.hasOwnProperty(key)
          ? resolve(storage[key])
          : resolve(null);
      });
    }),
    deleteItemAsync: jest.fn((key) => {
      console.log(`expo-secure-store deleteItemAsync(${key})`);
      return new Promise((resolve, reject) => {
        return storage.hasOwnProperty(key)
          ? resolve(delete storage[key])
          : reject(new Error("No such key!"));
      });
    }),
  });
}
*/
