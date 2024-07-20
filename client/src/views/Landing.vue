<script setup>
import { getClientPublicImgUrl } from "@/others/util";
import { useDisplay } from "vuetify";

const { xs } = useDisplay();
</script>

<template>
  <v-sheet
    :class="{ 'bg-mobile': xs, 'bg-landing-color': !xs }"
    class="limit-max-width-xl"
  >
    <v-row align="center" :class="{ 'bg-overlay-mobile': xs }">
      <v-col cols="5" class="d-none d-sm-flex">
        <v-row>
          <v-col cols="11">
            <v-img
              :src="getClientPublicImgUrl('landing1.png')"
              rounded="xl"
            ></v-img>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="12" md="7" class="px-10" :class="{ 'text-white': xs }">
        <v-row align="center" justify="center">
          <v-col>
            <v-row
              class="mt-2 mt-md-0"
              :class="{ 'bg-overlay-mobile-logo rounded': xs }"
            >
              <v-col cols="12" md="9">
                <v-img :src="getClientPublicImgUrl('logo.png')"></v-img>
              </v-col>
            </v-row>
            <v-row>
              <v-col style="font-size: 18px">
                <p>
                  Click Event è la soluzione completa per la gestione dei vostri
                  eventi. Semplifica l'organizzazione, migliora l'efficienza e
                  aumenta la soddisfazione dei clienti.
                </p>
                <p class="pt-8">
                  Scoprite come rivoluzionare la gestione dei vostri eventi con
                  la nostra piattaforma intuitiva e potente.
                </p>
              </v-col>
            </v-row>
            <v-row align="center" class="pt-4 pt-md-15">
              <v-col cols="auto">
                <v-img
                  :width="35"
                  :src="getClientPublicImgUrl('landing2.png')"
                ></v-img>
              </v-col>
              <v-col>
                <b>by Ferdinando Guzzo</b>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-sheet>
</template>

<style>
.bg-landing-color {
  background-color: #eeeeee;
}

.bg-mobile {
  background: url("/img/landing1.png") !important;
  background-size: cover !important;
  position: relative !important;
}

.bg-overlay-mobile {
  background-color: rgba(0, 0, 0, 0.5);
}

.bg-overlay-mobile-logo {
  background-color: rgba(255, 255, 255, 0.9);
}
</style>
