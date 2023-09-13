import { 
  StyleSheet, 
  Text, 
  View,
  Pressable,
  Dimensions,
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
}

const AccountScreen = ({logout, studyInfo, userInfo} : AccountScreenProps) => {
  return (
    <View style={{paddingHorizontal: 40, backgroundColor: 'white', height:'100%', justifyContent: 'space-around'}}>
      <View>
        <Text style={{fontFamily: 'Roboto_700Bold', fontSize: 32, fontWeight: 'bold', color: '#3a3a3a', marginBottom: 8}}>Patient ID: {userInfo?.username}</Text>
        <Text style={{fontFamily: 'Roboto_400Regular', fontSize: 20, color: '#3a3a3a'}}>{studyInfo?.contactEmail}</Text>
      </View>

      <View>
        <Text style={{fontFamily: 'Roboto_700Bold',fontSize: 20, fontWeight: 'bold', color: '#3a3a3a', marginBottom: 8}}>What is Well Ping?</Text>
        <Text style={{fontFamily: 'Roboto_400Regular', fontSize: 20, color: '#0F4EC7'}}>Learn about the methodology</Text>
      </View>

      {/* placeholders */}
      <Text></Text>
      <Text></Text>
      <Text></Text>

      <View style={{backgroundColor: 'transparent', height: 100, justifyContent: 'space-around'}}>
        <Text style={{fontFamily: 'Roboto_700Bold', fontSize: 20, fontWeight: 'bold', color: '#3a3a3a'}}>Help</Text>
        <View style={{width: '100%', backgroundColor: 'transparent', flexDirection: 'row'}}>
          <Text style={{width: '85%', fontFamily: 'Roboto_400Regular', fontSize: 18, color: '#3a3a3a'}}>Contact us</Text>
          <AntDesign name="right" size={20} color="black" />
        </View>
        <View style={{width: '100%', backgroundColor: 'transparent', flexDirection: 'row'}}>
          <Text style={{width: '85%', fontFamily: 'Roboto_400Regular', fontSize: 18, color: '#3a3a3a'}}>Report an issue</Text>
          <AntDesign name="right" size={20} color="black" />
        </View>
      </View>

      <View style={{width: '100%', alignItems: 'center'}}>
        <PaperButton
          buttonColor="white" 
          textColor="#761A15"
          mode="elevated" 
          style={{borderRadius: 12, width: '95%', alignItems: 'center', paddingVertical: 10, borderWidth: 1, borderColor: '#761A15'}}
          labelStyle={{fontFamily: 'Roboto_400Regular', fontSize: 18}}
          onPress={async () => { await logout(); }}
        >
          Log out
        </PaperButton>
      </View>
    </View>
  )
}

export default AccountScreen

const styles = StyleSheet.create({})