<template>
  <div class="min-h-screen flex login-anim-enter" style="background-color: var(--color-background)">
    <!-- Desktop: Split layout | Mobile: Stacked -->
    <div class="flex w-full min-h-screen lg:max-h-screen lg:overflow-hidden">
      <!-- Login Form Panel -->
      <div class="w-full lg:w-[55%] xl:w-[50%] flex items-center justify-center p-6 sm:p-8 lg:p-12 flex-shrink-0">
        <div class="w-full max-w-md">
          <!-- Brand Header -->
          <div class="login-anim-fade" style="animation-delay: 0.1s">
            <div class="flex items-center gap-3">
              <div
                v-if="loaded && settings.logoUrl && !logoError"
                class="w-10 h-10 rounded-xl overflow-hidden shrink-0"
              >
                <img
                  :src="settings.logoUrl"
                  :alt="settings.companyName"
                  class="w-full h-full object-contain"
                  @error="logoError = true"
                />
              </div>
              <div
                v-else
                class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style="background-color: var(--color-primary)"
              >
                <Shield class="w-5 h-5" style="color: var(--color-primary-foreground)" />
              </div>
              <div>
                <span class="text-sm font-bold" style="color: var(--color-foreground)">
                  {{ loaded ? settings.companyName : 'IT Ticketing' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Welcome Text -->
          <div class="space-y-1 login-anim-fade mt-1" style="animation-delay: 0.2s">
            <h1 class="text-2xl sm:text-3xl font-bold" style="color: var(--color-foreground)">
              Selamat Datang
            </h1>
            <p class="text-sm" style="color: var(--color-muted-foreground)">
              Masuk untuk mengakses IT Service Desk Anda.
            </p>
          </div>

          <!-- Login Form -->
          <form @submit.prevent="handleLogin" class="space-y-4 login-anim-fade mt-5" style="animation-delay: 0.3s">
            <!-- Error Alert -->
            <div
              v-if="authStore.error"
              class="flex items-start gap-2.5 p-3.5 rounded-xl border border-destructive/20 bg-destructive/5"
              role="alert"
            >
              <AlertTriangle class="w-4 h-4 mt-0.5 shrink-0" style="color: var(--color-destructive)" />
              <p class="text-xs font-medium" style="color: var(--color-destructive)">
                {{ authStore.error }}
              </p>
            </div>

            <!-- Email Field -->
            <div class="space-y-1.5">
              <label
                for="login-email"
                class="block text-xs font-semibold text-foreground"
              >
                Email
              </label>
              <div class="relative">
                <div class="absolute left-3 top-1/2 -translate-y-1/2">
                  <User class="w-4 h-4 text-muted-foreground" />
                </div>
                <input
                  id="login-email"
                  v-model="email"
                  type="email"
                  placeholder="email@company.co.id"
                  required
                  autocomplete="email"
                  class="w-full pl-10 pr-3 py-2.5 rounded-xl border border-input bg-surface text-foreground text-sm font-medium placeholder:text-muted-foreground/50 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
                />
              </div>
            </div>

            <!-- Password Field -->
            <div class="space-y-1.5">
              <label
                for="login-password"
                class="block text-xs font-semibold text-foreground"
              >
                Password
              </label>
              <div class="relative">
                <div class="absolute left-3 top-1/2 -translate-y-1/2">
                  <Lock class="w-4 h-4 text-muted-foreground" />
                </div>
                <input
                  id="login-password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Masukkan password"
                  required
                  autocomplete="current-password"
                  class="w-full pl-10 pr-10 py-2.5 rounded-xl border border-input bg-surface text-foreground text-sm font-medium placeholder:text-muted-foreground/50 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-muted-foreground transition-colors hover:text-foreground"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                  :aria-pressed="showPassword"
                >
                  <EyeOff v-if="showPassword" class="w-4 h-4" />
                  <Eye v-else class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Remember me + Forgot password -->
            <div class="flex items-center justify-between mt-0.5">
              <label class="flex items-center gap-2 cursor-pointer select-none">
                <input
                  v-model="rememberMe"
                  type="checkbox"
                  class="w-4 h-4 rounded border-2 cursor-pointer accent-primary"
                />
                <span class="text-xs font-medium text-muted-foreground">
                  Ingat saya
                </span>
              </label>
              <a
                href="#"
                class="text-xs font-semibold text-primary transition-colors hover:underline"
                @click.prevent
              >
                Lupa password?
              </a>
            </div>

            <!-- Sign In Button -->
            <button
              type="submit"
              :disabled="authStore.isLoading"
              class="w-full py-3 rounded-xl text-sm font-bold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-[0.98] mt-1.5"
              :style="{
                backgroundColor: authStore.isLoading ? 'var(--color-muted)' : 'var(--color-primary)',
                color: authStore.isLoading ? 'var(--color-muted-foreground)' : 'var(--color-primary-foreground)',
              }"
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

          <!-- Demo Credentials -->
          <div
            class="p-4 rounded-xl border border-primary/15 bg-primary-muted/50 login-anim-fade mt-5"
            style="animation-delay: 0.4s"
          >
            <p
              class="text-[10px] font-bold uppercase tracking-wider mb-2.5 text-primary"
            >
              Demo Akun
            </p>
            <div class="space-y-1.5 text-[11px] text-muted-foreground">
              <p>
                <strong class="text-foreground">Admin:</strong>
                sysadmin@company.co.id / password123
              </p>
              <p>
                <strong class="text-foreground">IT Worker:</strong>
                budi.santoso@it.company.co.id / password123
              </p>
              <p>
                <strong class="text-foreground">User:</strong>
                rina.wulandari@company.co.id / password123
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Visual Panel (Desktop only) -->
      <div class="hidden lg:block lg:w-[45%] xl:w-[50%] relative flex-shrink-0">
        <LoginVisual />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useAppStore } from '~/stores/app';
import { useCompany } from '~/composables/useCompany';
import { Shield, User, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-vue-next';
import LoginVisual from '~/components/login/LoginVisual.vue';

definePageMeta({
  layout: 'flat',
});

const authStore = useAuthStore();
const appStore = useAppStore();
const { settings, loaded } = useCompany();
const logoError = ref(false);

const email = ref('sysadmin@company.co.id');
const password = ref('password123');
const showPassword = ref(false);
const rememberMe = ref(false);

const handleLogin = async () => {
  const success = await authStore.login(email.value, password.value);
  if (success) {
    await appStore.initApp();
    await navigateTo('/');
  }
};
</script>
