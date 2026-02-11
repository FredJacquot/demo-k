import type { Message, Conversation, MessageContent, Source, Traceability, HRTransmissionSuggestion } from "@/types/conversation";
import type { Attachment } from "@/types/request";
import type { User } from "@/contexts/user-context";
import { generateConversationId } from "./conversations-storage";

/**
 * Interface pour les scénarios de conversation mockés
 */
interface ScenarioMessage {
  type: string;
  confidence?: number;
  sources?: Source[];
  content: string | MessageContent;
  traceability?: Traceability;
  suggestsHumanReview?: boolean;
  suggestHRTransmission?: HRTransmissionSuggestion;
}

interface ConversationScenario {
  title: string;
  subtitle: string;
  messages: ScenarioMessage[];
}

interface Scenario {
  id: string;
  keywords: string[];
  category: string;
  conversation: ConversationScenario;
}

interface ScenarioData {
  scenarios: Scenario[];
  defaultScenarioId: string;
}

// Cache pour les scénarios chargés
let scenariosCache: ScenarioData | null = null;

// Map pour suivre quel scénario est utilisé par conversation
const conversationScenarios = new Map<string, { scenarioId: string; messageIndex: number }>();

/**
 * Charge les scénarios de conversation depuis le JSON
 */
async function loadScenarios(): Promise<ScenarioData> {
  if (scenariosCache) {
    return scenariosCache;
  }
  
  try {
    const response = await fetch('/data/mock-conversation-scenarios.json');
    if (!response.ok) {
      throw new Error('Failed to load scenarios');
    }
    scenariosCache = await response.json();
    return scenariosCache!;
  } catch (error) {
    console.error('Error loading conversation scenarios:', error);
    // Retourner un scénario par défaut en cas d'erreur
    return {
      scenarios: [],
      defaultScenarioId: 'scenario-default'
    };
  }
}

/**
 * Normalise un texte pour la recherche (minuscules, sans accents)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Calcule le score de matching entre un message et les mots-clés d'un scénario
 */
function calculateKeywordMatch(userMessage: string, keywords: string[]): number {
  const normalizedMessage = normalizeText(userMessage);
  let matchCount = 0;
  
  for (const keyword of keywords) {
    const normalizedKeyword = normalizeText(keyword);
    if (normalizedMessage.includes(normalizedKeyword)) {
      matchCount++;
    }
  }
  
  return keywords.length > 0 ? matchCount / keywords.length : 0;
}

/**
 * Trouve le meilleur scénario correspondant au message de l'utilisateur
 */
export async function matchScenario(userMessage: string): Promise<Scenario> {
  const scenarioData = await loadScenarios();
  
  let bestScenario: Scenario | null = null;
  let bestScore = 0;
  
  for (const scenario of scenarioData.scenarios) {
    // Ignorer le scénario par défaut dans le matching
    if (scenario.id === scenarioData.defaultScenarioId) {
      continue;
    }
    
    const score = calculateKeywordMatch(userMessage, scenario.keywords);
    
    if (score > bestScore) {
      bestScore = score;
      bestScenario = scenario;
    }
  }
  
  // Si aucun match suffisant (moins de 20% des mots-clés), utiliser le scénario par défaut
  if (bestScore < 0.2 || !bestScenario) {
    const defaultScenario = scenarioData.scenarios.find(
      s => s.id === scenarioData.defaultScenarioId
    );
    return defaultScenario || scenarioData.scenarios[0];
  }
  
  return bestScenario;
}

/**
 * Convertit un message de scénario en Message avec les champs dynamiques
 */
function scenarioMessageToMessage(
  scenarioMessage: ScenarioMessage,
  messageId: string
): Message {
  const timestamp = new Date().toISOString();
  
  return {
    id: messageId,
    type: scenarioMessage.type as Message['type'],
    author: "kalia",
    timestamp,
    confidence: scenarioMessage.confidence,
    sources: scenarioMessage.sources,
    content: scenarioMessage.content,
    traceability: scenarioMessage.traceability ? {
      ...scenarioMessage.traceability,
      validatedAt: timestamp
    } : undefined,
    suggestsHumanReview: scenarioMessage.suggestsHumanReview,
    suggestHRTransmission: scenarioMessage.suggestHRTransmission,
    actions: {
      useful: false,
      needsImprovement: false,
      validated: false,
      requestCreated: false
    }
  };
}

/**
 * Crée une conversation initiale avec un message utilisateur et une réponse Kalia mockée
 */
export async function createMockConversation(
  initialMessage: string,
  currentUser: User,
  attachments?: Attachment[]
): Promise<Conversation> {
  const conversationId = generateConversationId();
  
  const userMessage: Message = {
    id: "msg-1",
    type: "question",
    content: initialMessage,
    timestamp: new Date().toISOString(),
    author: "user",
    attachments: attachments
  };
  
  // Trouver le scénario correspondant
  const scenario = await matchScenario(initialMessage);
  
  // Stocker le scénario utilisé pour cette conversation
  conversationScenarios.set(conversationId, {
    scenarioId: scenario.id,
    messageIndex: 0
  });
  
  // Générer la première réponse depuis le scénario
  const kaliaResponse = scenarioMessageToMessage(
    scenario.conversation.messages[0],
    "msg-2"
  );
  
  return {
    id: conversationId,
    userId: currentUser.id,
    title: scenario.conversation.title,
    subtitle: scenario.conversation.subtitle,
    messages: [userMessage, kaliaResponse],
    category: scenario.category,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Génère des réponses Kalia supplémentaires basées sur le contexte et le scénario
 */
export async function generateKaliaResponse(
  userMessage: string,
  conversationContext: Message[],
  conversationId?: string
): Promise<Message[]> {
  // Essayer de récupérer le scénario de la conversation
  let scenario: Scenario | null = null;
  let messageIndex = 0;
  
  if (conversationId && conversationScenarios.has(conversationId)) {
    const scenarioInfo = conversationScenarios.get(conversationId)!;
    const scenarioData = await loadScenarios();
    scenario = scenarioData.scenarios.find(s => s.id === scenarioInfo.scenarioId) || null;
    messageIndex = scenarioInfo.messageIndex + 1;
  }
  
  // Si pas de scénario ou si on a atteint la fin du scénario, chercher un nouveau scénario
  if (!scenario || messageIndex >= scenario.conversation.messages.length) {
    scenario = await matchScenario(userMessage);
    messageIndex = 0;
  }
  
  // Mettre à jour l'index du scénario
  if (conversationId) {
    conversationScenarios.set(conversationId, {
      scenarioId: scenario.id,
      messageIndex
    });
  }
  
  // Générer les messages depuis le scénario
  const messages: Message[] = [];
  const baseId = Date.now();
  
  // Prendre le message suivant du scénario s'il existe
  if (messageIndex < scenario.conversation.messages.length) {
    const scenarioMessage = scenario.conversation.messages[messageIndex];
    messages.push(scenarioMessageToMessage(scenarioMessage, `msg-${baseId}`));
    
    // Si le message suivant existe et c'est un requestPrompt, l'ajouter aussi
    if (messageIndex + 1 < scenario.conversation.messages.length) {
      const nextMessage = scenario.conversation.messages[messageIndex + 1];
      if (nextMessage.type === 'requestPrompt') {
        messages.push(scenarioMessageToMessage(nextMessage, `msg-${baseId + 1}`));
        
        // Mettre à jour l'index
        if (conversationId) {
          conversationScenarios.set(conversationId, {
            scenarioId: scenario.id,
            messageIndex: messageIndex + 1
          });
        }
      }
    }
  }
  
  return messages;
}

/**
 * Extrait un titre concis du message
 */
function extractTitle(message: string): string {
  const words = message.split(' ').slice(0, 8).join(' ');
  return words.length < message.length ? words + '...' : words;
}
