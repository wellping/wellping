import React from "react";
import { View, Text } from "react-native";

import { JS_VERSION_NUMBER } from "../helpers/debug";
import { styles } from "../helpers/styles";

export const Loading: React.FunctionComponent = () => {
  return (
    <View>
      <Text style={styles.onlyTextStyle}>Loading...</Text>
      <Text style={{ textAlign: "center", marginTop: 10, color: "lightgray" }}>
        v.{JS_VERSION_NUMBER}
      </Text>
    </View>
  );
};
