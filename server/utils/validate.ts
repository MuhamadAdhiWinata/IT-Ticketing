import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export const CreateTicketSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  category: z.enum(['Support IT', 'IT Programmer']),
  aplikasiProject: z.string().min(1),
  submodule: z.string().max(500).nullable().optional(),
  location: z.string().max(500).nullable().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  shouldIssue: z.boolean().optional(),
  behalfUserId: z.string().nullable().optional(),
  requestedByName: z.string().optional(),
  requestedByDept: z.string().optional(),
  attachmentCount: z.number().optional(),
}).superRefine((data, ctx) => {
  if (data.category === 'Support IT' && (!data.location || data.location.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Lokasi wajib diisi',
      path: ['location'],
    });
  }
});

export const UpdateTicketSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  category: z.enum(['Support IT', 'IT Programmer']).optional(),
  aplikasiProject: z.string().optional(),
  submodule: z.string().max(500).nullable().optional(),
  location: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
});

export const StatusUpdateSchema = z.object({
  status: z.enum(['DRAFT', 'PROCESS', 'DELEGASI', 'SELESAI']),
});

export const AssigneeSchema = z.object({
  userId: z.string().min(1),
  userName: z.string().optional(),
});

export const CompleteStageSchema = z.object({
  stageKey: z.enum(['START_WORK', 'IN_PROGRESS', 'COMPLETION', 'DELEGATION']),
  notes: z.string().optional(),
  targetStatus: z.enum(['DRAFT', 'PROCESS', 'DELEGASI', 'SELESAI']).optional(),
  attachment: z.object({
    file_name: z.string().optional(),
    file_size: z.string().optional(),
    stage: z.string().optional(),
    visibility: z.string().optional(),
  }).optional(),
  delegation: z.object({
    type: z.enum(['DELEGASI_VENDOR', 'DELEGASI_TEKNISI']),
    vendor_id: z.string().optional(),
    vendor_name: z.string().optional(),
    technician_id: z.string().optional(),
    technician_name: z.string().optional(),
    reference_no: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
});

export const WorklogSchema = z.object({
  stageKey: z.string().min(1),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  attachment: z.object({
    file_name: z.string(),
    file_size: z.string(),
    stage: z.string(),
    visibility: z.string(),
  }).optional(),
});

export const CustomWorklogSchema = z.object({
  date: z.string().min(1),
  start_at: z.string().min(1),
  finish_at: z.string().min(1),
  duration_minutes: z.number().min(0),
  description: z.string().min(1),
  stageKey: z.string().min(1),
  worker_id: z.string().optional(),
  worker_name: z.string().optional(),
});

export const CommentSchema = z.object({
  message: z.string().trim().min(1, 'Pesan wajib diisi').max(2000, 'Pesan maksimal 2000 karakter'),
});

export const NoteSchema = z.object({
  note: z.string().trim().min(1, 'Catatan wajib diisi').max(2000, 'Catatan maksimal 2000 karakter'),
});

export const PreferencesSchema = z.object({
  darkMode: z.boolean(),
});

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errorMsg = result.error.message;
  return { success: false, error: errorMsg };
}
