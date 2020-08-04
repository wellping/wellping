import { format, addHours, getDay } from "date-fns";
import { Notifications } from "expo";
import * as Linking from "expo-linking";
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
} from "react-native";
import { WebView } from "react-native-webview";

import SurveyScreen, { SurveyScreenState } from "./SurveyScreen";
import { AnswerEntity } from "./entities/AnswerEntity";
import { PingEntity } from "./entities/PingEntity";
import {
  uploadDataAsync,
  getAllDataAsync,
  getRequestURLAsync,
  getServerUrlAsync,
} from "./helpers/apiManager";
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
import { getUserAsync } from "./helpers/asyncStorage/user";
import {
  shareDatabaseFileAsync,
  deleteDatabaseFileAsync,
} from "./helpers/database";
import {
  getNonCriticalProblemTextForUser,
  JS_VERSION_NUMBER,
  getUsefulDebugInfo,
  alertWithShareButtonContainingDebugInfo,
} from "./helpers/debug";
import {
  setNotificationsAsync,
  setupNotificationsPermissionAsync,
  getCurrentNotificationTimeAsync,
  getIncomingNotificationTimeAsync,
  _sendTestNotificationAsync,
} from "./helpers/notifications";
import {
  getLatestPingAsync,
  getTodayPingsAsync,
  insertPingAsync,
  getNumbersOfPingsForAllStreamNames,
} from "./helpers/pings";
import { getAllStreamNames, getStudyInfoAsync } from "./helpers/studyFile";
import { styles } from "./helpers/styles";
import { Streams, StreamName, StudyInfo } from "./helpers/types";
import LoadingScreen from "./screens/LoadingScreen";

interface HomeScreenProps {
  studyInfo: StudyInfo;
  streams: Streams;
  logout: () => Promise<void>;
}

interface HomeScreenState {
  time: Date;
  allowsNotifications: boolean;
  currentNotificationTime: Date | null;
  currentPing: PingEntity | null;
  isLoading: boolean;
  storedPingStateAsync: SurveyScreenState | null;

  // DEBUG
  displayDebugView: boolean;
}

function SSNLDashboard(): JSX.Element {
  const [url, setUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function setDashboardUrl() {
      setUrl(await getRequestURLAsync("/ssnl_dashboard"));
    }
    setDashboardUrl();
  }, []);

  return (
    <View style={{ flex: 1, marginTop: 20 }}>
      {url ? (
        <WebView source={{ uri: url }} cacheEnabled={false} />
      ) : (
        <Text style={{ textAlign: "center", fontSize: 16 }}>Loading...</Text>
      )}
    </View>
  );
}

export default class HomeScreen extends React.Component<
  HomeScreenProps,
  HomeScreenState
> {
  interval!: ReturnType<typeof setInterval>;

  constructor(props: HomeScreenProps) {
    super(props);

    this.state = {
      time: new Date(),
      allowsNotifications: true,
      currentNotificationTime: null,
      currentPing: null,
      isLoading: true,
      displayDebugView: false,
      storedPingStateAsync: null,
    };
  }

  async componentDidMount() {
    const allowsNotifications = await setupNotificationsPermissionAsync();
    if (!allowsNotifications) {
      this.setState({ allowsNotifications: false });
    }

    if (Platform.OS === "android") {
      await Notifications.dismissAllNotificationsAsync();
    } else {
      await Notifications.setBadgeNumberAsync(0);
    }

    await setNotificationsAsync();

    const doEveryHalfMinutes = async () => {
      const currentNotificationTime = await getCurrentNotificationTimeAsync();
      this.setState({ time: new Date(), currentNotificationTime });

      if (currentNotificationTime == null) {
        this.setState({ currentPing: null });
      }
    };

    // Check if the current notification expires.
    this.interval = setInterval(async () => {
      await doEveryHalfMinutes();
    }, 30 * 1000);
    // Do this initially too.
    await doEveryHalfMinutes();

    Notifications.addListener(async () => {
      await doEveryHalfMinutes();
    });

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

    this.setState({ isLoading: false });
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  async startSurveyAsync() {
    const studyInfo = this.props.studyInfo;

    const todayWeekday = getDay(new Date());
    const todayPings = await getTodayPingsAsync();
    let newPingName: StreamName;

    if (todayPings.length >= studyInfo.frequency.hoursEveryday.length) {
      alertWithShareButtonContainingDebugInfo(
        getNonCriticalProblemTextForUser(
          `todayPings.length (${todayPings.length}) > ${studyInfo.frequency.hoursEveryday.length}`,
        ),
      );

      newPingName = studyInfo.streamInCaseOfError;
    } else {
      newPingName = studyInfo.streamsOrder[todayWeekday][todayPings.length];

      if (
        !(studyInfo.streamsNotReplacedByFollowupStream || []).includes(
          newPingName,
        )
      ) {
        const futurePingIfAny = await dequeueFuturePingIfAny();
        if (futurePingIfAny) {
          newPingName = futurePingIfAny.streamName;
        }
      }
    }

    await this._startSurveyTypeAsync(newPingName);

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

  render() {
    const { studyInfo, streams } = this.props;

    const {
      allowsNotifications,
      currentNotificationTime,
      currentPing,
      isLoading,
    } = this.state;

    if (isLoading) {
      return <LoadingScreen />;
    }

    const ExtraView = allowsNotifications ? (
      <>
        <TouchableWithoutFeedback
          onLongPress={() => {
            this.setState({ displayDebugView: true });
          }}
        >
          <View style={{ height: Platform.OS === "ios" ? 20 : 40 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "lightgray" }}>v.{JS_VERSION_NUMBER}</Text>
              {studyInfo.contactEmail && (
                <TouchableWithoutFeedback
                  onPress={async () => {
                    const user = await getUserAsync();

                    const emailSubject = encodeURIComponent(
                      `Questions about Well Ping study ${studyInfo.id}`,
                    );
                    const emailBody = encodeURIComponent(
                      `Please enter your question here (please attach a screenshot if applicable):\n\n\n\n\n\n` +
                        `====\n` +
                        `User ID: ${user!.patientId}\n` +
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
          If you wish to receive pings, please allow Well Ping to send
          notifications.
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
          <Text style={{ color: "red" }}>
            App last updated on 2019/11/14 - 12:20
          </Text>
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
          <Button
            color="green"
            title="hide debug view"
            onPress={() => {
              this.setState({ displayDebugView: false });
            }}
          />
          <Button
            color="orange"
            title="shareDatabaseFileAsync"
            onPress={async () => {
              /*const ping = new PingEntity();
              ping.id = "another";
              ping.notificationTime = new Date();
              ping.startTime = new Date();
              ping.streamName = "one";
              ping.tzOffset = 700;
              await ping.save();

              const answer = new AnswerEntity();
              answer.ping = ping;
              answer.questionId = "qu";
              answer.questionType = QuestionType.YesNo;
              answer.preferNotToAnswer = false;
              answer.nextWithoutOption = false;
              answer.data = {
                value: "haha",
              };
              answer.lastUpdateDate = new Date();
              await answer.save();*/

              await shareDatabaseFileAsync(studyInfo.id);
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
            title="getNumbersOfPingsForAllStreamNames()"
            onPress={async () => {
              const typesOfPingsAnswered = await getNumbersOfPingsForAllStreamNames();
              alertWithShareButtonContainingDebugInfo(
                JSON.stringify(typesOfPingsAnswered),
              );
            }}
          />
          <Button
            color="orange"
            title="getServerUrlAsync()"
            onPress={async () => {
              const serverUrl = await getServerUrlAsync();
              alertWithShareButtonContainingDebugInfo(serverUrl);
            }}
          />
          <Button
            color="orange"
            title="getUserAsync()"
            onPress={async () => {
              const user = await getUserAsync();
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
              const response = await uploadDataAsync();
              alertWithShareButtonContainingDebugInfo(JSON.stringify(response));
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
              const url = await getRequestURLAsync("/ssnl_dashboard");
              alertWithShareButtonContainingDebugInfo(url);
              Clipboard.setString(url);
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
                      await deleteDatabaseFileAsync(studyInfo.id);
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
      return (
        <View style={{ height: "100%" }}>
          {ExtraView}
          <DebugView />
          <Text style={styles.onlyTextStyle}>
            There is currently no active survey. You will receive a notification
            with a survey soon!
          </Text>
          <SSNLDashboard />
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
          <Button
            title="Click here to start the survey"
            onPress={() => {
              this.startSurveyAsync();
            }}
          />
          <SSNLDashboard />
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
          survey={streams[currentPing.streamName]}
          surveyStartingQuestionId={
            studyInfo.streamsStartingQuestionIds[currentPing.streamName]
          }
          ping={currentPing}
          previousState={this.state.storedPingStateAsync}
          onFinish={async (finishedPing) => {
            this.setState({ currentPing: finishedPing });
            uploadDataAsync();
          }}
        />
        <DebugView />
      </View>
    );
  }
}
