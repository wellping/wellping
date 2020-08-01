# Well Ping
![CI](https://github.com/StanfordSocialNeuroscienceLab/WellPing/workflows/CI/badge.svg) [![runs with expo](https://img.shields.io/badge/Runs%20with%20Expo-000.svg?style=flat-square&logo=EXPO&labelColor=f3f3f3&logoColor=000)](https://expo.io/)

A survey app that pings you once a while to answer questions!

## Docs
- [Supported Question Types](https://github.com/StanfordSocialNeuroscienceLab/WellPing/wiki/Supported-Question-Types)

## Demo
Login with the magic login code 🧙‍♀️:
```
ewoJInVzZXJuYW1lIjogIl9fZGVidWdfXyIsCgkicGFzc3dvcmQiOiAiX190ZXN0X18iLAoJInN0dWR5RmlsZUpzb25VcmwiOiAiaHR0cHM6Ly93ZWxscGluZ19sb2NhbF9fLnNzbmwuc3RhbmZvcmQuZWR1L2RlYnVnLmpzb24iCn0=
```

In case you are wondering, it's just the Base64 encoding of this:
```json
{
	"username": "__debug__",
	"password": "__test__",
	"studyFileJsonUrl": "https://wellping_local__.ssnl.stanford.edu/debug.json"
}
```

This access the local study file "config/survey.json".

## Development
```bash
# Installation
yarn

# Start
yarn start

# Test
yarn test
```
