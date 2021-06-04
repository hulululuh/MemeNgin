import { UserData } from "@/userdata";
import { ProjectItemData } from "./ProjectItemData";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import fs from "fs";

const appidPath = path.join(path.resolve("."), "/steam_appid.txt");
const greenworks = require("greenworks");
const APP_ID = 431960;
//const APP_ID = 480;
const UPDATE_DELAY = 1000;

export class WorkshopManager {
  private static _instance: WorkshopManager;
  private _dirty: boolean = false;
  private activeTimerId;
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
      let initialized = greenworks.init();
      if (initialized) {
        console.log("Steam API has been initialized.");
        this.requestPage(1);
      }
    } catch (err) {
      console.error(err);
    }
  }

  requestPage(num: number) {
    const userData = UserData.getInstance();
    if (userData.pageIndex != num || this._dirty) {
      userData.pageIndex = num;

      greenworks.ugcGetItems(
        {
          "app_id": APP_ID,
          "page_num": userData.pageIndex,
          "tags": userData.tags,
          "excludedTags": userData.excludedTags,
          "keyword": userData.keyword,
        },
        greenworks.UGCMatchingType.Items,
        greenworks.UGCQueryType.RankedByPublicationDate,
        (items, numResults, numTotalResults) => {
          UserData.getInstance().numSearchResultInPages = Math.trunc(
            numTotalResults / 50 + 1
          );
          console.log(items);

          let searchedItems: ProjectItemData[] = [];
          for (let item of items) {
            let prjItem = new ProjectItemData();
            prjItem.id = item.file;
            prjItem.title = item.title;
            prjItem.description = item.description;
            prjItem.thumbnailUrl = item.PreviewImageUrl;
            prjItem.publisherId = item.steamIDOwner;
            prjItem.numSubscribed = item.NumFollowers;
            prjItem.numLikes = item.NumFavorites;
            // prjItem.numDislikes = item.previewUrl;

            searchedItems.push(prjItem);
          }
          UserData.getInstance().updateSearchedItems(searchedItems);
        },
        (err) => {
          console.error(err);
        }
      );
    }
  }

  requestUpdate() {
    if (this._dirty) {
      clearTimeout(this.activeTimerId);
    }

    this._dirty = true;
    this.activeTimerId = setTimeout(() => {
      this.requestPage(UserData.getInstance().pageIndex);
      this._dirty = false;
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
}
