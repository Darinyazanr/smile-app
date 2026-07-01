import { ExpoConfig, ConfigContext } from 'expo/config';

const APP_NAME = '今日微笑';
const BUNDLE_ID = 'com.smileapp.today';
const VERSION = '1.2.0';
const BUILD_NUMBER = '3';

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    name: APP_NAME,
    slug: 'smile-app',
    version: VERSION,
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'smileapp',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: BUNDLE_ID,
      buildNumber: BUILD_NUMBER,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: BUNDLE_ID,
      versionCode: 3,
    },
    "web": {
      "bundler": "metro",
      "output": "single",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      process.env.EXPO_PUBLIC_BACKEND_BASE_URL ? [
        "expo-router",
        {
          "origin": process.env.EXPO_PUBLIC_BACKEND_BASE_URL
        }
      ] : 'expo-router',
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": `允许今日微笑App访问您的相册，以便您上传或保存图片。`,
          "cameraPermission": `允许今日微笑App使用您的相机，以便您直接拍摄照片上传。`,
          "microphonePermission": `允许今日微笑App访问您的麦克风，以便您拍摄带有声音的视频。`
        }
      ],
      [
        "expo-location",
        {
          "locationWhenInUsePermission": `今日微笑App需要访问您的位置以提供周边服务及导航功能。`
        }
      ],
      [
        "expo-camera",
        {
          "cameraPermission": `今日微笑App需要访问相机以拍摄照片和视频。`,
          "microphonePermission": `今日微笑App需要访问麦克风以录制视频声音。`,
          "recordAudioAndroid": true
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/images/icon.png",
          "color": "#F59E0B",
          "sounds": []
        }
      ],
      [
        "expo-calendar",
        {
          "calendarPermission": `今日微笑App需要访问日历以同步您的打卡记录。`
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "1c904c07-917b-4e8c-9a51-b9fc1ead23c6"
      }
    },
    "experiments": {
      "typedRoutes": true
    }
  }
}
