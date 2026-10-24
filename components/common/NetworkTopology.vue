<template>
  <svg
    class="absolute inset-0 w-full h-full"
    pointer-events="none"
    aria-hidden="true"
    preserveAspectRatio="xMidYMid slice"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1200 400"
  >
    <!-- Desktop group (6 nodes, 8 lines, server, monitor) -->
    <g>
      <!-- Node 1: upper-right anchor -->
      <circle cx="920" cy="60" r="35" stroke="var(--color-primary)" :stroke-opacity="'var(--tracking-network-stroke)'" stroke-width="1.5" fill="var(--color-primary)" :fill-opacity="'var(--tracking-network-fill)'" class="tracking-node-pulse" />
      <circle cx="920" cy="60" r="8" fill="var(--color-primary)" :fill-opacity="'var(--tracking-network-core)'" class="tracking-node-pulse" />

      <!-- Node 2: right-center -->
      <circle cx="1060" cy="180" r="28" stroke="var(--color-primary)" :stroke-opacity="'var(--tracking-network-stroke)'" stroke-width="1.5" fill="var(--color-primary)" :fill-opacity="'var(--tracking-network-fill)'" />
      <circle cx="1060" cy="180" r="7" fill="var(--color-primary)" :fill-opacity="'var(--tracking-network-core)'" />

      <!-- Node 3: lower-right -->
      <circle cx="830" cy="310" r="32" stroke="var(--color-primary)" :stroke-opacity="'var(--tracking-network-stroke)'" stroke-width="1.5" fill="var(--color-primary)" :fill-opacity="'var(--tracking-network-fill)'" class="tracking-node-pulse" />
      <circle cx="830" cy="310" r="7" fill="var(--color-primary)" :fill-opacity="'var(--tracking-network-core)'" class="tracking-node-pulse" />

      <!-- Node 4: lower-right corner -->
      <circle cx="1100" cy="370" r="22" stroke="var(--color-primary)" :stroke-opacity="'var(--tracking-network-stroke)'" stroke-width="1.5" fill="var(--color-primary)" :fill-opacity="'var(--tracking-network-fill)'" />
      <circle cx="1100" cy="370" r="5" fill="var(--color-primary)" :fill-opacity="'var(--tracking-network-core)'" />

      <!-- Node 5: upper-left (subtle) -->
      <circle cx="120" cy="60" r="20" stroke="var(--color-primary)" :stroke-opacity="'var(--tracking-network-stroke)'" stroke-width="1.5" fill="var(--color-primary)" :fill-opacity="'var(--tracking-network-fill)'" />
      <circle cx="120" cy="60" r="5" fill="var(--color-primary)" :fill-opacity="'var(--tracking-network-core)'" />

      <!-- Connection lines (desktop) -->
      <line x1="920" y1="60" x2="1060" y2="180" stroke="var(--color-primary)" :stroke-opacity="'var(--tracking-network-line)'" stroke-width="1" />
      <line x1="920" y1="60" x2="830" y2="310" stroke="var(--color-primary)" :stroke-opacity="'var(--tracking-network-line)'" stroke-width="1" />
      <line x1="1060" y1="180" x2="830" y2="310" stroke="var(--color-primary)" :stroke-opacity="'var(--tracking-network-line)'" stroke-width="1" />
      <line x1="1060" y1="180" x2="1100" y2="370" stroke="var(--color-primary)" :stroke-opacity="'var(--tracking-network-line)'" stroke-width="1" />
      <line x1="830" y1="310" x2="1100" y2="370" stroke="var(--color-primary)" :stroke-opacity="'var(--tracking-network-line)'" stroke-width="1" />
      <line x1="920" y1="60" x2="120" y2="60" stroke="var(--color-primary)" :stroke-opacity="'var(--tracking-network-line)'" stroke-width="1" />

      <!-- Lines connecting to icon positions (desktop only) -->
      <g class="hidden md:block">
        <line x1="920" y1="60" x2="950" y2="30" stroke="var(--color-primary)" :stroke-opacity="'var(--tracking-network-line)'" stroke-width="1" />
        <line x1="1060" y1="180" x2="1050" y2="120" stroke="var(--color-primary)" :stroke-opacity="'var(--tracking-network-line)'" stroke-width="1" />
        <line x1="830" y1="310" x2="980" y2="350" stroke="var(--color-primary)" :stroke-opacity="'var(--tracking-network-line)'" stroke-width="1" />
      </g>

      <!-- Node 6 + its lines (desktop only) -->
      <g class="hidden md:block">
        <circle cx="800" cy="380" r="18" stroke="var(--color-primary)" :stroke-opacity="'var(--tracking-network-stroke)'" stroke-width="1.5" fill="var(--color-primary)" :fill-opacity="'var(--tracking-network-fill)'" />
        <circle cx="800" cy="380" r="5" fill="var(--color-primary)" :fill-opacity="'var(--tracking-network-core)'" />
        <line x1="830" y1="310" x2="800" y2="380" stroke="var(--color-primary)" :stroke-opacity="'var(--tracking-network-line)'" stroke-width="1" />
        <line x1="120" y1="60" x2="800" y2="380" stroke="var(--color-primary)" :stroke-opacity="'var(--tracking-network-line)'" stroke-width="1" />
      </g>

      <!-- Server rack (desktop only) -->
      <g class="hidden md:block">
        <rect x="1020" y="240" width="55" height="85" rx="8" stroke="var(--color-primary)" :stroke-opacity="'var(--tracking-network-stroke)'" stroke-width="1.5" fill="var(--color-primary)" :fill-opacity="'var(--tracking-network-fill)'" />
        <rect x="1028" y="252" width="39" height="12" rx="3" stroke="var(--color-primary)" :stroke-opacity="'var(--tracking-network-line)'" stroke-width="1" />
        <rect x="1028" y="270" width="39" height="12" rx="3" stroke="var(--color-primary)" :stroke-opacity="'var(--tracking-network-line)'" stroke-width="1" />
        <rect x="1028" y="288" width="39" height="12" rx="3" stroke="var(--color-primary)" :stroke-opacity="'var(--tracking-network-line)'" stroke-width="1" />
        <rect x="1028" y="306" width="39" height="12" rx="3" stroke="var(--color-primary)" :stroke-opacity="'var(--tracking-network-line)'" stroke-width="1" />
        <circle cx="1060" cy="258" r="2" fill="var(--color-primary)" :fill-opacity="'var(--tracking-network-led)'" />
        <circle cx="1060" cy="276" r="2" fill="var(--color-primary)" :fill-opacity="'var(--tracking-network-led)'" />
        <circle cx="1060" cy="294" r="2" fill="var(--color-primary)" :fill-opacity="'var(--tracking-network-led)'" />
      </g>

      <!-- Monitor (desktop only) -->
      <g class="hidden md:block">
        <rect x="860" y="310" width="55" height="40" rx="5" stroke="var(--color-primary)" :stroke-opacity="'var(--tracking-network-stroke)'" stroke-width="1.5" fill="var(--color-primary)" :fill-opacity="'var(--tracking-network-fill)'" />
        <rect x="868" y="318" width="39" height="22" rx="2" stroke="var(--color-primary)" :stroke-opacity="'var(--tracking-network-line)'" stroke-width="1" />
        <line x1="880" y1="350" x2="895" y2="350" stroke="var(--color-primary)" :stroke-opacity="'var(--tracking-network-line)'" stroke-width="1.5" />
        <line x1="887" y1="350" x2="887" y2="360" stroke="var(--color-primary)" :stroke-opacity="'var(--tracking-network-line)'" stroke-width="1.5" />
        <line x1="875" y1="360" x2="900" y2="360" stroke="var(--color-primary)" :stroke-opacity="'var(--tracking-network-line)'" stroke-width="1.5" />
      </g>
    </g>

    <!-- Mobile group (4 nodes, 4 lines) -->
    <g class="md:hidden">
      <!-- Node M1: upper-right -->
      <circle cx="920" cy="80" r="12" stroke="var(--color-primary)" :stroke-opacity="'var(--tracking-network-stroke)'" stroke-width="1" fill="var(--color-primary)" :fill-opacity="'var(--tracking-network-fill)'" />
      <circle cx="920" cy="80" r="4" fill="var(--color-primary)" :fill-opacity="'var(--tracking-network-core)'" />

      <!-- Node M2: right-center -->
      <circle cx="1060" cy="200" r="12" stroke="var(--color-primary)" :stroke-opacity="'var(--tracking-network-stroke)'" stroke-width="1" fill="var(--color-primary)" :fill-opacity="'var(--tracking-network-fill)'" />
      <circle cx="1060" cy="200" r="4" fill="var(--color-primary)" :fill-opacity="'var(--tracking-network-core)'" />

      <!-- Node M3: lower-right -->
      <circle cx="850" cy="330" r="12" stroke="var(--color-primary)" :stroke-opacity="'var(--tracking-network-stroke)'" stroke-width="1" fill="var(--color-primary)" :fill-opacity="'var(--tracking-network-fill)'" />
      <circle cx="850" cy="330" r="4" fill="var(--color-primary)" :fill-opacity="'var(--tracking-network-core)'" />

      <!-- Node M4: lower-right corner -->
      <circle cx="1100" cy="380" r="10" stroke="var(--color-primary)" :stroke-opacity="'var(--tracking-network-line)'" stroke-width="1" fill="var(--color-primary)" :fill-opacity="'var(--tracking-network-fill)'" />
      <circle cx="1100" cy="380" r="3" fill="var(--color-primary)" :fill-opacity="'var(--tracking-network-core)'" />

      <!-- Connection lines (mobile) -->
      <line x1="920" y1="80" x2="1060" y2="200" stroke="var(--color-primary)" :stroke-opacity="'var(--tracking-network-line)'" stroke-width="1" />
      <line x1="1060" y1="200" x2="850" y2="330" stroke="var(--color-primary)" :stroke-opacity="'var(--tracking-network-line)'" stroke-width="1" />
      <line x1="1060" y1="200" x2="1100" y2="380" stroke="var(--color-primary)" :stroke-opacity="'var(--tracking-network-line)'" stroke-width="1" />
      <line x1="850" y1="330" x2="1100" y2="380" stroke="var(--color-primary)" :stroke-opacity="'var(--tracking-network-line)'" stroke-width="1" />
    </g>
  </svg>
</template>
