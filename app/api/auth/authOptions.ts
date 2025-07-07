import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import dbConnect from '../../lib/dbConnect';
import User from '../../models/User';
import { AuthOptions } from 'next-auth';
import debugMongoConnection from '../../lib/debugMongo';
import config from '../../config';

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('🔐 Auth attempt for email:', credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials');
          return null;
        }

        try {
          // Debug MongoDB connection
          const connectionString = process.env.MONGODB_URI || config.database.uri;
          if (connectionString) {
            await debugMongoConnection(connectionString);
          }

          await dbConnect();
          console.log('📋 Database connected successfully');

          const user = await User.findOne({ email: credentials.email });
          console.log('👤 User found:', user ? 'Yes' : 'No');

          if (!user) {
            console.log('❌ User not found in database');
            return null;
          }

          console.log('🔍 User details:', {
            id: user._id.toString(),
            email: user.email,
            hasPassword: !!user.password,
            isGoogleUser: !!user.googleId
          });

          if (!user.password) {
            console.log('❌ User has no password (Google OAuth user)');
            return null;
          }

          const isPasswordValid = await user.comparePassword(credentials.password);
          console.log('🔑 Password valid:', isPasswordValid);

          if (!isPasswordValid) {
            console.log('❌ Invalid password');
            return null;
          }

          // Safely handle the user ID
          const userId = user._id ? user._id.toString() : '';
          console.log('✅ Authentication successful for user:', userId);
          
          return {
            id: userId,
            name: user.name,
            email: user.email,
          };
        } catch (error) {
          console.error('❌ Auth error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },  callbacks: {
    async signIn({ user, account }) {
      // Handle Google OAuth sign-in
      if (account?.provider === 'google') {
        try {
          await dbConnect();

          // Check if user already exists
          let existingUser = await User.findOne({ email: user.email });

          if (!existingUser) {
            // Create new user for Google OAuth
            existingUser = await User.create({
              name: user.name,
              email: user.email,
              // For Google OAuth users, we don't store a password
              password: null,
              googleId: account.providerAccountId,
            });
          } else if (!existingUser.googleId && account.providerAccountId) {
            // Link Google account to existing user
            existingUser.googleId = account.providerAccountId;
            await existingUser.save();
          }

          // Update user ID for session
          user.id = existingUser._id.toString();
          return true;
        } catch (error) {
          console.error('Error saving Google user:', error);
          return false;
        }
      }

      // For credentials provider, continue as normal
      return true;
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token) {
        // Use type assertion to inform TypeScript about the structure
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },
};
