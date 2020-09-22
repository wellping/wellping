import { Subscription } from "@unimodules/core";
import { format, getDay } from "date-fns";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import * as firebase from "firebase/app";
import React from "react";
import {
  Button,
  Text,
  View,
  ScrollView,
  Alert,
  Clipboard,
  Platform,
  TouchableWithoutFeedback,
  AppState,
  AppStateStatus,
} from "react-native";

import SurveyScreen, { SurveyScreenState } from "./SurveyScreen";
import DashboardComponent, {
  getDashboardUrlAsync,
} from "./components/DashboardComponent";
import {
  dequeueFuturePingIfAny,
  getFuturePingsQueue,
  initFuturePingQueueAsync,
} from "./helpers/asyncStorage/futurePings";
import {
  getNotificationTimesAsync,
  clearNotificationTimesAsync,
} from "./helpers/asyncStorage/notificationTimes";
import {
  getPingStateAsync,
  clearPingStateAsync,
} from "./helpers/asyncStorage/pingState";
import { getPingsListAsync } from "./helpers/asyncStorage/pingsList";
import { clearAllPingsAndAnswersAsync } from "./helpers/cleanup";
import { uploadDataAsync, getAllDataAsync } from "./helpers/dataUpload";
import {
  getNonCriticalProblemTextForUser,
  JS_VERSION_NUMBER,
  getUsefulDebugInfo,
  alertWithShareButtonContainingDebugInfo,
  HOME_SCREEN_DEBUG_VIEW_SYMBOLS,
} from "./helpers/debug";
import { firebaseLoginAsync, firebaseInitialized } from "./helpers/firebase";
import {
  setNotificationsAsync,
  setupNotificationsPermissionAsync,
  getCurrentNotificationTimeAsync,
  getIncomingNotificationTimeAsync,
  clearSentNotificationsAsync,
  _sendTestNotificationAsync,
} from "./helpers/notifications";
import {
  getLatestPingAsync,
  getTodayPingsAsync,
  insertPingAsync,
  getNumbersOfPingsForAllStreamNamesAsync,
} from "./helpers/pings";
import { secureGetUserAsync } from "./helpers/secureStore/user";
import { getSymbolsForServerTypeUsed, useFirebase } from "./helpers/server";
import {
  getAllStreamNames,
  getStudyStartDate,
  getStudyEndDate,
  getStudyInfoAsync,
} from "./helpers/studyFile";
import { styles } from "./helpers/styles";
import { Streams, StreamName, StudyInfo, Ping } from "./helpers/types";
import LoadingScreen from "./screens/LoadingScreen";

interface HomeScreenProps {
  studyInfo: StudyInfo;
  streams: Streams;
  logout: () => Promise<void>;
}

interface HomeScreenState {
  appState: AppStateStatus;
  time: Date;
  allowsNotifications: boolean;
  currentNotificationTime: Date | null;
  currentPing: Ping | null;
  isLoading: boolean;
  storedPingStateAsync: SurveyScreenState | null;
  uploadStatusSymbol: string;

  /**
   * For when Firebase server is used.
   *
   * If Firebase server is not used, it is always `null`.
   */
  firebaseUser: firebase.User | null;

  // DEBUG
  displayDebugView: boolean;
}

export default class HomeScreen extends React.Component<
  HomeScreenProps,
  HomeScreenState
> {
  interval!: ReturnType<typeof setInterval>;

  constructor(props: HomeScreenProps) {
    super(props);

    this.state = {
      appState: AppState.currentState,
      time: new Date(),
      allowsNotifications: true,
      currentNotificationTime: null,
      currentPing: null,
      isLoading: true,
      displayDebugView: false,
      storedPingStateAsync: null,
      uploadStatusSymbol: HOME_SCREEN_DEBUG_VIEW_SYMBOLS.UPLOAD.INITIAL,
      firebaseUser: null,
    };
  }

  async checkIfPingHasExpiredAsync() {
    const previousNotificationTime = this.state.currentNotificationTime;

    const currentNotificationTime = await getCurrentNotificationTimeAsync();
    this.setState({ time: new Date(), currentNotificationTime });

    // Because we cannot compare data directly, we have to compare the time with
    // `getTime`.
    // https://stackoverflow.com/a/7244571/2603230
    const previousNotificationTimeNumber =
      previousNotificationTime && previousNotificationTime.getTime();
    const currentNotificationTimeNumber =
      currentNotificationTime && currentNotificationTime.getTime();
    if (currentNotificationTimeNumber !== previousNotificationTimeNumber) {
      // It means that the previous ping has ended. We are either in between
      // two pings or in a new ping. So we can reset `currentPing` state.
      this.setState({ currentPing: null });
    }
  }

  _handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (
      this.state.appState.match(/inactive|background/) &&
      nextAppState === "active"
    ) {
      // App has come to the foreground.
      this.checkIfPingHasExpiredAsync();
    }
    this.setState({ appState: nextAppState });
  };

  notificationResponseReceivedListener: Subscription | null = null;
  unregisterAuthObserver: firebase.Unsubscribe | null = null;
  async componentDidMount() {
    const { studyInfo } = this.props;

    const allowsNotifications = await setupNotificationsPermissionAsync();
    if (!allowsNotifications) {
      this.setState({ allowsNotifications: false });
    }

    await clearSentNotificationsAsync();

    await setNotificationsAsync();

    // Check if the current notification expires.
    this.interval = setInterval(async () => {
      await this.checkIfPingHasExpiredAsync();
    }, 30 * 1000);
    // Do this initially too.
    await this.checkIfPingHasExpiredAsync();

    this.notificationResponseReceivedListener = Notifications.addNotificationResponseReceivedListener(
      async () => {
        await this.checkIfPingHasExpiredAsync();
        await clearSentNotificationsAsync();
      },
    );

    AppState.addEventListener("change", this._handleAppStateChange);

    const latestPing = await getLatestPingAsync();
    //console.warn(latestStartedPing);
    const currentNotificationTime = await getCurrentNotificationTimeAsync();
    if (
      latestPing &&
      currentNotificationTime &&
      latestPing.notificationTime.getTime() ===
        currentNotificationTime.getTime()
    ) {
      const storedPingStateAsync = await getPingStateAsync(latestPing.id);
      //console.warn(storedPingStateAsync);
      this.setState({
        storedPingStateAsync,
        currentPing: latestPing,
      });
    }

    if (useFirebase(studyInfo) && firebaseInitialized()) {
      this.unregisterAuthObserver = firebase.auth().onAuthStateChanged(
        async (firebaseUser) => {
          if (firebaseUser) {
            // The user is signed in to Firebase.
            // Notice that Firebase Authentication sessions are long lived,
            // meaning that the user is still signed in even if e.g. there is
            // no Internet.
            // As such, we can safely show alert in `else` branch.
            // See https://firebase.google.com/docs/auth/admin/manage-sessions.
            this.setState({ firebaseUser });
          } else {
            // The user is not signed in to Firebase.

            // We will try to log in the user again first.
            const localStoredUser = await secureGetUserAsync();
            if (localStoredUser === null) {
              alertWithShareButtonContainingDebugInfo(
                "Not logged in locally!",
                "Error",
              );
              return;
            }

            try {
              await firebaseLoginAsync(localStoredUser);
              // If the login is successful, this `onAuthStateChanged` callback
              // will be called again, so we don't have to do anything here.
            } catch (e) {
              alertWithShareButtonContainingDebugInfo(
                // I'm pretty sure Internet has nothing to do with this, but
                // we will still tell user to connect to the Internet just in
                // case.
                `Firebase login failed!\nNo data will be uploaded.\n\n` +
                  `Please make sure you are connected to the Internet and ` +
                  `then try restarting the app. If this error persists, ` +
                  `please contact the research staff.\n\n(${e})`,
                "Warning",
              );
            }
          }
        },
        (e) => {
          // Unsure when will this be called.
          alertWithShareButtonContainingDebugInfo(
            `onAuthStateChanged error: ${e}`,
          );
        },
      );
    }

    this.setState({ isLoading: false });
  }

  componentWillUnmount() {
    clearInterval(this.interval);

    AppState.removeEventListener("change", this._handleAppStateChange);

    if (this.unregisterAuthObserver) {
      this.unregisterAuthObserver();
    }

    if (this.notificationResponseReceivedListener) {
      this.notificationResponseReceivedListener.remove();
    }
  }

  async startSurveyAsync() {
    const studyInfo = this.props.studyInfo;

    const todayWeekday = getDay(new Date());
    const todayPings = await getTodayPingsAsync();

    const pingsList = await getPingsListAsync();
    const newPingNth = pingsList.length + 1;

    let newStreamName: StreamName;
    if (todayPings.length >= studyInfo.frequency.hoursEveryday.length) {
      alertWithShareButtonContainingDebugInfo(
        getNonCriticalProblemTextForUser(
          `todayPings.length (${todayPings.length}) > ${studyInfo.frequency.hoursEveryday.length}`,
        ),
      );

      newStreamName = studyInfo.streamInCaseOfError;
    } else if (
      studyInfo.streamsForNthPings &&
      studyInfo.streamsForNthPings[`${newPingNth}`]
    ) {
      newStreamName = studyInfo.streamsForNthPings[`${newPingNth}`];
    } else {
      newStreamName = studyInfo.streamsOrder[todayWeekday][todayPings.length];

      if (
        !(studyInfo.streamsNotReplacedByFollowupStream || []).includes(
          newStreamName,
        )
      ) {
        const futurePingIfAny = await dequeueFuturePingIfAny();
        if (futurePingIfAny) {
          newStreamName = futurePingIfAny.streamName;
        }
      }
    }

    await this._startSurveyTypeAsync(newStreamName);

    // So that the notification text ("n pings left") can be updated.
    await setNotificationsAsync();
  }

  async _startSurveyTypeAsync(streamName: StreamName) {
    const { currentNotificationTime } = this.state;
    const newPing = await insertPingAsync({
      notificationTime: currentNotificationTime!,
      startTime: new Date(),
      streamName,
    });

    this.setState({
      currentPing: newPing,
      storedPingStateAsync: null,
    });
  }

  setUploadStatusSymbol = (symbol: string) => {
    this.setState({ uploadStatusSymbol: symbol });
  };

  render() {
    const { studyInfo, streams } = this.props;

    const {
      allowsNotifications,
      currentNotificationTime,
      currentPing,
      firebaseUser,
      isLoading,
    } = this.state;

    if (isLoading) {
      return <LoadingScreen />;
    }

    const ExtraView = allowsNotifications ? (
      <>
        <TouchableWithoutFeedback
          onLongPress={() => {
            if (__DEV__) {
              this.setState({ displayDebugView: true });
            }
          }}
        >
          <View style={{ height: 20 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
              }}
            >
              <TouchableWithoutFeedback
                onPress={async () => {
                  const nextPingTime = await getIncomingNotificationTimeAsync();
                  const nextPingTimeString = nextPingTime
                    ? nextPingTime.toString()
                    : "N/A";
                  Alert.alert(
                    "Well Ping",
                    `Thank you for using Well Ping!\n` +
                      `You will receive your next ping on ${nextPingTimeString}.`,
                    [
                      {
                        text: "OK",
                        onPress: () => {},
                        style: "cancel",
                      },
                    ],
                  );
                }}
              >
                {this.state.uploadStatusSymbol.length > 1 ? (
                  // If it is not a one-character symbol, there is an error.
                  // We will hide the version code to show the error code.
                  <Text style={{ color: "orange" }}>
                    {this.state.uploadStatusSymbol}
                  </Text>
                ) : (
                  <Text style={{ color: "lightblue" }}>
                    {JS_VERSION_NUMBER}
                    {getSymbolsForServerTypeUsed(studyInfo)}
                    {useFirebase(studyInfo) && firebaseUser === null
                      ? HOME_SCREEN_DEBUG_VIEW_SYMBOLS.FIREBASE_AUTH
                          .NOT_LOGGED_IN
                      : HOME_SCREEN_DEBUG_VIEW_SYMBOLS.FIREBASE_AUTH.LOGGED_IN}
                    {this.state.uploadStatusSymbol}
                  </Text>
                )}
              </TouchableWithoutFeedback>
              {studyInfo.contactEmail && (
                <TouchableWithoutFeedback
                  onPress={async () => {
                    const user = await secureGetUserAsync();

                    const emailSubject = encodeURIComponent(
                      `Questions about Well Ping study ${studyInfo.id}`,
                    );
                    const emailBody = encodeURIComponent(
                      `Please enter your question here (please attach a screenshot if applicable):\n\n\n\n\n\n` +
                        `====\n` +
                        `User ID: ${user!.username}\n` +
                        getUsefulDebugInfo(),
                    );
                    const mailtoLink = `mailto:${studyInfo.contactEmail}?subject=${emailSubject}&body=${emailBody}`;
                    Linking.openURL(mailtoLink);
                  }}
                >
                  <Text style={{ color: "lightblue", marginLeft: 20 }}>
                    Contact Staff
                  </Text>
                </TouchableWithoutFeedback>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </>
    ) : (
      <View>
        <Text style={{ color: "red", fontWeight: "bold" }}>
          If you'd like to receive reminders and updates on your participation,
          please allow Well Ping to send you notifications.
        </Text>
      </View>
    );

    const DebugView: React.FunctionComponent = ({ children }) => {
      if (!this.state.displayDebugView) {
        return <></>;
      }
      return (
        <ScrollView
          style={{
            backgroundColor: "yellow",
            maxHeight: 140,
          }}
          contentContainerStyle={{
            padding: 5,
          }}
        >
          <Text>
            Time: {format(this.state.time, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")}
          </Text>
          <Text>
            Current ping's notification time:{" "}
            {this.state.currentNotificationTime
              ? format(
                  this.state.currentNotificationTime,
                  "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
                )
              : "IS NULL"}
          </Text>
          <Text>
            this.state.currentPing: {JSON.stringify(this.state.currentPing)}
          </Text>
          <Text>
            this.state.firebaseUser: {JSON.stringify(this.state.firebaseUser)}
          </Text>
          <Button
            color="green"
            title="hide debug view"
            onPress={() => {
              this.setState({ displayDebugView: false });
            }}
          />
          <Button
            color="orange"
            title="getStudyInfoAsync()"
            onPress={async () => {
              alertWithShareButtonContainingDebugInfo(
                JSON.stringify(await getStudyInfoAsync()),
              );
            }}
          />
          <Button
            color="orange"
            title="getStudyStartDate()"
            onPress={async () => {
              alertWithShareButtonContainingDebugInfo(
                getStudyStartDate(await getStudyInfoAsync()).toString(),
              );
            }}
          />
          <Button
            color="orange"
            title="getStudyEndDate()"
            onPress={async () => {
              alertWithShareButtonContainingDebugInfo(
                getStudyEndDate(await getStudyInfoAsync()).toString(),
              );
            }}
          />
          <Button
            color="orange"
            title="getIncomingNotificationTimeAsync()"
            onPress={async () => {
              const nextPingTime = await getIncomingNotificationTimeAsync();
              alertWithShareButtonContainingDebugInfo(
                nextPingTime
                  ? format(nextPingTime, "yyyy-MM-dd' T 'HH:mm:ss.SSSxxx")
                  : "IS NULL",
              );
            }}
          />
          <Button
            color="orange"
            title="getLatestPingAsync()"
            onPress={async () => {
              const latestStartedPing = await getLatestPingAsync();
              alertWithShareButtonContainingDebugInfo(
                JSON.stringify(latestStartedPing),
              );
            }}
          />
          <Button
            color="orange"
            title="getCurrentNotificationTimeAsync()"
            onPress={async () => {
              const currentNotificationTime = await getCurrentNotificationTimeAsync();
              alertWithShareButtonContainingDebugInfo(
                JSON.stringify(currentNotificationTime),
              );
            }}
          />
          <Button
            color="red"
            title="clear current ping state"
            onPress={async () => {
              const latestStartedPing = await getLatestPingAsync();
              if (latestStartedPing) {
                await clearPingStateAsync(latestStartedPing.id);
                alert("Cleared. Please restart app");
              } else {
                alert("No current ping.");
              }
            }}
          />
          <Button
            color="orange"
            title="getNotificationTimesAsync()"
            onPress={async () => {
              const notificationsTimes = await getNotificationTimesAsync();
              let text = "";
              notificationsTimes!.forEach((element) => {
                text += format(element, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx") + `\n`;
              });
              alertWithShareButtonContainingDebugInfo(text);
            }}
          />
          <Button
            color="orange"
            title="getNumbersOfPingsForAllStreamNamesAsync()"
            onPress={async () => {
              const typesOfPingsAnswered = await getNumbersOfPingsForAllStreamNamesAsync();
              alertWithShareButtonContainingDebugInfo(
                JSON.stringify(typesOfPingsAnswered),
              );
            }}
          />
          <Button
            color="orange"
            title="secureGetUserAsync()"
            onPress={async () => {
              const user = await secureGetUserAsync();
              alertWithShareButtonContainingDebugInfo(JSON.stringify(user));
            }}
          />
          <Button
            color="orange"
            title="getFuturePingsQueue()"
            onPress={async () => {
              const futurePingsQueues = await getFuturePingsQueue();
              alertWithShareButtonContainingDebugInfo(
                JSON.stringify(futurePingsQueues),
              );
            }}
          />
          <Button
            color="red"
            title="reset/initFuturePingQueueAsync()"
            onPress={async () => {
              await initFuturePingQueueAsync();
            }}
          />
          <Button
            color="orange"
            title="getAllDataAsync()"
            onPress={async () => {
              const allData = await getAllDataAsync();
              alertWithShareButtonContainingDebugInfo(JSON.stringify(allData));
            }}
          />
          <Button
            color="orange"
            title="uploadDataAsync()"
            onPress={async () => {
              const response = await uploadDataAsync(
                studyInfo,
                this.setUploadStatusSymbol,
              );
              alertWithShareButtonContainingDebugInfo(`${response}`);
            }}
          />
          <Button
            color="orange"
            title="send a local notification"
            onPress={async () => {
              await _sendTestNotificationAsync();
            }}
          />
          <Button
            color="orange"
            title="copy dashboard url"
            onPress={async () => {
              const url = await getDashboardUrlAsync(
                studyInfo.dashboardURL ||
                  "studyInfo.dashboardURL === undefined",
                firebaseUser,
              );
              Clipboard.setString(url);
              alertWithShareButtonContainingDebugInfo(url);
            }}
          />
          <Button
            color="red"
            onPress={() => {
              Alert.alert("Log out", "Are you sure you want to log out?", [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Log out",
                  style: "destructive",
                  onPress: async () => {
                    await this.props.logout();
                  },
                },
              ]);
            }}
            title="Logout"
          />
          <Button
            color="red"
            onPress={() => {
              Alert.alert(
                "Dangerous",
                "This will clear future notifications. Restart the app to reset future notifications.",
                [
                  {
                    text: "Cancel",
                    style: "cancel",
                  },
                  {
                    text: "Confirm",
                    style: "destructive",
                    onPress: async () => {
                      await clearNotificationTimesAsync();
                    },
                  },
                ],
              );
            }}
            title="Reset notifications (restart needed)"
          />
          <Button
            color="red"
            onPress={() => {
              Alert.alert(
                "Dangerous",
                "Doing this will reset all your previous survey data both locally and on the server.",
                [
                  {
                    text: "Cancel",
                    style: "cancel",
                  },
                  {
                    text: "Confirm",
                    style: "destructive",
                    onPress: async () => {
                      await clearAllPingsAndAnswersAsync();
                      alert("Done! Please restart the app.");
                    },
                  },
                ],
              );
            }}
            title="Reset pings/app (restart needed)"
          />
          {children}
        </ScrollView>
      );
    };

    if (currentNotificationTime == null) {
      // We include `> endDate` and `< startDate` inside
      // `currentNotificationTime == null` so that the user can normally finish
      // their last ping even if it's after the end date.

      if (new Date() > getStudyEndDate(studyInfo)) {
        return (
          <View style={{ height: "100%" }}>
            {ExtraView}
            <DebugView />
            <Text style={styles.onlyTextStyle}>
              Thank you for your participation!
            </Text>
            <Text
              style={{
                marginTop: 10,
                marginHorizontal: 10,
                textAlign: "center",
              }}
            >
              The study has concluded on{"\n"}
              {format(getStudyEndDate(studyInfo), "PPPP")}.{"\n\n"}
              You may now uninstall Well Ping from your phone.
            </Text>
          </View>
        );
      }

      if (new Date() < getStudyStartDate(studyInfo)) {
        return (
          <View style={{ height: "100%" }}>
            {ExtraView}
            <DebugView />
            <Text style={styles.onlyTextStyle}>Welcome to Well Ping!</Text>
            <Text
              style={{
                marginTop: 10,
                marginHorizontal: 10,
                textAlign: "center",
              }}
            >
              You will receive your first ping on{"\n"}
              {format(getStudyStartDate(studyInfo), "PPPP")}.
            </Text>
          </View>
        );
      }

      return (
        <View style={{ height: "100%" }}>
          {ExtraView}
          <DebugView />
          <Text style={styles.onlyTextStyle}>
            There is currently no active survey. You will receive a notification
            with a survey soon!
          </Text>
          <DashboardComponent
            firebaseUser={firebaseUser}
            studyInfo={studyInfo}
          />
        </View>
      );
    }

    if (currentPing == null) {
      const streamButtons = [];
      for (const streamName of getAllStreamNames(studyInfo)) {
        streamButtons.push(
          <Button
            color="orange"
            key={streamName}
            title={`Start "${streamName}" stream`}
            onPress={() => {
              this._startSurveyTypeAsync(streamName);
            }}
          />,
        );
      }

      return (
        <View style={{ height: "100%" }}>
          {ExtraView}
          <DebugView>{streamButtons}</DebugView>
          <Text
            style={{ fontSize: 30, marginVertical: 20, textAlign: "center" }}
          >
            Welcome to Well Ping!
          </Text>
          <View style={{ marginHorizontal: 20 }}>
            <Button
              title="Click here to start the survey"
              onPress={() => {
                this.startSurveyAsync();
              }}
            />
          </View>
          <DashboardComponent
            firebaseUser={firebaseUser}
            studyInfo={studyInfo}
          />
        </View>
      );
    }

    if (currentPing.endTime) {
      return (
        <View style={{ height: "100%" }}>
          {ExtraView}
          <DebugView />
          <Text style={styles.onlyTextStyle}>
            Thank you. You have completed the survey for this ping.{"\n"}You
            will receive a notification with the next survey soon!
            {Platform.OS === "ios" && "\nPlease close the app."}
          </Text>
        </View>
      );
    }

    return (
      <View style={{ height: "100%" }}>
        {ExtraView}
        <SurveyScreen
          questions={streams[currentPing.streamName]}
          startingQuestionId={
            studyInfo.streamsStartingQuestionIds[currentPing.streamName]
          }
          ping={currentPing}
          previousState={this.state.storedPingStateAsync}
          onFinish={(finishedPing) => {
            this.setState({ currentPing: finishedPing });
            uploadDataAsync(studyInfo, this.setUploadStatusSymbol);
          }}
          studyInfo={studyInfo}
          setUploadStatusSymbol={this.setUploadStatusSymbol}
        />
        <DebugView />
      </View>
    );
  }
}
