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
import { connectDatabaseAsync } from "./helpers/database";
import { getCriticalProblemTextForUser, shareDebugText } from "./helpers/debug";
import {
  getStudyFileAsync,
  downloadStudyFileAsync,
  shouldDownloadStudyFileAsync,
} from "./helpers/studyFile";
import { StudyFile } from "./helpers/types";

interface RootScreenProps {}

interface RootScreenState {
  userInfo: User | null;
  isLoading: boolean;
  formDataUserId?: string;
  formDataPassword?: string;
  errorText: string | null;
  studyFileErrorText: string | null;
  unableToParticipate?: boolean;
  survey?: StudyFile;
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
      studyFileErrorText: null,
    };
  }

  async downloadStudyFileHandleErrorAsync(url: string): Promise<boolean> {
    const downloadError = await downloadStudyFileAsync(url);
    if (downloadError !== null) {
      this.setState({
        studyFileErrorText: downloadError,
      });
      return false;
    }
    return true;
  }

  async componentDidMount() {
    const user = await getUserAsync();
    if (user) {
      if (await shouldDownloadStudyFileAsync()) {
        if (!(await this.downloadStudyFileHandleErrorAsync("TODO: "))) {
          this.setState({ isLoading: false });
          return;
        }
      }

      const survey = await getStudyFileAsync();

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
    const {
      isLoading,
      userInfo,
      errorText,
      studyFileErrorText,
      unableToParticipate,
    } = this.state;
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

    if (studyFileErrorText) {
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
              <Text style={{ fontSize: 20, color: "red" }}>
                Study File Error
              </Text>
              <Text style={{ marginTop: 10, marginBottom: 10 }}>
                The study file contains the following error:
              </Text>
            </View>
            <View style={{ flex: -1 }}>
              <TextInput
                multiline
                editable={false}
                value={studyFileErrorText}
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
                  shareDebugText(studyFileErrorText);
                }}
                title="Send the error message to the research staff"
              />
            </View>
          </View>
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
                        this.setState({
                          errorText: "Downloading study data...",
                        });

                        if (
                          !(await this.downloadStudyFileHandleErrorAsync(
                            "TODO: ",
                          ))
                        ) {
                          return;
                        }

                        const survey = await getStudyFileAsync();

                        await WebBrowser.openBrowserAsync(
                          survey.studyInfo.consentFormUrl,
                        );

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
        studyInfo={this.state.survey.studyInfo}
        streams={this.state.survey.streams}
        logout={async () => {
          await clearUserAsync();
          this.setState({ userInfo: null });
        }}
      />
    );
  }
}
