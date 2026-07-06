// src/auth.ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import PostgresAdapter from '@auth/pg-adapter';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PostgresAdapter(pool),
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email or Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        try {
          // Look up user by email OR username matching input
          const result = await pool.query(
            'SELECT * FROM users WHERE email = $1 OR name = $1',
            [credentials.email]
          );
          const user = result.rows[0];

          if (!user) {
            throw new Error("USER_NOT_FOUND");
          }

          const passwordMatch = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!passwordMatch) {
            throw new Error("INCORRECT_PASSWORD");
          }

          return { 
            id: String(user.id), 
            name: user.name, 
            email: user.email 
          };
        } catch (error: any) {
          console.error("Authorization flow catch:", error.message);
          // Re-throw specific errors so they bounce to the front end
          if (["USER_NOT_FOUND", "INCORRECT_PASSWORD"].includes(error.message)) {
            throw error;
          }
          throw new Error("SERVER_ERROR");
        }
      },
    }),
  ],
  pages: {
    signIn: '/', 
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});