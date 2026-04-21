import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "CustomLogin",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        
        try {
          const params = new URLSearchParams({
            client_id: process.env.KEYCLOAK_ID,
            client_secret: process.env.KEYCLOAK_SECRET,
            grant_type: "password",
            scope: "openid profile email",
            username: credentials.username,
            password: credentials.password,
          });

          // Direct Access Grant manually asks Keycloak for the tokens
          const res = await fetch(`${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params.toString(),
          });

          const tokens = await res.json();
          if (!res.ok) throw new Error(tokens.error_description || "Invalid credentials");

          // Decode JWT by calling userinfo endpoint
          const userInfoRes = await fetch(`${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/userinfo`, {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
          });
          const user = await userInfoRes.json();

          if (user) {
            return { id: user.sub, name: user.preferred_username || user.name, email: user.email };
          }
          return null;
        } catch (e) {
          console.error("Login error:", e);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/login', // Force NextAuth to use our beautiful custom login page!
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
