import { LucideIcon } from "lucide-react";

export interface NavItemProps {
  icon: LucideIcon;
  label: string;
  href?: string;
  active?: boolean;
  hasMenu?: boolean;
  onMenuAction?: (action: MenuAction) => void;
  subItems?: SubNavItem[];
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export interface SubNavItem {
  id: string;
  label: string;
  href: string;
  icon?: LucideIcon;
  active?: boolean;
}

export interface NavSectionProps {
  title: string;
  children: React.ReactNode;
  hasBorder?: boolean;
}

export interface NavItemMenuProps {
  onAction: (action: MenuAction) => void;
}

export type MenuAction = "rename" | "delete" | "share" | "archive";

export interface Conversation {
  id: string;
  title: string;
  createdAt?: string;
}

export interface Request {
  id: string;
  title: string;
  status: string;
}

export interface ConversationsData {
  current: Conversation;
  history: Conversation[];
}

export interface RequestsData {
  requests: Request[];
}
