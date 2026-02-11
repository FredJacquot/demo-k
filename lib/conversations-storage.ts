import type { Conversation } from "@/types/conversation";

const STORAGE_KEY = "conversations";

/**
 * Get all conversations from localStorage
 */
export function getConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading conversations from localStorage:", error);
    return [];
  }
}

/**
 * Save a conversation to localStorage
 */
export function saveConversation(conversation: Conversation): void {
  if (typeof window === "undefined") return;
  
  try {
    const conversations = getConversations();
    const existingIndex = conversations.findIndex(c => c.id === conversation.id);
    
    if (existingIndex >= 0) {
      // Update existing conversation
      conversations[existingIndex] = conversation;
    } else {
      // Add new conversation
      conversations.push(conversation);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error("Error saving conversation to localStorage:", error);
    throw error;
  }
}

/**
 * Get a single conversation by ID
 */
export function getConversationById(id: string): Conversation | null {
  const conversations = getConversations();
  return conversations.find(c => c.id === id) || null;
}

/**
 * Generate a unique conversation ID based on timestamp
 * Format: conv-YYYYMMDD-HHMMSS
 */
export function generateConversationId(): string {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  
  return `conv-${yyyy}${mm}${dd}-${hh}${min}${ss}`;
}

/**
 * Delete a conversation from localStorage
 */
export function deleteConversation(id: string): void {
  if (typeof window === "undefined") return;
  
  try {
    const conversations = getConversations();
    const filtered = conversations.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting conversation from localStorage:", error);
    throw error;
  }
}
