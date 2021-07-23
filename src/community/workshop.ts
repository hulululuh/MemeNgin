// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

import { UserData, QueryTarget, SearchOption, SearchType } from "@/userdata";
import {
  ProjectItemData,
  ageRatingsToExcludedTags,
  LocalItemData,
} from "@/community/ProjectItemData";
import { Editor } from "@/lib/editor";
import { plainToClass } from "class-transformer";
import fs, { readFileSync, writeFileSync } from "fs";
import { ProjectManager } from "@/lib/project";
import path from "path";
import { toDataURL } from "@/lib/utils";
const electron = require("electron");
const appidPath = path.join(path.resolve("."), "/steam_appid.txt");
const greenworks = require("greenworks");
const APP_ID = 1632910;
const UPDATE_DELAY = 1000;

export class QueryResult {
  items: Array<ProjectItemData>;
  numResults: number;
  numTotalResults: number;
}

export class WorkshopManager {
  private static _instance: WorkshopManager;
  private _dirty = new Map<QueryTarget, boolean>([
    [QueryTarget.Subscribed, false],
    [QueryTarget.Search, false],
  ]);
  private activeTimerId = new Map<QueryTarget, any>();
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

  refresh() {
    if (this.initialized) {
      this.steamId = greenworks.getSteamId().steamId;
      this.requestSearch(
        UserData.getInstance().searchOption,
        QueryTarget.Search
      );
      this.requestSearch(
        UserData.getInstance().searchOption,
        QueryTarget.Subscribed
      );
    }
  }

  shutdown() {
    if (this.initialized) {
      greenworks.shutdown();
    }
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

  async queryItems(options: SearchOption): Promise<any> {
    let rank = greenworks.UGCQueryType.RankedByPublicationDate;
    if (options.type == SearchType.Best) {
      rank = greenworks.UGCQueryType.RankedByVote;
    }

    let items = await new Promise((resolve, reject) => {
      greenworks.ugcGetItems(
        {
          "app_id": APP_ID,
          "page_num": options.pageNum,
          "tags": options.tags,
          "excluded_tags": ageRatingsToExcludedTags(options.ageRating),
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
          resolve(
            plainToClass(QueryResult, {
              items: searchedItems,
              numResults: numResults,
              numTotalResults: numTotalResults,
            })
          );
        },
        (err) => {
          reject(err);
        }
      );
    });
    return items;
  }

  async queryUserItems(page_num: number): Promise<any> {
    let items = await new Promise((resolve, reject) => {
      greenworks.ugcGetUserItems(
        {
          "app_id": APP_ID,
          "page_num": page_num,
        },
        greenworks.UGCMatchingType.Items,
        greenworks.UserUGCListSortOrder.SubscriptionDateDesc,
        greenworks.UserUGCList.Subscribed,
        (items) => {
          let searchedItems: ProjectItemData[] = [];
          for (let item of items) {
            let pItem = ProjectItemData.fromMetadata(item);
            if (pItem) searchedItems.push(pItem);
          }
          resolve(
            plainToClass(QueryResult, {
              items: searchedItems,
              numResults: searchedItems.length,
              numTotalResults: searchedItems.length,
            })
          );
        },
        (err) => {
          reject(err);
        }
      );
    });

    return items;
  }

  requestSearch(options: SearchOption, target: QueryTarget) {
    if (this._dirty.get(target)) {
      clearTimeout(this.activeTimerId.get(target));
    }

    this._dirty.set(target, true);
    let timerId = setTimeout(() => {
      this.doSearch(options, target);
    }, UPDATE_DELAY);
    this.activeTimerId.set(target, timerId);
  }

  async doSearch(options: SearchOption, target: QueryTarget) {
    let result;

    if (target == QueryTarget.Search) {
      result = await this.queryItems(options);
    } else if (target == QueryTarget.Subscribed) {
      result = await this.synchroizeItems(1);
    }

    if (result instanceof QueryResult) {
      UserData.getInstance().updateSearchedItems(result.items, target);
      UserData.getInstance().numSearchResultInPages = Math.trunc(
        result.numTotalResults / 50 + 1
      );
    }
    this._dirty.set(target, false);
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

      // save file if not exists in local repository
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

    setTimeout(() => {
      this.doSearch(null, QueryTarget.Subscribed);
    }, UPDATE_DELAY);
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

    setTimeout(() => {
      this.doSearch(null, QueryTarget.Subscribed);
    }, UPDATE_DELAY);
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

  async synchroizeItems(page_num: number): Promise<any> {
    if (!this.initialized) return;

    let workshopLocalPath = "";
    // shall be removed if there
    let ghostItems = [];
    let subscribed = [];
    let sholudBeInstalled = [];
    let result = await this.queryUserItems(page_num);
    for (let item of result.items) {
      const file_id = item.workshopItem.publishedFileId;
      const itemState = await this.getItemState(file_id);
      const state = itemState.itemState;
      if (state & greenworks.UGCItemState.Subscribed) {
        let info = await greenworks.ugcGetItemInstallInfo(file_id);

        if (info) {
          if (!item.localItem) {
            if (!fs.existsSync(info.folder)) {
              sholudBeInstalled.push({
                "file_id": file_id,
                "targetPath": info.folder,
              });
              continue;
            }
            let list = fs.readdirSync(info.folder);
            for (let file of list) {
              const fullPath = path.join(info.folder, file);
              const stat = fs.statSync(fullPath);
              if (!stat.isDirectory()) {
                let parsedPath = path.parse(fullPath);
                workshopLocalPath = path.join(parsedPath.dir, "..");
                if (parsedPath.ext == ".mmng") {
                  let project = ProjectManager.load(fullPath);
                  if (!project) continue;
                  const name = parsedPath.name;
                  const path = fullPath;
                  item.localItem = LocalItemData.fromLocalPath(
                    project,
                    name,
                    fullPath
                  );
                }
              }
            }
          }
          subscribed.push(item);
        }
      } else {
        ghostItems.push(item.workshopItem.publishedFileId);
      }
    }

    // try to install subscribed item to local
    for (let item of sholudBeInstalled) {
      let success = await new Promise((resolve, reject) => {
        greenworks.ugcDownloadItem(
          item.file_id,
          item.targetPath,
          () => {
            resolve(true);
          },
          (err) => {
            console.error(err);
            resolve(false);
          }
        );
      });
    }

    // try to remove ghost items on local
    if (ghostItems.length > 0 && workshopLocalPath.length > 0) {
      for (let item of ghostItems) {
        const targetDir = path.join(workshopLocalPath, item);
        if (fs.existsSync(targetDir)) {
          const stat = fs.statSync(targetDir);
          if (stat.isDirectory()) {
            fs.rmdirSync(targetDir, { recursive: true });
          }
        }
      }
    }

    result.items = subscribed;
    return result;
  }

  async doSyncItems(destFolder: string) {
    let items = await new Promise((resolve, reject) => {
      greenworks.ugcSynchronizeItems(
        {
          "app_id": APP_ID,
          "page_num": 1,
        },
        destFolder,
        (items) => {
          resolve(items);
        },
        (err) => {
          reject(err);
        }
      );
    });

    return items;
  }

  requestUserInfo(userId: string) {
    return greenworks.requestUserInformation(userId, false);
  }

  getAuthorAvatar(userId: string) {
    try {
      const imgHandle = greenworks.getMediumFriendAvatar(userId);
      let rgba = greenworks.getImageRGBA(imgHandle);
      return toDataURL(64, 64, rgba);
    } catch (err) {
      return "mdi-account-box";
    }
  }

  getAuthorName(userId: string) {
    try {
      return greenworks.getFriendPersonaName(userId);
    } catch {
      console.warn(`failed to access author name`);
      return `Unknown`;
    }
  }
}
