<template>
  <div class="relative w-full h-full overflow-hidden login-anim-fade" style="background-color: var(--login-visual-bg); animation-delay: 0.1s;">
    <!-- Organic curve SVG (left boundary) -->
    <svg
      class="absolute inset-y-0 left-0 h-full w-24 sm:w-32 lg:w-40 z-10"
      viewBox="0 0 160 800"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
    </svg>

    <!-- IT Infrastructure illustration (centered, behind floating cards) -->
    <svg
      class="absolute inset-0 w-full h-full z-0"
      viewBox="0 0 600 800"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- Network nodes -->
      <circle cx="180" cy="120" r="32" stroke="var(--color-primary)" stroke-width="1.5" :style="{ strokeOpacity: 'var(--login-network-stroke-opacity)', fillOpacity: 'var(--login-network-fill-opacity)' }" />
      <circle cx="180" cy="120" r="8" fill="var(--color-primary)" :style="{ fillOpacity: 'var(--login-network-core-opacity)' }" />

      <circle cx="450" cy="100" r="28" stroke="var(--color-primary)" stroke-width="1.5" :style="{ strokeOpacity: 'var(--login-network-stroke-opacity)', fillOpacity: 'var(--login-network-fill-opacity)' }" />
      <circle cx="450" cy="100" r="7" fill="var(--color-primary)" :style="{ fillOpacity: 'var(--login-network-core-opacity)' }" />

      <circle cx="120" cy="350" r="24" stroke="var(--color-primary)" stroke-width="1.5" :style="{ strokeOpacity: 'var(--login-network-stroke-opacity)', fillOpacity: 'var(--login-network-fill-opacity)' }" />
      <circle cx="120" cy="350" r="7" fill="var(--color-primary)" :style="{ fillOpacity: 'var(--login-network-core-opacity)' }" />

      <circle cx="480" cy="320" r="26" stroke="var(--color-primary)" stroke-width="1.5" :style="{ strokeOpacity: 'var(--login-network-stroke-opacity)', fillOpacity: 'var(--login-network-fill-opacity)' }" />
      <circle cx="480" cy="320" r="7" fill="var(--color-primary)" :style="{ fillOpacity: 'var(--login-network-core-opacity)' }" />

      <circle cx="180" cy="580" r="22" stroke="var(--color-primary)" stroke-width="1.5" :style="{ strokeOpacity: 'var(--login-network-stroke-opacity)', fillOpacity: 'var(--login-network-fill-opacity)' }" />
      <circle cx="180" cy="580" r="6" fill="var(--color-primary)" :style="{ fillOpacity: 'var(--login-network-core-opacity)' }" />

      <circle cx="420" cy="620" r="30" stroke="var(--color-primary)" stroke-width="1.5" :style="{ strokeOpacity: 'var(--login-network-stroke-opacity)', fillOpacity: 'var(--login-network-fill-opacity)' }" />
      <circle cx="420" cy="620" r="5" fill="var(--color-primary)" :style="{ fillOpacity: 'var(--login-network-core-opacity)' }" />

      <!-- Connection lines -->
      <line x1="180" y1="120" x2="450" y2="100" stroke="var(--color-primary)" stroke-width="1" :style="{ strokeOpacity: 'var(--login-network-line-opacity)' }" />
      <line x1="180" y1="120" x2="120" y2="350" stroke="var(--color-primary)" stroke-width="1" :style="{ strokeOpacity: 'var(--login-network-line-opacity)' }" />
      <line x1="450" y1="100" x2="480" y2="320" stroke="var(--color-primary)" stroke-width="1" :style="{ strokeOpacity: 'var(--login-network-line-opacity)' }" />
      <line x1="120" y1="350" x2="480" y2="320" stroke="var(--color-primary)" stroke-width="1" :style="{ strokeOpacity: 'var(--login-network-line-opacity)' }" />
      <line x1="120" y1="350" x2="180" y2="580" stroke="var(--color-primary)" stroke-width="1" :style="{ strokeOpacity: 'var(--login-network-line-opacity)' }" />
      <line x1="480" y1="320" x2="420" y2="620" stroke="var(--color-primary)" stroke-width="1" :style="{ strokeOpacity: 'var(--login-network-line-opacity)' }" />
      <line x1="180" y1="580" x2="420" y2="620" stroke="var(--color-primary)" stroke-width="1" :style="{ strokeOpacity: 'var(--login-network-line-opacity)' }" />
      <line x1="180" y1="120" x2="480" y2="320" stroke="var(--color-primary)" stroke-width="1" :style="{ strokeOpacity: 'var(--login-network-line-opacity)' }" />
      <line x1="450" y1="100" x2="120" y2="350" stroke="var(--color-primary)" stroke-width="1" :style="{ strokeOpacity: 'var(--login-network-line-opacity)' }" />
      <line x1="120" y1="350" x2="420" y2="620" stroke="var(--color-primary)" stroke-width="1" :style="{ strokeOpacity: 'var(--login-network-line-opacity)' }" />
      <line x1="480" y1="320" x2="180" y2="580" stroke="var(--color-primary)" stroke-width="1" :style="{ strokeOpacity: 'var(--login-network-line-opacity)' }" />

      <!-- Server rack abstraction -->
      <rect x="380" y="480" width="70" height="110" rx="10" stroke="var(--color-primary)" stroke-width="1.5" fill="var(--color-primary)" fill-opacity="0.02" :style="{ strokeOpacity: 'var(--login-server-stroke-opacity)' }" />
      <rect x="390" y="495" width="50" height="14" rx="4" stroke="var(--color-primary)" stroke-width="1" :style="{ strokeOpacity: 'var(--login-server-stroke-opacity)' }" />
      <rect x="390" y="515" width="50" height="14" rx="4" stroke="var(--color-primary)" stroke-width="1" :style="{ strokeOpacity: 'var(--login-server-stroke-opacity)' }" />
      <rect x="390" y="535" width="50" height="14" rx="4" stroke="var(--color-primary)" stroke-width="1" :style="{ strokeOpacity: 'var(--login-server-stroke-opacity)' }" />
      <rect x="390" y="555" width="50" height="14" rx="4" stroke="var(--color-primary)" stroke-width="1" :style="{ strokeOpacity: 'var(--login-server-stroke-opacity)' }" />
      <!-- Server LEDs -->
      <circle cx="430" cy="502" r="2.5" fill="var(--color-success)" :style="{ fillOpacity: 'var(--login-server-led-opacity)' }" />
      <circle cx="430" cy="522" r="2.5" fill="var(--color-success)" :style="{ fillOpacity: 'var(--login-server-led-opacity)' }" />
      <circle cx="430" cy="542" r="2.5" fill="var(--color-primary)" :style="{ fillOpacity: 'var(--login-server-led-opacity)' }" />
      <circle cx="430" cy="562" r="2.5" fill="var(--color-success)" :style="{ fillOpacity: 'var(--login-server-led-opacity)' }" />

      <!-- Monitor / device -->
      <rect x="60" y="480" width="80" height="60" rx="8" stroke="var(--color-primary)" stroke-width="1.5" fill="var(--color-primary)" fill-opacity="0.02" :style="{ strokeOpacity: 'var(--login-server-stroke-opacity)' }" />
      <rect x="72" y="490" width="56" height="35" rx="3" stroke="var(--color-primary)" stroke-width="1" :style="{ strokeOpacity: 'var(--login-server-stroke-opacity)' }" />
      <line x1="85" y1="540" x2="115" y2="540" stroke="var(--color-primary)" stroke-width="1.5" :style="{ strokeOpacity: 'var(--login-server-stroke-opacity)' }" />
      <line x1="100" y1="540" x2="100" y2="555" stroke="var(--color-primary)" stroke-width="1.5" :style="{ strokeOpacity: 'var(--login-server-stroke-opacity)' }" />
      <line x1="80" y1="555" x2="120" y2="555" stroke="var(--color-primary)" stroke-width="1.5" :style="{ strokeOpacity: 'var(--login-server-stroke-opacity)' }" />
    </svg>

    <!-- Visual Panel Heading -->
    <div class="absolute top-[8%] left-[20%] z-10 select-none">
      <h2 class="text-sm font-bold uppercase tracking-[0.4em] text-primary/20">
        IT Service Desk
      </h2>
    </div>

    <!-- Floating cards -->
    <div class="absolute inset-0 z-20 pointer-events-none">
      <FloatingCard
        :icon="Ticket"
        title="TK-1024"
        subtitle="Printer tidak dapat digunakan"
        badge="In Progress"
        badge-color="primary"
        delay="0s"
        class="absolute top-[10%] right-[5%] pointer-events-auto login-anim-fade"
        style="animation-delay: 0.3s"
      />
      <FloatingCard
        :icon="CheckCircle2"
        title="System Status"
        subtitle="All services operational"
        badge="Operational"
        badge-color="success"
        delay="1.5s"
        class="absolute top-[45%] right-[25%] pointer-events-auto login-anim-fade"
        style="animation-delay: 0.5s"
      />
      <FloatingCard
        :icon="Clock"
        title="Response Time"
        value="01:42:35"
        delay="3s"
        class="absolute top-[75%] right-[8%] pointer-events-auto login-anim-fade"
        style="animation-delay: 0.7s"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Ticket, CheckCircle2, Clock } from 'lucide-vue-next';
import FloatingCard from './FloatingCard.vue';
</script>
