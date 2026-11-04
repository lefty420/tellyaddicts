# Spelunkr TV (Android TV / Google TV / NVIDIA Shield)

A full-screen wrapper app for https://spelunkr.tv. Shows up in the TV launcher with a banner,
keeps the screen awake, supports remote D-pad, Back, and play/pause keys, and shows a retry
page if the network is down.

## Get the APK (no Android Studio needed)

1. Create a new GitHub repository and upload everything in this folder (keep the
   `.github` folder).
2. Open the repo's **Actions** tab, pick **Build APK**, and press **Run workflow**
   (it also runs on every push to `main`).
3. When it finishes, open the run and download the **spelunkr-tv-apk** artifact.
   Unzip it to get `app-debug.apk`.

## Or build locally

Open this folder in Android Studio and choose **Build > Build APK(s)**, or run
`./gradlew assembleDebug`. The APK ends up in `app/build/outputs/apk/debug/`.

## Install on the TV

- **Downloader app:** install "Downloader" from the TV's app store, host the APK somewhere
  (Dropbox, Google Drive direct link, etc.), and open the link. Allow "Install unknown apps"
  for Downloader when asked.
- **adb:** enable Developer options and Network debugging on the TV, then
  `adb connect <tv-ip>` and `adb install app-debug.apk`.

On Google TV the app may appear at the end of the app row; use "Apps > Manage" or the
"Spelunkr" entry to move it. On Shield it appears in the Apps list.

## Customising

- URL: `HOME_URL` in `app/src/main/java/tv/spelunkr/app/MainActivity.java`
- Banner / icon: `app/src/main/res/drawable-xhdpi/banner.png` (320x180) and
  `app/src/main/res/mipmap-xxxhdpi/ic_launcher.png`
