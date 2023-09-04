import {
  Streams,
  StreamName,
  StudyInfo,
  StudyFile,
  Ping,
} from "@wellping/study-schemas/lib/types";
import React from "react";
import { 
  Text,
  View,
  Dimensions,
  Pressable,
  Platform,
  StyleSheet
} from "react-native";
const { height, width } = Dimensions.get('screen')
import {
  Button as PaperButton
} from 'react-native-paper'

import HomeScreen from "./HomeScreen";
import {
  storeTempStudyFileAsync,
  getTempStudyFileAsync,
  clearTempStudyFileAsync,
} from "./helpers/asyncStorage/tempStudyFile";
import {
  getCriticalProblemTextForUser,
  alertWithShareButtonContainingDebugInfoAsync,
  getNonCriticalProblemTextForUser,
} from "./helpers/debug";
import { validateAndInitializeFirebaseWithConfig } from "./helpers/firebase";
import { secureGetUserAsync, User } from "./helpers/secureStore/user";
import { isUsingFirebase } from "./helpers/server";
import {
  getStudyFileAsync,
  downloadStudyFileAsync,
  parseAndStoreStudyFileAsync,
  studyFileExistsAsync,
} from "./helpers/studyFile";
import { logoutAsync } from "./helpers/users";
import LoadingScreen from "./screens/LoadingScreen";
import LoginScreen, {
  ParamDownloadAndParseStudyFileAsync,
} from "./screens/LoginScreen";
import StudyFileErrorScreen from "./screens/StudyFileErrorScreen";
import {
  NavigationContainer
} from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator, NativeStackScreenProps } from "@react-navigation/native-stack";
import { AppStateStatus } from "react-native";
import { SurveyScreenState } from "./SurveyScreen";
import { User as FirebaseUser } from 'firebase/auth'

interface RootScreenProps {}

interface RootScreenState {
  userInfo: User | null;
  isLoading: boolean;
  studyFileErrorText: string | null;
  survey?: StudyFile;
}

export type RootStackParamList = {
  // HomeScreen: React.Component<HomeScreenProps, HomeScreenState>;
  HomeScreen: undefined;
  Profile: { userId: string };
  Feed: { sort: 'latest' | 'top' } | undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

type HomeScreenProps = {
  studyInfo: StudyInfo;
  streams: Streams;
  logout: () => Promise<void>;
  userInfo: User | null;
}

type HomeScreenState = {
  appState: AppStateStatus;
  time: Date;
  allowsNotifications: boolean;
  currentNotificationTime: Date | null;
  currentPing: Ping | null;
  isLoading: boolean;
  storedPingStateAsync: SurveyScreenState | null;
  uploadStatusSymbol: string;
  text: string | undefined;

  /**
   * Only used for the upload process after a ping has been completed.
   */
  afterFinishingPing_isUploading: boolean;

  /**
   * For when Firebase server is used.
   *
   * If Firebase server is not used, it is always `null`.
   */
  firebaseUser: FirebaseUser | null;

  // DEBUG
  displayDebugView: boolean;
}

export default function Main () {
  return <RootScreen/>
}

class RootScreen extends React.Component<
  RootScreenProps,
  RootScreenState
> {
  constructor(props: RootScreenProps) {
    super(props);

    this.state = {
      userInfo: null,
      isLoading: true,
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
  async downloadAndParseStudyFileAsync({
    url,
    user,
    isRedownload,
    handleNetworkErrorAsync,
  }: ParamDownloadAndParseStudyFileAsync): Promise<boolean> {
    let rawJsonString: string;
    try {
      rawJsonString = await downloadStudyFileAsync({
        url,
        username: user.username,
        password: user.password,
      });
    } catch (e) {
      let downloadErrorMessage: string;
      if (e instanceof Error) {
        downloadErrorMessage = `**${e.name}**\n${e.message}`;
      } else {
        downloadErrorMessage = `Unknown error: ${e}`;
      }
      const errorMessage =
        `Failed to download study data! Possible network failure. ` +
        `Please try again later.\n\n${downloadErrorMessage}`;
      await handleNetworkErrorAsync(errorMessage);

      if (!isRedownload) {
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

      if (isUsingFirebase(survey.studyInfo)) {
        try {
          validateAndInitializeFirebaseWithConfig(survey.studyInfo);
        } catch (e) {
          await this.logoutFnAsync();
          this.setState({ isLoading: false });
          await alertWithShareButtonContainingDebugInfoAsync(
            getCriticalProblemTextForUser(
              `componentDidMount validateAndInitializeFirebaseWithConfig: ${e}`,
            ),
          );
          return;
        }
      }

      const user = await secureGetUserAsync();
      if (user === null) {
        // One reason this might happen is that the newly downloaded study file
        // has changed the study ID in it. It makes `secureClearUserAsync` unable
        // to get the user info (since the key is based on the study ID) and hence
        // returns null. (So this is actually this expected behavior.)

        // Notice that we have to do this before `downloadAndParseStudyFileAsync`
        // or else the async function in `downloadAndParseStudyFileAsync` will
        // still try to find study file when it is already deleted.
        await this.logoutFnAsync();
        this.setState({ isLoading: false });
        await alertWithShareButtonContainingDebugInfoAsync(
          getNonCriticalProblemTextForUser(
            `You have been logged out for an unknown reason. ` +
              `Please uninstall the app, reinstall the app, and try logging in again. ` +
              `Your previous responses are still logged in our server after you reinstall the app.\n\n` +
              `(REF: studyFileExistsAsync and user === null).`,
          ),
        );
        return;
      }

      // Do it in background because there isn't any urgency to redownload.
      this.downloadAndParseStudyFileAsync({
        url: survey.studyInfo.studyFileURL,
        user,
        isRedownload: true,
        handleNetworkErrorAsync: async () => {
          // No need to handle network error.
          // Just do it next time.
        },
      });

      this.setState({ userInfo: user, survey });
    }

    this.setState({ isLoading: false });
  }

  async logoutFnAsync() {
    this.setState({ userInfo: null, survey: undefined }, async () => {
      await logoutAsync();
    });
  }

  render() {
    const { isLoading, userInfo, studyFileErrorText } = this.state;
    const Stack = createNativeStackNavigator<RootStackParamList>();

    const AppStack = () => (
      <View style={{height: height*.8, width: '100%', backgroundColor: '#f8f9fa', alignItems: 'center', justifyContent: 'flex-start', paddingTop: Platform.OS === 'ios'? 50:0 }}>
        <View style={{height: '100%', width: '100%'}}>
          <NavigationContainer>
            <Stack.Navigator initialRouteName='HomeScreen'>
              <Stack.Screen name="HomeScreen" options={{headerShown: false, contentStyle: {paddingTop: 30}}}>
                {(props)=> this.state.survey === undefined? <View style={{height: 100, width: 200, backgroundColor: 'gray'}}>
                    <Text>survey is undefined</Text>
                  </View>
                  : 
                  <HomeScreen
                    {...props}
                    studyInfo={this.state.survey.studyInfo}
                    streams={this.state.survey.streams}
                    userInfo={this.state.userInfo}
                    logout={async () => {
                      await this.logoutFnAsync();
                    }}
                  /> }
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </View>
      </View>
    )

    const AppStackWithLogout = () => (
      <>
        <AppStack/>
        <TemporaryLogoutBar/>
      </>
    )

    const AuthStack = () => (
      <LoginScreen
        userInfo={this.state.userInfo}
        downloadAndParseStudyFileAsync={async (...parameter) => {
          return await this.downloadAndParseStudyFileAsync(...parameter);
        }}
        loggedInAsync={async (user) => {
          this.setState({
            userInfo: user,
            survey: await getStudyFileAsync(),
          });
        }}
      />
    )

    const TemporaryLogoutBar = () => (
      <View style={{height: Platform.OS==='ios'? height*.1 : height*.1, width: width, backgroundColor: '#f8f9fa', flexDirection: 'row'}}>
        <Pressable 
          style={[styles.center, styles.navButton, {backgroundColor: 'white'}]}
          onPress={()=>console.log('go home')}
        >
          <Text style={{fontSize: 30}}>🏡</Text>
          <Text style={{fontSize: 12}}>Home</Text>
        </Pressable>
        <Pressable style={[styles.center, styles.navButton, {backgroundColor: 'white'}]}>
          <Text style={{fontSize: 30}}>🛎️</Text>
          <Text style={{fontSize: 12}}>Notifications</Text>
        </Pressable>
        <Pressable style={[styles.center, styles.navButton, {backgroundColor: 'white'}]}>
          <Text style={{fontSize: 30}}>🙆</Text>
          <Text style={{fontSize: 12}}>Account</Text>
        </Pressable>
        {/* <PaperButton
          buttonColor="#f8f9fa" 
          textColor="black"
          mode="elevated" 
          style={{borderRadius: 12, width: 160, alignItems: 'center', paddingVertical: 10}}
          // disabled={this.state.disableLoginButton}
          labelStyle={{fontSize: 18}}
          onPress={async () => {
            await this.logoutFnAsync();
          }}
        >
          Log out
        </PaperButton> */}
      </View>
    )

    if (isLoading) return <LoadingScreen />;
    if (studyFileErrorText) return <StudyFileErrorScreen errorText={studyFileErrorText} />;
    if (this.state.survey == null) {
      if (userInfo != null || userInfo != undefined) {
        <>
          <Text>
            {getCriticalProblemTextForUser("this.state.survey == null")}
          </Text>
          <Pressable 
            onPress={async ()=> console.log(
              await studyFileExistsAsync(),
              'userInfo: ',userInfo,
              'survey: ', this.state.survey,
              (userInfo != null || userInfo != undefined)
            )}
            >
            <Text>Press this to store async study file info</Text>
          </Pressable>

        </>
      }
      return (
        <LoginScreen
          userInfo={this.state.userInfo}
          downloadAndParseStudyFileAsync={async (...parameter) => {
            return await this.downloadAndParseStudyFileAsync(...parameter);
          }}
          loggedInAsync={async (user) => {
            this.setState({
              userInfo: user,
              survey: await getStudyFileAsync(),
            });
          }}
        />
      )
    }

    return userInfo? <AppStackWithLogout/> : <AuthStack/>

  }
}

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  navButton: {
    width: '33.33%', 
    height: '100%', 
  }
})
