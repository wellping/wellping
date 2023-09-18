import { 
  StyleSheet, 
  Text, 
  View,
  Pressable,
  Dimensions,
  Alert,
} from 'react-native'
const { height, width } = Dimensions.get('window')
import {
  StudyInfo,
} from "@wellping/study-schemas/lib/types";
import React from 'react'
import { User } from "../helpers/secureStore/user";
import { Button as PaperButton } from 'react-native-paper'
import { AntDesign } from '@expo/vector-icons';

type AccountScreenProps = {
  logout: () => Promise<void>;
  studyInfo: StudyInfo | undefined;
  userInfo: User | null;
  navFn: () => void;
  showNavBar: boolean;
}

const AccountScreen = ({logout, studyInfo, userInfo, navFn, showNavBar} : AccountScreenProps) => {
  const alertContactUs = () => {
    Alert.alert(
      "CONTACT INFORMATION:", 
      "Questions: If you have any questions, concerns or complaints about this research, its procedures, risks and benefits, contact the Protocol Director, Jamil Zaki at (650) 725-5177, or send an email to communitiesproject@stanford.edu. \n\nIndependent Contact: If you are not satisfied with how this study is being conducted, or if you have any concerns, complaints, or general questions about the research or your rights as a participant, please contact the Stanford Institutional Review Board (IRB) to speak to someone independent of the research team at (650) 723-2480 or toll free at 1-866-680-2906.  You can also write to the Stanford IRB, Stanford University, 1705 El Camino Real, Palo Alto, CA 94306.      ", 
      [
        {
          text: "Close",
          style: "cancel",
        },
        // {
        //   text: "Log out",
        //   style: "destructive",
        //   onPress: async () => {
        //     // await this.props.logout();
        //   },
        // },
      ]
    );
  }

  const alertLogOut = () => {
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
  }

  return (
    <View style={{
      paddingHorizontal: 40, 
      backgroundColor: 'white', 
      height:'100%', 
    }}>

      <View style={{height: '70%', backgroundColor: 'white', justifyContent: 'space-around'}}>

        <Pressable onPress={navFn} style={{flexDirection: 'row', alignItems: 'center'}}>
          {showNavBar
            ? <></>
            : <AntDesign style={{marginRight: 20}} name="arrowleft" size={32} color="#3a3a3a" />
          }
          <Text style={{fontFamily: 'Roboto_500Medium', fontSize: 32, color: '#3a3a3a', marginBottom: 8, paddingTop: 10}}>Settings</Text>
        </Pressable>

        <View>
          <Text style={{fontFamily: 'Roboto_700Bold',fontSize: 20, fontWeight: 'bold', color: '#3a3a3a', marginBottom: 8}}>What is Well Ping?</Text>
          <Text style={{fontFamily: 'Roboto_400Regular', fontSize: 20, color: '#0F4EC7'}}>Learn about the methodology</Text>
        </View>

        <View style={{backgroundColor: 'transparent', height: 100, justifyContent: 'space-around'}}>
          <Text style={{fontFamily: 'Roboto_700Bold', fontSize: 20, fontWeight: 'bold', color: '#3a3a3a'}}>Help</Text>
          <Pressable onPress={alertContactUs} style={{width: '100%', backgroundColor: 'transparent', flexDirection: 'row'}}>
            <Text style={{width: '85%', fontFamily: 'Roboto_400Regular', fontSize: 18, color: '#3a3a3a'}}>Contact us</Text>
            <AntDesign name="right" size={20} color="#3a3a3a" />
          </Pressable>
          <Pressable onPress={alertContactUs} style={{width: '100%', backgroundColor: 'transparent', flexDirection: 'row'}}>
            <Text style={{width: '85%', fontFamily: 'Roboto_400Regular', fontSize: 18, color: '#3a3a3a'}}>Report an issue</Text>
            <AntDesign name="right" size={20} color="#3a3a3a" />
          </Pressable>
        </View>

        <View style={{width: '100%', alignItems: 'center'}}>
          <PaperButton
            buttonColor="white" 
            textColor="#761A15"
            mode="elevated" 
            style={{borderRadius: 12, width: '95%', alignItems: 'center', paddingVertical: 10, borderWidth: 1, borderColor: '#761A15'}}
            labelStyle={{fontFamily: 'Roboto_400Regular', fontSize: 18}}
            onPress={alertLogOut}
          >
            Log out
          </PaperButton>

      </View>
      </View>
    </View>
  )
}

export default AccountScreen

const styles = StyleSheet.create({})