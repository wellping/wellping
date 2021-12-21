import { StudyFile } from "@wellping/study-file/lib/types";
import React from "react";
import { Text } from "react-native";

import HomeScreen from "./HomeScreen";
import { clearCurrentStudyFileAsync } from "./helpers/asyncStorage/studyFile";
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

interface RootScreenProps {}

interface RootScreenState {
  userInfo: User | null;
  isLoading: boolean;
  studyFileErrorText: string | null;
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
    if (isLoading) {
      return <LoadingScreen />;
    }

    if (studyFileErrorText) {
      return <StudyFileErrorScreen errorText={studyFileErrorText} />;
    }

    if (userInfo === null) {
      // The user hasn't logged in.
      return (
        <LoginScreen
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
          await this.logoutFnAsync();
        }}
      />
    );
  }
}
