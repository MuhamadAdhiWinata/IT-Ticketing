// Peran dipakai server dan UI. PM & DUTY_ENGINEER termasuk tim IT.
export const IT_ROLES: string[] = ['IT_WORKER', 'SYSTEM_ADMIN', 'PM', 'DUTY_ENGINEER'];
export const TRIAGE_ROLES: string[] = ['PM', 'SYSTEM_ADMIN'];
export const DUTY_ROLES: string[] = ['DUTY_ENGINEER', 'SYSTEM_ADMIN'];
// Boleh memilih Kanal Asal dan "Buat atas nama" saat membuat tiket.
export const INTAKE_ROLES: string[] = ['PM', 'DUTY_ENGINEER', 'SYSTEM_ADMIN'];

export const isITRole = (role?: string | null) => !!role && IT_ROLES.includes(role);
export const canTriageRole = (role?: string | null) => !!role && TRIAGE_ROLES.includes(role);
export const isDutyRole = (role?: string | null) => !!role && DUTY_ROLES.includes(role);
export const isIntakeRole = (role?: string | null) => !!role && INTAKE_ROLES.includes(role);
