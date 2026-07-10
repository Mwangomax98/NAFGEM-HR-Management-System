import { STUB_USER, STUB_SESSION, STUB_USER_ID } from './currentUser';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const AUTH_DISABLED = import.meta.env.VITE_AUTH_DISABLED === 'true';

const SESSION_KEY = 'nafgem_hr_session';

type Session = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  user: typeof STUB_USER;
  role?: string;
};

function getStoredSession(): Session | null {
  if (AUTH_DISABLED) return STUB_SESSION as Session;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredSession(session: Session | null) {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

function authHeaders(): Record<string, string> {
  const session = getStoredSession();
  if (session?.access_token && session.access_token !== 'local-stub-token') {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

type Filter = { column: string; op: string; value: unknown };

function encodeFilter(f: Filter): string {
  const v = f.value;
  if (f.op === 'raw' && f.column === 'or') {
    return `or=${encodeURIComponent(String(v))}`;
  }
  if (f.op === 'is' || f.op === 'not.is') {
    return `${f.column}=${f.op}.${v}`;
  }
  if (f.op === 'in' || f.op === 'not.in') {
    const list = Array.isArray(v) ? v : String(v).replace(/^\(|\)$/g, '').split(',');
    return `${f.column}=${f.op}.(${list.join(',')})`;
  }
  return `${f.column}=${f.op}.${encodeURIComponent(String(v))}`;
}

class QueryBuilder {
  private table: string;
  private filters: Filter[] = [];
  private selectClause = '*';
  private orderClause: string | null = null;
  private limitValue: number | null = null;
  private offsetValue: number | null = null;
  private wantSingle = false;
  private wantMaybeSingle = false;
  private wantCount: 'exact' | null = null;
  private headOnly = false;
  private method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET';
  private body: unknown = null;

  constructor(table: string) {
    this.table = table;
  }

  select(columns = '*', options?: { count?: 'exact'; head?: boolean }) {
    this.selectClause = columns;
    if (options?.count) this.wantCount = options.count;
    if (options?.head) this.headOnly = true;
    return this;
  }

  insert(data: unknown) {
    this.method = 'POST';
    this.body = data;
    return this;
  }

  upsert(data: unknown) {
    this.method = 'POST';
    this.body = data;
    return this;
  }

  update(data: unknown) {
    this.method = 'PATCH';
    this.body = data;
    return this;
  }

  delete() {
    this.method = 'DELETE';
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, op: 'eq', value });
    return this;
  }

  neq(column: string, value: unknown) {
    this.filters.push({ column, op: 'neq', value });
    return this;
  }

  gt(column: string, value: unknown) {
    this.filters.push({ column, op: 'gt', value });
    return this;
  }

  gte(column: string, value: unknown) {
    this.filters.push({ column, op: 'gte', value });
    return this;
  }

  lt(column: string, value: unknown) {
    this.filters.push({ column, op: 'lt', value });
    return this;
  }

  lte(column: string, value: unknown) {
    this.filters.push({ column, op: 'lte', value });
    return this;
  }

  like(column: string, value: unknown) {
    this.filters.push({ column, op: 'like', value });
    return this;
  }

  ilike(column: string, value: unknown) {
    this.filters.push({ column, op: 'ilike', value });
    return this;
  }

  is(column: string, value: unknown) {
    this.filters.push({ column, op: 'is', value });
    return this;
  }

  in(column: string, values: unknown[]) {
    this.filters.push({ column, op: 'in', value: values });
    return this;
  }

  not(column: string, op: string, value?: unknown) {
    if (op === 'in') {
      this.filters.push({ column, op: 'not.in', value });
    } else if (op === 'eq') {
      this.filters.push({ column, op: 'neq', value });
    } else if (op === 'is') {
      this.filters.push({ column, op: 'not.is', value });
    } else {
      this.filters.push({ column, op: `not.${op}`, value });
    }
    return this;
  }

  or(expression: string) {
    this.filters.push({ column: 'or', op: 'raw', value: expression });
    return this;
  }

  order(column: string, opts?: { ascending?: boolean }) {
    const dir = opts?.ascending === false ? 'desc' : 'asc';
    this.orderClause = this.orderClause
      ? `${this.orderClause},${column}.${dir}`
      : `${column}.${dir}`;
    return this;
  }

  limit(n: number) {
    this.limitValue = n;
    return this;
  }

  range(from: number, to: number) {
    this.offsetValue = from;
    this.limitValue = to - from + 1;
    return this;
  }

  single() {
    this.wantSingle = true;
    return this;
  }

  maybeSingle() {
    this.wantMaybeSingle = true;
    return this;
  }

  private buildUrl(): string {
    const params = new URLSearchParams();
    if (this.selectClause && this.method === 'GET') {
      params.set('select', this.selectClause);
    }
    for (const f of this.filters) {
      params.append(f.column.split('.')[0] ? f.column : f.column, '');
      // URLSearchParams can't easily set raw; build manually
    }

    const parts: string[] = [];
    if (this.selectClause && this.method === 'GET') {
      parts.push(`select=${encodeURIComponent(this.selectClause)}`);
    }
    for (const f of this.filters) {
      parts.push(encodeFilter(f));
    }
    if (this.orderClause) parts.push(`order=${this.orderClause}`);
    if (this.limitValue != null) parts.push(`limit=${this.limitValue}`);
    if (this.offsetValue != null) parts.push(`offset=${this.offsetValue}`);
    if (this.wantCount) parts.push(`count=${this.wantCount}`);
    if (this.headOnly) parts.push('head=true');
    if (this.wantSingle) parts.push('single=true');
    if (this.wantMaybeSingle) parts.push('maybeSingle=true');

    const qs = parts.length ? `?${parts.join('&')}` : '';
    return `${API_URL}/api/db/${this.table}${qs}`;
  }

  then<TResult1 = { data: any; error: any; count?: number | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any; count?: number | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  async execute(): Promise<{ data: any; error: any; count?: number | null }> {
    try {
      const res = await fetch(this.buildUrl(), {
        method: this.method,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
          ...(this.wantSingle || this.wantMaybeSingle
            ? { Accept: 'application/vnd.pgrst.object+json' }
            : {}),
        },
        body: this.body != null ? JSON.stringify(this.body) : undefined,
      });

      const countHeader = res.headers.get('x-total-count');
      const count = countHeader != null ? Number(countHeader) : null;

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: res.statusText }));
        if (this.wantMaybeSingle && res.status === 406) {
          return { data: null, error: null, count };
        }
        return {
          data: null,
          error: { message: errBody.error || res.statusText, code: String(res.status) },
          count,
        };
      }

      if (this.headOnly) {
        return { data: null, error: null, count };
      }

      const data = await res.json();
      return { data, error: null, count };
    } catch (err: any) {
      return { data: null, error: { message: err.message || 'Network error' }, count: null };
    }
  }
}

class StorageBucket {
  constructor(private bucket: string) {}

  async upload(path: string, file: File | Blob, _options?: unknown) {
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('path', path);
      const res = await fetch(`${API_URL}/api/storage/${this.bucket}`, {
        method: 'POST',
        headers: authHeaders(),
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        return { data: null, error: { message: err.error || res.statusText } };
      }
      const data = await res.json();
      return {
        data: {
          path: data.fullPath || `${this.bucket}/${data.path}`,
          fullPath: data.fullPath || `${this.bucket}/${data.path}`,
          publicUrl: data.publicUrl,
        },
        error: null,
      };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  }

  getPublicUrl(path: string) {
    // Accept fullPath like "bucket/file.ext", "bucket/folder/file.ext", or bare filename
    const cleaned = String(path || '').replace(/^\/+/, '');
    const parts = cleaned.split('/');
    const fileName = parts[parts.length - 1];
    const bucketFromPath = parts.length > 1 && parts[0] === this.bucket ? this.bucket : this.bucket;
    return {
      data: {
        publicUrl: `${API_URL}/uploads/${bucketFromPath}/${fileName}`,
      },
    };
  }
}

const authListeners = new Set<(event: string, session: Session | null) => void>();

function notifyAuth(event: string, session: Session | null) {
  authListeners.forEach((cb) => cb(event, session));
}

export const api = {
  from(table: string) {
    return new QueryBuilder(table);
  },

  auth: {
    async getUser() {
      if (AUTH_DISABLED) return { data: { user: STUB_USER }, error: null };
      const session = getStoredSession();
      if (!session) return { data: { user: null }, error: null };
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, { headers: authHeaders() });
        if (!res.ok) {
          setStoredSession(null);
          return { data: { user: null }, error: null };
        }
        const data = await res.json();
        return { data: { user: data.user }, error: null };
      } catch (err: any) {
        return { data: { user: session.user }, error: null };
      }
    },
    async getSession() {
      const session = getStoredSession();
      return { data: { session }, error: null };
    },
    onAuthStateChange(callback: (event: string, session: Session | null) => void) {
      authListeners.add(callback);
      setTimeout(() => callback('INITIAL_SESSION', getStoredSession()), 0);
      return {
        data: {
          subscription: {
            unsubscribe: () => authListeners.delete(callback),
          },
        },
      };
    },
    async signInWithPassword(credentials?: { email: string; password: string }) {
      if (AUTH_DISABLED) {
        return { data: { user: STUB_USER, session: STUB_SESSION }, error: null };
      }
      try {
        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        });
        const body = await res.json();
        if (!res.ok) {
          return { data: { user: null, session: null }, error: { message: body.error || 'Login failed' } };
        }
        const session: Session = {
          access_token: body.access_token,
          token_type: body.token_type,
          expires_in: body.expires_in,
          user: body.user,
          role: body.role,
        };
        setStoredSession(session);
        notifyAuth('SIGNED_IN', session);
        return { data: { user: body.user, session }, error: null };
      } catch (err: any) {
        return { data: { user: null, session: null }, error: { message: err.message } };
      }
    },
    async signUp() {
      return { data: { user: null, session: null }, error: { message: 'Contact HR to create an account' } };
    },
    async signOut() {
      setStoredSession(null);
      notifyAuth('SIGNED_OUT', null);
      return { error: null };
    },
    admin: {
      async createUser(attrs: { email: string; password?: string; user_metadata?: Record<string, unknown> }) {
        const id = crypto.randomUUID();
        const res = await fetch(`${API_URL}/api/db/profiles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({
            id,
            email: attrs.email,
            full_name: attrs.user_metadata?.full_name || attrs.email,
            project: attrs.user_metadata?.project || '',
            title: attrs.user_metadata?.title || '',
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: res.statusText }));
          return { data: { user: null }, error: { message: err.error } };
        }
        const profile = await res.json();
        await fetch(`${API_URL}/api/db/user_roles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ user_id: profile.id, role: 'employee', assigned_by: STUB_USER_ID }),
        });
        return {
          data: {
            user: {
              id: profile.id,
              email: profile.email,
              user_metadata: attrs.user_metadata || {},
            },
          },
          error: null,
        };
      },
    },
  },

  storage: {
    from(bucket: string) {
      return new StorageBucket(bucket);
    },
  },

  channel(_name: string) {
    const channel: any = {
      on() {
        return channel;
      },
      subscribe() {
        return channel;
      },
      unsubscribe() {
        return 'ok';
      },
    };
    return channel;
  },

  removeChannel(_channel: unknown) {
    return Promise.resolve('ok');
  },

  async rpc(fn: string, args?: Record<string, unknown>) {
    try {
      const res = await fetch(`${API_URL}/api/rpc/${fn}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(args || {}),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        return { data: null, error: { message: err.error || res.statusText } };
      }
      const data = await res.json();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  },

  functions: {
    async invoke(name: string, opts?: { body?: unknown }) {
      if (name === 'delete-user') {
        const userId = (opts?.body as any)?.userId;
        if (!userId) return { data: null, error: { message: 'userId required' } };
        // Soft-delete: remove profile (cascades roles)
        const res = await fetch(`${API_URL}/api/db/profiles?id=eq.${userId}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: res.statusText }));
          return { data: null, error: { message: err.error } };
        }
        return { data: { success: true }, error: null };
      }
      return { data: { ok: true, stub: true }, error: null };
    },
  },
};

/** @deprecated Use `api` — kept as `supabase` alias during migration */
export const supabase = api;

export default api;
