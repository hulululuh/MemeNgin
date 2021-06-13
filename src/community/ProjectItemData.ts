import { ProjectManager } from "@/lib/project";
import { AGE_RATING } from "@/userdata";
import fs from "fs";
import path from "path";

function ageRatingFromTags(tags: Array<string>) {
  let rating = "Questionable";

  for (let tag of tags) {
    let idx = AGE_RATING.findIndex((item) => item == tag);
    if (idx != -1) return AGE_RATING[idx];
  }

  return rating;
}

export class ProjectItemData {
  localItem: LocalItemData;
  workshopItem: WorkshopItemData;

  get id() {
    return this.isWorkshopItem
      ? this.workshopItem.itemId
      : this.localItem.itemId;
  }

  get localPath() {
    return this.localItem ? this.localItem.localPath : "";
  }

  get title() {
    return this.isWorkshopItem ? this.workshopItem.title : this.localItem.title;
  }

  set title(value: string) {
    this.workshopItem.title = value;
  }

  get description() {
    return this.isWorkshopItem
      ? this.workshopItem.description
      : this.localItem.description;
  }

  get isWorkshopItem() {
    return this.workshopItem;
  }

  get thumbnail() {
    return this.isWorkshopItem
      ? this.workshopItem.thumbnailUrl
      : this.localItem.thumbnail;
  }

  get isValid() {
    return this.isWorkshopItem
      ? this.workshopItem.isValid
      : this.localItem.isValid;
  }

  save(): any {
    let data = {};
    if (this.localItem) data["localItem"] = this.localItem.save();
    if (this.workshopItem) data["workshopItem"] = this.workshopItem.save();
    return data;
  }

  static fromNothing() {
    let item = new ProjectItemData();
    item.localItem = new LocalItemData();
    item.workshopItem = new WorkshopItemData();
    return item;
  }

  static fromLocalPath(localPath: string): ProjectItemData {
    let item = new ProjectItemData();
    let exists = fs.existsSync(localPath);

    if (!exists) {
      console.error("given path is invalid!");
      return null;
    } else {
      let project = ProjectManager.load(localPath);
      item.localItem = LocalItemData.fromLocalPath(
        project,
        path.parse(localPath).name,
        localPath
      );

      let itemData = project.data["item"];
      if (itemData && itemData["workshopItem"]) {
        item.workshopItem = itemData["workshopItem"];
      }
    }

    if (item.localItem.isValid) {
      // try parse workshop data
    }

    return item.localItem.isValid ? item : null;
  }

  static fromMetadata(data: any): ProjectItemData {
    let item = new ProjectItemData();
    item.workshopItem = WorkshopItemData.fromMetadata(data);
    return item.workshopItem.isValid ? item : null;
  }
}

export class LocalItemData {
  // general
  itemId: string;
  title: string;
  description: string;
  thumbnail: string;

  // local item
  localPath: string;

  get isValid() {
    return this.title && this.thumbnail && this.localPath;
  }

  save(): any {
    let data = {};

    data["itemId"] = this.itemId;
    data["title"] = this.title;
    data["description"] = this.description;
    data["thumbnail"] = this.thumbnail;
    data["localPath"] = this.localPath;

    return data;
  }

  static fromLocalPath(
    project: any,
    title: string,
    localPath: string
  ): LocalItemData {
    let item = new LocalItemData();

    // general
    // item.itemId; // keep it empty until it is published on steam
    item.title = title;
    item.localPath = localPath;
    item.description = project.data["description"];
    item.thumbnail = project.data["thumbnail"];

    // do parsing
    return item.isValid ? item : null;
  }
}
export class WorkshopItemData {
  // id
  itemId: string;
  publisherId: string;

  // general
  title: string;
  description: string;
  thumbnailUrl: any;
  numSubscribed: number;
  numLikes: number;
  numDislikes: number;
  tags: Array<string>;

  // calculated
  ageRating: string;

  get isValid() {
    return this.itemId && this.publisherId && this.thumbnailUrl;
  }

  save(): any {
    let data = {};

    data["itemId"] = this.itemId;
    data["publisherId"] = this.publisherId;
    data["title"] = this.title;
    data["description"] = this.description;
    data["thumbnailUrl"] = this.thumbnailUrl;
    data["numSubscribed"] = this.numSubscribed;
    data["numLikes"] = this.numLikes;
    data["numDislikes"] = this.numDislikes;
    data["tags"] = this.tags;
    data["ageRating"] = this.ageRating;

    return data;
  }

  static fromMetadata(data: any) {
    let item = new WorkshopItemData();
    item.itemId = data.file;
    item.title = data.title;
    item.description = data.description;
    item.thumbnailUrl = data.PreviewImageUrl;
    item.publisherId = data.steamIDOwner;
    item.numSubscribed = data.NumFollowers;
    item.numLikes = data.votesUp;
    item.numDislikes = data.votesDown;
    item.ageRating = ageRatingFromTags(data.tags);
    return item.isValid ? item : null;
  }

  static fromId(id: string) {
    let data = [];
    return this.fromMetadata(data);
  }
}
