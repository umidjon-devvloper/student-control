import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      username: string;
      role: "admin" | "student";
    };
  }

  interface User {
    id: string;
    name: string;
    username: string;
    role: "admin" | "student";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    role?: "admin" | "student";
  }
}
