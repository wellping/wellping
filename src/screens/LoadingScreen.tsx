import React from "react";
import { View, Text, Button, Image } from "react-native";

import { JS_VERSION_NUMBER, shareDebugTextAsync } from "../helpers/debug";
import { styles } from "../helpers/styles";

const TEXT_COLOR = "#ededed";

const LoadingScreen: React.FunctionComponent = () => {
  return (
    <View style={{ flex: 1, marginHorizontal: 0, backgroundColor: 'white'}}>
      <Text
        style={{
          textAlign: "center",
          marginTop: 100,
          color: TEXT_COLOR,
        }}
      >
        {/* If you are stuck on this page for more than one minute, please click the
        button below and contact the research staff. */}
      </Text>
      <View style={{height: 120, width: '100%', backgroundColor: 'rgba(0,0,0,0.0)', alignItems: 'center', justifyContent: 'center', opacity: .1}}>
        <Image source={require('../../assets/icon-android-foreground.png')} style={{height: 120, width: 120, backgroundColor: 'transparent', transform: [{scale: 2.5}]}}/>
      </View>
      <Text style={{ ...styles.onlyTextStyle, fontWeight: "bold", color: '#761A15'}}>
        Loading...
      </Text>
      {/* <Button
        title="Share Error"
        color={TEXT_COLOR}
        onPress={async () => {
          await shareDebugTextAsync("Stuck on the loading page.");
        }}
      /> */}
      <Text
        style={{
          textAlign: "center",
          marginHorizontal: 20,
          marginTop: 30,
          color: TEXT_COLOR,
        }}
      >
        {/* If you want to reset the app, please delete and then re-install the app. */}
      </Text>
      <Text style={{ textAlign: "center", marginTop: 20, color: TEXT_COLOR }}>
        {/* {JS_VERSION_NUMBER} */}
      </Text>
    </View>
  );
};

export default LoadingScreen;
