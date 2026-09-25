<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-sm">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-md overflow-hidden">
          <img
            v-if="settings.logoUrl && !logoError"
            :src="settings.logoUrl"
            :alt="settings.companyName"
            class="w-10 h-10 object-contain"
            @error="logoError = true"
          />
          <img
            v-else
            src="/images/IO.png"
            :alt="settings.companyName"
            class="w-10 h-10 object-contain"
          />
        </div>
        <h1 class="text-xl font-bold text-foreground">{{ settings.companyName }}</h1>
        <p class="text-xs text-muted-foreground mt-1">Masuk ke sistem untuk melanjutkan</p>
      </div>

      <!-- Form -->
      <div class="bg-surface rounded-lg border border-border p-5 shadow-xs">
        <form @submit.prevent="handleLogin">
          <div class="space-y-3">
            <div>
              <label for="login-email" class="block text-xs font-semibold text-foreground mb-1.5">Email</label>
              <input
                id="login-email"
                v-model="email"
                type="email"
                placeholder="email@company.co.id"
                required
                class="w-full px-3 py-2.5 rounded-lg border border-input bg-surface text-foreground text-xs font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label for="login-password" class="block text-xs font-semibold text-foreground mb-1.5">Password</label>
              <input
                id="login-password"
                v-model="password"
                type="password"
                placeholder="Masukkan password"
                required
                class="w-full px-3 py-2.5 rounded-lg border border-input bg-surface text-foreground text-xs font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div v-if="authStore.error" class="mt-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
            <p class="text-xs text-destructive font-medium">{{ authStore.error }}</p>
          </div>

          <button
            type="submit"
            :disabled="authStore.isLoading"
            class="w-full mt-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover disabled:bg-muted text-primary-foreground text-xs font-bold transition-colors shadow-xs"
          >
            <span v-if="authStore.isLoading" class="flex items-center justify-center gap-2">
              <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Memproses...</span>
            </span>
            <span v-else>Masuk</span>
          </button>
        </form>
      </div>

      <!-- Demo -->
      <div class="mt-4 p-3 rounded-lg bg-primary-muted/50 border border-primary/10">
        <p class="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Demo Akun</p>
        <div class="space-y-1 text-[11px] text-muted-foreground">
          <p><strong class="text-foreground">Admin:</strong> sysadmin@company.co.id / password123</p>
          <p><strong class="text-foreground">IT Worker:</strong> budi.santoso@it.company.co.id / password123</p>
          <p><strong class="text-foreground">User:</strong> rina.wulandari@company.co.id / password123</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useAppStore } from '~/stores/app';
import { useCompany } from '~/composables/useCompany';

definePageMeta({
  layout: 'flat',
});

const authStore = useAuthStore();
const appStore = useAppStore();
const { settings } = useCompany();
const logoError = ref(false);

const email = ref('sysadmin@company.co.id');
const password = ref('password123');

const handleLogin = async () => {
  const success = await authStore.login(email.value, password.value);
  if (success) {
    await appStore.initApp();
    await navigateTo('/');
  }
};
</script>
