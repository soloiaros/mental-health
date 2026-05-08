# Bubl

> Your personal space to establish boundaries, reflect, and manage emotional wellbeing.

<div align="center">
  <img width="25%" height="auto" alt="app logo" src="https://github.com/user-attachments/assets/065bfeae-5288-4fc4-81e9-91ad21aac502" />
</div>

Welcome to **Bubl**! This is a fun, interactive React Native app built to help you track your emotions and reinforce self-respect in a visual, spatial way. Drop your feelings onto an infinite canvas and watch your progress grow.

---

## 📸 Screenshots

Here’s a sneak peek of Bubl in action:

<div align="center">
  <img width="18%" height="auto" alt="Simulator Screenshot" src="https://github.com/user-attachments/assets/56d69e76-b3cf-4335-b75c-0770eefe1b70" />
  <img width="18%" height="auto" alt="Simulator Screenshot" src="https://github.com/user-attachments/assets/2ac38f01-9ba1-49fc-9cca-07d1064e2ced" />
  <img width="18%" height="auto" alt="Simulator Screenshot" src="https://github.com/user-attachments/assets/8cb26b39-d32e-4741-9041-e9cf4fc9f164" />
  <img width="18%" height="auto" alt="Simulator Screenshot" src="https://github.com/user-attachments/assets/da192813-ec1d-4bcf-8c3f-e14db27838d7" />
  <img width="18%" height="auto" alt="Simulator Screenshot" src="https://github.com/user-attachments/assets/53d12243-c18f-4739-83bf-231b7e0d18fe" />


</div>

---

## ✨ Features

- 🎨 **Emotion Canvas**: An infinite, pan-and-zoom surface where you can plot your emotional state using text, emojis, or media.
- 🧱 **Self-Respect Wall**: A dedicated space to log boundaries and positive affirmations.
- ⚡ **Lightning Fast Persistence**: Your logs are saved instantly on-device using `react-native-mmkv` so your data never leaves your phone unless you want it to.

## 🛠️ Tech Stack

Bubl was built as a fun side-project with a powerful, modern stack:

- **Framework**: [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/)
- **Routing**: Expo Router
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Local Storage**: `react-native-mmkv` (with AsyncStorage fallback for web)
- **Animations & Gestures**: `react-native-reanimated` & `react-native-gesture-handler`
- **UI Components**: `@gorhom/bottom-sheet`, custom Glass Surfaces, and Themed elements.

## 🚀 Getting Started

### Prerequisites

- Node.js installed
- Expo Go app on your physical device, or an iOS Simulator / Android Emulator running.

### Installation

1. Clone the repository and navigate into it:

   ```bash
   cd MentalHealth
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the Expo development server:

   ```bash
   npm start
   ```

4. Press `i` to open in iOS simulator, `a` for Android, or scan the QR code with your Expo Go app!

## 📂 Codebase Structure Highlights

- `app/`: Expo Router screens and tab layouts.
- `components/`: Reusable UI components including the `InfiniteCanvas` and `LogEntrySheet`.
- `store/`: Zustand stores for global state and MMKV persistence adapters.
- `utils/`: Helper functions for ID generation, random spawn points, and date formatting.
- `assets/`: App icons, splash screens, and images.

---

_Take a deep breath, set your boundaries, and enjoy the Bubl! 🫩✌️_
