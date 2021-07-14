import path from "path";
import fs from "fs";
import { ProjectItemData } from "@/community/ProjectItemData";

const MAX_RECENT_FILE = 8;
const app = require("electron").remote.app;
const userDataPath = path.join(app.getPath("userData"), "userData.json");

export enum QueryTarget {
  Search = "Search",
  Subscribed = "Subscribed",
}

export const DERIVATIVE_TAG: string = "Derivative Allowed";
export const FILTER_TYPE: string[] = ["Best", "Recent"];
export const AGE_RATING_DEFAULT: string = "Questionable";
export const AGE_RATING: string[] = ["Everyone", AGE_RATING_DEFAULT, "Mature"];
export const TAGS_TEST: string[] = [
  "Actor",
  "Advertisement",
  "Animal",
  "Anime",
  "Art",
  "Artist",
  "Blog",
  "Book",
  "Cartoon",
  "Catchphrase",
  "Character",
  "Cliche",
  "Comic Book",
  "Company",
  "Controversy",
  "Copypasta",
  "Disaster",
  "Exploitable",
  "Fan Art",
  "Fauna",
  "Film",
  "Forum",
  "Gamer",
  "Generator",
  "Hashtag",
  "Image Macro",
  "Media Host",
  "Musician",
  "Parody",
  "Politician",
  "Pop Culture",
  "Product",
  "Reaction",
  "Reference",
  "Remix",
  "Slang",
  "Snowclone",
  "Social Game",
  "Social Network",
  "Song",
  "Technology",
  "TV Show",
  "Video Game",
  "Viral Video",
  "Vlogger",
  "Web Series",
  "Webcomic",
];

export enum SearchType {
  Best = "Best",
  Recent = "Recent",
}

export class SearchOption {
  pageNum: number = 1;
  count: number = 50;
  keyword: string = "";
  type: SearchType = SearchType.Best;
  ageRating: Array<string> = [];
  tags: Array<string> = [];
}

export class UserData {
  recentFiles: string[] = [];
  subscribedProject: string[] = [];
  followedUser: string[] = [];

  recentItems: ProjectItemData[] = [];
  subscribedItems: ProjectItemData[] = [];
  searchedItems: ProjectItemData[] = [];
  numSearchResultInPages: number;

  pageIndex = new Map<QueryTarget, number>([
    [QueryTarget.Subscribed, -1],
    [QueryTarget.Search, -1],
  ]);

  searchOption: SearchOption = new SearchOption();
  agreed: boolean = false;
  seenDerivative: boolean = false;
  seenLegal: boolean = false;
  dontShowIntroAgain: boolean = false;

  static _instance: UserData = null;
  static getInstance(): UserData {
    if (!UserData._instance) {
      UserData._instance = new UserData();
    }
    return UserData._instance;
  }

  // storage to mem
  static serialize() {
    // parse userdata file, if it exists
    if (fs.existsSync(userDataPath)) {
      let parsed = JSON.parse(fs.readFileSync(userDataPath).toString());
      let instance = UserData.getInstance();
      if (parsed.recentFiles) instance.recentFiles = parsed.recentFiles;
      if (parsed.subscribedProject)
        instance.subscribedProject = parsed.subscribedProject;
      if (parsed.followedUser) instance.followedUser = parsed.followedUser;
      if (parsed.agreed) instance.agreed = parsed.agreed;
      //if (parsed.derivative) instance.derivative = parsed.derivative;
      // if (parsed.seenDerivative)
      //   instance.seenDerivative = parsed.seenDerivative;
      if (parsed.seenLegal) instance.seenLegal = parsed.seenLegal;
      if (parsed.searchOption) instance.searchOption = parsed.searchOption;
      if (parsed.dontShowIntroAgain)
        instance.dontShowIntroAgain = parsed.dontShowIntroAgain;

      // validate data and remove invalid path
      let invalids = [];
      instance.recentFiles.forEach((v, i) => {
        if (!fs.existsSync(v)) invalids.push(i);
      });

      for (let i of invalids.reverse()) {
        instance.recentFiles.splice(i, 1);
      }

      for (let path of instance.recentFiles) {
        let item = ProjectItemData.fromLocalPath(path);
        if (item) instance.recentItems.push(item);
      }

      console.log(
        `found ${invalids.length} invalid path, removed from recentFiles`
      );
    }
  }

  // mem to storage
  static deserialize() {
    try {
      fs.writeFileSync(userDataPath, JSON.stringify(UserData.getInstance()));
    } catch (err) {
      alert("Error saving user data: " + err);
    }
  }

  registerRecent(path: string) {
    // remove target from list
    let idx = this.recentFiles.findIndex((item) => item === path);
    if (idx > -1) {
      this.recentFiles.splice(idx, 1);
    }

    // move target to front of list
    this.recentFiles = [path, ...this.recentFiles];

    // cut overflowed item
    if (this.recentFiles.length > MAX_RECENT_FILE) {
      this.recentFiles.splice(MAX_RECENT_FILE, 1);
    }

    this.registerRecentItem(path);
  }

  registerRecentItem(path: string) {
    let idx = this.recentItems.findIndex((item) => item.path == path);
    if (idx > -1) {
      this.recentItems.splice(idx, 1);
    }

    let item = ProjectItemData.fromLocalPath(path);
    if (item) this.recentItems = [item, ...this.recentItems];

    // cut overflowed item
    if (this.recentItems.length > MAX_RECENT_FILE) {
      this.recentItems.splice(MAX_RECENT_FILE, 1);
    }
  }

  updateSearchedItems(items: ProjectItemData[], target: QueryTarget) {
    switch (target) {
      case QueryTarget.Search:
        this.searchedItems = items;
        break;
      case QueryTarget.Subscribed:
        this.subscribedItems = items;
        break;
    }
  }
}
