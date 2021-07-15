// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

import { ProjectItemData } from "@/community/ProjectItemData";
import { WorkshopManager } from "@/community/workshop";

export class CloudData {
  userWorks = [];

  static _instance: CloudData = null;
  static getInstance(): CloudData {
    if (!CloudData._instance) {
      CloudData._instance = new CloudData();
    }
    return CloudData._instance;
  }

  async getUserWorks() {
    const cloudFiles = WorkshopManager.getInstance().UserWorks;
    let items = [];

    for (let file of cloudFiles) {
      let item = await ProjectItemData.fromCloud(file);
      items.push(item);
    }
    this.userWorks = items;
  }
}
