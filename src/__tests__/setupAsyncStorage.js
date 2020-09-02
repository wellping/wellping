// https://react-native-community.github.io/async-storage/docs/advanced/jest

import mockAsyncStorage from "@react-native-community/async-storage/jest/async-storage-mock";

jest.mock("@react-native-community/async-storage", () => mockAsyncStorage);
