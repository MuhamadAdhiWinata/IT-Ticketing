<template>
  <div class="border border-border rounded-lg overflow-hidden bg-card">
    <!-- Toolbar -->
    <div v-if="editor && !readonly" class="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted px-2 py-1.5">
      <button
        type="button"
        @click="editor.chain().focus().toggleBold().run()"
        :class="['p-1.5 rounded hover:bg-muted-foreground/10 transition-colors', editor.isActive('bold') ? 'bg-muted-foreground/20' : '']"
        title="Bold"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8"/></svg>
      </button>
      <button
        type="button"
        @click="editor.chain().focus().toggleItalic().run()"
        :class="['p-1.5 rounded hover:bg-muted-foreground/10 transition-colors', editor.isActive('italic') ? 'bg-muted-foreground/20' : '']"
        title="Italic"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" x2="10" y1="4" y2="4"/><line x1="14" x2="5" y1="20" y2="20"/><line x1="15" x2="9" y1="4" y2="20"/></svg>
      </button>
      <button
        type="button"
        @click="editor.chain().focus().toggleStrike().run()"
        :class="['p-1.5 rounded hover:bg-muted-foreground/10 transition-colors', editor.isActive('strike') ? 'bg-muted-foreground/20' : '']"
        title="Strikethrough"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" x2="20" y1="12" y2="12"/></svg>
      </button>
      
      <div class="w-px h-4 bg-border mx-1" />
      
      <button
        type="button"
        @click="editor.chain().focus().toggleBulletList().run()"
        :class="['p-1.5 rounded hover:bg-muted-foreground/10 transition-colors', editor.isActive('bulletList') ? 'bg-muted-foreground/20' : '']"
        title="Bullet List"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
      </button>
      <button
        type="button"
        @click="editor.chain().focus().toggleOrderedList().run()"
        :class="['p-1.5 rounded hover:bg-muted-foreground/10 transition-colors', editor.isActive('orderedList') ? 'bg-muted-foreground/20' : '']"
        title="Numbered List"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" x2="21" y1="6" y2="6"/><line x1="10" x2="21" y1="12" y2="12"/><line x1="10" x2="21" y1="18" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
      </button>
      
      <div class="w-px h-4 bg-border mx-1" />
      
      <button
        type="button"
        @click="setLink"
        :class="['p-1.5 rounded hover:bg-muted-foreground/10 transition-colors', editor.isActive('link') ? 'bg-muted-foreground/20' : '']"
        title="Link"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
      </button>
      <button
        type="button"
        @click="triggerImageUpload"
        :disabled="uploadingImage"
        class="p-1.5 rounded hover:bg-muted-foreground/10 transition-colors disabled:opacity-50"
        title="Upload Image"
      >
        <svg v-if="uploadingImage" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
      </button>
    </div>
    
    <!-- Editor Content -->
    <EditorContent :editor="editor" />
    
    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      accept="image/png,image/jpeg,image/webp,image/gif"
      class="hidden"
      @change="handleImageUpload"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

const props = withDefaults(defineProps<{
  modelValue: string;
  placeholder?: string;
  readonly?: boolean;
}>(), {
  placeholder: 'Tulis sesuatu...',
  readonly: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'imageUpload': [file: File, callback: (url: string) => void];
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const uploadingImage = ref(false);

const editor = useEditor({
  content: props.modelValue,
  editable: !props.readonly,
  extensions: [
    StarterKit,
    Image.configure({
      inline: true,
      HTMLAttributes: {
        class: 'max-w-full h-auto rounded',
      },
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-primary underline',
      },
    }),
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-sm max-w-none focus:outline-none min-h-[80px] p-3 text-foreground',
    },
  },
  onUpdate: ({ editor: instance }) => {
    emit('update:modelValue', instance.getHTML());
  },
});

watch(() => props.modelValue, (value) => {
  if (editor.value && value !== editor.value.getHTML()) {
    editor.value.commands.setContent(value, { emitUpdate: false });
  }
});

watch(() => props.readonly, (isReadonly) => {
  if (editor.value) {
    editor.value.setEditable(!isReadonly);
  }
});

onBeforeUnmount(() => {
  editor.value?.destroy();
});

function setLink() {
  if (!editor.value) return;
  const previous = editor.value.getAttributes('link').href as string | undefined;
  const url = window.prompt('URL:', previous ?? 'https://');
  if (url === null) return;
  
  if (!url.trim()) {
    editor.value.chain().focus().unsetLink().run();
  } else {
    editor.value.chain().focus().setLink({ href: url.trim() }).run();
  }
}

function triggerImageUpload() {
  fileInput.value?.click();
}

async function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file || !editor.value) return;
  
  uploadingImage.value = true;
  
  emit('imageUpload', file, (url: string) => {
    editor.value?.chain().focus().setImage({ src: url }).run();
    uploadingImage.value = false;
  });
}
</script>

<style>
.ProseMirror {
  outline: none;
}

.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: rgb(var(--muted-foreground) / 0.5);
  pointer-events: none;
  height: 0;
}

.ProseMirror img {
  max-width: 100%;
  height: auto;
  border-radius: 0.375rem;
  margin: 0.5rem 0;
}

.ProseMirror ul,
.ProseMirror ol {
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}

.ProseMirror li {
  margin: 0.25rem 0;
}

.ProseMirror a {
  color: rgb(var(--primary));
  text-decoration: underline;
}

.ProseMirror strong {
  font-weight: 600;
}

.ProseMirror em {
  font-style: italic;
}

.ProseMirror s {
  text-decoration: line-through;
}
</style>
