<div align="center">
  <img width="200" height="200" src="./assets/icon-android-foreground.png">
</div>

# Well Ping
![CI](https://github.com/StanfordSocialNeuroscienceLab/WellPing/workflows/CI/badge.svg) [![runs with expo](https://img.shields.io/badge/Runs%20with%20Expo-000.svg?style=flat-square&logo=EXPO&labelColor=f3f3f3&logoColor=000)](https://expo.io/)

A React Native survey app that pings you once a while to answer questions!

## Docs
- [Supported Question Types](https://github.com/StanfordSocialNeuroscienceLab/WellPing/wiki/Supported-Question-Types)

## Demo
Log in with the login code
```
__debug__ __test__ https://wellping_local__.ssnl.stanford.edu/debug.json
```

Alternatively, click this link to automatically enter the login code in the app: https://stanfordsocialneurosciencelab.github.io/wellping/login?code=__debug__%20__test__%20https%3A%2F%2Fwellping_local__.ssnl.stanford.edu%2Fdebug.json

(`https://wellping_local__.ssnl.stanford.edu/debug.json` is a fake study file URL that actually access the local study file "config/survey.json". It can be logged in with any non-empty username and password combination and will not upload anything.)

## Development
```bash
# Installation
yarn

# Start
yarn start

# Test
yarn test

# Publish app
expo publish
```
