// [GPLv3] modified 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)
// [GPLv3] created 2020 by nicolas brown for texturelab(https://github.com/njbrown/texturelab)

"use strict";

import { app, protocol, BrowserWindow, session } from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import { setupMenu } from "@/menu";
import path from "path";

const Config = require("electron-config");
const config = new Config();

const isDevelopment = process.env.NODE_ENV !== "production";
declare let __static: any;

let vueDevToolsPath = null;
if (process.platform === "win32") {
  vueDevToolsPath =
    "C:/Users/hulul/AppData/Local/Google/Chrome/User Data/Default/Extensions/nhdogjmejiglipccpnnnanhbledajbpd/5.3.4_0";
}
app.allowRendererProcessReuse = false;
app.commandLine.appendSwitch("--disable-seccomp-filter-sandbox");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win: BrowserWindow | null;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

function createWindow() {
  setupMenu();

  // Create the browser window.
  win = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    show: false,
    icon: path.join(__static, "assets/icons/mmng_icon.png"),
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,
      enableRemoteModule: true,
      contextIsolation: false,
    },
  });

  if (config.get("winIsMaximized")) {
    win.maximize();
  } else {
    win.setBounds(config.get("winBounds"));
  }

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string);
    //if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol("app");
    // Load the index.html when not in development
    const indexPath = path.join(__dirname, "index.html");
    win.loadURL(indexPath);
  }

  // save window size and position
  win.on("close", () => {
    config.set("winBounds", win.getBounds());
    config.set("winIsMaximized", win.isMaximized());
  });

  win.on("closed", () => {
    win = null;
  });

  win.once("ready-to-show", () => {
    win.show();
  });
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.removeAllListeners("ready");
app.on("ready", async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await session.defaultSession.loadExtension(vueDevToolsPath);
      //await installVueDevtools();
    } catch (e) {
      console.error("Vue Devtools failed to install:", e.toString());
    }
  }

  // initialize assets
  createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", (data) => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}
