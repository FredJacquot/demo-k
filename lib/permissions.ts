import { UserRole } from "@/contexts/user-context";

export type Section = "mon-espace" | "base-connaissance" | "espace-rh" | "administration" | "gestion-paie";

/**
 * Vérifie si un utilisateur a accès à une section donnée
 * @param userRole Le rôle de l'utilisateur
 * @param section La section à vérifier
 * @returns true si l'utilisateur a accès, false sinon
 */
export function hasAccess(userRole: UserRole, section: Section): boolean {
  const permissions: Record<UserRole, Section[]> = {
    employee: ["mon-espace", "base-connaissance"],
    hr: ["mon-espace", "base-connaissance", "espace-rh"],
    drh: ["mon-espace", "base-connaissance", "espace-rh", "administration","gestion-paie"],
    payroll: ["mon-espace", "base-connaissance", "espace-rh", "gestion-paie"],
  };

  return permissions[userRole]?.includes(section) || false;
}

/**
 * Vérifie si un utilisateur peut voir une conversation spécifique
 * @param userRole Le rôle de l'utilisateur
 * @param userId L'ID de l'utilisateur actuel
 * @param conversationUserId L'ID de l'utilisateur propriétaire de la conversation
 * @returns true si l'utilisateur peut voir la conversation
 */
export function canViewConversation(
  userRole: UserRole,
  userId: string,
  conversationUserId: string
): boolean {
  // Les RH, DRH et Payroll peuvent voir toutes les conversations
  if (userRole === "hr" || userRole === "drh" || userRole === "payroll") {
    return true;
  }
  
  // Les employés ne peuvent voir que leurs propres conversations
  return userId === conversationUserId;
}

/**
 * Vérifie si un utilisateur peut voir une demande spécifique
 * @param userRole Le rôle de l'utilisateur
 * @param userId L'ID de l'utilisateur actuel
 * @param requestUserId L'ID de l'utilisateur propriétaire de la demande
 * @returns true si l'utilisateur peut voir la demande
 */
export function canViewRequest(
  userRole: UserRole,
  userId: string,
  requestUserId: string
): boolean {
  // Les RH, DRH et Payroll peuvent voir toutes les demandes
  if (userRole === "hr" || userRole === "drh" || userRole === "payroll") {
    return true;
  }
  
  // Les employés ne peuvent voir que leurs propres demandes
  return userId === requestUserId;
}

/**
 * Vérifie si un utilisateur peut voir un document spécifique de la base de connaissances
 * @param userRole Le rôle de l'utilisateur
 * @param documentAllowedRoles Les rôles autorisés à voir le document
 * @returns true si l'utilisateur peut voir le document
 */
export function canViewDocument(
  userRole: UserRole,
  documentAllowedRoles: UserRole[]
): boolean {
  return documentAllowedRoles.includes(userRole);
}

/**
 * Obtient le label français du rôle
 * @param role Le rôle de l'utilisateur
 * @returns Le label en français
 */
export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    employee: "Employé",
    hr: "RH",
    drh: "DRH",
    payroll: "Paie",
  };
  
  return labels[role] || role;
}

/**
 * Obtient la couleur du badge pour un rôle
 * @param role Le rôle de l'utilisateur
 * @returns La classe CSS pour le badge
 */
export function getRoleBadgeClass(role: UserRole): string {
  const classes: Record<UserRole, string> = {
    employee: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800",
    hr: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-800",
    drh: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-800",
    payroll: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800",
  };
  
  return classes[role] || "";
}
