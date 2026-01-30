// Supabase client configuration
// NOTE: Install @supabase/supabase-js and set up environment variables before using

// Placeholder types for build compatibility
// These will be replaced with actual Supabase types once the package is installed

interface SupabaseAuthUser {
  id: string;
  email?: string;
}

interface SupabaseAuthSession {
  user: SupabaseAuthUser;
}

interface SupabaseQueryBuilder {
  select: (columns?: string, options?: { count?: string; head?: boolean }) => SupabaseQueryBuilder;
  insert: (data: any) => SupabaseQueryBuilder;
  update: (data: any) => SupabaseQueryBuilder;
  upsert: (data: any) => SupabaseQueryBuilder;
  delete: () => SupabaseQueryBuilder;
  eq: (column: string, value: any) => SupabaseQueryBuilder;
  neq: (column: string, value: any) => SupabaseQueryBuilder;
  gt: (column: string, value: any) => SupabaseQueryBuilder;
  gte: (column: string, value: any) => SupabaseQueryBuilder;
  lt: (column: string, value: any) => SupabaseQueryBuilder;
  lte: (column: string, value: any) => SupabaseQueryBuilder;
  or: (filters: string) => SupabaseQueryBuilder;
  order: (column: string, options?: { ascending?: boolean }) => SupabaseQueryBuilder;
  limit: (count: number) => SupabaseQueryBuilder;
  range: (from: number, to: number) => SupabaseQueryBuilder;
  single: () => Promise<{ data: any; error: any }>;
  then: (resolve: (result: { data: any; error: any; count?: number }) => void) => void;
}

interface SupabaseRealtimeChannel {
  on: (event: string, config: any, callback: (payload: any) => void) => SupabaseRealtimeChannel;
  subscribe: (callback?: (status: string) => void) => SupabaseRealtimeChannel;
}

interface SupabaseClient {
  from: (table: string) => SupabaseQueryBuilder;
  rpc: (fn: string, params?: any) => Promise<{ data: any; error: any }>;
  auth: {
    getUser: () => Promise<{ data: { user: SupabaseAuthUser | null } }>;
    onAuthStateChange: (callback: (event: string, session: SupabaseAuthSession | null) => void) => {
      data: { subscription: { unsubscribe: () => void } };
    };
  };
  channel: (name: string) => SupabaseRealtimeChannel;
  removeChannel: (channel: SupabaseRealtimeChannel) => void;
}

// Check if we have environment variables set
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a mock client for development when Supabase is not configured
const createMockClient = (): SupabaseClient => {
  const mockQueryBuilder: SupabaseQueryBuilder = {
    select: () => mockQueryBuilder,
    insert: () => mockQueryBuilder,
    update: () => mockQueryBuilder,
    upsert: () => mockQueryBuilder,
    delete: () => mockQueryBuilder,
    eq: () => mockQueryBuilder,
    neq: () => mockQueryBuilder,
    gt: () => mockQueryBuilder,
    gte: () => mockQueryBuilder,
    lt: () => mockQueryBuilder,
    lte: () => mockQueryBuilder,
    or: () => mockQueryBuilder,
    order: () => mockQueryBuilder,
    limit: () => mockQueryBuilder,
    range: () => mockQueryBuilder,
    single: async () => ({ data: null, error: { code: 'MOCK', message: 'Supabase not configured' } }),
    then: (resolve) => resolve({ data: [], error: null, count: 0 }),
  };

  const mockChannel: SupabaseRealtimeChannel = {
    on: () => mockChannel,
    subscribe: (callback) => {
      if (callback) callback('SUBSCRIBED');
      return mockChannel;
    },
  };

  return {
    from: () => mockQueryBuilder,
    rpc: async () => ({ data: null, error: { code: 'MOCK', message: 'Supabase not configured' } }),
    auth: {
      getUser: async () => ({ data: { user: null } }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
    channel: () => mockChannel,
    removeChannel: () => {},
  };
};

// Export the client
// When Supabase is properly configured, replace this with:
// import { createClient } from '@supabase/supabase-js'
// export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const supabase: SupabaseClient = supabaseUrl && supabaseAnonKey
  ? createMockClient() // Replace with real client when configured
  : createMockClient();

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => !!(supabaseUrl && supabaseAnonKey);

// Export types for use in other files
export type { SupabaseClient, SupabaseRealtimeChannel, SupabaseAuthUser, SupabaseAuthSession };

/*
SETUP INSTRUCTIONS:

1. Install Supabase:
   npm install @supabase/supabase-js

2. Create a .env file with your Supabase credentials:
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key

3. Replace the mock client above with the real client:
   import { createClient } from '@supabase/supabase-js'
   export const supabase = createClient(supabaseUrl, supabaseAnonKey)

4. Run the migration in supabase/migrations/001_live_page_schema.sql
*/
