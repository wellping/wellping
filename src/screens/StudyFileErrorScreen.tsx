import React from "react";
import { Button, TextInput, Text, View } from "react-native";

import { shareDebugText } from "../helpers/debug";

interface StudyFileErrorScreenProps {
  errorText: string;
}

interface StudyFileErrorScreenState {}

export default class StudyFileErrorScreen extends React.Component<
  StudyFileErrorScreenProps,
  StudyFileErrorScreenState
> {
  render() {
    const { errorText } = this.props;
    return (
      <View style={{ height: "100%" }}>
        <View
          style={{
            flex: 1,
            marginTop: 20,
            marginHorizontal: 20,
          }}
        >
          <View style={{ flex: 0 }}>
            <Text style={{ fontSize: 20, color: "red" }}>Study File Error</Text>
            <Text style={{ marginTop: 10, marginBottom: 10 }}>
              The study file contains the following error:
            </Text>
          </View>
          <View style={{ flex: -1 }}>
            <TextInput
              multiline
              editable={false}
              value={errorText}
              style={{
                borderColor: "black",
                borderWidth: 1,
                padding: 5,
              }}
            />
          </View>
          <View style={{ flex: 0 }}>
            <Text style={{ textAlign: "center" }}>
              (Restart the app to try again.)
            </Text>
            <Button
              onPress={() => {
                shareDebugText(errorText);
              }}
              title="Send the error message to the research staff"
            />
          </View>
        </View>
      </View>
    );
  }
}
