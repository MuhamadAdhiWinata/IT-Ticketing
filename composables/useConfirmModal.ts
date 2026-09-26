import { ref } from 'vue';

interface ConfirmState {
  show: boolean;
  title: string;
  message: string;
  confirmText: string;
  onConfirm: (() => void) | null;
  onCancel: (() => void) | null;
}

const state = ref<ConfirmState>({
  show: false,
  title: '',
  message: '',
  confirmText: 'Hapus',
  onConfirm: null,
  onCancel: null,
});

let resolvePromise: ((value: boolean) => void) | null = null;

export function useConfirmModal() {
  function confirm(title: string, message: string, confirmText = 'Hapus'): Promise<boolean> {
    return new Promise((resolve) => {
      resolvePromise = resolve;
      state.value = {
        show: true,
        title,
        message,
        confirmText,
        onConfirm: () => {
          state.value.show = false;
          resolve(true);
        },
        onCancel: () => {
          state.value.show = false;
          resolve(false);
        },
      };
    });
  }

  return { state, confirm };
}
