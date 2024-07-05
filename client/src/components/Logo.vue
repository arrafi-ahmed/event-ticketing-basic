<script setup>
import { useDisplay } from "vuetify";
import {
  appInfo,
  getApiPublicImgUrl,
  getClientPublicImgUrl,
} from "@/others/util";
import { computed } from "vue";

const { mobile } = useDisplay();
const {
  imgSrcApi,
  imgSrcClient,
  title,
  imgClass,
  containerClass,
  width,
  maxWidth,
  maxHeight,
} = defineProps({
  imgSrcApi: { type: Object },
  imgSrcClient: { type: String },
  title: { type: String },
  imgClass: { type: String },
  containerClass: { type: String },
  width: { type: Number },
  maxWidth: { type: Number },
  maxHeight: { type: Number },
});

const imgSrc = computed(() =>
  imgSrcClient
    ? getClientPublicImgUrl(imgSrcClient)
    : imgSrcApi?.name
    ? getApiPublicImgUrl(imgSrcApi.name, imgSrcApi.type)
    : null
);
</script>

<template>
  <div :class="`d-flex justify-center align-center ${containerClass}`">
    <!--    c-{{ imgSrcClient }} a-{{ imgSrcApi?.name }}-->
    <v-img
      v-if="imgSrc"
      :class="`${imgClass}`"
      :max-height="maxHeight"
      :max-width="maxWidth"
      :src="imgSrc"
      :width="width"
    ></v-img>

    <div v-if="title" :class="{ 'pl-2': imgSrc }">
      <component :is="mobile ? 'h2' : 'h1'">
        <span class="text-primary">{{ title || appInfo.name }}</span>
      </component>
    </div>
  </div>
</template>

<style scoped></style>
