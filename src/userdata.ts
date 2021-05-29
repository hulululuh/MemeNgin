import path from "path";
import fs from "fs";
const MAX_RECENT_FILE = 8;
const app = require("electron").remote.app;
const userDataPath = path.join(app.getPath("userData"), "userData.json");

export class UserData {
  recentFiles: string[] = [];
  subscribedProject: string[] = [];
  followedUser: string[] = [];

  static _instance: UserData = null;
  static getInstance(): UserData {
    if (!UserData._instance) {
      UserData._instance = new UserData();
    }
    return UserData._instance;
  }

  // mem to storage
  static serialize() {
    // parse userdata file, if it exists
    if (fs.existsSync(userDataPath)) {
      let parsed = JSON.parse(fs.readFileSync(userDataPath).toString());
      let instance = UserData.getInstance();
      if (parsed.recentFiles) instance.recentFiles = parsed.recentFiles;
      if (parsed.subscribedProject)
        instance.subscribedProject = parsed.subscribedProject;
      if (parsed.followedUser) instance.followedUser = parsed.followedUser;

      // validate data and remove invalid path
      let invalids = [];
      instance.recentFiles.forEach((v, i) => {
        if (!fs.existsSync(v)) invalids.push(i);
      });

      for (let i of invalids.reverse()) {
        instance.recentFiles.splice(i, 1);
      }

      console.log(
        `found ${invalids.length} invalid path, removed from recentFiles`
      );
    }
  }

  // storage to mem
  static deserialize() {
    try {
      fs.writeFileSync(userDataPath, JSON.stringify(UserData.getInstance()));
    } catch (err) {
      alert("Error saving user data: " + err);
    }
  }

  registerRecent(path: string) {
    let idx = this.recentFiles.findIndex((item) => item === path);
    if (idx > -1) {
      this.recentFiles.splice(idx, 1);
    }

    this.recentFiles = [path, ...this.recentFiles];
    if (this.recentFiles.length > MAX_RECENT_FILE) {
      this.recentFiles.splice(MAX_RECENT_FILE, 1);
    }
  }
}
