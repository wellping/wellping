import React from "react";
import { View, Text, Button } from "react-native";

import { JS_VERSION_NUMBER, shareDebugText } from "../helpers/debug";
import { styles } from "../helpers/styles";

const LoadingScreen: React.FunctionComponent = () => {
  return (
    <View style={{ marginHorizontal: 20 }}>
      <Text style={{ ...styles.onlyTextStyle, fontWeight: "bold" }}>
        Loading...
      </Text>
      <Text
        style={{
          textAlign: "center",
          marginTop: 50,
          color: "lightgray",
        }}
      >
        If you are stuck on this page, please click the button below and contact
        the research staff.
      </Text>
      <Button
        title="Share Error"
        color="lightgray"
        onPress={() => {
          shareDebugText("Stuck on the loading page.");
        }}
      />
      <Text
        style={{
          textAlign: "center",
          marginHorizontal: 20,
          marginTop: 30,
          color: "lightgray",
        }}
      >
        If you want to reset the app, please delete and then re-install the app.
      </Text>
      <Text style={{ textAlign: "center", marginTop: 20, color: "lightgray" }}>
        {JS_VERSION_NUMBER}
      </Text>
    </View>
  );
};

export default LoadingScreen;
