<template>
  <v-container fluid class="pa-0 ma-0">
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
      <v-chip v-for="tag in ageRating" :key="tag">
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
      <v-chip v-for="tag in tags" :key="tag">
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
  import { WorkshopManager } from "@/community/workshop";
  import { UserData, AGE_RATING, TAGS_TEST, QueryTarget } from "@/userdata";
  import { Component, Vue } from "vue-property-decorator";
  @Component
  export default class WorkshopFilter extends Vue {
    selectedAgeRating: number[] = [];
    selectedTags: number[] = [];

    onAgeRatingChanged() {
      let ratingsToExclude = Array.from(AGE_RATING);

      this.selectedAgeRating.sort();
      for (let ageRating of this.selectedAgeRating.reverse()) {
        ratingsToExclude.splice(ageRating, 1);
      }

      UserData.getInstance().excludedTags = ratingsToExclude;
      WorkshopManager.getInstance().requestUpdate(QueryTarget.Search);
    }

    onTagsChanged() {
      let TAGS: string[] = [];
      for (let tag of this.selectedTags) {
        TAGS.push(TAGS_TEST[tag]);
      }

      UserData.getInstance().tags = TAGS;
      WorkshopManager.getInstance().requestUpdate(QueryTarget.Search);
    }

    get ageRating() {
      return AGE_RATING;
    }

    get tags() {
      return TAGS_TEST;
    }
  }
</script>
