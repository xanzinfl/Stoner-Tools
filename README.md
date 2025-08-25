# Stoner Tools
A handy desktop utility for enthusiasts, featuring a global 420 countdown, Discord Rich Presence, a rip counter, and OBS integration.

---

## ✨ Features

Stoner Tools is packed with features designed for convenience and fun:

*   **Global 420 Finder:** Automatically locates the very next occurrence of 4:20, anywhere in the world, and provides a real-time countdown.
*   **Discord Rich Presence:** Display your status and rip count directly on your Discord profile. Customize buttons and images to link to your social media or other sites.
*   **Rip Counter:** A simple counter that tracks your hits. The count is saved to a local text file of your choice.
*   **OBS Widgets:** Two dedicated browser source widgets for your streaming setup:
    *   A clean, real-time 420 countdown.
    *   A display for your current rip count.

---

## ⬇️ Downloads

| Type | Link | Description |
| :--- | :--- | :--- |
| **Windows Installer** | **[stoner-tools.msi](https://github.com/xanzinfl/Stoner-Tools/releases/download/v1.0.4/stoner-tools.msi)** | Installs the application and adds it to your start menu. |

---

## Getting Started

1.  **Download:** Grab the **Windows Installer** or the **Portable Version** from the links above.
2.  **Run:** Launch the `Stoner Tools` application.
3.  **Configure:** Click the **Configuration** dropdown menu to expand the settings panel. Fill in the necessary information for the features you want to use.

---

## Configuration

### Discord Rich Presence
To get your activity to show up on Discord, you'll need to provide:
1.  **Client ID:** The Application ID from your app in the [Discord Developer Portal](https://discord.com/developers/applications). Or, use our default one! `1360824994149568562`
2.  **Details & State:** The text you want to display.
3.  **Images & Buttons:** The keys for any assets you've uploaded to your Discord application, and the labels/URLs for custom buttons.

> **Note:** Use `{rip}` in the `Details` field to have it automatically replaced by the current rip counter value!

### Rip Counter
To enable the rip counter, you must provide a valid **Rip File Path**.
- This is the full path to a `.txt` file on your computer where the count will be stored (e.g., `C:\Users\YourName\Documents\rip_count.txt`).

### OBS Widget Integration
The app hosts a local server on port `4200` to provide real-time widgets for your stream.

We also host our own widgets, check those out [here!](https://bloodmoonstudios.xyz/widgets)

1.  In OBS, add a new **Browser** source.
2.  Set the **URL** to one of the following:
    -   **420 Countdown:** `http://localhost:4200/widgets/countdown`
    -   **Rip Counter:** `http://localhost:4200/widgets/ripcounter`
3.  Set the dimensions to the suggested sizes below, or customize as you see fit:
    -   Countdown: `420` width, `210` height
    -   Rip Counter: `220` width, `210` height
4.  Remove everything from the custom css box.
> **Note:** You can customize the look of the counter right in OBS with CSS!

---

## 🛠️ Built With

*   [Electron](https://www.electronjs.org/) - Desktop application framework
*   [Node.js](https://nodejs.org/) - JavaScript runtime
*   [Express](https://expressjs.com/) - For the local OBS widget server
*   [Socket.io](https://socket.io/) - For real-time widget updates
*   [moment-timezone](https://momentjs.com/timezone/) - For accurate timezone calculations
*   [discord-rpc](https://github.com/discordjs/RPC) - For Discord Rich Presence integration
