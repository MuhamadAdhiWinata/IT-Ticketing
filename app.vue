<template>
  <div>
    <!-- Splash: tampil saat app init -->
    <AppLoading v-if="!ready" />

    <!-- Router: selalu render dengan transisi halus -->
    <NuxtLayout>
      <NuxtPage :transition="{ name: 'page', mode: 'out-in' }" />
    </NuxtLayout>
    <ErrorModal />
    <ConfirmModal />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useCompany } from '~/composables/useCompany';

const ready = ref(false);
const { fetchSettings } = useCompany();

onMounted(async () => {
  await fetchSettings();
  ready.value = true;
});
</script>
