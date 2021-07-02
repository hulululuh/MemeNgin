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
