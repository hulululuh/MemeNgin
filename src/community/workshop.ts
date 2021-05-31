import { UserData } from "@/userdata";
import { ProjectItemData } from "./ProjectItemData";

const greenworks = require("greenworks");

const APP_ID = 431960;

export class WorkshopManager {
  private static _instance: WorkshopManager;
  static getInstance() {
    if (!WorkshopManager._instance) {
      WorkshopManager._instance = new WorkshopManager();
    }
    return WorkshopManager._instance;
  }

  constructor() {
    try {
      let initialized = greenworks.init();

      if (!initialized) {
        initialized = greenworks.RestartAppIfNecessary();
      }

      if (initialized) {
        console.log("Steam API has been initialized.");
        greenworks.ugcGetItems(
          { "app_id": APP_ID, "page_num": 1 },
          greenworks.UGCMatchingType.Items,
          greenworks.UGCQueryType.RankedByPublicationDate,
          (items) => {
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
    } catch (err) {
      console.error(err);
    }
  }
  //   if (greenworks.init()) {
  //     console.log("Steam API has been initialized.");
  //     greenworks.ugcGetItems(
  //       { "app_id": APP_ID, "page_num": 1 },
  //       greenworks.UGCMatchingType.Items,
  //       greenworks.UGCQueryType.RankedByPublicationDate,
  //       (items) => {
  //         console.log(items);
  //       },
  //       (err) => {
  //         console.error(err);
  //       }
  //     );
  //   } else {
  //     console.warn("greenworks has not been initialzed");
  //   }
  // }
}
