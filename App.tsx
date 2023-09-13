import "./src/helpers/global";

import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View } from 'react-native';
import RootScreen from "./src/RootScreen";
import * as SplashScreen from 'expo-splash-screen';

// TODO: USE https://github.com/carloscuesta/react-native-error-boundary
// once https://github.com/expo/expo/issues/6598 is solved.


// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        // await Font.loadAsync(Entypo.font);
        // Artificially delay for two seconds to simulate a slow loading
        // experience. Please remove this if you copy and paste the code!
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // This tells the splash screen to hide immediately! If we call this after
      // `setAppIsReady`, then we may see a blank screen while the app is
      // loading its initial state and rendering its first pixels. So instead,
      // we hide the splash screen once we know the root view has already
      // performed layout.
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaView
      onLayout={onLayoutRootView}>
      <RootScreen />
      {/* eslint-disable-next-line react/style-prop-object */}
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}
