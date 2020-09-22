<div align="center">
  <img width="200" height="200" src="./assets/icon-android-foreground.png">
</div>

# Well Ping

![CI](https://github.com/StanfordSocialNeuroscienceLab/WellPing/workflows/CI/badge.svg) [![runs with expo](https://img.shields.io/badge/Runs%20with%20Expo-000.svg?style=flat-square&logo=EXPO&labelColor=f3f3f3&logoColor=000)](https://expo.io/)

A React Native survey app that pings you once a while to answer questions!

## Docs

*Work in Progress*

- [Docs](https://stanfordsocialneurosciencelab.github.io/WellPing/)

## Demo

Log in with the login code

```
__debug__ __test__ https://debug.local.wellping.ssnl.stanford.edu/DEBUG_STUDY.json
```

Alternatively, click this link on your phone to automatically enter the login code in the app: https://wellping.github.io/app/login?code=__debug__%20__test__%20https%3A%2F%2Fdebug.local.wellping.ssnl.stanford.edu%2FDEBUG_STUDY.json

> `https://debug.local.wellping.ssnl.stanford.edu/DEBUG_STUDY.json` is a local study file URL (learn more in the [`local/`](./local/) folder). It can be logged in with any non-empty username and password combination and will not upload anything.

## Development

```bash
# Installation
yarn

# We have to include a `study.json` file here as otherwise the program will not build (see https://github.com/facebook/react-native/issues/6391).
echo "{}" > local/private/study.json

# Start
yarn start

# Test
yarn test
```

## Deployment

Channels should be in the format of `prod-v{VERSION NUMBER}`. For example, Version 1.0.1 uses channel `prod-v1-0-1`.

```bash
# Publish app
expo publish --release-channel prod-v1-0-1

# Build iOS
expo build:ios --release-channel prod-v1-0-1
# Build Android
expo build:android --release-channel prod-v1-0-1
```
