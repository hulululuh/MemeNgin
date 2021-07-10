import { ProjectManager } from "@/lib/project";
import { WorkshopManager } from "@/community/workshop";
import {
  AGE_RATING,
  AGE_RATING_DEFAULT,
  TAGS_TEST,
  DERIVATIVE_TAG,
} from "@/userdata";
import { plainToClass } from "class-transformer";
import fs from "fs";
import path from "path";

function ageRatingToExcludedTag(value: string) {
  let exTag = [];
  for (let rating of AGE_RATING) {
    if (rating != value) exTag.push(rating);
  }
  return exTag;
}

export function ageRatingsToExcludedTags(tags: Array<string>) {
  let exTag = [];
  for (let rating of AGE_RATING) {
    if (!tags.find((item) => item == rating)) {
      exTag.push(rating);
    }
  }
  return exTag;
}

function ageRatingFromTags(tags: Array<string>) {
  for (let age of TAGS_TEST) {
    if (!tags.find((item) => item == age)) return age;
  }

  return AGE_RATING_DEFAULT;
}

function allowDerivativeWorkFromTags(tags: Array<string>): boolean {
  return tags.find((item) => item == DERIVATIVE_TAG) ? true : false;
}

export class ProjectItemData {
  localItem: LocalItemData;
  workshopItem: WorkshopItemData;

  get id() {
    return this.isWorkshopItem
      ? this.workshopItem.itemId
      : this.localItem.itemId;
  }

  get path() {
    return this.localItem ? this.localItem.path : "";
  }

  get title() {
    return this.isWorkshopItem ? this.workshopItem.title : this.localItem.title;
  }

  set title(value: string) {
    this.localItem.title = value;
    this.workshopItem.title = value;
  }

  get description() {
    let desc = this.isWorkshopItem
      ? this.workshopItem.description
      : this.localItem.description;
    return desc ? desc : "";
  }

  set description(value: string) {
    this.localItem.description = value;
    this.workshopItem.description = value;
  }

  get ageRating() {
    const rating = this.workshopItem.ageRating;
    return rating ? rating : AGE_RATING_DEFAULT;
  }

  set ageRating(value: string) {
    this.workshopItem.ageRating = value;
  }

  get tags() {
    return this.workshopItem.tags
      ? this.workshopItem.tags
      : new Array<string>();
  }

  get tagsCalculated() {
    if (this.workshopItem) {
      let tags = new Set();

      // user assigned tags
      for (let tag of this.workshopItem.tags) {
        tags.add(tag);
      }

      // age rating
      tags.add(this.workshopItem.ageRating);

      // derivable
      if (this.workshopItem.allowDerivativeWork) tags.add("Derivable");

      return [...tags.values()];
    } else {
      return [];
    }
  }

  set tags(value: Array<string>) {
    this.workshopItem.tags = value;
  }

  get allowDerivativeWork() {
    return this.isWorkshopItem ? this.workshopItem.allowDerivativeWork : false;
  }

  set allowDerivativeWork(value: boolean) {
    if (this.isWorkshopItem) this.workshopItem.allowDerivativeWork = value;
  }

  get isWorkshopItem() {
    return this.workshopItem != null;
  }

  get thumbnail() {
    return this.localItem && this.localItem.thumbnail
      ? this.localItem.thumbnail
      : this.workshopItem.thumbnailUrl;
  }

  set thumbnail(value) {
    this.localItem.thumbnail = value;
    if (this.isWorkshopItem) this.workshopItem.thumbnailUrl = value;
  }

  get isValid(): boolean {
    let valid = this.localItem && this.localItem.isValid;
    valid = valid ? valid : this.workshopItem && this.workshopItem.isValid;
    return valid;
  }

  get isCloud(): boolean {
    return this.localItem ? this.localItem.isCloud : false;
  }

  set isCloud(value: boolean) {
    if (this.localItem) {
      this.localItem.isCloud = value;
    }
  }

  get publisherId() {
    return this.isWorkshopItem ? this.workshopItem.publisherId : "";
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

  static async fromCloud(path: string): Promise<any> {
    let item = new ProjectItemData();
    let contents = JSON.parse(
      await WorkshopManager.getInstance().ReadTextFromFile(path)
    );

    if (contents) {
      item.localItem = LocalItemData.fromCloud(
        path,
        contents.item.localItem.title,
        contents.item.localItem.description,
        contents.thumbnail
      );

      item.workshopItem = plainToClass(
        WorkshopItemData,
        contents.item.workshopItem
      );
      return item;
    } else {
      Promise.reject();
    }
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
    return item.workshopItem && item.workshopItem.isValid ? item : null;
  }
}

export class LocalItemData {
  // general
  itemId: string;
  title: string;
  description: string;
  thumbnail: string;

  // local item
  path: string;
  isCloud: boolean;

  get isValid(): boolean {
    return this.title !== "" && this.thumbnail && this.path !== "";
  }

  save(): any {
    let data = {};

    data["itemId"] = this.itemId;
    data["title"] = this.title;
    data["description"] = this.description;
    data["thumbnail"] = this.thumbnail;
    data["path"] = this.path;

    return data;
  }

  static fromCloud(
    path: string,
    title: string,
    description: string,
    thumbnail: string
  ) {
    let item = new LocalItemData();

    // general
    item.title = title;
    item.path = path;
    item.isCloud = true;
    item.description = description;
    item.thumbnail = thumbnail;

    // do parsing
    return item.isValid ? item : null;
  }

  static fromLocalPath(
    project: any,
    title: string,
    path: string
  ): LocalItemData {
    let item = new LocalItemData();

    // general
    // item.itemId; // keep it empty until it is published on steam
    item.title = title;
    item.path = path;
    item.isCloud = false;
    item.description = project.data["description"];
    item.thumbnail = project.data["thumbnail"];

    // do parsing
    return item.isValid ? item : null;
  }
}
export class WorkshopItemData {
  // id
  itemId: string;
  fileId: string;
  publishedFileId: string;
  thumbnailId: string;
  publisherId: string;

  // general
  title: string;
  description: string;
  thumbnailUrl: any;
  numSubscribed: number;
  numLikes: number;
  numDislikes: number;
  ageRating: string;
  tags: Array<string>;
  allowDerivativeWork: boolean;

  get isValid(): boolean {
    return (
      this.itemId !== "" &&
      this.publisherId !== "" &&
      this.thumbnailUrl &&
      this.ageRating !== ""
    );
  }

  get excludedTag() {
    return ageRatingToExcludedTag(this.ageRating);
  }

  addTag(value: string) {
    const idx = this.tags.findIndex((item) => item == value);
    if (idx != -1) {
      this.tags.push(value);
    }
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
    data["allowDerivativework"] = this.allowDerivativeWork;

    return data;
  }

  static fromMetadata(data: any) {
    let item = new WorkshopItemData();
    item.itemId = data.file;
    item.title = data.title;
    item.description = data.description;
    item.thumbnailUrl = data.PreviewImageUrl;
    item.publishedFileId = data.publishedFileId;
    item.publisherId = data.steamIDOwner;
    item.numSubscribed = data.NumFollowers;
    item.numLikes = data.votesUp;
    item.numDislikes = data.votesDown;
    item.tags = data.tags.split(",");
    item.ageRating = ageRatingFromTags(item.tags);
    item.allowDerivativeWork = allowDerivativeWorkFromTags(item.tags);
    return item.isValid ? item : null;
  }

  static fromId(id: string) {
    // TODO: finish this
    let data = [];

    //greenworks
    return this.fromMetadata(data);
  }
}
