import { StyleSheet, Text, View, Pressable, ScrollView, Button, Alert, Platform, Dimensions, Image } from 'react-native'
import React, { useState } from 'react'
const { height, width } = Dimensions.get('screen')
import {
  RootStackParamList,
} from '../RootScreen'
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import SurveyScreen, { SurveyScreenState } from '../SurveyScreen';
import {
  Streams,
  StreamName,
  StudyInfo,
  Ping,
} from "@wellping/study-schemas/lib/types";
import { User } from "../helpers/secureStore/user";
import { format, getDay } from "date-fns";
import {
  getLatestPingAsync,
  getTodayPingsAsync,
  insertPingAsync,
  getNumbersOfPingsForAllStreamNamesAsync,
} from "../helpers/pings";
import { getPingsListAsync } from "../helpers/asyncStorage/pingsList";
import {
  getNonCriticalProblemTextForUser,
  JS_VERSION_NUMBER,
  getUsefulDebugInfoAsync,
  alertWithShareButtonContainingDebugInfoAsync,
  HOME_SCREEN_DEBUG_VIEW_SYMBOLS,
} from "../helpers/debug";
import {
  dequeueFuturePingIfAny,
  getFuturePingsQueue,
  initFuturePingQueueAsync,
} from "../helpers/asyncStorage/futurePings";
import {
  setNotificationsAsync,
  setupNotificationsPermissionAsync,
  getCurrentNotificationTimeAsync,
  getIncomingNotificationTimeAsync,
  clearSentNotificationsAsync,
  _sendTestNotificationAsync,
} from "../helpers/notifications";
import {
  getAllStreamNames,
  getStudyStartDate,
  getStudyEndDate,
  getStudyInfoAsync,
} from "../helpers/studyFile";
import {
  getPingStateAsync,
  clearPingStateAsync,
} from "../helpers/asyncStorage/pingState";
import {
  getNotificationTimesAsync,
  clearNotificationTimesAsync,
} from "../helpers/asyncStorage/notificationTimes";
import { secureGetUserAsync } from "../helpers/secureStore/user";
import {
  uploadDataAsync,
  getAllDataAsync,
  getUnuploadedDataAsync,
} from "../helpers/dataUpload";
import { clearAllPingsAndAnswersAsync } from "../helpers/cleanup";
import { finished } from 'stream';
import {
  DataUploadServerResponse,
  getSymbolsForServerTypeUsed,
  isUsingFirebase,
} from "../helpers/server";
import {
  addToUnuploadedPingsListIfNeededAsync,
  getUnuploadedPingsListAsync,
  removeFromUnuploadedPingsListAsync,
} from "../helpers/asyncStorage/unuploadedPingsList";

import { AntDesign } from '@expo/vector-icons';
import { Button as PaperButton } from 'react-native-paper'


type Props = NativeStackScreenProps<RootStackParamList, 'Notification'>;

type NotificationScreenProps = {
  studyInfo: StudyInfo;
  streams: Streams;
  logout: () => Promise<void>;
  navFn: ()=> void;
  userInfo: User | null;
}


const NotificationScreen = ({streams, studyInfo, logout, userInfo, navFn}: NotificationScreenProps, {navigation}: Props) => {
  const [isLoading, setIsLoading] = useState(false)
  const [time, setTime] = useState(new Date())
  const [currentNotificationTime, setCurrentNotificationTime] = useState(null)
  const [currentPing, setCurrentPing] = useState<Ping|null>(null)
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [displayDebugView, setDisplayDebugView] = useState(false)
  const [uploadStatusSymbol, setUploadStatusSymbol] = useState(HOME_SCREEN_DEBUG_VIEW_SYMBOLS.UPLOAD.INITIAL)
  const [storedPingStateAsync, setStoredPingStateAsync] = useState<SurveyScreenState|null>(null)

  const DebugView: React.FunctionComponent = ({ 
    // children 
  }) => {
    // if (!this.state.displayDebugView) {
    //   return <></>;
    // }
    return (
      <View style={{width: '100%', height: '100%', backgroundColor: 'transparent'}}>
        <ScrollView
          style={{
            backgroundColor: "#bde0fe",
            opacity: .9,
            maxHeight: '100%',
          }}
          contentContainerStyle={{
            padding: 5,
          }}
        >
          <Text>
            Time: {format(time, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")}
          </Text>
          <Text>
            Current ping's notification time:{" "}
            {currentNotificationTime
              ? format(
                  currentNotificationTime,
                  "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
                )
              : "IS NULL"}
          </Text>
          <Text>
            this.state.currentPing: {JSON.stringify(currentPing)}
          </Text>
          <Text>
            this.state.firebaseUser: {JSON.stringify(firebaseUser)}
          </Text>
          <Button
            color="green"
            title="hide debug view"
            onPress={() => {
              setDisplayDebugView(false);
            }}
          />
          <Button
            color="orange"
            title="getStudyInfoAsync()"
            onPress={async () => {
              await alertWithShareButtonContainingDebugInfoAsync(
                JSON.stringify(await getStudyInfoAsync(),null,2),
              );
            }}
          />
          <Button
            color="orange"
            title="getStudyStartDate()"
            onPress={async () => {
              await alertWithShareButtonContainingDebugInfoAsync(
                getStudyStartDate(await getStudyInfoAsync()).toString(),
              );
            }}
          />
          <Button
            color="orange"
            title="getStudyEndDate()"
            onPress={async () => {
              await alertWithShareButtonContainingDebugInfoAsync(
                getStudyEndDate(await getStudyInfoAsync()).toString(),
              );
            }}
          />
          <Button
            color="orange"
            title="getIncomingNotificationTimeAsync()"
            onPress={async () => {
              const nextPingTime = await getIncomingNotificationTimeAsync();
              await alertWithShareButtonContainingDebugInfoAsync(
                // nextPingTime
                //   ? format(nextPingTime, "yyyy-MM-dd' T 'HH:mm:ss.SSSxxx")
                //   : "IS NULL",
                nextPingTime
                  ? nextPingTime.toLocaleString()
                  : "Null"
              );
            }}
          />
          <Button
            color="orange"
            title="getLatestPingAsync()"
            onPress={async () => {
              const latestStartedPing = await getLatestPingAsync();
              await alertWithShareButtonContainingDebugInfoAsync(
                JSON.stringify(latestStartedPing),
              );
            }}
          />
          <Button
            color="orange"
            title="getCurrentNotificationTimeAsync()"
            onPress={async () => {
              const currentNotificationTime =
                await getCurrentNotificationTimeAsync();
              await alertWithShareButtonContainingDebugInfoAsync(
                JSON.stringify(currentNotificationTime?.toLocaleString()),
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
                text += element.notificationDate.toLocaleString()+" expires at " + element.expirationDate.toLocaleTimeString()+'\n';
                // text +=
                //   format(
                //     element.notificationDate,
                //     "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
                //   ) +
                //   ", expire at " +
                //   format(
                //     element.expirationDate,
                //     "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
                //   ) +
                //   `\n`;
              });
              await alertWithShareButtonContainingDebugInfoAsync(text);
            }}
          />
          <Button
            color="orange"
            title="getNumbersOfPingsForAllStreamNamesAsync()"
            onPress={async () => {
              const typesOfPingsAnswered =
                await getNumbersOfPingsForAllStreamNamesAsync();
              await alertWithShareButtonContainingDebugInfoAsync(
                JSON.stringify(typesOfPingsAnswered),
              );
            }}
          />
          <Button
            color="orange"
            title="secureGetUserAsync()"
            onPress={async () => {
              const user = await secureGetUserAsync();
              await alertWithShareButtonContainingDebugInfoAsync(
                JSON.stringify(user),
              );
            }}
          />
          <Button
            color="orange"
            title="getFuturePingsQueue()"
            onPress={async () => {
              const futurePingsQueues = await getFuturePingsQueue();
              await alertWithShareButtonContainingDebugInfoAsync(
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
              await alertWithShareButtonContainingDebugInfoAsync(
                JSON.stringify(allData),
              );
            }}
          />
          <Button
            color="orange"
            title="getUnuploadedDataAsync()"
            onPress={async () => {
              const unuploadedData = await getUnuploadedDataAsync();
              await alertWithShareButtonContainingDebugInfoAsync(
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
                  setUploadStatusSymbol,
                  { unuploadedOnly: false },
                );
                await alertWithShareButtonContainingDebugInfoAsync(
                  JSON.stringify(response),
                );
              } catch (e) {
                await alertWithShareButtonContainingDebugInfoAsync(`${e}`);
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
                  setUploadStatusSymbol,
                  { unuploadedOnly: true },
                );
                await alertWithShareButtonContainingDebugInfoAsync(
                  JSON.stringify(response),
                );
              } catch (e) {
                await alertWithShareButtonContainingDebugInfoAsync(`${e}`);
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
              // const url =
              //   (await getDashboardUrlAsync(studyInfo, firebaseUser)) ??
              //   "No dashboard URL.";
              // Clipboard.setString(url);
              // await alertWithShareButtonContainingDebugInfoAsync(url);
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
                    await logout();
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
          {/* {children} */}
        </ScrollView>
      </View>
    );
  };

  const _startSurveyTypeAsync = async (streamName: StreamName) => {

    // Upload and clear old unuploaded pings.
    await _uploadUnuploadedDataAndRemoveFromThemIfSuccessfulAsync();

    console.log({
      notificationTime: currentNotificationTime!,
      startTime: new Date(),
      streamName,
    })

    // Needs current notification time
    const list = await getNotificationTimesAsync()
    // console.log('list: ',JSON.stringify(list,null,2))
    // console.log(JSON.stringify(list?.map(e=>e.notificationDate.toLocaleString()),null,2))
    console.log('log',list?list[2].notificationDate:null)
    
    if(list == null)
      return;
    else if(list[2]?.notificationDate !== null) {

    // // Create new ping.
    const newPing = await insertPingAsync({
      // notificationTime: currentNotificationTime!,
      notificationTime: list[2].notificationDate,
      startTime: new Date(),
      // streamName,
      streamName: 'welcomeStream'
      // streamName: 'myStream'
      // streamName: 'exampleStream'
      // streamName: 'errorStream'
    });

    console.log('np',newPing)
    
    // // Add this ping to unuploaded pings list.
    await addToUnuploadedPingsListIfNeededAsync(newPing);

    setCurrentPing(newPing)
    // setStoredPingStateAsync(null)
    }


  }

  const _uploadUnuploadedDataAndRemoveFromThemIfSuccessfulAsync = async ({
    doAfterResponseAsync = async (_) => {},
    doAfterErrorAsync = async (_) => {},
    doFinally = () => {},
  }: {
    doAfterResponseAsync?: (
      response: DataUploadServerResponse,
    ) => Promise<void>;
    doAfterErrorAsync?: (error: any) => Promise<void>;
    doFinally?: () => void;
  } = {}) => {
    // const { studyInfo } = this.props;
    // We need to store `prevUnuploaded` beforehand because unuploaded pings list
    // might be changed during we are doing `uploadDataAsync`. And we don't want
    // to remove the newly added pings that we haven't uploaded.
    const prevUnuploaded = await getUnuploadedPingsListAsync();
    const prevData = await getUnuploadedDataAsync();
    uploadDataAsync(studyInfo, setUploadStatusSymbol, {
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

  const shouldRemoveFutureNotifications = async () => {
    // Check if future pings should be disabled
    // This condition is met when the last 5 consecutive answers are "prefer not to answer"
    const data = await getAllDataAsync();

    // Get last up to last Five "preferNotToAnswer" values
    const answers = data.answers.slice(-5)
    // Round up all prefNotAnswer values into an array, 1 for true, 0 for false
    const responses = answers.map(e=>e.preferNotToAnswer? 1:0)

    // If all elements are 1 e.g. [1,1,1,1,1] and length more than 5, 
    // meaning the Participant repeatedly chose not to respond, disable all future pings 
    // so the Participant won't have to receive pings. They can choose to continue
    // answering survey questions by logging out and in again
    if(responses.length>=5 && responses.every(e => e===1)) {
      console.log('Since the last 5 responses have been "Prefer not to Answer" The app will log out so no further pings will be sent')

      await logout()
    }
    else {}
  }

  const startSurveyAsync = async () => {
    setIsLoading(true);
  
    const todayWeekday = getDay(new Date());
    const todayPings = await getTodayPingsAsync();
  
    const pingsList = await getPingsListAsync();
    const newPingNth = pingsList.length + 1;

    let newStreamName: StreamName;
    /*
    *   Catch if today's pings is more than max pings allowed in Study File
    */
    if (todayPings.length >= studyInfo.pingsFrequency.length) {  
      await alertWithShareButtonContainingDebugInfoAsync(
        getNonCriticalProblemTextForUser(
          `todayPings.length (${todayPings.length}) >= ${studyInfo.pingsFrequency.length}`,
        ),
      );
  
      newStreamName = studyInfo.streamInCaseOfError;
    } 
    /*
    *   Catch if there exists a next Nth ping, then set new stream to the designated stream id
    */
    else if (
      studyInfo.streamsForNthPings &&
      studyInfo.streamsForNthPings[`${newPingNth}`]
    ) {
      newStreamName = studyInfo.streamsForNthPings[`${newPingNth}`];
    } 
    /*
    *   OTHERWISE Set the stream name to the originally scheduled Stream i.e. myStream
    */
    else {
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
  
    console.log(newStreamName)
    await _startSurveyTypeAsync(newStreamName);
  
    // TODO: should this be after setNotificationsAsync?
    await new Promise<void>((resolve) =>
      setIsLoading(false)
    );
  
    // So that the notification text ("n pings left") can be updated.
    await setNotificationsAsync();
  }

  return (
    <View style={{paddingHorizontal: 0, backgroundColor: 'white', height:'100%', justifyContent: 'flex-start', paddingTop: 0}}>
      <View style={{width: '100%', backgroundColor: 'gray'}}>
        {
          currentPing===null

          // If Ping is null, display "Click here to start" Screen
          ? <View style={[{ 
            justifyContent: 'flex-start', 
            backgroundColor: 'white', 
            height: '100%', 
            width: '100%', 
            }]}>

            {/* Disclaimer / Title */}
            <Text style={{width: '100%', paddingHorizontal: 50, textAlign: 'center', textAlignVertical: 'center', fontFamily: 'Roboto_700Bold', fontSize: 20, color: '#761A15', height: 100}}>LOCAL DEBUG SURVEY{'\n'}NOT INTENDED FOR PRODUCTION</Text>
            <Pressable onPress={()=>{setCurrentPing(null); setCurrentNotificationTime(null); navFn()}} style={{position: 'absolute', top: 20, backgroundColor: 'transparent', justifyContent: 'flex-start', alignItems: 'center', width: '100%', paddingLeft: 20, flexDirection: 'row'}}>
              <AntDesign name="arrowleft" size={30} color="black" />
            </Pressable>

            {/* Main Body */}
            <View style={{height: height*.5, width: '100%', backgroundColor: 'transparent', justifyContent: 'space-around', alignItems: 'center'}}>
              <View style={{height: 120, width: 120, backgroundColor: 'rgba(0,0,0,0.0)'}}>
                <Image source={require('../../assets/icon-android-foreground.png')} style={{height: 120, width: 120, backgroundColor: 'transparent', transform: [{scale: 2.5}]}}/>
              </View>

              <View style={{width: '100%', flexDirection: 'row', justifyContent: 'center'}}>
                <Text style={{ width: '50%',fontFamily: 'Roboto_700Bold', fontSize: 36, marginVertical: 20, textAlign: "center" }}>
                  Welcome to <Text style={{fontSize: 20, color: '#761A15'}}>{'{'}debugging{'}\n'}</Text>Well Ping!
                </Text>
              </View>

              <PaperButton
                buttonColor="white" 
                mode="elevated" 
                style={{borderRadius: 12, width: 294, alignItems: 'center', paddingVertical: 10, borderWidth: 0, borderColor: 'black'}}
                // disabled={this.state.disableLoginButton}
                labelStyle={{fontSize: 18, color: '#0F4EC7'}}
                onPress={() => {
                  startSurveyAsync();
                }}
              >
                Click here to start the survey
              </PaperButton>

            </View>

            {/* Container for Debug View */}
            {/* <View style={{ position: 'absolute', bottom: 0, width: width, height: 100, backgroundColor: 'tan'}}>
              <DebugView/>
            </View> */}
          </View> 
    
          // Display the Survey Screen
          : <>
            <SurveyScreen
              questions={streams[currentPing.streamName]}
              startingQuestionId={studyInfo.streamsStartingQuestionIds[currentPing.streamName]}
              ping={currentPing}
              studyInfo={studyInfo}
              previousState={storedPingStateAsync}
              setUploadStatusSymbol={setUploadStatusSymbol}
              onFinish={async (finishedPing)=>{
                setCurrentPing(finishedPing);

                await shouldRemoveFutureNotifications()
              }}
            />
          </>
        }
      </View>

    </View>
  )
}

export default NotificationScreen

const styles = StyleSheet.create({
  container: {
    height: "100%", 
    alignItems: 'center', 
    justifyContent: 'flex-start',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  shadow: Platform.OS!=="ios"? {
    // Android styles
		shadowColor: 'black', 
		shadowOffset: {height: 5, width: 5}, 
		shadowRadius: 6, 
		shadowOpacity: 1, 
		elevation: 4,
	} : {
    // iOS styles
		shadowColor: 'lightgray', 
		shadowOffset: {height: 5, width: 5}, 
		shadowRadius: 3, 
		shadowOpacity: 1, 
		elevation: 5,
	},
})