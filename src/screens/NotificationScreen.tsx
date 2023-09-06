import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import {
  RootStackParamList,
} from '../RootScreen'
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AntDesign } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'Notification'>;

const NotificationScreen = ({navigation}: Props) => {
  return (
    <View style={{paddingHorizontal: 40, backgroundColor: 'white', height:'100%', justifyContent: 'flex-start', paddingTop: 20}}>
      <View>
        <Text style={{fontFamily: 'Roboto_700Bold', fontSize: 32, fontWeight: 'bold', color: '#3a3a3a', marginBottom: 8}}>Notifications</Text>
        <Text style={{fontFamily: 'Roboto_400Regular', fontSize: 20, color: '#3a3a3a'}}>There is currently no active survey. You should receive a ping soon if you have notifications enabled.</Text>
      </View>

      {/* <View>
        <Text style={{fontFamily: 'Roboto_700Bold',fontSize: 20, fontWeight: 'bold', color: '#3a3a3a', marginBottom: 8}}>What is Well Ping?</Text>
        <Text style={{fontFamily: 'Roboto_400Regular', fontSize: 20, color: '#0F4EC7'}}>Learn about the methodology</Text>
      </View> */}

      {/* placeholders */}
      <Text></Text>
      <Text></Text>
      {/* <Text></Text> */}

      {/* <View style={{backgroundColor: 'transparent', height: 120, justifyContent: 'space-around'}}>
        <Text style={{fontFamily: 'Roboto_700Bold', fontSize: 20, fontWeight: 'bold', color: '#3a3a3a'}}>Help</Text>
        <View style={{width: '100%', backgroundColor: 'transparent', flexDirection: 'row'}}>
          <Text style={{width: '85%', fontFamily: 'Roboto_400Regular', fontSize: 20, color: '#3a3a3a'}}>Contact us</Text>
          <AntDesign name="right" size={20} color="black" />
        </View>
        <View style={{width: '100%', backgroundColor: 'transparent', flexDirection: 'row'}}>
          <Text style={{width: '85%', fontFamily: 'Roboto_400Regular', fontSize: 20, color: '#3a3a3a'}}>Report an issue</Text>
          <AntDesign name="right" size={20} color="black" />
        </View>
      </View> */}

      {/* <View style={{width: '100%', alignItems: 'center'}}>
        <PaperButton
          buttonColor="#f8f9fa" 
          textColor="#761A15"
          mode="elevated" 
          style={{borderRadius: 12, width: '95%', alignItems: 'center', paddingVertical: 10, borderWidth: 1, borderColor: '#761A15'}}
          labelStyle={{fontFamily: 'Roboto_400Regular', fontSize: 18}}
          onPress={async () => { await logout(); }}
        >
          Log out
        </PaperButton>
      </View> */}
    </View>
  )
}

export default NotificationScreen

const styles = StyleSheet.create({})