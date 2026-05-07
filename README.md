# Bubl🫩✌️

> Your personal space to establish boundaries, reflect, and manage emotional wellbeing.

Welcome to **Bubl**! This is a fun, interactive React Native app built to help you track your emotions and reinforce self-respect in a visual, spatial way. Drop your feelings onto an infinite canvas and watch your progress grow.

---

## 📸 Screenshots

Here’s a sneak peek of Bubl in action:

<div align="center">
  <img src="https://via.placeholder.com/200x400?text=Screenshot+1" width="18%" alt="Screenshot 1 Placeholder">
  <img src="https://via.placeholder.com/200x400?text=Screenshot+2" width="18%" alt="Screenshot 2 Placeholder">
  <img src="https://via.placeholder.com/200x400?text=Screenshot+3" width="18%" alt="Screenshot 3 Placeholder">
  <img src="https://via.placeholder.com/200x400?text=Screenshot+4" width="18%" alt="Screenshot 4 Placeholder">
  <img src="https://via.placeholder.com/200x400?text=Screenshot+5" width="18%" alt="Screenshot 5 Placeholder">
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
