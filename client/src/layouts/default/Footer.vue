<script setup>
import { appInfo, getToLink } from "@/others/util";
import { computed } from "vue";
import { useStore } from "vuex";

const store = useStore();
</script>
<template>
  <v-footer class="bg-grey-lighten-3 flex-grow-0" app>
    <v-row justify="center" no-gutters>
      <v-col class="text-center" cols="12">
        <small>
          Ferdinando Guzzo Consulting - &copy;
          <strong>{{ appInfo.name }}</strong> {{ new Date().getFullYear() }}
        </small>
      </v-col>
    </v-row>
  </v-footer>
</template>
