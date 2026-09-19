# IT Ticketing & Work Monitoring System

Sistem informasi tiket dan monitoring pekerjaan IT — mencakup pembuatan tiket, pelacakan progres, pencatatan kerja harian, dan laporan ekspor.

## Tech Stack

| Technology | Version |
|------------|---------|
| Nuxt | 4.5.2 |
| Vue | 3.5 |
| Tailwind CSS | - |
| Pinia | State management |
| TypeScript | - |
| Lucide Vue Next | Icons |

## Fitur Utama

- **Ticket Management** — Buat, lacak, dan kelola tiket IT dengan stepper progres
- **Kanban Board** — Drag & drop antar status (DRAFT → PROCESS → SELESAI → DELEGASI)
- **Worklog & Daily Work** — Pencatatan aktivitas harian dengan timeline dan KPI
- **Laporan & Export** — Rekapitulasi tiket, log pekerjaan, ringkasan per teknisi (Excel & PDF)
- **Admin Master Data** — Kelola kategori, subkategori, prioritas, dan user
- **Buat Tiket Atas Nama** — SYSTEM_ADMIN bisa membuat tiket atas nama user lain
- **Mobile-First Responsive** — Desain optimal untuk mobile dan desktop
- **Dark/Light Mode** — Toggle tema gelap/terang

## Roles

| Role | Deskripsi |
|------|-----------|
| `USER_NON_IT` | Karyawan pelapor — buat tiket, lacak progres |
| `IT_WORKER` | Teknisi IT — kerjakan tiket, catat worklog |
| `SYSTEM_ADMIN` | Admin — akses penuh + buat tiket atas nama user lain |

## Project Structure

```
├── components/
│   ├── common/          # AppSelect, ToastContainer
│   ├── dashboard/       # ITDashboard, DailyWorkView, MyWorkView
│   ├── global/          # Navbar, Sidebar
│   └── views/           # CreateTicketView, TicketDetailView, TrackingView, ReportsView, AdminMasterView
├── composables/         # useToast
├── layouts/             # default, dashboard, flat
├── pages/               # index (single-page app)
├── public/              # Static assets
├── services/            # StorageService (localStorage)
├── stores/              # Pinia store (app.ts)
├── types/               # TypeScript interfaces
├── utils/               # mockData, export helpers, ticketHelpers
├── PRD.md               # Product Requirement Document
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Buka http://localhost:3000

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## Kategori Tiket

| Kategori | Subkategori |
|----------|-------------|
| Support IT | Printer, Jaringan/WiFi, Akun/Email, Hardware Laptop/PC, Hardware Server, Internet/Proxy, Backup Data, Security/SIEM, VPN/Remote Access, Telepon/VoIP, CCTV, Scanner/Peripheral |
| IT Programmer | Development Sistem Baru, Maintenance ERP Web, Bug Fix Aplikasi, Integrasi API, Reporting/BI, Mobile App, Database Optimization, Security Patching, Deployment/DevOps, UI/UX Improvement, Fitur Enhancment, Sistem Ticketing Internal |

## Status Tiket

```
DRAFT → PROCESS → SELESAI
                    └─→ DELEGASI (opsional)
```

## License

Proprietary — Internal Use Only
