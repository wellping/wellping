import { setStatusBarStyle } from "expo-status-bar";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import RootScreen from "./src/RootScreen";

// TODO: USE https://github.com/carloscuesta/react-native-error-boundary
// once https://github.com/expo/expo/issues/6598 is solved.

export default function App() {
  React.useEffect(() => {
    setStatusBarStyle("dark");
  }, []);

  return (
    <SafeAreaView>
      <RootScreen />
    </SafeAreaView>
  );
}
