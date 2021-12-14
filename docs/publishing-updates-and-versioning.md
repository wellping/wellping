# Publishing Updates & Versioning

This document will discuss
- different ways to publish updates for Well Ping;
- things you need to consider when you want to update Well Ping;
- how Well Ping is versioned; and
- how to publish updates.

## Considerations When You Want to Update Well Ping

When you have changed some TypeScript code in the project, there are two ways you could publish the changes: **Over-the-Air Updates** and **App Store & Google Play Updates**. (For simplicit, we will refer to "App Store & Google Play" as "App Stores" below.)

As a rule of thumb, minor changes could be published with over-the-air updates, but major changes (and important changes) should be also published by updating the app on App Stores. It is also a good idea to update the app on App Stores regularly to make sure new users will open the newest version in their first launch.

Another thing to notice is the compabilitiy between the app's update and the study file's update when you update them. This should be easier to coordinate after https://github.com/wellping/wellping/issues/100 is resolved.

### Over-the-Air Updates

Over-the-air updates will be downloaded the next time the user launches the app (as in launches from the fully terminated state, not from background) and will then be applied the next time the user launches the app again. (This is because we have set `updates.fallbackToCacheTimeout` to `0` in `app.json`.)

An example timeline looks like this:
- The developer published an over-the-air update to change the home page background from red to blue.
- The user exited the app (but did not terminate the app).
- The user reentered the app (from background). They still saw a red background. The OTA update had not been downloaded yet.
- The user fully terminated the app.
- The user launched the app. They still saw a red background. The OTA update had now been downloaded (as long as the user had opened the app long enough to let the download finish).
- The user exited the app (but did not terminate the app).
- The user reentered the app (from background). They still saw a red background.
- The user fully terminated the app.
- The user launched the app. Now the OTA update had been applied and they now saw a blue background.

As you can see, the OTA updates take some time before the user could actually see the changes. This problem is somewhat better in Well Ping because we ask the user to "Please close the app entirely." after completing a ping. So it is reasonable to assume that the user will see the changes after completing two or three more pings. Still, this takes time and you should consider this accordingly when you are trying to push an OTA update.

One important thing to keep in mind is that the first launch of the app after a user downloads the app from App Stores will always use the version that you built for App Stores. In another word, you should not expect a new user to immediately see your OTA updates (that are published after the app has been built and uploaded to App Stores) when they first launch the app.

When publishing your changes through OTA, you should also use appropriate Release Channels (see [Build Version](#build-version) below).

### App Store & Google Play Updates

Publishing updates on App Stores allow all new users (and existing users who update through App Stores) to directly launch into the app with the changes.

Some caveats:
- It might take a few days before App Store and Google Play approve your updates (usually Google Play is faster than App Store). You might also face rejections from App Stores.
- If you only publish updates on App Stores but not over-the-air, many users might not regularly update the app from App Stores, so they will not update to the new version for a long time.

As such, it is always a good idea to publish an OTA update alongside of an App Stores update.

## Versioning

There are two separate versioning of Well Ping: **JS Version** and **Build Version**.

### JS Version

The JS Version corresponds to the version of our TypeScript code. It is defined by the `JS_VERSION_NUMBER` in the `src/helpers/debug.ts` file.

The JS Version should be updated each time we publish a new OTA update (or App Stores update with some changes from the last OTA update). This value is also shown at the top of the app to the user so that when something goes wrong, they could tell us what version of our TypeScript code they are running.

The JS Version's format is `js.[year - 2019].month.day.[the number of version on that day]` (e.g., `js.2.10.27.1` means that this is the first OTA update we published on 2021-10-27).

### Build Version

The Build Version is the `version` field in the `app.json` file. Its value is a conventional version number like `1.1.2`. This is updated each time we publish a new update on App Stores.

Along with the `version` field in the `app.json` file, we also have `ios.buildNumber` and `android.versionCode` in the same file. Those are used by App Store and Google Play respectively to uniquely identify a build. For our purpose, we just need to keep `ios.buildNumber` and `android.versionCode` the same and make sure we increment them every time we change the `version` field (or when we, for some reason, want to upload a new binary to App Stores with the smae `version`).

An important thing to notice is this version number does NOT capture the actual JS Version (hence if we have published some OTA updates after publishing on App Stores, the Build Version does not actually capture what version of our TypeScript code the user is running). As such, in general, we should not use the Build Version as a way to identify what version of code the user is running.

Also notice that we correspond each Build Version to a **[Release Channel](https://docs.expo.dev/distribution/release-channels/)**. The Release Channel should be in the format of `prod-v[Build Version]`. For example, Build Version `1.0.1` uses Release Channel `prod-v1-0-1`. The benefits of correspond each Build Version to a Release Channel is that it allows better controls in the cases of major updates.

## Updating & Versioning Example

To summarize, the app's update cycle might look something like this:
- 2020-01-01: App Stores Update (Build Version: `1.0`; JS version: `js.1.1.1.1`)
- 2020-01-05: OTA Update with change `a` (Build Version: `1.0`; JS version: `js.1.1.5.1`)
- 2020-01-06: OTA Update with change `b` (Build Version: `1.0`; JS version: `js.1.1.6.1`)
- 2020-01-10: OTA Update with change `c` (Build Version: `1.0`; JS version: `js.1.1.10.1`)
- 2020-01-15: App Stores Update (containing changes `a`, `b`, and `c`) (Build Version: `1.1`; JS version: `js.1.1.10.1`)
- 2020-02-01: OTA Update with change `e` (Build Version: `1.0`; JS version: `js.1.2.1.1`)
- 2020-02-02: OTA Update with change `f` (Build Version: `1.0`; JS version: `js.1.2.2.1`)
- 2020-02-05: OTA Update with change `g` (Build Version: `1.0`; JS version: `js.1.2.5.1`)
- 2020-02-10: OTA Update with change `h` & App Stores Update (containing changes `e`, `f`, `g`, and `h`) (Build Version: `1.2`; JS version: `js.1.2.10.1`)

## How to Actually Publish Updates

Now we know when we should publish updates and what we need to consider, we can see how we actually publish updates.

### Publishing Over-the-Air Updates

To publish over-the-air updates to a specific Release Channel (see [Build Version](#build-version) above), use
```bash
expo publish --release-channel [Release Channel ID]
```
in the project folder.

For example, to publish an OTA update to Build Version `1.0.1`, we use
```bash
expo publish --release-channel prod-v1-0-1
```

### Publishing App Store & Google Play Updates

You will need to upload a binary to App Store and a binary to Google Play in order to publishing updates to App Store and Google Play.

To build the binaries, use
```bash
# Build a binary for iOS
expo build:ios --release-channel [Release Channel ID]
# Build a binary for Android
expo build:android --release-channel [Release Channel ID]
```
in the project folder. Notice that iOS, you would want to select "archive - Deploy the build to the store" and for Android, you would want to select "app-bundle - Build an optimized bundle for the store".

Then you could follow [https://docs.expo.dev/distribution/uploading-apps/](https://docs.expo.dev/distribution/uploading-apps/) to upload the app to App Store and Google Play.

TODO: consider the new EAS Build
