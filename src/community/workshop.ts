import { UserData, QueryTarget, SearchOption, SearchType } from "@/userdata";
import {
  ProjectItemData,
  ageRatingsToExcludedTags,
} from "@/community/ProjectItemData";
import { Editor } from "@/lib/editor";
import fs, { readFileSync, writeFileSync } from "fs";
import path from "path";
const electron = require("electron");
const appidPath = path.join(path.resolve("."), "/steam_appid.txt");
const greenworks = require("greenworks");
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

  get initialized() {
    try {
      const init = greenworks.init();
      return init;
    } catch (err) {
      return false;
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

    return fetched;
  }

  async queryItems(options: SearchOption) {
    let rank = greenworks.UGCQueryType.RankedByPublicationDate;
    if (options.type == SearchType.Best) {
      greenworks.UGCQueryType.RankedByVote;
    }

    let items = await new Promise((resolve, reject) => {
      greenworks.ugcGetItems(
        {
          "app_id": APP_ID,
          "page_num": options.pageNum,
          "tags": options.tags,
          "excludedTags": ageRatingsToExcludedTags(options.ageRating),
          "keyword": options.keyword,
        },
        greenworks.UGCMatchingType.Items,
        rank,
        (items, numResults, numTotalResults) => {
          let searchedItems: ProjectItemData[] = [];
          for (let item of items) {
            let pItem = ProjectItemData.fromMetadata(item);
            if (pItem) searchedItems.push(pItem);
          }
          resolve([items, numResults, numTotalResults]);
        },
        (err) => {
          reject(err);
        }
      );
    });
    return items;
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

  create(projectPath: string): boolean {
    if (!this.initialized) {
      console.warn("The steam client must be running!!!");
      return false;
    }
    if (fs.existsSync(projectPath)) {
      const pathResolved = path.resolve(projectPath);

      if (!greenworks.isCloudEnabledForUser()) {
        console.warn("You need to turn on cloud feature to use this feature");
      }
      if (!greenworks.isCloudEnabled()) {
        greenworks.enableCloud(true);
      }

      greenworks.saveFilesToCloud(
        [pathResolved],
        () => {
          console.info(`File save succeed: ${path.basename(projectPath)}`);
        },
        (err) => {
          console.error(err);
        }
      );
      return true;
    } else {
      console.error(`file does not exists: ${projectPath}`);
      return false;
    }
  }

  load(localPath: string) {}

  save(localPath: string) {
    const fileExt = localPath.split(".").pop();
    // check path valid
    if (fs.existsSync(localPath) && fileExt == "mmng") {
      greenworks.saveFilesToCloud(
        [localPath],
        () => {
          console.info(`File save succeed: ${path.basename(localPath)}`);
        },
        (err) => {
          console.error(err);
        }
      );
    }
  }

  remove(data: ProjectItemData): boolean {
    if (!this.initialized) {
      console.warn("The steam client must be running!!!");
      return false;
    }
    if (data.isCloud) {
      greenworks.deleteFile(
        data.localItem.path,
        () => {
          console.info(`File remove succeed: ${data.localItem.path}`);
        },
        (err) => {
          console.error(err);
        }
      );

      return true;
    }
    return false;
  }

  async publish(projectPath: string) {
    try {
      let exists = fs.existsSync(projectPath);
      let stats = exists && (await fs.statSync(projectPath));
      let isFile = exists && stats.isFile();
      if (exists && isFile) {
        const data = Editor.getMetadata();
        const localPath = path.parse(projectPath).dir;
        const parsedPath = path.parse(projectPath);
        const thumbnailPathLocal = path.join(
          parsedPath.dir,
          `${parsedPath.name}.png`
        );

        let img = new Image();
        img.src = data.thumbnail;
        await img.decode();

        let canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        let ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const url = canvas.toDataURL("image/png", 1);
        const nativeImage = electron.nativeImage.createFromDataURL(url);
        const buffer = nativeImage.toPNG();
        fs.writeFileSync(thumbnailPathLocal, buffer);

        await greenworks.ugcCreateWorkshopItem(
          { "app_id": APP_ID, "tags": data.tagsCalculated },
          localPath,
          thumbnailPathLocal,
          data.title,
          data.description,
          (publish_file_handle) => {
            data.workshopItem.itemId = publish_file_handle;
            console.log(
              `item has successfuly published. handle:[${publish_file_handle}]`
            );
          },
          (err) => {
            console.error(err);
            return false;
          }
        );

        return true;
      } else {
        console.error(`file does not exists: ${projectPath}`);
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  async update(projectPath: string) {
    return true;
  }

  async subscribe(file_id: string) {
    if (this.initialized) {
      await greenworks.ugcSubscribe(
        file_id,
        () => {
          console.log(`subscribed: ${file_id}`);
        },
        (err) => {
          console.error(err);
        }
      );
    }
  }

  async unsubscribe(file_id: string) {
    if (this.initialized) {
      await greenworks.ugcUnsubscribe(
        file_id,
        () => {
          console.log(`unsubscribed: ${file_id}`);
        },
        (err) => {
          console.error(err);
        }
      );
    }
  }

  async voteup(file_id: string) {
    if (this.initialized) {
      await greenworks.ugcVote(
        file_id,
        true,
        () => {
          console.log(`voted up: ${file_id}`);
        },
        (err) => {
          console.error(err);
        }
      );
    }
  }

  async votedown(file_id: string) {
    if (this.initialized) {
      await greenworks.ugcVote(
        file_id,
        false,
        () => {
          console.log(`voted down: ${file_id}`);
        },
        (err) => {
          console.error(err);
        }
      );
    }
  }

  async getItemState(file_id: string): Promise<any> {
    if (this.initialized) {
      let itemState = await new Promise((resolve, reject) => {
        greenworks.ugcGetItemState(
          file_id,
          (state) => {
            resolve(state);
          },
          (err) => {
            reject(err);
          }
        );
      });
      return itemState;
    }

    const defaultState = {
      state: greenworks.UGCItemState.None,
      votedUp: false,
      votedDown: false,
    };
    return defaultState;
  }
}
