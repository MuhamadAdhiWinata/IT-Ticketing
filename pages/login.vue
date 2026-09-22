<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-slate-950">
    <div class="w-full max-w-md">
      <!-- Logo / Header -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 rounded-2xl bg-[#026bb1] flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Shield class="w-8 h-8 text-white" />
        </div>
        <h1 class="text-2xl font-extrabold text-gray-900 dark:text-white">IT Ticketing System</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Masuk ke sistem untuk melanjutkan</p>
      </div>

      <!-- Login Form -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm">
        <form @submit.prevent="handleLogin">
          <div class="space-y-4">
            <!-- Email -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <input
                v-model="email"
                type="email"
                placeholder="email@company.co.id"
                required
                class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#026bb1]/50 transition-all font-medium"
              />
            </div>

            <!-- Password -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
              <input
                v-model="password"
                type="password"
                placeholder="Masukkan password"
                required
                class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#026bb1]/50 transition-all font-medium"
              />
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="authStore.error" class="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
            <p class="text-xs text-red-600 dark:text-red-400 font-medium">{{ authStore.error }}</p>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="authStore.isLoading"
            class="w-full mt-6 py-3 rounded-xl bg-[#026bb1] hover:bg-[#025a95] disabled:bg-gray-300 dark:disabled:bg-slate-700 text-white text-sm font-bold transition-colors shadow-md"
          >
            <span v-if="authStore.isLoading" class="flex items-center justify-center gap-2">
              <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Memproses...</span>
            </span>
            <span v-else>Masuk</span>
          </button>
        </form>
      </div>

      <!-- Demo Credentials -->
      <div class="mt-6 p-4 rounded-xl bg-blue-50/60 dark:bg-slate-800/60 border border-blue-100 dark:border-slate-700/80">
        <p class="text-[10px] font-bold text-[#026bb1] dark:text-[#52b5f2] uppercase tracking-wider mb-2">Demo Akun</p>
        <div class="space-y-1.5 text-[11px] text-gray-600 dark:text-gray-400">
          <p><strong>Admin:</strong> sysadmin@company.co.id / password123</p>
          <p><strong>IT Worker:</strong> budi.santoso@it.company.co.id / password123</p>
          <p><strong>User:</strong> rina.wulandari@company.co.id / password123</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Shield } from 'lucide-vue-next';
import { useAuthStore } from '~/stores/auth';
import { useAppStore } from '~/stores/app';

definePageMeta({
  layout: 'flat',
});

const authStore = useAuthStore();
const appStore = useAppStore();

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
