# Set Up Your Server

Before your participants can start using Well Ping, you have to set up a server that will store your study file (e.g., the questions) as well as the participants' responses.

Luckily, setting up a server is very simple. Well Ping is designed to use Google's popular **[Firebase](https://firebase.google.com/)** platform. Specifically, Well Ping is utilizing **[Firebase Authentication](https://firebase.google.com/docs/auth)** (for authenticating the participant) and **[Firebase Realtime Database](https://firebase.google.com/docs/database/)** (for storing the participants' answers). You may wish to review "[Privacy and Security in Firebase](https://firebase.google.com/support/privacy/)" and "[Terms of Service for Firebase Services](https://firebase.google.com/terms/)" for relevent services (Firebase Authentication and Firebase Realtime Database) before continuing.

Optionally, you may also choose to host your study file as well as your (optional) dashboard using **[Firebase Hosting](https://firebase.google.com/docs/hosting)** (although you are free to choose other platforms such as **[GitHub Pages](https://pages.github.com/)**).

Let's get started!

#
