"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load users from JSON
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch("/data/users.json");
        const data = await response.json();
        setUsers(data.users);

        // Check localStorage for saved user
        const savedUserId = localStorage.getItem("currentUserId");
        
        if (savedUserId) {
          const savedUser = data.users.find((u: User) => u.id === savedUserId);
          if (savedUser) {
            setCurrentUserState(savedUser);
          } else {
            // If saved user not found, default to first user
            setCurrentUserState(data.users[0]);
          }
        } else {
          // Default to first user (user-001)
          setCurrentUserState(data.users[0]);
        }
      } catch (error) {
        console.error("Error loading users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, []);

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    localStorage.setItem("currentUserId", user.id);
    
    // Redirect to home page when user changes
    window.location.href = "/";
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
