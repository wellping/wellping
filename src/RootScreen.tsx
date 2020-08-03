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
  getUserAsync,
  User,
  clearUserAsync,
} from "./helpers/asyncStorage/user";
import { connectDatabaseAsync } from "./helpers/database";
import { getCriticalProblemTextForUser } from "./helpers/debug";
import {
  getStudyFileAsync,
  downloadStudyFileAsync,
  parseAndStoreStudyFileAsync,
  studyFileExistsAsync,
} from "./helpers/studyFile";
import { StudyFile } from "./helpers/types";
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
    isRedownload,
    handleNetworkErrorAsync,
  }: ParamDownloadAndParseStudyFileAsync): Promise<boolean> {
    let rawJsonString: string;
    try {
      rawJsonString = await downloadStudyFileAsync(url);
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

      // Do it in background because there isn't any urgency to redownload.
      this.downloadAndParseStudyFileAsync({
        url: survey.studyInfo.studyFileJsonURL,
        isRedownload: true,
        handleNetworkErrorAsync: async () => {
          // No need to handle network error.
          // Just do it next time.
        },
      });

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
    }

    this.setState({ isLoading: false });
  }

  async logoutAsync() {
    await clearUserAsync();
    await clearCurrentStudyFileAsync();
    this.setState({ userInfo: null });
  }

  render() {
    const { isLoading, userInfo, studyFileErrorText } = this.state;
    if (isLoading) {
      return <LoadingScreen />;
    }

    if (studyFileErrorText) {
      return <StudyFileErrorScreen errorText={studyFileErrorText} />;
    }

    if (userInfo == null) {
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
          await this.logoutAsync();
        }}
      />
    );
  }
}
