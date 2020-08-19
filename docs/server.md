# Set Up Your Server

Before your participants can start using Well Ping, you have to set up a server that will store your study file (e.g., the questions) as well as the participants' responses.

Luckily, setting up a server is very simple. Well Ping is designed to use Google's popular **[Firebase](https://firebase.google.com/)** platform. Specifically, Well Ping is utilizing **[Firebase Authentication](https://firebase.google.com/docs/auth)** (for authenticating the participant) and **[Firebase Realtime Database](https://firebase.google.com/docs/database/)** (for storing the participants' responses). You may wish to review "[Privacy and Security in Firebase](https://firebase.google.com/support/privacy/)" and "[Terms of Service for Firebase Services](https://firebase.google.com/terms/)" for relevent services (Firebase Authentication and Firebase Realtime Database) before continuing. You may also want to learn more about Well Ping's [Privacy & Security](./privacy-security).

Optionally, you may also choose to host your study file as well as your (optional) dashboard using **[Firebase Hosting](https://firebase.google.com/docs/hosting)** (although you are free to choose other platforms such as **[GitHub Pages](https://pages.github.com/)**).

Let's get started!

## 1. Create a Firebase project

A **Firebase project** is basically a dedicated entity for a single project - in this case, your study. To create a new Firebase project, follow [**Step 1: Create a Firebase project**](https://firebase.google.com/docs/web/setup#create-firebase-project).

Some notes:

- You may use any Project name and Project ID you like.
- You do not have to set up the optional Google Analytics.

At this point, you should have a dashboard page like follows:
