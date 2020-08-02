import React from "react";
import { View, Text } from "react-native";

import { styles } from "../helpers/styles";

export const Loading: React.FunctionComponent = ({ children }) => {
  return (
    <View>
      <Text style={styles.onlyTextStyle}>Loading...</Text>
    </View>
  );
};
