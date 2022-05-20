# Upgrading Expo

Expo frequently upgrades its SDK. You should regularly check if new SDK version has been published at Expo's [website](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/) and follow the upgrade instruction. By upgrading regularly, you can avoid having deal with massive changes across multiple SDK upgrades.

After you upgrade the SDK, you should check to make sure the app still works as intended. Specifically, you could look for the following things: (though this is not a comprehensive list)
- Make sure all tests still pass with `yarn test`.
- Make sure when you launch the app, there is no warning or error messages in the console (e.g., no deprecation warning in the log).
- Read through the SDK upgrade's change list (e.g., [blog post for Expo SDK 43](https://blog.expo.dev/expo-sdk-43-aa9b3c7d5541)), and especially pay close attention to the "Deprecations, renamings, and removals" section.
- Manually test the basic functionalities of the app such as logging in, receiving pings, completing pings, and uploading data.

## Important Note

One important thing to notice is that over-the-air updates (through `expo publish`) will not apply to the app built with an older SDK version after you upgrade the SDK version even if you publish in the same Release Channel. In another word, if you upgrade the SDK version, you have to publish a new version on App Store and Google Play; OTA updates published after an SDK update will not be reflected in the user's existing app. Learn more about different options to publish app changes in [Publishing Code Updates & Versioning](./publishing-updates-and-versioning.md).
