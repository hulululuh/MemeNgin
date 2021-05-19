var os = require("os");
var greenworks = require("greenworks");
//greenworks_win64

export class WorkshopManager {
  private static _instance: WorkshopManager;
  static getInstance() {
    if (WorkshopManager._instance) {
      WorkshopManager._instance = new WorkshopManager();
    }
    return WorkshopManager._instance;
  }

  constructor() {
    if (!greenworks) {
      console.log("Greenworks not support for " + os.platform() + " platform");
    } else {
      if (greenworks.init()) {
        console.log("Greenworks successfully initialized");
      }
    }
  }
}
