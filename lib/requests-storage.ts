import type { Request } from "@/types/conversation";
import { getConversationById, saveConversation } from "./conversations-storage";

const REQUESTS_KEY = "requests";

/**
 * Déclenche un événement personnalisé pour notifier les changements de demandes
 */
function dispatchRequestsUpdatedEvent() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("requestsUpdated"));
  }
}

/**
 * Récupère toutes les demandes du localStorage
 */
export function getRequests(): Request[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(REQUESTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading requests from localStorage:", error);
    return [];
  }
}

/**
 * Sauvegarde une demande dans le localStorage
 */
export function saveRequest(request: Request): void {
  if (typeof window === "undefined") return;
  
  try {
    const requests = getRequests();
    const existingIndex = requests.findIndex(r => r.id === request.id);
    
    if (existingIndex >= 0) {
      // Mettre à jour la demande existante
      requests[existingIndex] = request;
    } else {
      // Ajouter une nouvelle demande
      requests.push(request);
    }
    
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
    
    // Notifier les composants des changements
    dispatchRequestsUpdatedEvent();
  } catch (error) {
    console.error("Error saving request to localStorage:", error);
    throw error;
  }
}

/**
 * Met à jour une demande existante
 */
export function updateRequest(id: string, updates: Partial<Request>): void {
  if (typeof window === "undefined") return;
  
  try {
    const requests = getRequests();
    const index = requests.findIndex(r => r.id === id);
    
    if (index >= 0) {
      requests[index] = { ...requests[index], ...updates };
      localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
      
      // Notifier les composants des changements
      dispatchRequestsUpdatedEvent();
    }
  } catch (error) {
    console.error("Error updating request in localStorage:", error);
    throw error;
  }
}

/**
 * Récupère une demande par son ID
 */
export function getRequestById(id: string): Request | null {
  const requests = getRequests();
  return requests.find(r => r.id === id) || null;
}

/**
 * Génère un ID unique pour une nouvelle demande basé sur timestamp
 * Format: REQ-YYYYMMDD-HHMMSS
 */
export function generateRequestId(): string {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  
  return `REQ-${yyyy}${mm}${dd}-${hh}${min}${ss}`;
}

/**
 * Met à jour une demande et synchronise la conversation associée
 */
export function updateRequestAndSyncConversation(id: string, updates: Partial<Request>): void {
  if (typeof window === "undefined") return;
  
  try {
    // 1. Mettre à jour la requête
    updateRequest(id, updates);
    
    // 2. Récupérer la requête mise à jour
    const updatedRequest = getRequestById(id);
    if (!updatedRequest) {
      console.warn(`Request ${id} not found after update`);
      return;
    }
    
    // 3. Si la requête a une conversation associée, mettre à jour la conversation
    if (updatedRequest.conversationId) {
      const conversation = getConversationById(updatedRequest.conversationId);
      if (conversation) {
        // Mettre à jour le champ request dans la conversation
        const updatedConversation = {
          ...conversation,
          request: updatedRequest,
          updatedAt: new Date().toISOString()
        };
        
        // Sauvegarder la conversation mise à jour
        saveConversation(updatedConversation);
        
        console.log(`Conversation ${updatedRequest.conversationId} synchronized with request ${id}`);
      } else {
        console.warn(`Conversation ${updatedRequest.conversationId} not found for request ${id}`);
      }
    }
  } catch (error) {
    console.error("Error updating request and syncing conversation:", error);
    throw error;
  }
}

/**
 * Supprime une demande du localStorage
 */
export function deleteRequest(id: string): void {
  if (typeof window === "undefined") return;
  
  try {
    const requests = getRequests();
    const filtered = requests.filter(r => r.id !== id);
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(filtered));
    
    // Notifier les composants des changements
    dispatchRequestsUpdatedEvent();
  } catch (error) {
    console.error("Error deleting request from localStorage:", error);
    throw error;
  }
}
