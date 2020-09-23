import { setStatusBarStyle } from "expo-status-bar";
import * as firebase from "firebase/app";
import React from "react";
import { Text, View } from "react-native";
import { WebView } from "react-native-webview";

import {
  getPingsAsync,
  getThisWeekPingsAsync,
  getTodayPingsAsync,
} from "../helpers/pings";
import { secureGetUserAsync } from "../helpers/secureStore/user";
import { StudyInfo } from "../helpers/types";

const USERNAME_PLACEHOLDER = "__USERNAME__";
const FIREBASE_ID_TOKEN_PLACEHOLDER = "__FIREBASE_ID_TOKEN__";
const PINGS_COMPLETED_OVERALL_PLACEHOLDER = "__PINGS_COMPLETED_OVERALL__";
const PINGS_COMPLETED_THIS_WEEK_PLACEHOLDER = "__PINGS_COMPLETED_THIS_WEEK__";
const PINGS_COMPLETED_TODAY_PLACEHOLDER = "__PINGS_COMPLETED_TODAY__";
export async function getDashboardUrlAsync(
  dashboardRawURL: string,
  firebaseUser: firebase.User | null,
) {
  let dashboardUrl = dashboardRawURL;

  if (dashboardUrl.includes(USERNAME_PLACEHOLDER)) {
    let username = "N/A";
    const user = await secureGetUserAsync();
    if (user) {
      username = user.username;
    }
    dashboardUrl = dashboardUrl.split(USERNAME_PLACEHOLDER).join(username);
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

  const dashboardRawURL = studyInfo.dashboardURL;

  const [url, setUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    async function setDashboardUrlAsync() {
      const dashboardUrl = await getDashboardUrlAsync(
        dashboardRawURL,
        firebaseUser,
      );
      setUrl(dashboardUrl);
    }
    setDashboardUrlAsync();
  }, [studyInfo, firebaseUser]);

  return (
    <View style={{ flex: 1, marginTop: 20 }}>
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
