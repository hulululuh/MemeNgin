// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

import Vue from "vue";
import Vuex from "vuex";
import { UserData } from "@/userdata";
import { CloudData } from "@/clouddata";
import { ProjectItemData } from "@/community/ProjectItemData";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    userData: UserData.getInstance(),
    cloudData: CloudData.getInstance(),
    thumbnail: "",
    metadata: ProjectItemData.fromNothing(),
    selectedProject: null,
    selectedProjectState: null,
  },
  mutations: {
    setMetadata(state, data) {
      state.metadata = data;
    },
  },
  actions: {
    changeMetadata({ commit }, data) {
      commit("setMetadata", data);
    },
  },
});
