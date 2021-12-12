import { setStatusBarStyle } from "expo-status-bar";
import firebase from "firebase/app";
import React from "react";
import { Text, View } from "react-native";
import { WebView } from "react-native-webview";

import { getInstallationIDAsync } from "../helpers/debug";
import { base64ToBase64URL, getHashedPasswordAsync } from "../helpers/helpers";
import { getLoginSessionIDAsync } from "../helpers/loginSession";
import {
  getPingsAsync,
  getThisWeekPingsAsync,
  getTodayPingsAsync,
} from "../helpers/pings";
import { secureGetUserAsync } from "../helpers/secureStore/user";
import { StudyInfo } from "../helpers/types";

const TIMEZONE_OFFSET_PLACEHOLDER = "__TIMEZONE_OFFSET__";
const INSTALLATION_ID_PLACEHOLDER = "__INSTALLATION_ID__";
const STUDY_ID_PLACEHOLDER = "__STUDY_ID__";
const STUDY_VERSION_PLACEHOLDER = "__STUDY_VERSION__";
const LOGIN_SESSION_ID_PLACEHOLDER = "__LOGIN_SESSION_ID__";
const USERNAME_PLACEHOLDER = "__USERNAME__";
const PASSWORD_HASH_PLACEHOLDER = "__PASSWORD_HASH__";
const FIREBASE_ID_TOKEN_PLACEHOLDER = "__FIREBASE_ID_TOKEN__";
const PINGS_COMPLETED_OVERALL_PLACEHOLDER = "__PINGS_COMPLETED_OVERALL__";
const PINGS_COMPLETED_THIS_WEEK_PLACEHOLDER = "__PINGS_COMPLETED_THIS_WEEK__";
const PINGS_COMPLETED_TODAY_PLACEHOLDER = "__PINGS_COMPLETED_TODAY__";
export async function getDashboardUrlAsync(
  studyInfo: StudyInfo,
  firebaseUser: firebase.User | null,
): Promise<string | null> {
  if (studyInfo.dashboardURL === undefined) {
    return null;
  }

  let dashboardUrl = studyInfo.dashboardURL;

  if (dashboardUrl.includes(TIMEZONE_OFFSET_PLACEHOLDER)) {
    const timezoneOffset = new Date().getTimezoneOffset();
    dashboardUrl = dashboardUrl
      .split(TIMEZONE_OFFSET_PLACEHOLDER)
      .join(`${timezoneOffset}`);
  }

  if (dashboardUrl.includes(INSTALLATION_ID_PLACEHOLDER)) {
    dashboardUrl = dashboardUrl
      .split(INSTALLATION_ID_PLACEHOLDER)
      .join(await getInstallationIDAsync());
  }

  if (dashboardUrl.includes(STUDY_ID_PLACEHOLDER)) {
    dashboardUrl = dashboardUrl.split(STUDY_ID_PLACEHOLDER).join(studyInfo.id);
  }

  if (dashboardUrl.includes(STUDY_VERSION_PLACEHOLDER)) {
    dashboardUrl = dashboardUrl
      .split(STUDY_VERSION_PLACEHOLDER)
      .join(studyInfo.version ?? "STUDY_VERSION_NOT_SPECIFIED");
  }

  if (dashboardUrl.includes(LOGIN_SESSION_ID_PLACEHOLDER)) {
    let loginSessionId = "N/A";
    const user = await secureGetUserAsync();
    if (user) {
      loginSessionId = await getLoginSessionIDAsync(user);
    }
    dashboardUrl = dashboardUrl
      .split(LOGIN_SESSION_ID_PLACEHOLDER)
      .join(loginSessionId);
  }

  if (dashboardUrl.includes(USERNAME_PLACEHOLDER)) {
    let username = "N/A";
    const user = await secureGetUserAsync();
    if (user) {
      username = user.username;
    }
    dashboardUrl = dashboardUrl.split(USERNAME_PLACEHOLDER).join(username);
  }

  if (dashboardUrl.includes(PASSWORD_HASH_PLACEHOLDER)) {
    let passwordHash = "N/A";
    const user = await secureGetUserAsync();
    if (user) {
      passwordHash = base64ToBase64URL(
        await getHashedPasswordAsync(user.password),
      );
    }
    dashboardUrl = dashboardUrl
      .split(PASSWORD_HASH_PLACEHOLDER)
      .join(passwordHash);
  }

  if (dashboardUrl.includes(FIREBASE_ID_TOKEN_PLACEHOLDER)) {
    let firebaseIdToken = "N/A";
    if (firebaseUser !== null) {
      firebaseIdToken = await firebaseUser.getIdToken(true);
    }
    // https://stackoverflow.com/a/1145525/2603230
    dashboardUrl = dashboardUrl
      .split(FIREBASE_ID_TOKEN_PLACEHOLDER)
      .join(firebaseIdToken);
  }

  if (dashboardUrl.includes(PINGS_COMPLETED_OVERALL_PLACEHOLDER)) {
    const numberOfPingsCompletedOverall = (await getPingsAsync()).length;
    dashboardUrl = dashboardUrl
      .split(PINGS_COMPLETED_OVERALL_PLACEHOLDER)
      .join(`${numberOfPingsCompletedOverall}`);
  }

  if (dashboardUrl.includes(PINGS_COMPLETED_THIS_WEEK_PLACEHOLDER)) {
    const numberOfPingsCompletedThisWeek = (await getThisWeekPingsAsync())
      .length;
    dashboardUrl = dashboardUrl
      .split(PINGS_COMPLETED_THIS_WEEK_PLACEHOLDER)
      .join(`${numberOfPingsCompletedThisWeek}`);
  }

  if (dashboardUrl.includes(PINGS_COMPLETED_TODAY_PLACEHOLDER)) {
    const numberOfPingsCompletedToday = (await getTodayPingsAsync()).length;
    dashboardUrl = dashboardUrl
      .split(PINGS_COMPLETED_TODAY_PLACEHOLDER)
      .join(`${numberOfPingsCompletedToday}`);
  }

  return dashboardUrl;
}

interface DashboardComponentProps {
  studyInfo: StudyInfo;
  firebaseUser: firebase.User | null;
}
const DashboardComponent: React.FunctionComponent<DashboardComponentProps> = ({
  studyInfo,
  firebaseUser,
}) => {
  if (studyInfo.dashboardURL === undefined) {
    return <></>;
  }

  const [url, setUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    async function setDashboardUrlAsync() {
      const dashboardUrl = await getDashboardUrlAsync(studyInfo, firebaseUser);
      setUrl(dashboardUrl);
    }
    setDashboardUrlAsync();
  }, [studyInfo, firebaseUser]);

  return (
    <View style={{ flex: 1, marginTop: 20, marginHorizontal: 20 }}>
      {url ? (
        <WebView
          source={{ uri: url }}
          cacheEnabled={false}
          // TODO: Use `autoManageStatusBarEnabled` after https://github.com/react-native-community/react-native-webview/pull/914 is in Expo
          // https://github.com/react-native-community/react-native-webview/issues/735#issuecomment-629073261
          onNavigationStateChange={(navState) => {
            setStatusBarStyle("dark");
          }}
        />
      ) : (
        <Text style={{ textAlign: "center", fontSize: 16 }}>Loading...</Text>
      )}
    </View>
  );
};

export default DashboardComponent;
