import { format, addHours, getDay } from "date-fns";
import { Notifications } from "expo";
import React from "react";
import {
  Button,
  Text,
  View,
  ScrollView,
  Alert,
  StyleSheet,
  Clipboard,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";
import { WebView } from "react-native-webview";

import SurveyScreen, { SurveyScreenState } from "./SurveyScreen";
import {
  uploadDataAsync,
  SERVER_URL,
  getAllDataAsync,
  getRequestURLAsync,
} from "./helpers/apiManager";
import {
  getNotificationTimesAsync,
  clearNotificationTimesAsync,
  getPingsAsync,
  initPingAsync,
  insertPingAsync,
  clearPingsAsync,
  getLatestStartedPingAsync,
  getPingStateAsync,
  PingInfo,
  getTodayPingsAsync,
  dequeueFuturePingIfAny,
  initFuturePingQueue,
  getFuturePingsQueue,
  clearPingStateAsync,
  getTypesOfPingsAnsweredAsync,
} from "./helpers/asyncStorage";
import {
  getSurveyFile,
  getStudyInfo,
  getAllStreamNames,
} from "./helpers/configFiles";
import { getNonCriticalProblemTextForUser } from "./helpers/debug";
import {
  setNotificationsAsync,
  setupNotificationsPermissionAsync,
  getCurrentNotificationTimeAsync,
  getIncomingNotificationTimeAsync,
  _sendTestNotificationAsync,
} from "./helpers/notifications";
import {
  Streams,
  QuestionsList,
  SurveyFile,
  StreamName,
  StudyInfo,
} from "./helpers/types";
import { getUserAsync } from "./helpers/user";

const survey: SurveyFile = getSurveyFile();
const studyInfo: StudyInfo = getStudyInfo();

const styles = StyleSheet.create({
  onlyTextStyle: {
    textAlign: "center",
    marginTop: 30,
    fontSize: 25,
    marginHorizontal: 10,
  },
});

interface HomeScreenProps {
  logout: () => Promise<void>;
}

interface HomeScreenState {
  time: Date;
  allowsNotifications: boolean;
  currentNotificationTime: Date | null;
  currentPing: PingInfo | null;
  isLoading: boolean;
  storedPingStateAsync?: SurveyScreenState;

  // DEBUG
  displayDebugView: boolean;
}

function SSNLDashboard(props): JSX.Element {
  const [url, setUrl] = React.useState(null);

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
  interval;

  constructor(props) {
    super(props);

    this.state = {
      time: new Date(),
      allowsNotifications: true,
      currentNotificationTime: null,
      currentPing: null,
      isLoading: true,
      displayDebugView: false,
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

    await setNotificationsAsync(studyInfo);

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

    if ((await getFuturePingsQueue()) == null) {
      await initFuturePingQueue();
    }

    const latestStartedPing = await getLatestStartedPingAsync();
    //console.warn(latestStartedPing);
    const currentNotificationTime = await getCurrentNotificationTimeAsync();
    if (
      latestStartedPing &&
      currentNotificationTime &&
      latestStartedPing.notificationTime.getTime() ===
        currentNotificationTime.getTime()
    ) {
      const storedPingStateAsync = await getPingStateAsync(
        latestStartedPing.id,
      );
      //console.warn(storedPingStateAsync);
      this.setState({
        storedPingStateAsync,
        currentPing: latestStartedPing,
      });
    }

    this.setState({ isLoading: false });
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  async startSurveyAsync() {
    const todayWeekday = getDay(new Date());
    const todayPings = await getTodayPingsAsync();
    let newPingName: StreamName;

    if (todayPings.length > studyInfo.frequency.hoursEveryday.length) {
      alert(
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
    await setNotificationsAsync(studyInfo);
  }

  async _startSurveyTypeAsync(streamName: StreamName) {
    const { currentNotificationTime } = this.state;
    const newPing = await insertPingAsync({
      notificationTime: currentNotificationTime,
      startTime: new Date(),
      streamName,
    });

    this.setState({
      currentPing: newPing,
      storedPingStateAsync: null,
    });
  }

  render() {
    const {
      allowsNotifications,
      currentNotificationTime,
      currentPing,
      isLoading,
    } = this.state;

    if (isLoading) {
      return (
        <View>
          <Text style={styles.onlyTextStyle}>Loading...</Text>
        </View>
      );
    }

    const ExtraView = allowsNotifications ? (
      <>
        <TouchableWithoutFeedback
          onLongPress={() => {
            this.setState({ displayDebugView: true });
          }}
        >
          <View style={{ height: Platform.OS === "ios" ? 20 : 40 }}>
            <Text style={{ textAlign: "center", color: "lightgray" }}>
              Version 1.1.0
            </Text>
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
            title="getIncomingNotificationTimeAsync()"
            onPress={async () => {
              const nextPingTime = await getIncomingNotificationTimeAsync();
              alert(
                nextPingTime
                  ? format(nextPingTime, "yyyy-MM-dd' T 'HH:mm:ss.SSSxxx")
                  : "IS NULL",
              );
            }}
          />
          <Button
            color="orange"
            title="getLatestStartedPingAsync()"
            onPress={async () => {
              const latestStartedPing = await getLatestStartedPingAsync();
              alert(JSON.stringify(latestStartedPing));
            }}
          />
          <Button
            color="orange"
            title="getCurrentNotificationTimeAsync()"
            onPress={async () => {
              const currentNotificationTime = await getCurrentNotificationTimeAsync();
              alert(JSON.stringify(currentNotificationTime));
            }}
          />
          <Button
            color="red"
            title="clear current ping state"
            onPress={async () => {
              const latestStartedPing = await getLatestStartedPingAsync();
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
              notificationsTimes.forEach((element) => {
                text += format(element, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx") + `\n`;
              });
              alert(text);
            }}
          />
          <Button
            color="orange"
            title="getTypesOfPingsAnsweredAsync()"
            onPress={async () => {
              const typesOfPingsAnswered = await getTypesOfPingsAnsweredAsync();
              alert(JSON.stringify(typesOfPingsAnswered));
            }}
          />
          <Button
            color="orange"
            title="getUserAsync()"
            onPress={async () => {
              const user = await getUserAsync();
              alert(JSON.stringify(user));
            }}
          />
          <Button
            color="orange"
            title="getFuturePingsQueue()"
            onPress={async () => {
              const futurePingsQueues = await getFuturePingsQueue();
              alert(JSON.stringify(futurePingsQueues));
            }}
          />
          <Button
            color="red"
            title="reset/initFuturePingQueue()"
            onPress={async () => {
              await initFuturePingQueue();
            }}
          />
          <Button
            color="orange"
            title="getAllDataAsync()"
            onPress={async () => {
              const allData = await getAllDataAsync();
              alert(JSON.stringify(allData));
            }}
          />
          <Button
            color="orange"
            title="uploadDataAsync()"
            onPress={async () => {
              const response = await uploadDataAsync();
              alert(JSON.stringify(response));
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
              alert(url);
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
                      await clearPingsAsync();
                      await initPingAsync();
                    },
                  },
                ],
              );
            }}
            title="Reset pings/app (restart needed)"
          />
          <Text>Server address: {SERVER_URL}</Text>
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
      for (const streamName of getAllStreamNames()) {
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
          survey={survey.streams[currentPing.streamName]}
          surveyStartingQuestionId={
            survey.meta.startingQuestionIds[currentPing.streamName]
          }
          pingId={currentPing.id}
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
