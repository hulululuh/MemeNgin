import Vue from "vue";
import Vuex from "vuex";
import { UserData } from "@/userdata";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    userData: UserData.getInstance(),
  },
  mutations: {},
  actions: {},
});
