// Types for HR requests

export type RequestType = 
  | 'contrat' 
  | 'paie' 
  | 'conges' 
  | 'formation' 
  | 'avantages'
  | 'autre' 
  | 'hr_confirmation';

export type RequestStatus = 'pending' | 'in_progress' | 'resolved' | 'rejected';

export type RequestPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface Attachment {
  id: string;
  name: string;
  originalName?: string;
  size: number;
  type: string;
  url: string;
}

export interface HRConfirmationData {
  originalMessageId: string;
  kaliaResponse: string | object;
  kaliaConfidence: number;
  questionAsked: string;
}

export interface Request {
  id: string;
  conversationId: string | null;
  userId: string;
  userName: string;
  createdAt: string;
  status: RequestStatus;
  priority: RequestPriority;
  category: RequestType;
  title: string;
  reformulatedRequest: string;
  includeFullConversation: boolean;
  userComment: string;
  assignedTo: string | null;
  response: string | null;
  resolvedAt: string | null;
  hrConfirmationData?: HRConfirmationData;
  attachments?: Attachment[];
}

export interface RequestsData {
  requests: Request[];
}
