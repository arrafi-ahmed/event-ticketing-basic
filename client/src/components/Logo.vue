<script setup>
import { useDisplay } from "vuetify";
import { appName, getClientPublicImgUrl } from "@/others/util";

const { mobile } = useDisplay();
const {
  imgSrc,
  imgSrcClient,
  title,
  imgClass,
  containerClass,
  width,
  maxWidth,
  maxHeight,
} = defineProps({
  imgSrc: { type: String },
  imgSrcClient: { type: Boolean, default: true },
  title: { type: String },
  imgClass: { type: String },
  containerClass: { type: String },
  width: { type: Number },
  maxWidth: { type: Number },
  maxHeight: { type: Number },
});
</script>

<template>
  <div :class="`d-flex align-center ${containerClass}`">
    <v-img
      v-if="imgSrc"
      :class="`${imgClass}`"
      :max-height="maxHeight"
      :max-width="maxWidth"
      :src="imgSrcClient ? getClientPublicImgUrl(imgSrc) : imgSrc"
      :width="width"
    ></v-img>

    <div v-if="title" class="pl-2">
      <component :is="mobile ? 'h2' : 'h1'">
        <span class="text-primary">{{ appName }}</span>
      </component>
    </div>
  </div>
</template>

<style scoped></style>
