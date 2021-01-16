import Vue from "vue";
import vgl from "vue-golden-layout";
//import vgl from "vue-golden-layout/src";
import "golden-layout/src/css/goldenlayout-dark-theme.css";
//import "golden-layout/src/css/goldenlayout-light-theme.css";
import "../public/scss/scrollbar.scss";
import "./utils/inspectelement";
import "boxicons/css/boxicons.css";
require("typeface-open-sans");

// https://github.com/EmbeddedEnterprises/ng6-golden-layout/blob/master/README.md
import * as $ from "jquery";
(<any>window).$ = $;
(<any>window).JQuery = $;

import App from "./App.vue";
import router from "./router";
import store from "./store";

Vue.config.productionTip = false;
Vue.use(vgl);

import { Titlebar, Color } from "custom-electron-titlebar";
import "../public/scss/scrollbar.scss";
import {
  readProperty,
  readPropertyAsColor,
  readPropertyAsNumber,
} from "./utils/scsshelper";

import { ApplicationSettings } from "@/settings";
const settings = ApplicationSettings.getInstance();
settings.load();

const colorTitle = readPropertyAsColor("colorTitle");
export const colorGridBackground = readProperty("colorGridBackground");
export const colorGridPrimary = readProperty("colorGridPrimary");
export const colorGridSecondary = readProperty("colorGridSecondary");

let titleBar = new Titlebar({
  backgroundColor: colorTitle,
  icon: "./favicon.svg",
  shadow: true,
});

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount("#app");
