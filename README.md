# nemon
<ins>Ne</ins>twork <ins>Mon</ins>itoring
A network/internet monitoring tool/widget based on electron.

Nemon provides a little window which constantly shows your current ping to a server which you can define in the settings.

<img src="https://i.imgur.com/kyKPvrj.png" />

## Installation
Download the Windows installer or Linux AppImage from the [releases page](https://github.com/dinariox/nemon/releases). On Windows, run the `.exe` installer. On Linux, make the `.AppImage` executable and run it:

```sh
chmod +x Nemon-*.AppImage
./Nemon-*.AppImage
```

To build and publish both the Windows installer and Linux AppImage in one GitHub release, run `npm run deploy`. Nemon's auto-updater checks for published updates when the app starts.
