The app uses **[React Native](https://reactnative.dev/)** (with **[Expo](https://expo.dev/)**) and is written purely in **[TypeScript](https://www.typescriptlang.org/)**.

The main benefit of using React Native is we could write only one set of TypeScript code to support both iOS and Android devices. With Expo, it also allows easy setup and development without needing to worry about any native iOS or Android code.

The app's source code could be found at [https://github.com/wellping/wellping](https://github.com/wellping/wellping).

## Upgrading Expo

Expo frequently upgrades its SDK. You should regularly check if new SDK version has been published at Expo's [website](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/) and follow the upgrade instruction. By upgrading regularly, you can avoid having deal with massive changes across multiple SDK upgrades.

After you upgrade the SDK, you should check to make sure the app still works as intended. Specifically, you could look for the following things: (though this is not a comprehensive list)
- Make sure all tests still pass with `yarn test`.
- Make sure when you launch the app, there is no warning or error messages in the console (e.g., no deprecation warning in the log).
- Read through the SDK upgrade's change list (e.g., [blog post for Expo SDK 43](https://blog.expo.dev/expo-sdk-43-aa9b3c7d5541)), and especially pay close attention to the "Deprecations, renamings, and removals" section.
- Manually test the basic functionalities of the app such as logging in, receiving pings, completing pings, and uploading data.

One important thing to notice is that over-the-air updates (through `expo publish`) will not apply to the app built with an older SDK version after you upgrade the SDK version. Learn more about different options to publish app changes [here](TODO).
