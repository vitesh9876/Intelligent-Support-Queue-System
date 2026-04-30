# 🚀 Intelligent Support Queue System

A real-time, priority-based MERN stack application designed for high-efficiency customer support management. This project features dynamic ticket routing, displacement-based priority boosting, and automated inactivity handling.

---

## 🔗 Live Deployment Links

| Component | URL | Status |
| :--- | :--- | :--- |
| **Admin Dashboard** | [https://intelligent-support-queue-system.netlify.app](https://intelligent-support-queue-system.netlify.app) | 🟢 Live |
| **Backend API** | [https://intelligent-support-queue-system.onrender.com](https://intelligent-support-queue-system.onrender.com) | 🟢 Live |
| **Customer App** | *Generate APK via EAS for Mobile* | 🟢 Ready |

---

## ✨ Key Features

- **⚡ Real-Time Updates:** Powered by Socket.io for instantaneous queue status updates across all platforms.
- **📈 Dynamic Priority Logic:** Tickets gain priority over time (0.5 score/min). 
- **🛡️ Displacement Protection:** Low-priority tickets that are "skipped" 3 times are automatically boosted to the top of the queue.
- **🤖 Specialized Routing:** Automated matching of tickets (Billing/Technical) to agents with corresponding specializations.
- **⏱️ Inactivity Watchdog:** Customers are automatically removed from the queue if no heartbeat is detected for 2 minutes.

---

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Tailwind CSS v4
- **Mobile:** React Native (Expo Bare Workflow)
- **Backend:** Node.js, Express, Socket.io
- **Database:** MongoDB (using `mongodb-memory-server` for zero-config testing)

---

## 🚀 Getting Started Locally

### 1. Backend
```bash
cd backend
npm install
npm start
```
*Runs on `http://localhost:5000`*

### 2. Admin Dashboard
```bash
cd admin-web
npm install
npm run dev
```
*Runs on `http://localhost:5173`*

### 3. Customer Mobile App
```bash
cd customer-mobile
npm install
npx expo start
```

---

## 📦 Building the APK

To generate a standalone Android APK for the customer application:

1. Ensure you have the [Expo CLI](https://docs.expo.dev/get-started/installation/) installed.
2. Run the build command:
   ```bash
   cd customer-mobile
   eas build -p android --profile preview
   ```
3. Download the generated `.apk` from the provided Expo link.

---

## 📁 Project Structure

- `backend/`: Express server logic, Socket.io handlers, and Mongoose models.
- `admin-web/`: React-based dashboard for agents and administrators.
- `customer-mobile/`: React Native application for customer queue entry and monitoring.

---
**Developed for the Agumentik Internship Task.**
