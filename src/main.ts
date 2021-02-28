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
import router from "./router";
import store from "./store";

Vue.config.productionTip = false;
//Vue.use(vgl);

import { Titlebar } from "custom-electron-titlebar";
import { readProperty, readPropertyAsColor } from "./utils/scsshelper";
import "../public/scss/scrollbar.scss";

import { ApplicationSettings } from "@/settings";
import vuetify from './plugins/vuetify';
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
  vuetify,
  render: (h) => h(App)
}).$mount("#app");
