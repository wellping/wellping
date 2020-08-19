# Privacy & Security

## What data will Well Ping store locally and/or upload to Firebase?

The following data is stored on the user's device and uploaded to Firebase:

- A participant's username/password combination.
- A participant's responses to the questions in pings.
- A participant's device information (their phone platform and brand).

No identifiable information of a participant such as their name will be stored locally or uploaded to Firebase (unless your ping streams include questions that require the partipants to disclose identifiable information).

## Can everyone view my study file?

Yes, everyone will be able to view your study file (the file that includes your question streams). Hence, you should not include any sensitive information in the file.

## How secure is Firebase?

You may wish to review "[Privacy and Security in Firebase](https://firebase.google.com/support/privacy/)" and "[Terms of Service for Firebase Services](https://firebase.google.com/terms/)" for relevent services used by Well Ping (Firebase Authentication and Firebase Realtime Database).

## Is the data stored in Firebase Realtime Database encrypted?

Data in Firebase Realtime Database is encrypted at rest. See [https://firebase.google.com/support/privacy/#data_encryption](https://firebase.google.com/support/privacy/#data_encryption).

## Who has access to the data stored in Firebase Realtime Database?

Only the Firebase project Owner and the project members they grant permissions to (learn more [here](https://firebase.google.com/docs/projects/iam/overview)) have access to the entire Firebase Realtime Database.

Each participant has read and write access to their own ping responses (but not others' ping responses) stored in the Firebase Realtime Database.

## How secure is the data upload/download process?

Firebase services encrypt data in transit using HTTPS. See [https://firebase.google.com/support/privacy/#data_encryption](https://firebase.google.com/support/privacy/#data_encryption).
