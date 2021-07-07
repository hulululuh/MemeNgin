<template>
  <v-container fluid class="pa-0 ma-0">
    <v-text-field
      label="Keyword"
      :append-icon="'mdi-magnify'"
      :rules="titleRules"
      @click:append="onSearchClicked"
    ></v-text-field>
    <v-subheader small style="font-size: 1rem; font-weight: 400;">{{
      "Type"
    }}</v-subheader>
    <v-chip-group
      v-model="selectedFilterType"
      column
      mandatory
      active-class="d-flex primary--text"
      @change="onAgeRatingChanged"
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
  import { AGE_RATING, TAGS_TEST, FILTER_TYPE } from "@/userdata";
  import { Component, Vue } from "vue-property-decorator";
  import { TITLE_RULES } from "@/views/PublishDialog.vue";

  @Component
  export default class WorkshopFilter extends Vue {
    onAgeRatingChanged() {
      // let ratingsToExclude = Array.from(AGE_RATING);
      // this.selectedAgeRating.sort();
      // for (let ageRating of this.selectedAgeRating.reverse()) {
      //   ratingsToExclude.splice(ageRating, 1);
      // }
      // UserData.getInstance().excludedTags = ratingsToExclude;
      // WorkshopManager.getInstance().requestUpdate(QueryTarget.Search);
    }

    onTagsChanged() {
      // let TAGS: string[] = [];
      // for (let tag of this.selectedTags) {
      //   TAGS.push(TAGS_TEST[tag]);
      // }
      // UserData.getInstance().tags = TAGS;
      // WorkshopManager.getInstance().requestUpdate(QueryTarget.Search);
    }

    onSearchClicked() {}

    get keyword() {
      return this.$store.state.userData.searchOption.keyword;
    }

    set keyword(value: string) {
      this.$store.state.userData.searchOption.keyword = value;
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

    get titleRules() {
      return TITLE_RULES;
    }
  }
</script>
