// Peran dan klaim dinamis (DB, diatur SYSTEM_ADMIN); lihat utils/permissions.ts.
// PM & DUTY_ENGINEER termasuk tim IT lewat klaim it.access.
import { CLAIM, roleHas, rolesWith } from './permissions';

export const isITRole = (role?: string | null, dutyActive = false) => roleHas(role, CLAIM.IT, dutyActive);
export const canTriageRole = (role?: string | null, dutyActive = false) => roleHas(role, CLAIM.TRIAGE, dutyActive);
export const isDutyRole = (role?: string | null, dutyActive = false) => roleHas(role, CLAIM.DUTY, dutyActive);
// Boleh memilih Kanal Asal dan "Buat atas nama" saat membuat tiket.
export const isIntakeRole = (role?: string | null, dutyActive = false) => roleHas(role, CLAIM.INTAKE, dutyActive);
// Peran bertanda it.access (untuk query daftar worker).
export const itRoles = () => rolesWith(CLAIM.IT);
