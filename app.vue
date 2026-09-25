<template>
  <div>
    <!-- Splash overlay: di atas semua, hilang setelah company settings loaded -->
    <AppLoading v-if="!companyReady" />

    <!-- Router: selalu render, tidak pernah conditionally -->
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ErrorModal />
    <ConfirmModal />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useCompany } from '~/composables/useCompany';

const companyReady = ref(false);
const { fetchSettings } = useCompany();

onMounted(async () => {
  await fetchSettings();
  companyReady.value = true;
});
</script>
