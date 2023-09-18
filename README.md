<div align="center">
  <a href="https://ssnl.stanford.edu/"><img width="350" src="./.images/SSNL.jpg"></a>
  <br><br>
  <a href="https://wellping.github.io/"><img width="200" height="200" src="./assets/icon-android-foreground.png"></a>
</div>

# Well Ping

[![CI](https://github.com/wellping/wellping/actions/workflows/jest.yml/badge.svg)](https://github.com/wellping/wellping/actions/workflows/jest.yml) [![runs with expo](https://img.shields.io/badge/Runs%20with%20Expo-000.svg?style=flat-square&logo=EXPO&labelColor=f3f3f3&logoColor=000)](https://expo.dev/)

A React Native survey app that pings you once a while to answer questions!

**Download on App Store**: https://apps.apple.com/us/app/id1532364388

**Download on Google Play**: https://play.google.com/store/apps/details?id=edu.stanford.ssnl.wellping

## Docs

*Work in Progress*

- [User Docs](https://wellping.github.io/)
- [Developer Docs](https://wellping.github.io/wellping/)
- [Well Ping Study File Editor](https://wellping.github.io/study-file-editor/)

### Related Tools

- [WellPing EMA Parser](https://github.com/StanfordSocialNeuroscienceLab/wellping-ema-parser)

## Demo

Log in with the login code

```
__debug__-__test__-https://debug.local.wellping.ssnl.stanford.edu/DEBUG_STUDY.json
```

Alternatively, click this link on your phone to automatically enter the login code in the app: https://wellping.github.io/app/login?code=__debug__-__test__-https%3A%2F%2Fdebug.local.wellping.ssnl.stanford.edu%2FDEBUG_STUDY.json

> `https://debug.local.wellping.ssnl.stanford.edu/DEBUG_STUDY.json` is a local study file URL (learn more in the [`local/`](./local/) folder). It can be logged in with any non-empty username and password combination and will not upload anything.

## Development

Note the following commands are deprecated. See https://blog.expo.dev/the-new-expo-cli-f4250d8e3421
```bash
# Use ONE of these commands to install the expo package
npm install expo
yarn add expo

# Install eas-cli if you need Expo Application Services (EAS) i.e. app deployment
npm install -g eas-cli
yarn global add eas-cli

# Do not use this command anymore
npm install -g expo-cli
yarn global add expo-cli

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
