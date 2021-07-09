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
  TouchableOpacity,
  AppState,
  AppStateStatus,
} from "react-native";

import SurveyScreen, { SurveyScreenState } from "./SurveyScreen";
import DashboardComponent, {
  getDashboardUrlAsync,
} from "./components/DashboardComponent";
import HideKeyboardButtonAndWrapper from "./components/HideKeyboardButtonAndWrapper";
import { getAnswersPingIdsQuestionIdsListAsync } from "./helpers/asyncStorage/answersPingIdsQuestionIdsList";
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
import {
  addToUnuploadedPingsListIfNeededAsync,
  getUnuploadedPingsListAsync,
  removeFromUnuploadedPingsListAsync,
} from "./helpers/asyncStorage/unuploadedPingsList";
import { clearAllPingsAndAnswersAsync } from "./helpers/cleanup";
import {
  uploadDataAsync,
  getAllDataAsync,
  getUnuploadedDataAsync,
} from "./helpers/dataUpload";
import {
  getNonCriticalProblemTextForUser,
  JS_VERSION_NUMBER,
  getUsefulDebugInfo,
  alertWithShareButtonContainingDebugInfo,
  HOME_SCREEN_DEBUG_VIEW_SYMBOLS,
} from "./helpers/debug";
import { firebaseLoginAsync, firebaseInitialized } from "./helpers/firebase";
import { getLoginSessionID } from "./helpers/loginSession";
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
import {
  DataUploadServerResponse,
  getSymbolsForServerTypeUsed,
  useFirebase,
} from "./helpers/server";
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
   * Only used for the upload process after a ping has been completed.
   */
  afterFinishingPing_isUploading: boolean;

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

    await clearSentNotificationsAsync();
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
    await new Promise((resolve) => this.setState({ isLoading: true }, resolve));

    const studyInfo = this.props.studyInfo;

    const todayWeekday = getDay(new Date());
    const todayPings = await getTodayPingsAsync();

    const pingsList = await getPingsListAsync();
    const newPingNth = pingsList.length + 1;

    let newStreamName: StreamName;
    if (todayPings.length >= studyInfo.frequency.hoursEveryday.length) {
      alertWithShareButtonContainingDebugInfo(
        getNonCriticalProblemTextForUser(
          `todayPings.length (${todayPings.length}) >= ${studyInfo.frequency.hoursEveryday.length}`,
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

    // TODO: should this be after setNotificationsAsync?
    await new Promise((resolve) =>
      this.setState({ isLoading: false }, resolve),
    );

    // So that the notification text ("n pings left") can be updated.
    await setNotificationsAsync();
  }

  async _uploadUnuploadedDataAndRemoveFromThemIfSuccessfulAsync({
    doAfterResponseAsync = async (_) => {},
    doAfterErrorAsync = async (_) => {},
    doFinally = () => {},
  }: {
    doAfterResponseAsync?: (
      response: DataUploadServerResponse,
    ) => Promise<void>;
    doAfterErrorAsync?: (error: any) => Promise<void>;
    doFinally?: () => void;
  } = {}) {
    const { studyInfo } = this.props;
    // We need to store `prevUnuploaded` beforehand because unuploaded pings list
    // might be changed during we are doing `uploadDataAsync`. And we don't want
    // to remove the newly added pings that we haven't uploaded.
    const prevUnuploaded = await getUnuploadedPingsListAsync();
    const prevData = await getUnuploadedDataAsync();
    uploadDataAsync(studyInfo, this.setUploadStatusSymbol, {
      unuploadedOnly: true,
      // We do this to avoid the data being modified before being uploaded.
      prefetchedData: prevData,
    })
      .then(async (response) => {
        // We have to use `.then` here because we don't want to block.
        await removeFromUnuploadedPingsListAsync(prevUnuploaded);
        await doAfterResponseAsync(response);
      })
      .catch(async (e) => {
        // There's some error in uploading.
        // Do nothing (keep the unuploaded pings list unmodified).
        console.warn(`Upload error! ${e}`);
        await doAfterErrorAsync(e);
      })
      .finally(() => {
        doFinally();
      });
  }

  async _startSurveyTypeAsync(streamName: StreamName) {
    // Upload and clear old unuploaded pings.
    await this._uploadUnuploadedDataAndRemoveFromThemIfSuccessfulAsync();

    // Create new ping.
    const { currentNotificationTime } = this.state;
    const newPing = await insertPingAsync({
      notificationTime: currentNotificationTime!,
      startTime: new Date(),
      streamName,
    });

    // Add this ping to unuploaded pings list.
    await addToUnuploadedPingsListIfNeededAsync(newPing);

    this.setState({
      currentPing: newPing,
      storedPingStateAsync: null,
    });
  }

  setUploadStatusSymbol = (symbol: string) => {
    this.setState({ uploadStatusSymbol: symbol });
  };

  async _forceUploadAllDataAsync({
    successTitle,
    getSuccessMessage = (response) => JSON.stringify(response),
    errorTitle,
    getErrorMessage = (error) => getNonCriticalProblemTextForUser(`${error}`),
  }: {
    successTitle: string;
    getSuccessMessage?: (response: DataUploadServerResponse) => string;
    errorTitle: string;
    getErrorMessage?: (error: any) => string;
  }) {
    const { studyInfo } = this.props;
    try {
      const response = await uploadDataAsync(
        studyInfo,
        this.setUploadStatusSymbol,
        { unuploadedOnly: false },
      );
      alertWithShareButtonContainingDebugInfo(
        getSuccessMessage(response),
        successTitle,
      );
    } catch (e) {
      alertWithShareButtonContainingDebugInfo(getErrorMessage(e), errorTitle);
    }
  }

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
      <TouchableWithoutFeedback
        onLongPress={() => {
          if (__DEV__) {
            this.setState({ displayDebugView: true });
          }
        }}
      >
        <View style={{ height: 20 }}>
          <HideKeyboardButtonAndWrapper>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
              }}
            >
              <TouchableOpacity
                onPress={async () => {
                  Alert.alert(
                    "Well Ping",
                    `Thank you for using Well Ping!`,
                    [
                      {
                        text: "Send me a test notification!",
                        onPress: async () => {
                          await _sendTestNotificationAsync();
                        },
                      },
                      {
                        text: "What's my current data?",
                        onPress: async () => {
                          Alert.alert(
                            "View/Upload Data",
                            `Please select the type of data you want to view and/or upload.`,
                            [
                              {
                                text: "All Data",
                                onPress: async () => {
                                  const allData = await getAllDataAsync();
                                  alertWithShareButtonContainingDebugInfo(
                                    JSON.stringify(allData),
                                    "All Data",
                                    [
                                      {
                                        text: "Force Upload ALL Current Data",
                                        onPress: async () => {
                                          await this._forceUploadAllDataAsync({
                                            successTitle:
                                              "Data Uploaded Successfully!",
                                            errorTitle:
                                              "Error: Data Upload Error!",
                                          });
                                        },
                                      },
                                    ],
                                  );
                                },
                              },
                              {
                                text: "Unuploaded Data",
                                onPress: async () => {
                                  const unuploadedData = await getUnuploadedDataAsync();
                                  alertWithShareButtonContainingDebugInfo(
                                    JSON.stringify(unuploadedData),
                                    "Unuploaded Data",
                                    [
                                      {
                                        text: "Upload Unuploaded Data",
                                        onPress: async () => {
                                          await this._uploadUnuploadedDataAndRemoveFromThemIfSuccessfulAsync(
                                            {
                                              doAfterResponseAsync: async (
                                                response,
                                              ) => {
                                                alertWithShareButtonContainingDebugInfo(
                                                  `Response: ${JSON.stringify(
                                                    response,
                                                  )}`,
                                                  "Data Uploaded Successfully!",
                                                );
                                              },
                                              doAfterErrorAsync: async (
                                                error,
                                              ) => {
                                                alertWithShareButtonContainingDebugInfo(
                                                  getNonCriticalProblemTextForUser(
                                                    `Error: ${error}`,
                                                  ),
                                                  "Error: Data Upload Error!",
                                                );
                                              },
                                            },
                                          );
                                        },
                                      },
                                    ],
                                  );
                                },
                              },
                              {
                                text: "Cancel",
                                onPress: () => {},
                                style: "cancel",
                              },
                            ],
                            { cancelable: true, onDismiss: () => {} },
                          );
                        },
                      },
                      {
                        text: "OK",
                        onPress: () => {},
                        style: "cancel",
                      },
                    ],
                    { cancelable: true, onDismiss: () => {} },
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
                  <Text style={{ color: "lightgray" }}>
                    {JS_VERSION_NUMBER}
                    {getSymbolsForServerTypeUsed(studyInfo)}
                    {useFirebase(studyInfo) && firebaseUser === null
                      ? HOME_SCREEN_DEBUG_VIEW_SYMBOLS.FIREBASE_AUTH
                          .NOT_LOGGED_IN
                      : HOME_SCREEN_DEBUG_VIEW_SYMBOLS.FIREBASE_AUTH.LOGGED_IN}
                    {this.state.uploadStatusSymbol}
                  </Text>
                )}
              </TouchableOpacity>
              {studyInfo.contactEmail && (
                <TouchableOpacity
                  onPress={async () => {
                    let user = await secureGetUserAsync();
                    if (user === null) {
                      user = {
                        username: "UNKNOWN ERROR CANNOT GET USER",
                        password: "N/A",
                        loginDate: -1,
                      };
                    }

                    const emailSubject = encodeURIComponent(
                      `Questions about Well Ping study ${studyInfo.id}`,
                    );
                    const emailBody = encodeURIComponent(
                      `Please enter your question here (please attach a screenshot if applicable):\n\n\n\n\n\n` +
                        `====\n` +
                        `User ID: ${user.username}\n` +
                        `User Login Session ID: ${getLoginSessionID(user)}\n` +
                        getUsefulDebugInfo(),
                    );
                    const mailtoLink = `mailto:${studyInfo.contactEmail}?subject=${emailSubject}&body=${emailBody}`;
                    Linking.openURL(mailtoLink);
                  }}
                >
                  <Text style={{ color: "lightblue", marginLeft: 20 }}>
                    Contact Staff
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </HideKeyboardButtonAndWrapper>
        </View>
      </TouchableWithoutFeedback>
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
            title="getUnuploadedDataAsync()"
            onPress={async () => {
              const unuploadedData = await getUnuploadedDataAsync();
              alertWithShareButtonContainingDebugInfo(
                JSON.stringify(unuploadedData),
              );
            }}
          />
          <Button
            color="orange"
            title="uploadDataAsync(all)"
            onPress={async () => {
              try {
                const response = await uploadDataAsync(
                  studyInfo,
                  this.setUploadStatusSymbol,
                  { unuploadedOnly: false },
                );
                alertWithShareButtonContainingDebugInfo(
                  JSON.stringify(response),
                );
              } catch (e) {
                alertWithShareButtonContainingDebugInfo(`${e}`);
              }
            }}
          />
          <Button
            color="orange"
            title="uploadDataAsync(unuploaded)"
            onPress={async () => {
              try {
                const response = await uploadDataAsync(
                  studyInfo,
                  this.setUploadStatusSymbol,
                  { unuploadedOnly: true },
                );
                alertWithShareButtonContainingDebugInfo(
                  JSON.stringify(response),
                );
              } catch (e) {
                alertWithShareButtonContainingDebugInfo(`${e}`);
              }
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
            <View style={{ marginHorizontal: 20 }}>
              <Text style={styles.onlyTextStyle}>
                Thank you for your participation!
              </Text>
              <Text
                style={{
                  marginVertical: 10,
                  textAlign: "center",
                }}
              >
                The study has concluded on{"\n"}
                {format(getStudyEndDate(studyInfo), "PPPP")}.{"\n\n"}
                If you have any concerns regarding your ping records (or
                payments), please do not uninstall the app and press the button
                below to upload all your pings data stored locally. Otherwise,
                you may now uninstall Well Ping from your phone.
              </Text>
              <Button
                title="Upload Your Data"
                onPress={async () => {
                  Alert.alert(
                    "Upload All Data",
                    "During upload, your phone might be unresponsive for several minutes.\n\n" +
                      "Please do not exit the app until you see a message telling you that the upload is complete.",
                    [
                      {
                        text: "Upload All Data",
                        onPress: async () => {
                          await this._forceUploadAllDataAsync({
                            successTitle: "Data Uploaded Successfully!",
                            getSuccessMessage: (response) =>
                              "Thank you for your patience. " +
                              "Your local data has been successfully uploaded to the server.\n\n" +
                              `Response: ${JSON.stringify(response)}`,
                            errorTitle: "Error: Data Upload Error!",
                            getErrorMessage: (error) =>
                              "We cannot upload your data at this moment.\n\n" +
                              "Please try again later or contact the research staff.\n\n" +
                              `Error message: ${error}`,
                          });
                        },
                      },
                      {
                        text: "Cancel",
                        style: "cancel",
                        onPress: async () => {
                          // Do nothing
                        },
                      },
                    ],
                  );
                }}
              />
            </View>
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
          {this.state.afterFinishingPing_isUploading ? (
            <Text style={{ ...styles.onlyTextStyle, color: "red" }}>
              Uploading…{"\n"}Please do not exit the app!
            </Text>
          ) : (
            <>
              <Text style={styles.onlyTextStyle}>
                Thank you for completing the survey for this ping!{"\n"}
                Well Ping will send a notification for the next survey soon!
                {"\n"}
                Please close the app entirely.
              </Text>
              <DashboardComponent
                firebaseUser={firebaseUser}
                studyInfo={studyInfo}
              />
            </>
          )}
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
            this.setState({
              currentPing: finishedPing,
              afterFinishingPing_isUploading: true,
            });
            // TODO: Maybe also use NetInfo.fetch() before to make sure don't stuck on this page. But that's probably unnecessary.
            this._uploadUnuploadedDataAndRemoveFromThemIfSuccessfulAsync({
              doAfterResponseAsync: async (response) => {
                const showDataDiscrepancyAlert = ({
                  serverPingsCount,
                  localPingsCount,
                  serverAnswersCount,
                  localAnswersCount,
                }: {
                  serverPingsCount: number;
                  localPingsCount?: number;
                  serverAnswersCount?: number;
                  localAnswersCount?: number;
                }) => {
                  let serverInfo = `p${serverPingsCount}`;
                  if (serverAnswersCount) {
                    serverInfo += `a${serverAnswersCount}`;
                  }

                  let localInfo = "";
                  if (localPingsCount) {
                    localInfo += `p${localPingsCount}`;
                  }
                  if (localAnswersCount) {
                    localInfo += `a${localAnswersCount}`;
                  }

                  Alert.alert(
                    "Data Discrepancy Detected",
                    `The data on your phone locally (${localInfo}) does not match the data we have on the server (${serverInfo}). ` +
                      "To ensure your answers are recorded correctly, please click the “Upload All Data” button below.\n\n" +
                      "During upload, your phone might be unresponsive for several minutes. " +
                      "Please do not exit the app until you see a message telling you that the upload is complete.",
                    [
                      {
                        text: "Upload All Data",
                        onPress: async () => {
                          await this._forceUploadAllDataAsync({
                            successTitle: "Data Uploaded Successfully!",
                            getSuccessMessage: (response) =>
                              "Thank you for your patience. " +
                              "You may exit the app now.\n\n" +
                              `Response: ${JSON.stringify(response)}`,
                            errorTitle: "Error: Data Upload Error!",
                            getErrorMessage: (error) =>
                              "We cannot upload your data at this moment.\n\n" +
                              "You may exit the app for now, we will alert you again of this problem next time you finished a ping.\n\n" +
                              `Error message: ${error}`,
                          });
                        },
                      },
                    ],
                  );
                };

                const serverPingsCount = response.new_pings_count;
                if (serverPingsCount != null) {
                  const localPingsCount = (await getPingsListAsync()).length;
                  if (serverPingsCount !== localPingsCount) {
                    console.warn(
                      `serverPingsCount (${serverPingsCount}) != localPingsCount (${localPingsCount})!`,
                    );
                    showDataDiscrepancyAlert({
                      serverPingsCount,
                      localPingsCount,
                    });
                    return;
                  }
                }

                const serverAnswersCount = response.new_answers_count;
                if (serverAnswersCount != null) {
                  const localAnswersCount = (
                    await getAnswersPingIdsQuestionIdsListAsync()
                  ).length;
                  if (serverAnswersCount !== localAnswersCount) {
                    console.warn(
                      `serverAnswersCount (${serverAnswersCount}) != localAnswersCount (${localAnswersCount})!`,
                    );
                    showDataDiscrepancyAlert({
                      serverPingsCount: serverPingsCount ?? -1,
                      serverAnswersCount,
                      localAnswersCount,
                    });
                    return;
                  }
                }
              },
              doFinally: () => {
                this.setState({ afterFinishingPing_isUploading: false });
              },
            });
          }}
          studyInfo={studyInfo}
          setUploadStatusSymbol={this.setUploadStatusSymbol}
        />
        <DebugView />
      </View>
    );
  }
}
