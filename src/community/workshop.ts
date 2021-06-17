import { UserData, QueryTarget } from "@/userdata";
import { ProjectItemData, WorkshopItemData } from "./ProjectItemData";
import fs, { readFileSync, writeFileSync } from "fs";
import path from "path";

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

  publish(): boolean {
    return true;
  }
}
