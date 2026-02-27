# React Native Skia Example Demo

A feature-rich React Native application demonstrating the powerful rendering capabilities of `@shopify/react-native-skia`, `Skottie`, and advanced Gesture Handling.

## 🚀 Features

### 1. Advanced Image Editor
A fully interactive photo editor built using Skia Canvases allowing users to manipulate images with high performance.
- **Pinch-to-Zoom & Pan:** Navigate around your high-res photos effortlessly using `react-native-gesture-handler`.
- **Shape Stamping:** Stamp interactive vector shapes (Circles, Rectangles, Stars, Polygons, Lines, and Points) directly onto images.
- **Dynamic Interactions:** Tap to select any stamped shape to dynamically move, rotate, and resize it.
- **Deep Customization:** 
  - Change shape Fill and Border colors independently.
  - Adjust Border Width directly from the UI.
  - Dynamically morph Polygon and Star sides using built-in controls.
- **Exporting:** Save your fully edited masterpiece directly to your device's photo gallery.

### 2. High-Performance UI Components
- **Antigravity Orb:** A glowing, pulsing neon orb component built entirely in Skia. Utilizes `react-native-reanimated` for smooth 60FPS physics-like motion, dynamic gradients, and animated glowing effects without triggering React re-renders.

### 3. Skottie Animation Engine
- Render complex After Effects JSON animations natively at high frame rates using the built-in Skottie integration.

## 🛠 Tech Stack
- **Framework:** React Native (Expo)
- **Graphics Engine:** `@shopify/react-native-skia`
- **Gestures:** `react-native-gesture-handler`
- **Animations:** `react-native-reanimated`
- **Media:** `expo-image-picker`, `expo-media-library`

## 📦 Getting Started

### Prerequisites
Make sure you have Node.js and npm/yarn installed.

### Installation
1. Clone this repository:
```bash
git clone https://github.com/pamujsharma1/skia-demo-react-native.git
cd skia-demo-react-native
```

2. Install dependencies:
```bash
npm install
```

3. Start the Expo development server:
```bash
npx expo start --clear
```

4. Press `a` to open Android, `i` to open iOS simulator, or scan the QR code with the Expo Go app on your physical device.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!

## 📝 License
This project is open-source and available under the MIT License.
