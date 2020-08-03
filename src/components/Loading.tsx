import React from "react";
import { View, Text, Button } from "react-native";

import { JS_VERSION_NUMBER, shareDebugText } from "../helpers/debug";
import { styles } from "../helpers/styles";

export const Loading: React.FunctionComponent = () => {
  return (
    <View>
      <Text style={{ ...styles.onlyTextStyle, fontWeight: "bold" }}>
        Loading...
      </Text>
      <Text
        style={{
          textAlign: "center",
          marginHorizontal: 20,
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
      <Text style={{ textAlign: "center", marginTop: 50, color: "lightgray" }}>
        v.{JS_VERSION_NUMBER}
      </Text>
    </View>
  );
};
