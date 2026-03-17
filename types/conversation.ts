// Types for conversation messages and structure

import type { RequestType, RequestStatus as RequestStatusType, RequestPriority, Attachment } from "./request";

export type ConfirmationStatus = 'none' | 'requested' | 'confirmed' | 'corrected';
export type MessageAuthor = "user" | "kalia" | "hr";
export type SourceType = "procedure" | "convention" | "loi" | "accord";
export type SectionType = "steps" | "warning" | "info";
export type RequestStatus = "pending" | "resolved" | "in_progress";
export type Priority = "low" | "medium" | "high" | "urgent";
export type HRAction = "createRequest" | "dismiss" | "request_hr_confirmation";
export type TraceabilityStatus = "valid" | "outdated" | "pending";

export interface HRConfirmation {
  confirmedBy: string;
  confirmedByName: string;
  confirmedAt: string;
  comment?: string;
  correctedContent?: string | MessageContent;
}

export interface Source {
  name: string;
  type: SourceType;
  color: string;
}

export interface StepItem {
  number: number;
  text: string;
  reference: string;
}

export interface Section {
  title: string;
  type: SectionType;
  items?: StepItem[];
  content?: string;
}

export interface MessageContent {
  intro: string;
  sections: Section[];
}

export interface TraceabilitySource {
  id: string;
  name: string;
  article: string;
  title: string;
  verifiedDate: string;
  status: TraceabilityStatus; // ← Changement
}

export interface Traceability {
  sources: TraceabilitySource[];
  context: string;
  validatedBy: string;
  validatedAt: string;
}

export interface TransmissionDetails {
  requestId: string;
  category: string;
  priority: Priority; // ← Changement
  summary: string;
  status: RequestStatus; // ← Changement
}

export interface HRTransmissionSuggestion {
  prompt: string;
  actions: {
    primary: {
      label: string;
      action: HRAction; // ← Changement
    };
    secondary: {
      label: string;
      action: HRAction; // ← Changement
    };
  };
}

export interface MessageActions {
  useful: boolean;
  needsImprovement: boolean;
  validated: boolean;
  requestCreated: boolean;
  requestId?: string;
  requestStatus?: RequestStatus; // ← Changement
  primary?: {
    label: string;
    action: string;
  };
  secondary?: {
    label: string;
    action: string;
  };
}

export interface Message {
  id: string;
  type: "question" | "answer" | "transmission" | "requestPrompt" | "hrConfirmation";
  content: string | MessageContent;
  timestamp: string;
  author: MessageAuthor;
  sources?: Source[];
  confidence?: number;
  traceability?: Traceability;
  suggestsHumanReview?: boolean;
  actions?: MessageActions;
  transmissionDetails?: TransmissionDetails;
  suggestHRTransmission?: HRTransmissionSuggestion;
  actionTaken?: "primary" | "secondary";
  confirmationStatus?: ConfirmationStatus;
  hrConfirmation?: HRConfirmation;
  hasNewUpdate?: boolean;
  attachments?: Attachment[];
}

export interface Request {
  id: string;
  conversationId: string | null;
  userId: string;
  userName: string;
  createdAt: string;
  status: RequestStatusType;
  priority: RequestPriority;
  category: RequestType;
  title: string;
  reformulatedRequest: string;
  includeFullConversation: boolean;
  userComment: string;
  assignedTo: string | null;
  assignedToName?: string;
  response: string | null;
  resolvedAt: string | null;
  hrConfirmationData?: {
    originalMessageId: string;
    kaliaResponse: string | object;
    kaliaConfidence: number;
    questionAsked: string;
  };
  attachments?: Attachment[];
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  subtitle: string;
  messages: Message[];
  request?: Request;
  /** Optional: when a request is created/linked to this conversation (e.g. via a transmission). */
  hasLinkedRequest?: string;
  category?: string;
  tags?: string[];
  complexity?: 'low' | 'medium' | 'high';
  createdAt?: string;
  updatedAt?: string;
}
