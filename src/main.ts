import Vue from "vue";
import "../public/scss/scrollbar.scss";
import "./utils/inspectelement";
import "boxicons/css/boxicons.css";
require("typeface-open-sans");
require("typeface-roboto");

// https://github.com/EmbeddedEnterprises/ng6-golden-layout/blob/master/README.md
import * as $ from "jquery";
(window as any).$ = $;
(window as any).JQuery = $;

import App from "./App.vue";
import store from "./store";

import Vuetify from "vuetify/lib";

Vue.config.productionTip = false;
Vue.use(Vuetify);

import { ApplicationSettings } from "@/settings";
import { AssetManager } from "@/assets/assetmanager";
import { TextManager } from "@/assets/textmanager";
import { WorkshopManager } from "@/community/workshop";

AssetManager.getInstance();
TextManager.getInstance();
WorkshopManager.getInstance();

const settings = ApplicationSettings.getInstance();
settings.load();

new Vue({
  store,
  vuetify: new Vuetify(),
  render: (h) => h(App),
}).$mount("#app");
