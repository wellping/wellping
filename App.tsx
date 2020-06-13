import React from "react";
import { SafeAreaView, Platform, StatusBar } from "react-native";
import RootScreen from "./src/RootScreen";

export default function App() {
  return (
    <SafeAreaView style={{ paddingTop: Platform.OS === "android" ? 25 : 0 }}>
      <StatusBar barStyle="dark-content" />
      <RootScreen />
    </SafeAreaView>
  );
}
