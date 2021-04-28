import fs from "fs";
const MAX_RECENT_FILE = 8;

export function registerRecent(path: string, data: UserData) {
  let idx = data.recentFiles.findIndex((item) => item === path);

  if (idx != -1) {
    data.recentFiles.splice(idx, 1);
  }

  data.recentFiles = [path, ...data.recentFiles];

  if (data.recentFiles.length > MAX_RECENT_FILE) {
    data.recentFiles.splice(MAX_RECENT_FILE - 1, 1);
  }
}

export class UserData {
  recentFiles: string[] = [];

  static _instance: UserData;
  static getInstance(): UserData {
    if (!UserData._instance) {
      UserData._instance = new UserData();
    }
    return UserData._instance;
  }

  static parse(path: string) {
    UserData._instance = JSON.parse(fs.readFileSync(path).toString());

    // validate data and remove invalid path
    let invalids = [];
    let recentFiles = UserData._instance.recentFiles;
    recentFiles.forEach((v, i) => {
      if (!fs.existsSync(v)) invalids.push(i);
    });

    for (let i of invalids.reverse()) {
      recentFiles.splice(i, 1);
    }

    console.log(
      `found ${invalids.length} invalid path, removed from recentFiles`
    );
  }
}
