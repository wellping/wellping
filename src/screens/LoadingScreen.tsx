import React from "react";
import { View, Text, Button } from "react-native";

import { JS_VERSION_NUMBER, shareDebugText } from "../helpers/debug";
import { styles } from "../helpers/styles";

const TEXT_COLOR = "#ededed";

const LoadingScreen: React.FunctionComponent = () => {
  return (
    <View style={{ marginHorizontal: 40 }}>
      <Text style={{ ...styles.onlyTextStyle, fontWeight: "bold" }}>
        Loading...
      </Text>
      <Text
        style={{
          textAlign: "center",
          marginTop: 50,
          color: TEXT_COLOR,
        }}
      >
        If you are stuck on this page for more than one minute, please click the
        button below and contact the research staff.
      </Text>
      <Button
        title="Share Error"
        color={TEXT_COLOR}
        onPress={() => {
          shareDebugText("Stuck on the loading page.");
        }}
      />
      <Text
        style={{
          textAlign: "center",
          marginHorizontal: 20,
          marginTop: 30,
          color: TEXT_COLOR,
        }}
      >
        If you want to reset the app, please delete and then re-install the app.
      </Text>
      <Text style={{ textAlign: "center", marginTop: 20, color: TEXT_COLOR }}>
        {JS_VERSION_NUMBER}
      </Text>
    </View>
  );
};

export default LoadingScreen;
