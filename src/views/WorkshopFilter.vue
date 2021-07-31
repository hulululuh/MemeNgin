<template>
  <v-container fluid class="pa-0 ma-0">
    <v-text-field
      label="Keyword"
      clearable
      v-model="keyword"
      :append-icon="'mdi-magnify'"
      :append-outer-icon="'mdi-cached'"
      @keydown.enter="onSearchClicked"
      @click:clear="onClearClicked"
      @click:append="onSearchClicked"
      @click:append-outer="onResetFilter"
    />
    <v-subheader small style="font-size: 1rem; font-weight: 400;">{{
      "Type"
    }}</v-subheader>
    <v-chip-group
      v-model="selectedFilterType"
      column
      mandatory
      active-class="d-flex primary--text"
      @change="onTypeSelected"
    >
      <v-chip v-for="tag in filterType" :key="tag" :value="tag">
        {{ tag }}
      </v-chip>
    </v-chip-group>
    <v-subheader style="font-size: 1rem; font-weight: 400;">{{
      "Age rating"
    }}</v-subheader>
    <v-chip-group
      v-model="selectedAgeRating"
      column
      multiple
      mandatory
      active-class="d-flex primary--text"
      @change="onAgeRatingChanged"
    >
      <v-chip v-for="tag in ageRating" :key="tag" :value="tag">
        {{ tag }}
      </v-chip>
    </v-chip-group>
    <v-divider class="pb-1" />

    <v-subheader style="font-size: 1rem; font-weight: 400;">{{
      "Tags"
    }}</v-subheader>
    <v-chip-group
      v-model="selectedTags"
      column
      multiple
      active-class="d-flex primary--text"
      @change="onTagsChanged"
    >
      <v-chip v-for="tag in tags" :key="tag" :value="tag">
        {{ tag }}
      </v-chip>
    </v-chip-group>
    <v-divider class="pb-1" />
  </v-container>
</template>

<style scoped lang="scss">
  @import "../../public/scss/app.scss";
</style>

<script lang="ts">
  import {
    AGE_RATING,
    TAGS_TEST,
    FILTER_TYPE,
    QueryTarget,
    SearchOption,
  } from "@/userdata";
  import { Component, Vue } from "vue-property-decorator";
  import { WorkshopManager } from "@/community/workshop";

  @Component
  export default class WorkshopFilter extends Vue {
    onResetFilter() {
      this.$store.state.userData.searchOption = new SearchOption();
      this.requestSearch();
    }

    onTypeSelected() {
      this.requestSearch();
    }

    onAgeRatingChanged() {
      this.requestSearch();
    }

    onTagsChanged() {
      this.requestSearch();
    }

    onSearchClicked() {
      this.requestSearch();
    }

    onClearClicked() {
      this.requestSearch();
    }

    requestSearch() {
      console.log(`Explore tab: Search requested`);
      WorkshopManager.getInstance().requestSearch(
        this.$store.state.userData.searchOption,
        QueryTarget.Search
      );
    }

    get keyword() {
      return this.$store.state.userData.searchOption.keyword;
    }

    set keyword(value: string) {
      this.$store.state.userData.searchOption.keyword = value ? value : "";
    }

    get selectedFilterType() {
      return this.$store.state.userData.searchOption.type;
    }

    set selectedFilterType(value: string) {
      this.$store.state.userData.searchOption.type = value;
    }

    get selectedAgeRating() {
      return this.$store.state.userData.searchOption.ageRating;
    }

    set selectedAgeRating(value: string) {
      this.$store.state.userData.searchOption.ageRating = value;
    }

    get selectedTags() {
      return this.$store.state.userData.searchOption.tags;
    }

    set selectedTags(value: string) {
      this.$store.state.userData.searchOption.tags = value;
    }

    get filterType() {
      return FILTER_TYPE;
    }

    get ageRating() {
      return AGE_RATING;
    }

    get tags() {
      return TAGS_TEST;
    }
  }
</script>
