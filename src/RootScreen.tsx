import * as WebBrowser from "expo-web-browser";
import React from "react";
import { Button, TextInput, Text, View, ScrollView, Alert } from "react-native";

import HomeScreen from "./HomeScreen";
import { registerUserAsync } from "./helpers/apiManager";
import {
  getUserAsync,
  User,
  clearUserAsync,
} from "./helpers/asyncStorage/user";
import { getSurveyFileAsync } from "./helpers/configFiles";
import { connectDatabaseAsync } from "./helpers/database";
import { getCriticalProblemTextForUser } from "./helpers/debug";
import { SurveyFile } from "./helpers/types";

interface RootScreenProps {}

interface RootScreenState {
  userInfo: User | null;
  isLoading: boolean;
  formDataUserId?: string;
  formDataPassword?: string;
  errorText: string | null;
  unableToParticipate?: boolean;
  survey?: SurveyFile;
}

export default class RootScreen extends React.Component<
  RootScreenProps,
  RootScreenState
> {
  constructor(props: RootScreenProps) {
    super(props);

    this.state = {
      userInfo: null,
      isLoading: true,
      errorText: null,
    };
  }

  async componentDidMount() {
    const user = await getUserAsync();
    if (user) {
      const survey = await getSurveyFileAsync();

      await connectDatabaseAsync(survey.studyInfo.id);

      this.setState({ survey });
    }
    this.setState({ userInfo: user, isLoading: false });

    if (user == null) {
      Alert.alert(
        "Confirm",
        `Are you at least 18 years of age?`,
        [
          {
            text: "Yes",
          },
          {
            text: "No",
            onPress: () => {
              this.setState({ unableToParticipate: true });
            },
          },
        ],
        { cancelable: false },
      );
    }
  }

  render() {
    const { isLoading, userInfo, errorText, unableToParticipate } = this.state;
    if (isLoading) {
      return (
        <View>
          <Text>Loading...</Text>
        </View>
      );
    }

    if (unableToParticipate) {
      return (
        <View style={{ marginTop: 20, marginHorizontal: 20 }}>
          <Text style={{ fontSize: 20 }}>Thank you for your interests.</Text>
          <Text style={{ fontSize: 20 }}>
            Unfortunately, you cannot participate in this study.
          </Text>
        </View>
      );
    }

    if (userInfo == null) {
      const textFieldStyle = {
        padding: 12,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 5,
        margin: 15,
      };
      return (
        <ScrollView>
          <View style={{ padding: 20 }}>
            <Text
              style={{ fontSize: 30, marginBottom: 20, textAlign: "center" }}
            >
              Welcome to Well Ping!
            </Text>
            <Text style={{ fontSize: 20 }}>
              Please log in using the credentials sent to your email.
            </Text>
          </View>
          <TextInput
            onChangeText={(text) => this.setState({ formDataUserId: text })}
            autoCorrect={false}
            autoCapitalize="none"
            autoCompleteType="off"
            placeholder="User ID"
            style={textFieldStyle}
          />
          <TextInput
            onChangeText={(text) => this.setState({ formDataPassword: text })}
            secureTextEntry
            autoCorrect={false}
            autoCapitalize="none"
            autoCompleteType="off"
            placeholder="Password"
            style={textFieldStyle}
          />
          <Button
            title="Log in"
            onPress={async () => {
              this.setState({
                errorText: "Loading...",
              });

              const user: User = {
                patientId: this.state.formDataUserId || "",
                password: this.state.formDataPassword || "",
              };
              const error = await registerUserAsync(user);
              if (!error) {
                Alert.alert(
                  "Welcome to Well Ping!",
                  `Please review the consent form.`,
                  [
                    {
                      text: "Review",
                      onPress: async () => {
                        await WebBrowser.openBrowserAsync(
                          (await getSurveyFileAsync()).studyInfo.consentFormUrl,
                        );
                        this.setState({
                          errorText: "Downloading survey...",
                        });

                        // TODO: await downloadSurvey;
                        const survey = await getSurveyFileAsync();

                        this.setState({
                          userInfo: user,
                          survey,
                          errorText: null,
                        });
                      },
                    },
                  ],
                  { cancelable: false },
                );
              } else {
                this.setState({
                  errorText: error,
                });
              }
            }}
          />
          {errorText ? (
            <Text style={{ margin: 15, fontWeight: "bold" }}>{errorText}</Text>
          ) : undefined}
        </ScrollView>
      );
    }

    if (this.state.survey == null) {
      return (
        <Text>
          {getCriticalProblemTextForUser("this.state.survey == null")}
        </Text>
      );
    }

    return (
      <HomeScreen
        survey={this.state.survey}
        logout={async () => {
          await clearUserAsync();
          this.setState({ userInfo: null });
        }}
      />
    );
  }
}
