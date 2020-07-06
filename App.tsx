import React from "react";
import { SafeAreaView, Platform, StatusBar } from "react-native";

import RootScreen from "./src/RootScreen";

// TODO: USE https://github.com/carloscuesta/react-native-error-boundary
// once https://github.com/expo/expo/issues/6598 is solved.

export default function App() {
  return (
    <SafeAreaView style={{ paddingTop: Platform.OS === "android" ? 25 : 0 }}>
      <StatusBar barStyle="dark-content" />
      <RootScreen />
    </SafeAreaView>
  );
}
