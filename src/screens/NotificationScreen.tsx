import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import {
  RootStackParamList,
} from '../RootScreen'
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'Notification'>;

const NotificationScreen = ({navigation}: Props) => {
  return (
    <View>
      <Text>NotificationScreen</Text>
    </View>
  )
}

export default NotificationScreen

const styles = StyleSheet.create({})