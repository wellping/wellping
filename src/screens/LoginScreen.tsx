import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import {
  Button,
  // TextInput,
  Text,
  View,
  ScrollView,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  Pressable,
  Dimensions,
  Image,
} from "react-native";
const { height, width } = Dimensions.get('screen')
import {
  Button as PaperButton,
  TextInput
} from 'react-native-paper'

import { CONFIG } from "../../config/config";
import {
  JS_VERSION_NUMBER,
  alertWithShareButtonContainingDebugInfoAsync,
  getCriticalProblemTextForUser,
  shareDebugTextAsync,
} from "../helpers/debug";
import { LoginSchema } from "../helpers/schemas/Login";
import { User } from "../helpers/secureStore/user";
import { getStudyFileAsync } from "../helpers/studyFile";
import { loginAsync, logoutAsync } from "../helpers/users";

// This is an ugly hack so that the init url won't pop up again if the user log
// in and then immediately log out.
let firstTimeLoadingLoginScreen = true;

export type ParamDownloadAndParseStudyFileAsync = {
  url: string;
  user: User;
  isRedownload: boolean;
  handleNetworkErrorAsync: (error: string) => Promise<void>;
};

interface LoginScreenProps {
  downloadAndParseStudyFileAsync: (
    options: ParamDownloadAndParseStudyFileAsync,
  ) => Promise<boolean>;
  loggedInAsync: (user: User) => Promise<void>;
  userInfo: User | null;
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
    if (
      url.hostname === "stanfordsocialneurosciencelab.github.io" ||
      url.hostname === "wellping.github.io"
    ) {
      if (
        (url.path === "WellPing/app/login" || url.path === "app/login") &&
        url.queryParams &&
        url.queryParams["code"]
      ) {
        const loginCode = decodeURIComponent(url.queryParams["code"] as string);

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

  async confirmAgeAsync(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // TODO: ALLOW CUSTOMIZE IT
      Alert.alert(
        "Confirm",
        `Are you at least 18 years of age?`,
        [
          {
            text: "Yes, I am at least 18 years of age.",
            onPress: () => {
              resolve(true);
            },
          },
          {
            text: "No, I am not at least 18 years of age.",
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
    let studyFileURL!: string;
    try {
      const loginCode = this.state.formData?.trim();
      if (!loginCode) {
        throw new Error("You have not entered your login code.");
      }

      const parsedLoginCode = loginCode.split(CONFIG.LOGIN_CODE_SEPARATOR);
      const loginInfo = LoginSchema.parse({
        username: parsedLoginCode[0] || "",
        password: parsedLoginCode[1] || "",
        studyFileURL:
          // https://stackoverflow.com/a/25177077/2603230
          parsedLoginCode.splice(2).join(CONFIG.LOGIN_CODE_SEPARATOR) ||
          CONFIG.DEFAULT_STUDY_FILE_URL,
      });
      user = {
        username: loginInfo.username,
        password: loginInfo.password,
        loginDate: new Date().getTime(),
      };
      studyFileURL = loginInfo.studyFileURL;
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
        url: studyFileURL,
        user,
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
          <Text style={{ fontSize: 15 }}>
            If you are at least 18 years of age, please fully exit the app,
            restart the app, and press “Yes, I am at least 18 years of age.”
            when logging in.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={{ height: "100%", paddingHorizontal: 20, backgroundColor: '#f8f9fa' }}
        keyboardShouldPersistTaps="handled" /* https://github.com/facebook/react-native/issues/9404#issuecomment-252474548 */
      >
        <View style={{marginVertical: 20, width: width-40, height: height*.8, backgroundColor: '#f8f9fa', alignItems: 'center', justifyContent: 'space-around'}}>
          <Text style={{position: 'absolute', top: 10, fontSize: 18, fontWeight: 'bold', color: 'gray'}}>
              {"(Login)"} - no user info
            </Text>

          <View style={{width: width*.9, height: height*.7, backgroundColor: '#f8f9fa', alignItems: 'center', justifyContent: 'space-around'}}>
            <View style={{height: 120, width: 120, backgroundColor: 'rgba(0,0,0,0.0)'}}>
              <Image source={require('../../assets/icon-android-foreground.png')} style={{height: 120, width: 120, backgroundColor: 'transparent', transform: [{scale: 2.5}]}}/>
            </View>
            <Text style={{ fontSize: 36, fontWeight: 'bold', width: '70%', textAlign: "center" }}>
              Welcome to Well Ping!
            </Text>
            <Pressable
              onPress={()=>console.log('asdf', this.props.userInfo)}
              style={{width: '70%'}}
            >
              <Text style={{ fontSize: 18, textAlign: 'center' }}>
                Please log in using the login code sent to you.
              </Text>
            </Pressable>
            <TextInput
              onChangeText={(text) => this.setState({ formData: text })}
              value={this.state.formData}
              autoCorrect={false}
              autoCapitalize="none"
              placeholder="Enter login code here..."
              textColor="black"
              selectionColor="black"
              underlineColor="gray"
              activeUnderlineColor="gray"
              contentStyle={{backgroundColor: '#f5f5f5'}}
              outlineStyle={{borderColor: 'transparent'}}
              underlineStyle={{borderColor: 'transparent'}}
              blurOnSubmit // https://stackoverflow.com/a/38988668/2603230
              onSubmitEditing={this.loginFnAsync}
              editable={!this.state.disableLoginButton}
              style={{width: 297, fontSize: 18}}
            />
            <PaperButton
              buttonColor="#761A15" 
              mode="contained" 
              style={{borderRadius: 12, width: 294, alignItems: 'center', paddingVertical: 10}}
              disabled={this.state.disableLoginButton}
              labelStyle={{fontSize: 18}}
              // onPress={() => console.log('Pressed')}
              onPress={this.loginFnAsync}
            >
              Log in
            </PaperButton>
            <Pressable 
              onPress={() => console.log('Pressed')}
              style={{borderRadius: 12, width: 4/5*width, alignItems: 'center'}}
            >
              <Text style={{color: '#6C6C6C', fontSize: 21}}>
                Skip for now
              </Text>
            </Pressable>
          </View>
        </View>
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
              onPress={async () => {
                await shareDebugTextAsync(errorText);
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
            await alertWithShareButtonContainingDebugInfoAsync(
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
