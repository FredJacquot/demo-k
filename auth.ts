import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { User as NextAuthUser } from "next-auth";
import usersData from "@/public/data/users.json";

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      department: string;
      position: string;
      company?: string;
      convention?: string;
    };
  }
  
  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    department: string;
    position: string;
    company?: string;
    convention?: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Find user by email from imported JSON data
        const user = usersData.users.find((u: { email: string }) => u.email === credentials.email);
        
        if (!user) {
          console.error("User not found:", credentials.email);
          return null;
        }

        // For demo purposes, password is "demo123" for all users
        // In production, you should store hashed passwords
        const isValidPassword = credentials.password === "demo123";
        
        if (!isValidPassword) {
          console.error("Invalid password for user:", credentials.email);
          return null;
        }

        // Return user object that will be stored in the session
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
          position: user.position,
          company: user.company,
          convention: user.convention,
        } as NextAuthUser;
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.department = user.department;
        token.position = user.position;
        token.company = user.company;
        token.convention = user.convention;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.department = token.department as string;
        session.user.position = token.position as string;
        session.user.company = token.company as string | undefined;
        session.user.convention = token.convention as string | undefined;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
  },
});
