// Ticket lifecycle rules
// Valid transitions based on frontend behavior

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PROCESS'],
  PROCESS: ['DRAFT', 'IN_PROGRESS', 'SELESAI', 'DELEGASI'],
  IN_PROGRESS: ['SELESAI', 'DELEGASI'],
  DELEGASI: ['PROCESS'],
  SELESAI: ['PROCESS'],
};

export function isValidTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getTargetStatus(stageKey: string): string {
  const map: Record<string, string> = {
    REQUEST: 'DRAFT',
    ASSIGN: 'PROCESS',
    IN_PROGRESS: 'SELESAI',
    COMPLETION: 'SELESAI',
    DELEGATION: 'DELEGASI',
  };
  return map[stageKey] || 'SELESAI';
}

// Fields that can be edited by the user directly
export const EDITABLE_TICKET_FIELDS = [
  'title', 'description', 'category', 'subcategory', 'location', 'priority',
];

// Fields that can only be changed via domain actions
export const WORKFLOW_CONTROLLED_FIELDS = [
  'status', 'assignedTo', 'assignedToName', 'completedAt',
  'delegationType', 'vendorId', 'vendorName', 'technicianId', 'technicianName',
  'referenceNo', 'delegationNotes', 'delegatedAt', 'returnedAt', 'returnedNotes',
  'issuedAt', 'processStartedAt', 'resolutionSummary', 'confirmedByUser',
];
