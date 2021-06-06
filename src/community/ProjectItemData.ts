import path from "path";

export class ProjectItemData {
  //general
  id: string;
  title: string;
  description: string;

  // local item
  localPath: string;
  thumbnail: any;

  // workshop item
  thumbnailUrl: any;
  publisherId: string;
  numSubscribed: number;
  numLikes: number;
  numDislikes: number;

  get filename() {
    let name = this.title
      ? this.title
      : this.localPath
      ? path.parse(this.localPath).name
      : "";
    return name;
  }

  get desc() {
    if (this.description) return this.description;
    else return "";
  }

  get isLocal() {
    return this.localPath && !this.id;
  }

  get isWorkshopItem() {
    return this.id && this.publisherId;
  }
}
