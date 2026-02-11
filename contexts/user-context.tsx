"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";

export type UserRole = "employee" | "hr" | "drh" | "payroll";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  position: string;
  company?: string;
  convention?: string;
}

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  users: User[];
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);

  // Load users from JSON
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch("/data/users.json");
        const data = await response.json();
        setUsers(data.users);
      } catch (error) {
        console.error("Error loading users:", error);
      }
    };

    loadUsers();
  }, []);

  // Derive currentUser from session instead of storing in state
  const currentUser: User | null = session?.user ? {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role as UserRole,
    department: session.user.department,
    position: session.user.position,
    company: session.user.company,
    convention: session.user.convention,
  } : null;

  const isLoading = status === "loading";

  const setCurrentUser = (user: User) => {
    // This is now handled by NextAuth session
    // Keep the function for backward compatibility but it's a no-op
    console.log("setCurrentUser called but is now handled by NextAuth", user);
  };

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, users, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
