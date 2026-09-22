<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAppStore } from '~/stores/app';

const store = useAppStore();

// Note: initApp is now called from pages/index.vue after auth check
// This file is kept minimal for the layout wrapper
</script>
