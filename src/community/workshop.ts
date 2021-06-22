import { UserData, QueryTarget } from "@/userdata";
import { ProjectItemData } from "@/community/ProjectItemData";
import fs, { readFileSync, writeFileSync } from "fs";
import path from "path";
import { Editor } from "@/lib/editor";

const appidPath = path.join(path.resolve("."), "/steam_appid.txt");
const greenworks = require("greenworks");
//const APP_ID = 480;
//const APP_ID = 431960;
const APP_ID = 1632910;
const UPDATE_DELAY = 1000;

export class WorkshopManager {
  private static _instance: WorkshopManager;
  private _dirty = new Map<QueryTarget, boolean>([
    [QueryTarget.Best, false],
    [QueryTarget.Search, false],
  ]);
  private activeTimerId;
  private steamId;
  initialized: boolean = false;
  static getInstance() {
    if (!WorkshopManager._instance) {
      WorkshopManager._instance = new WorkshopManager();
    }
    return WorkshopManager._instance;
  }

  constructor() {
    try {
      let valid = this.validateAppIdFile();
      if (!valid) {
        console.error(
          `steam_appid.txt seems invalid. please check ${appidPath}, contains valid appid. or you can remove this file to let the app can handle this.`
        );
      }

      // trying to init api with appid: 0
      this.initialized = greenworks.init();
      if (this.initialized) {
        console.log("Steam API has been initialized.");

        this.steamId = greenworks.getSteamId().steamId;
        this.requestPage(1, QueryTarget.Search);
        this.requestPage(1, QueryTarget.Best);
      }
    } catch (err) {
      console.warn(err);
    }
  }

  get SteamId() {
    return this.steamId;
  }

  get UserWorks() {
    let files = [];

    if (this.initialized) {
      const count = greenworks.getFileCount();
      for (let i = 0; i < count; i++) {
        let obj = greenworks.getFileNameAndSize(i);
        const fileName = obj.name;
        const fileExt = fileName.split(".").pop();

        if (fileExt === "mmng") files.push(obj.name);
      }
    }
    return files;
  }

  async ReadTextFromFile(filename: string): Promise<any> {
    if (!this.initialized) {
      return Promise.reject();
    }

    let fetched = await new Promise((resolve, reject) => {
      greenworks.readTextFromFile(
        filename,
        (file_content) => {
          console.info(`File loaded: ${filename}`);
          resolve(file_content);
        },
        (err) => {
          reject(err);
        }
      );
    });

    return Promise.resolve(fetched);
  }

  requestPage(num: number, target: QueryTarget) {
    const userData = UserData.getInstance();
    let rank = greenworks.UGCQueryType.RankedByPublicationDate;
    let tags = userData.tags;
    let excludedTags = userData.excludedTags;

    if (target == QueryTarget.Best) {
      rank = greenworks.UGCQueryType.RankedByVote;
      tags = [];
      excludedTags = [];
    }

    if (userData.pageIndex.get(target) != num || this._dirty.get(target)) {
      userData.pageIndex.set(target, num);
      greenworks.ugcGetItems(
        {
          "app_id": APP_ID,
          "page_num": userData.pageIndex.get(target),
          "tags": tags,
          "excludedTags": excludedTags,
          "keyword": userData.keyword,
        },
        greenworks.UGCMatchingType.Items,
        rank,
        (items, numResults, numTotalResults) => {
          UserData.getInstance().numSearchResultInPages = Math.trunc(
            numTotalResults / 50 + 1
          );
          console.log(items);

          let searchedItems: ProjectItemData[] = [];
          for (let item of items) {
            let pItem = ProjectItemData.fromMetadata(item);
            if (pItem) searchedItems.push(pItem);
          }
          UserData.getInstance().updateSearchedItems(searchedItems, target);
        },
        (err) => {
          console.error(err);
        }
      );
    }
  }

  requestUpdate(target: QueryTarget) {
    if (this._dirty) {
      clearTimeout(this.activeTimerId);
    }

    this._dirty.set(target, true);
    this.activeTimerId = setTimeout(() => {
      this.requestPage(UserData.getInstance().pageIndex.get(target), target);
      this._dirty.set(target, false);
    }, UPDATE_DELAY);
  }

  validateAppIdFile(): boolean {
    try {
      // check steam_appid.txt presents
      let needToCreateAppIdFile = false;
      if (fs.existsSync(appidPath)) {
        // check appid is correct and go
        const appidParsed = parseInt(readFileSync(appidPath, "utf-8"));
        if (appidParsed != APP_ID) {
          needToCreateAppIdFile = true;
        }
      } else {
        needToCreateAppIdFile = true;
      }

      if (needToCreateAppIdFile) {
        writeFileSync(appidPath, `${APP_ID}`);
      }
      return true;
    } catch {
      return false;
    }
  }

  publish(projectPath: string): boolean {
    if (fs.existsSync(projectPath)) {
      const data = Editor.getMetadata();
      const pathResolved = path.resolve(projectPath);
      const thumbnailPathResolved = path.resolve(
        "C:/Users/hulul/Desktop/testImage/projects_/thumb.png"
      );

      // greenworks.deleteFile(
      //   "test.mmng",
      //   () => {
      //     console.info(`File delete successs: test.mmng`);
      //   },
      //   (err) => {
      //     console.error(err);
      //   }
      // );
      // return true;

      if (!greenworks.isCloudEnabledForUser()) {
        console.warn("You need to turn on cloud feature to use this feature");
      }
      if (!greenworks.isCloudEnabled()) {
        greenworks.enableCloud(true);
      }

      greenworks.saveFilesToCloud(
        [pathResolved],
        () => {
          console.info(`File save successs: ${path.basename(projectPath)}`);
        },
        (err) => {
          console.error(err);
        }
      );

      // greenworks.publishWorkshopFile(
      //   { "app_id": APP_ID, "tags": data.tags },
      //   pathResolved,
      //   thumbnailPathResolved,
      //   data.title,
      //   data.description,
      //   (publish_file_handle) => {},
      //   (err) => {
      //     console.error(err);
      //   }
      // );

      // greenworks.ugcPublish(
      //   pathResolved,
      //   data.title,
      //   data.description,
      //   thumbnailPathResolved,
      //   (published) => {
      //     console.log(`Your work has successfully published`);
      //     console.log(published);
      //   },
      //   (err) => {
      //     console.error(err);
      //   },
      //   (progress) => {}
      // );
      return true;
    } else {
      console.error(`file does not exists: ${projectPath}`);
      return false;
    }
  }
}
