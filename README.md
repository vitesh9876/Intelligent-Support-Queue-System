# Intelligent Support Queue System

A complete MERN stack application featuring a real-time priority queue for customer support, built for the Agumentik Internship Task.

## Project Structure
The repository is divided into three core modules:

1. **`backend/`**
   - Node.js & Express server
   - In-Memory MongoDB (Zero-configuration required)
   - Socket.io for real-time bidirectional communication
   - Calculates dynamic wait-time priorities and displacement counts.

2. **`admin-web/`**
   - React + Vite + Tailwind CSS v4
   - Real-time Admin Dashboard
   - Allows agents to take tickets from the queue based on specializations.

3. **`customer-mobile/`**
   - React Native (Bare Workflow ready)
   - Real-time customer facing application.
   - Heartbeat inactivity detection to remove idle users.

## Running Locally

### Backend
```bash
cd backend
npm install
node server.js
```
The backend will automatically start an In-Memory MongoDB instance and run on `http://localhost:5000`.

### Admin Dashboard
```bash
cd admin-web
npm install
npm run dev
```
Open `http://localhost:5173`.

### Customer App
```bash
cd customer-mobile
npm install
npx expo start -c
```
Press `w` to open in browser, or open in Android emulator.

## Building the APK (Bare React Native)
To convert the Expo project into a raw, native Android project (Bare Workflow) and generate an APK without Expo's cloud services:

1. Eject to a bare React Native project:
```bash
cd customer-mobile
npx expo prebuild --clean
```
2. Build the APK using Android Studio, or via command line:
```bash
cd android
./gradlew assembleRelease
```
The APK will be generated at `android/app/build/outputs/apk/release/app-release.apk`.
