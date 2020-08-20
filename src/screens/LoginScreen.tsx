import * as Linking from "expo-linking";
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
  TouchableWithoutFeedback,
} from "react-native";

import { User } from "../helpers/asyncStorage/user";
import { connectDatabaseAsync } from "../helpers/database";
import {
  JS_VERSION_NUMBER,
  alertWithShareButtonContainingDebugInfo,
  getCriticalProblemTextForUser,
  shareDebugText,
} from "../helpers/debug";
import { LoginSchema } from "../helpers/schemas/Login";
import { getStudyFileAsync } from "../helpers/studyFile";
import { loginAsync, logoutAsync } from "../helpers/users";

// This is an ugly hack so that the init url won't pop up again if the user log
// in and then immediately log out.
let firstTimeLoadingLoginScreen = true;

export type ParamDownloadAndParseStudyFileAsync = {
  url: string;
  isRedownload: boolean;
  handleNetworkErrorAsync: (error: string) => Promise<void>;
};

interface LoginScreenProps {
  downloadAndParseStudyFileAsync: (
    options: ParamDownloadAndParseStudyFileAsync,
  ) => Promise<boolean>;
  loggedInAsync: (user: User) => Promise<void>;
}

interface LoginScreenState {
  unableToParticipate: boolean;
  formData?: string;
  disableLoginButton: boolean;
  loadingText: string | null;
  errorText: string | null;
}

export default class LoginScreen extends React.Component<
  LoginScreenProps,
  LoginScreenState
> {
  constructor(props: LoginScreenProps) {
    super(props);

    this.state = {
      unableToParticipate: false,
      disableLoginButton: false,
      loadingText: null,
      errorText: null,
    };
  }

  handleUrl(url: Linking.ParsedURL) {
    if (url.hostname === "stanfordsocialneurosciencelab.github.io") {
      if (
        url.path === "WellPing/app/login" &&
        url.queryParams &&
        url.queryParams["code"]
      ) {
        const loginCode = decodeURIComponent(url.queryParams["code"]);

        this.setState({ formData: loginCode });
        Alert.alert(
          "Hi there!",
          `We have pre-filled your login information. Please click "OK" to log in.`,
          [
            {
              text: "OK",
              style: "cancel",
              onPress: this.loginFnAsync,
            },
          ],
        );
      }
    }
  }

  listenToUrlWhenForegroundHandler = (event: Linking.EventType) => {
    this.handleUrl(Linking.parse(event.url));
  };

  async componentDidMount() {
    // If LoginScreen is loaded, it means that the user haven't logged in yet.
    // So we can parse initial url and addEventListener.
    if (firstTimeLoadingLoginScreen) {
      // We have to check this, or else when the user log in and then
      // immediately log out, they will be presented with this again.
      this.handleUrl(await Linking.parseInitialURLAsync());
      firstTimeLoadingLoginScreen = false;
    }
    Linking.addEventListener("url", this.listenToUrlWhenForegroundHandler);
  }

  componentWillUnmount() {
    Linking.removeEventListener("url", this.listenToUrlWhenForegroundHandler);
  }

  async confirmAgeAsync(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // TODO: ALLOW CUSTOMIZE IT
      Alert.alert(
        "Confirm",
        `Are you at least 18 years of age?`,
        [
          {
            text: "Yes",
            onPress: () => {
              resolve(true);
            },
          },
          {
            text: "No",
            onPress: () => {
              this.setState({ unableToParticipate: true });
              resolve(false);
            },
          },
        ],
        { cancelable: false },
      );
    });
  }

  loginFnAsync = async () => {
    this.setState({
      errorText: null,
      loadingText: null,
      disableLoginButton: true,
    });

    Keyboard.dismiss();

    if (!(await this.confirmAgeAsync())) {
      this.setState({
        disableLoginButton: false,
      });
      return;
    }

    this.setState({
      loadingText: "Magical things happening...",
    });

    let user!: User;
    let studyFileJsonUrl!: string;
    try {
      const loginCode = this.state.formData?.trim();
      if (!loginCode) {
        throw new Error("You have not entered your login code.");
      }

      const parsedLoginCode = loginCode.split(" ");
      if (parsedLoginCode.length > 3) {
        throw new Error(
          "Your login code is not formatted correctly " +
            "(`parsedLoginCode.length > 3`).",
        );
      }
      const loginInfo = LoginSchema.parse({
        username: parsedLoginCode[0] || "",
        password: parsedLoginCode[1] || "",
        studyFileJsonUrl: parsedLoginCode[2] || "",
      });
      user = {
        username: loginInfo.username,
        password: loginInfo.password,
      };
      studyFileJsonUrl = loginInfo.studyFileJsonUrl;
    } catch (e) {
      this.setState({
        disableLoginButton: false,
        errorText: `**Your login code is invalid**\n${e}`,
      });
      return;
    }

    this.setState({
      loadingText: "Loading study data...",
    });

    if (
      !(await this.props.downloadAndParseStudyFileAsync({
        url: studyFileJsonUrl,
        isRedownload: false,
        handleNetworkErrorAsync: async (errorMessage) => {
          this.setState({
            errorText: errorMessage,
            disableLoginButton: false,
          });
        },
      }))
    ) {
      // We don't have to set `disableLoginButton` here because the page
      // will be unmounted anyway (to show stuty file error page).
      return;
    }

    const survey = await getStudyFileAsync();

    this.setState({
      loadingText: "Authenticating...",
    });

    let error: string | null = null;
    try {
      await loginAsync(user, survey.studyInfo);
    } catch (e) {
      error = `${e}`;
    }

    if (!error) {
      this.setState({
        loadingText: "Logged in!",
      });

      Alert.alert(
        "Welcome to Well Ping!",
        `Please review the consent form.`,
        [
          {
            text: "Review",
            onPress: async () => {
              try {
                // Because database was not previously connected.
                await connectDatabaseAsync(survey.studyInfo.id);
              } catch (e) {
                // `connectDatabaseAsync` should already alerted user.
                this.setState({
                  errorText: getCriticalProblemTextForUser(`${e}`),
                });
                return;
              }

              await WebBrowser.openBrowserAsync(
                survey.studyInfo.consentFormUrl,
              );

              this.setState(
                {
                  loadingText: null,
                  errorText: null,
                  disableLoginButton: false,
                },
                // Avoid no-op error.
                async () => {
                  await this.props.loggedInAsync(user);
                },
              );
            },
          },
        ],
        { cancelable: false },
      );
    } else {
      await logoutAsync();
      this.setState({
        errorText: error,
        disableLoginButton: false,
      });
    }
  };

  render() {
    const { loadingText, errorText, unableToParticipate } = this.state;

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

    return (
      <ScrollView
        style={{ height: "100%", paddingHorizontal: 20 }}
        keyboardShouldPersistTaps="handled" /* https://github.com/facebook/react-native/issues/9404#issuecomment-252474548 */
      >
        <View style={{ marginVertical: 20 }}>
          <Text style={{ fontSize: 30, marginBottom: 20, textAlign: "center" }}>
            Welcome to Well Ping!
          </Text>
          <Text style={{ fontSize: 20 }}>
            Please log in using the login code sent to your email.
          </Text>
        </View>
        <TextInput
          onChangeText={(text) => this.setState({ formData: text })}
          value={this.state.formData}
          autoCorrect={false}
          autoCapitalize="none"
          autoCompleteType="off"
          placeholder="Paste your login code here..."
          multiline
          textAlignVertical="top" // https://reactnative.dev/docs/textinput#multiline
          blurOnSubmit // https://stackoverflow.com/a/38988668/2603230
          onSubmitEditing={this.loginFnAsync}
          editable={!this.state.disableLoginButton}
          style={{
            padding: 8,
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 5,
            marginBottom: 10,
            height: 75,
          }}
        />
        <Button
          title="Log In"
          disabled={this.state.disableLoginButton}
          onPress={this.loginFnAsync}
        />
        {errorText ? (
          <View
            style={{
              marginVertical: 5,
              padding: 10,
              borderColor: "lightcoral",
              borderWidth: 1,
            }}
          >
            <Text style={{ fontWeight: "bold" }}>
              {`A problem occurred! Please review the error log below. ` +
                `If necessary, please press the "Share Error" button at the ` +
                `bottom and send the error log to the research staff.`}
            </Text>
            <Text style={{ marginTop: 20 }}>{errorText}</Text>
            <Button
              onPress={() => {
                shareDebugText(errorText);
              }}
              title="Share Error"
            />
          </View>
        ) : undefined}
        {loadingText && !errorText ? (
          <View style={{ marginTop: 10 }}>
            <Text
              style={{
                fontWeight: "bold",
                textAlign: "center",
                fontSize: 20,
              }}
            >
              {loadingText}
            </Text>
          </View>
        ) : undefined}
        <TouchableWithoutFeedback
          onLongPress={async () => {
            //this.setState({ displayDebugView: true });
            alertWithShareButtonContainingDebugInfo(
              `parseInitialURLAsync:\n${JSON.stringify(
                await Linking.parseInitialURLAsync(),
              )}`,
              "👀",
            );
          }}
        >
          <Text
            style={{
              textAlign: "center",
              marginTop: 50,
              marginBottom: 30,
              color: "lightgray",
            }}
          >
            {JS_VERSION_NUMBER}
          </Text>
        </TouchableWithoutFeedback>
      </ScrollView>
    );
  }
}
