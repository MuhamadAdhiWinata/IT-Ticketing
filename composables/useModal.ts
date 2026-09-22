import { ref } from 'vue';

interface ModalState {
  show: boolean;
  title: string;
  message: string;
  type: 'error' | 'success' | 'warning' | 'info';
}

const modalState = ref<ModalState>({
  show: false,
  title: '',
  message: '',
  type: 'error',
});

export function useModal() {
  function showModal(title: string, message: string, type: ModalState['type'] = 'error') {
    modalState.value = { show: true, title, message, type };
  }

  function showError(title: string, message: string) {
    showModal(title, message, 'error');
  }

  function showSuccess(title: string, message: string) {
    showModal(title, message, 'success');
  }

  function closeModal() {
    modalState.value = { show: false, title: '', message: '', type: 'error' };
  }

  return { modalState, showModal, showError, showSuccess, closeModal };
}
