import * as WebBrowser from "expo-web-browser";
import React from "react";
import {
  Button,
  TextInput,
  Text,
  View,
  ScrollView,
  Alert,
  Keyboard,
} from "react-native";

import HomeScreen from "./HomeScreen";
import { registerUserAsync } from "./helpers/apiManager";
import { clearCurrentStudyFileAsync } from "./helpers/asyncStorage/studyFile";
import {
  storeTempStudyFileAsync,
  getTempStudyFileAsync,
  clearTempStudyFileAsync,
} from "./helpers/asyncStorage/tempStudyFile";
import {
  getUserAsync,
  User,
  clearUserAsync,
} from "./helpers/asyncStorage/user";
import { connectDatabaseAsync } from "./helpers/database";
import { getCriticalProblemTextForUser, shareDebugText } from "./helpers/debug";
import { LoginSchema } from "./helpers/schemas/Login";
import {
  getStudyFileAsync,
  downloadStudyFileAsync,
  parseAndStoreStudyFileAsync,
  studyFileExistsAsync,
} from "./helpers/studyFile";
import { styles } from "./helpers/styles";
import { StudyFile } from "./helpers/types";

interface RootScreenProps {}

interface RootScreenState {
  userInfo: User | null;
  isLoading: boolean;
  formData?: string;
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

  async parseStudyFileAsync(rawJsonString: string): Promise<boolean> {
    const parseErrorMessage = await parseAndStoreStudyFileAsync(rawJsonString);
    if (parseErrorMessage !== null) {
      this.setState({
        isLoading: false,
        studyFileErrorText: parseErrorMessage,
      });
      return false;
    }
    return true;
  }

  /**
   * Returns `false` if the downloading or the parsing process is unsuccessful.
   * Returns `true` otherwise.
   *
   * Notice that if `isRedownload` is true, the function still returns `true`
   * in case of downloading failure (but not parsing failure).
   */
  async downloadAndParseStudyFileAsync(
    url: string,
    isRedownload: boolean = false,
  ): Promise<boolean> {
    let rawJsonString: string;
    try {
      rawJsonString = await downloadStudyFileAsync(url);
    } catch (e) {
      if (!isRedownload) {
        let downloadErrorMessage: string;
        if (e instanceof Error) {
          downloadErrorMessage = `**${e.name}**\n${e.message}`;
        } else {
          downloadErrorMessage = `Unknown error: ${e}`;
        }
        alert("Failed to download study data! Please try again later.");
        this.setState({
          errorText: `Failed to download study data!\n\n${downloadErrorMessage}`,
        });
        return false;
      } else {
        // If it is re-download, we act as if nothing happens because at least
        // the user can continue to fill the valid version they have right now.
        return true;
      }
    }

    if (isRedownload) {
      // Store it in temp storage first, parse it next time.
      await storeTempStudyFileAsync(rawJsonString);
      return true;
    }

    return this.parseStudyFileAsync(rawJsonString);
  }

  /**
   * Loads and parse the study file from the temp study file Async Storage.
   * Returns `true` if there is no error (or no temp study file).
   * Returns `false` otherwise.
   */
  async loadTempStudyFileAsync(): Promise<boolean> {
    const tempStudyFile = await getTempStudyFileAsync();
    if (tempStudyFile === null) {
      return true;
    }
    // We have to `clearTempStudyFileAsync` before `parseStudyFileAsync`
    // because if the new study info is invalid, `parseStudyFileAsync` clears
    // study info which `clearTempStudyFileAsync` needs.
    await clearTempStudyFileAsync();
    const results = await this.parseStudyFileAsync(tempStudyFile);
    return results;
  }

  async componentDidMount() {
    if (await studyFileExistsAsync()) {
      if (!(await this.loadTempStudyFileAsync())) {
        return;
      }

      const survey = await getStudyFileAsync();

      // Do it in background because there isn't any urgency to redownload.
      this.downloadAndParseStudyFileAsync(
        survey.studyInfo.studyFileJsonURL,
        true,
      );

      const user = await getUserAsync();
      if (user === null) {
        // This will happen when e.g., the study file is downloads but the user
        // didn't successfully login.
        await this.logoutAsync();
        this.setState({ isLoading: false });
        return;
      }

      await connectDatabaseAsync(survey.studyInfo.id);

      this.setState({ userInfo: user, survey });
    } else {
      // New user.
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

    this.setState({ isLoading: false });
  }

  async logoutAsync() {
    await clearUserAsync();
    await clearCurrentStudyFileAsync();
    this.setState({ userInfo: null });
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
          <Text style={styles.onlyTextStyle}>Loading...</Text>
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
      return (
        <ScrollView
          style={{ height: "100%", paddingHorizontal: 20 }}
          keyboardShouldPersistTaps="handled" /* https://github.com/facebook/react-native/issues/9404#issuecomment-252474548 */
        >
          <View style={{ marginVertical: 20 }}>
            <Text
              style={{ fontSize: 30, marginBottom: 20, textAlign: "center" }}
            >
              Welcome to Well Ping!
            </Text>
            <Text style={{ fontSize: 20 }}>
              Please log in using the magic login code sent to your email. 🧙‍♀️
            </Text>
          </View>
          <TextInput
            onChangeText={(text) => this.setState({ formData: text })}
            autoCorrect={false}
            autoCapitalize="none"
            autoCompleteType="off"
            placeholder="Paste your magic login code here..."
            multiline
            style={{
              padding: 8,
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 5,
              marginBottom: 10,
              height: 150,
            }}
          />
          <Button
            title="Log in"
            onPress={async () => {
              this.setState({
                errorText: "Magical things happening... 🧙‍♂️",
              });

              Keyboard.dismiss();

              let user!: User;
              let studyFileJsonUrl!: string;
              try {
                const base64EncodedString = this.state.formData?.trim();
                if (!base64EncodedString) {
                  throw new Error(
                    "You have not entered your magic login code.",
                  );
                }

                const Buffer = require("buffer").Buffer;
                const loginJsonString = new Buffer(
                  base64EncodedString,
                  "base64",
                ).toString();
                const loginInfo = LoginSchema.parse(
                  JSON.parse(loginJsonString),
                );
                user = {
                  patientId: loginInfo.username,
                  password: loginInfo.password,
                };
                studyFileJsonUrl = loginInfo.studyFileJsonUrl;
              } catch (e) {
                this.setState({
                  errorText:
                    "Your magic login code is invalid 😕. Please screenshot " +
                    "the current page and contact the research staff.\n\n" +
                    `${e}`,
                });
                return;
              }

              this.setState({
                errorText: "Loading study data... ☁️",
              });

              if (
                !(await this.downloadAndParseStudyFileAsync(studyFileJsonUrl))
              ) {
                return;
              }

              const survey = await getStudyFileAsync();

              this.setState({
                errorText: "Authenticating... 🤖",
              });

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
                          survey.studyInfo.consentFormUrl,
                        );

                        // Because database was not previously connected.
                        await connectDatabaseAsync(survey.studyInfo.id);

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
            <Text style={{ fontWeight: "bold", marginTop: 10 }}>
              {errorText}
            </Text>
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
          await this.logoutAsync();
        }}
      />
    );
  }
}
