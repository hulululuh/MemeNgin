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
