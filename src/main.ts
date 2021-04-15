import Vue from "vue";
//import vgl from "vue-golden-layout";
//import "golden-layout/src/css/goldenlayout-dark-theme.css";
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

import { Titlebar } from "custom-electron-titlebar";
import { ApplicationSettings } from "@/settings";
import { AssetManager } from "@/assets/assetmanager";

const settings = ApplicationSettings.getInstance();
AssetManager.getInstance();

settings.load();

// new Titlebar({
//   backgroundColor: settings.colorTitle,
// });

new Vue({
  store,
  vuetify: new Vuetify(),
  render: (h) => h(App),
}).$mount("#app");
