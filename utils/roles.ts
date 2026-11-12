// Peran dan klaim dinamis (DB, diatur SYSTEM_ADMIN); lihat utils/permissions.ts.
// PM & DUTY_ENGINEER termasuk tim IT lewat klaim it.access.
import { CLAIM, roleHas, rolesWith } from './permissions';

export const isITRole = (role?: string | null) => roleHas(role, CLAIM.IT);
export const canTriageRole = (role?: string | null) => roleHas(role, CLAIM.TRIAGE);
export const isDutyRole = (role?: string | null) => roleHas(role, CLAIM.DUTY);
// Boleh memilih Kanal Asal dan "Buat atas nama" saat membuat tiket.
export const isIntakeRole = (role?: string | null) => roleHas(role, CLAIM.INTAKE);
// Peran bertanda it.access (untuk query daftar worker).
export const itRoles = () => rolesWith(CLAIM.IT);
