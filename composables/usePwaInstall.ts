import { ref } from 'vue';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const canInstall = ref(false);
const isInstalled = ref(false);
const isIOS = ref(false);
const showIOSInstructions = ref(false);
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let initialized = false;

export function initPwaInstall() {
  if (initialized || !import.meta.client) return;
  initialized = true;

  const ua = window.navigator.userAgent;
  isIOS.value = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in window);

  if (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  ) {
    isInstalled.value = true;
    return;
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    canInstall.value = true;
  });

  window.addEventListener('appinstalled', () => {
    isInstalled.value = true;
    canInstall.value = false;
    deferredPrompt = null;
  });
}

const install = async () => {
  if (!deferredPrompt) return;
  await deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') {
    isInstalled.value = true;
    canInstall.value = false;
  }
  deferredPrompt = null;
};

const openIOSInstructions = () => {
  showIOSInstructions.value = true;
};

const closeIOSInstructions = () => {
  showIOSInstructions.value = false;
};

export function usePwaInstall() {
  initPwaInstall();
  return { canInstall, isInstalled, isIOS, showIOSInstructions, install, openIOSInstructions, closeIOSInstructions };
}
