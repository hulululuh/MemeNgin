import { ProjectManager } from "@/lib/project";
import fs from "fs";
import path from "path";

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

  static fromLocalPath(localPath: string): ProjectItemData {
    let item = new ProjectItemData();
    item.localItem = LocalItemData.fromLocalPath(localPath);
    return item.localItem ? item : null;
  }

  static fromMetadata(data: any): ProjectItemData {
    let item = new ProjectItemData();
    item.workshopItem = WorkshopItemData.fromMetadata(data);
    return item.workshopItem ? item : null;
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

  static fromLocalPath(localPath: string): LocalItemData {
    let item = new LocalItemData();
    let exists = fs.existsSync(localPath);
    if (!exists) {
      console.error("given path is invalid!");
      return null;
    } else {
      let project = ProjectManager.load(localPath);

      // general
      // item.itemId; // keep it empty until it is published on steam
      item.title = path.parse(localPath).name;
      item.description = project.data["description"];
      item.thumbnail = project.data["thumbnail"];
      item.localPath = localPath;
    }

    // do parsing
    return item.isValid ? item : null;
  }
}

export class WorkshopItemData {
  // workshop item
  itemId: string;
  publisherId: string;
  title: string;
  description: string;
  thumbnailUrl: any;
  numSubscribed: number;
  numLikes: number;
  numDislikes: number;

  get isValid() {
    return this.itemId && this.publisherId && this.thumbnailUrl;
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
    return item.isValid ? item : null;
  }
}
