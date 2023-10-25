import { StudyFile } from "@wellping/study-schemas/lib/types";
import React, { SetStateAction, useEffect } from "react";
import { 
  Text,
  View,
  Dimensions,
  Pressable,
  Platform,
  StyleSheet
} from "react-native";
const { height, width } = Dimensions.get('window')
import AccountScreen from "./screens/AccountScreen";
import NotificationScreen from "./screens/NotificationScreen";
import HomeScreen from "./HomeScreen";
import LoadingScreen from "./screens/LoadingScreen";
import LoginScreen, { ParamDownloadAndParseStudyFileAsync } from "./screens/LoginScreen";
import StudyFileErrorScreen from "./screens/StudyFileErrorScreen";

import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native'
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Feather, FontAwesome, MaterialCommunityIcons, Foundation } from '@expo/vector-icons';
import {
  useFonts,
  Roboto_100Thin,
  Roboto_100Thin_Italic,
  Roboto_300Light,
  Roboto_300Light_Italic,
  Roboto_400Regular,
  Roboto_400Regular_Italic,
  Roboto_500Medium,
  Roboto_500Medium_Italic,
  Roboto_700Bold,
  Roboto_700Bold_Italic,
  Roboto_900Black,
  Roboto_900Black_Italic,
} from '@expo-google-fonts/roboto';

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

interface RootScreenProps {
  tab: number;
  setTab: React.Dispatch<SetStateAction<number>>;
  handleNav: (n:number, where:string)=>void;
}

interface RootScreenState {
  userInfo: User | null;
  isLoading: boolean;
  studyFileErrorText: string | null;
  survey?: StudyFile;
  tab: number;
  showNavBar: boolean;
}

export type RootStackParamList = {
  Home: undefined;
  Account: undefined;
  Notification: undefined;
  Profile: { userId: string };
  Feed: { sort: 'latest' | 'top' } | undefined;
};

export const navRef = React.createRef<NavigationContainerRef<RootStackParamList>>();

export default function Main () {
  const [tab, setTab] = React.useState(0);
  const isFirstRender = React.useRef(true);

  let [fontsLoaded] = useFonts({
    Roboto_100Thin,
    Roboto_100Thin_Italic,
    Roboto_300Light,
    Roboto_300Light_Italic,
    Roboto_400Regular,
    Roboto_400Regular_Italic,
    Roboto_500Medium,
    Roboto_500Medium_Italic,
    Roboto_700Bold,
    Roboto_700Bold_Italic,
    Roboto_900Black,
    Roboto_900Black_Italic,
  });

  const handleNav = (n:number, where:string) => {
    setTab(n)
  }

  const path = (n:number) => {
    if(n===1) return 'Notification'
    if(n===2) return "Account"
    else return 'Home'
  } 

  useEffect(()=>{ // Used to trigger navigation effect
    if(!isFirstRender.current) {
      navRef.current?.navigate(path(tab))
    }
  },[tab])

  useEffect(()=>{ // Set value to false in order to allow navigation effect after first load
    isFirstRender.current = false
  },[])

  if (!fontsLoaded) {
    return <LoadingScreen />;
  } else
  return <RootScreen tab={tab} setTab={setTab} handleNav={handleNav}/>
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
      tab: 0,
      showNavBar: false,
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
    this.setState({ userInfo: null, survey: undefined}, async () => {
      // reset Nav to home, to make sure first screen user sees is Home
      this.props.handleNav(0,'Home')
      
      await logoutAsync();
    });
  }

  render() {
    const { isLoading, userInfo, studyFileErrorText } = this.state;
    const Stack = createNativeStackNavigator<RootStackParamList>();

    const AppStack = () => (
      <View style={{height: Platform.OS==='ios'? height*.9:height*.9-20, width: '100%', backgroundColor: 'white', alignItems: 'center', justifyContent: 'flex-start', paddingTop: Platform.OS === 'ios'? 50:0 }}>
        <View style={{height: '100%', width: '100%'}}>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator initialRouteName='Home'>
              <Stack.Screen name="Notification" options={{headerShown: false}}>
                {(props)=> this.state.survey === undefined?
                  <><Text>Stream is undefined</Text></> 
                  :
                  <NotificationScreen 
                    {...props}
                    streams={this.state.survey.streams}
                    userInfo={this.state.userInfo}
                    studyInfo={this.state.survey?.studyInfo}
                    logout={async () => {await this.logoutFnAsync()}}
                    navFn={()=>this.props.handleNav(0,'Home')}
                  />}
              </Stack.Screen>
              <Stack.Screen name="Account" options={{headerShown: false}}>
                {(props)=> 
                  <AccountScreen 
                    {...props}
                    userInfo={this.state.userInfo}
                    studyInfo={this.state.survey?.studyInfo}
                    logout={async () => {await this.logoutFnAsync()}}
                    navFn={()=>this.props.handleNav(0,'Home')}
                    showNavBar={this.state.showNavBar}
                  />}
              </Stack.Screen>
              <Stack.Screen name="Home" options={{headerShown: false}}>
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
                    navFn={()=>this.props.handleNav(2,'Account')}
                    showNavBar={this.state.showNavBar}
                  /> }
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </View>
      </View>
    )

    const AppStackWithNavBar = () => (
      <View style={{height: '100%', backgroundColor: 'white'}}>
        <AppStack/>
        {this.state.showNavBar
          ?<BottomNavigationBar/>
          :<></>}
      </View>
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

    const BottomButton = ({
      path='Home', 
      icon=this.props.tab===0?
        <Foundation name="home" size={24} color="#761A15" />
        : <Feather name="home" size={24} color="#761A15" />,
      navFn=()=>{this.props.handleNav(0,'Home')},
      idx=0
    }) => 
    <Pressable onPress={navFn} style={[styles.center, styles.navButton, {backgroundColor: 'white', paddingHorizontal: '5%'}]}>
      {icon}
      <Text numberOfLines={1} adjustsFontSizeToFit style={{fontSize: 13, marginTop: 2, color: '#761A15', fontFamily: idx===this.props.tab? 'Roboto_700Bold':'Roboto_400Regular'}}>{path == 'Notification'? 'Notifications' : path}</Text>
    </Pressable>

    const BottomNavigationBar = () => <View style={{height: Platform.OS==='ios'? height*.1 : height*.1, width: width, backgroundColor: '#f8f9fa', flexDirection: 'row'}}>
      <BottomButton idx={0} path="Home"/>
      <BottomButton idx={1} path="Notification" icon={<FontAwesome name={this.props.tab===1?"bell":"bell-o"} size={24} color="#761A15" />} navFn={()=>{this.props.handleNav(1,'Notification')}}/>
      <BottomButton idx={2} path="Account" icon={<MaterialCommunityIcons name={this.props.tab===2?"account":"account-outline"} size={24} color="#761A15" />} navFn={()=>{this.props.handleNav(2,'Account')}}/>
    </View>
  

    if (isLoading) return <LoadingScreen />;
    if (studyFileErrorText) return <StudyFileErrorScreen errorText={studyFileErrorText} />;
    if (this.state.survey == null) {
      if (userInfo != null || userInfo != undefined) {
        return <>
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
    
    return userInfo? <AppStackWithNavBar/> : <AuthStack/>
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