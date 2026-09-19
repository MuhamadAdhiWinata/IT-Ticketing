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

onMounted(async () => {
  await store.initApp();
});
</script>
