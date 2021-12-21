<div align="center">
  <img width="200" height="200" src="./assets/icon-android-foreground.png">
</div>

# Well Ping

![CI](https://github.com/StanfordSocialNeuroscienceLab/WellPing/workflows/CI/badge.svg) [![runs with expo](https://img.shields.io/badge/Runs%20with%20Expo-000.svg?style=flat-square&logo=EXPO&labelColor=f3f3f3&logoColor=000)](https://expo.io/)

A React Native survey app that pings you once a while to answer questions!

**Download on App Store**: https://apps.apple.com/us/app/id1532364388

**Download on Google Play**: https://play.google.com/store/apps/details?id=edu.stanford.ssnl.wellping

## Docs

*Work in Progress*

- [Docs](https://wellping.github.io/)

## Demo

Log in with the login code

```
__debug__-__test__-https://debug.local.wellping.ssnl.stanford.edu/DEBUG_STUDY.json
```

Alternatively, click this link on your phone to automatically enter the login code in the app: https://wellping.github.io/app/login?code=__debug__-__test__-https%3A%2F%2Fdebug.local.wellping.ssnl.stanford.edu%2FDEBUG_STUDY.json

> `https://debug.local.wellping.ssnl.stanford.edu/DEBUG_STUDY.json` is a local study file URL (learn more in the [`local/`](./local/) folder). It can be logged in with any non-empty username and password combination and will not upload anything.

## Development

```bash
npm install -g expo-cli
npm install -g eas-cli

# Installation
yarn install

# Start
yarn start

# Test
yarn test
```

### `@wellping/study-schemas`

See https://github.com/wellping/study-schemas/blob/main/README-FOR-USERS.md.

## Deployment

See https://wellping.github.io/wellping/publishing-updates-and-versioning.html.
