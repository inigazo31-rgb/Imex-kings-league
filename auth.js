import { store } from "./store.js";
import { DEMO_PASSWORD, SEED_ACCOUNTS } from "./data.js";
import { uid } from "./utils.js";

const SESSION_KEY = "imex.session.v1";
const ITERATIONS = 60000;

function bytesToHex(buffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function randomSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes.buffer);
}

async function derive(password, salt, iterations = ITERATIONS) {
  if (!crypto?.subtle) throw new Error("Este navegador no permite cifrar contraseñas. Abre la plataforma desde localhost o HTTPS.");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations, hash: "SHA-256" },
    key,
    256
  );
  return bytesToHex(bits);
}

function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

function safeAccount(account) {
  if (!account) return null;
  return {
    id: account.id,
    email: account.email,
    name: account.name,
    role: account.role,
    teamId: account.teamId || null,
    playerId: account.playerId || null,
    createdAt: account.createdAt || null
  };
}

function mapProfile(profile) {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name || profile.email?.split("@")[0] || "Cuenta IMEX",
    role: profile.role || "FAN",
    teamId: profile.team_id || null,
    playerId: profile.player_id || null,
    createdAt: profile.created_at || null
  };
}

class Auth {
  constructor() {
    this.user = null;
    this.mode = "local";
    this.supabase = null;
    this.remember = true;
  }

  async init() {
    const config = store.getSupabaseConfig();
    if (config.url && config.key && window.supabase) {
      this.supabase = store.supabase || window.supabase.createClient(config.url, config.key, {
        auth: { persistSession: true, autoRefreshToken: true }
      });
      this.mode = "supabase";
      const { data } = await this.supabase.auth.getSession();
      if (data?.session) {
        await this.loadSupabaseProfile(data.session.user);
      }
      return;
    }
    this.mode = "local";
    await this.seedLocal();
    const saved = this.readSession();
    if (saved) {
      const account = store.account(saved.accountId);
      if (account) this.user = safeAccount(account);
    }
  }

  readSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  writeSession(accountId, remember = true) {
    const payload = JSON.stringify({ accountId, at: Date.now() });
    this.remember = remember;
    if (remember) {
      localStorage.setItem(SESSION_KEY, payload);
      sessionStorage.removeItem(SESSION_KEY);
    } else {
      sessionStorage.setItem(SESSION_KEY, payload);
      localStorage.removeItem(SESSION_KEY);
    }
  }

  clearSession() {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  }

  async seedLocal() {
    if (store.state.accounts.length) return;
    const accounts = await Promise.all(
      SEED_ACCOUNTS.map(async (account) => {
        const salt = randomSalt();
        const passwordHash = await derive(DEMO_PASSWORD, salt);
        return {
          ...account,
          email: normalizeEmail(account.email),
          salt,
          iterations: ITERATIONS,
          passwordHash,
          createdAt: new Date().toISOString()
        };
      })
    );
    store.state.accounts = accounts;
    store.save("seed-accounts");
  }

  async signIn(email, password, remember = true) {
    const normalized = normalizeEmail(email);
    if (!normalized || !password) throw new Error("Escribe tu correo y contraseña.");
    if (this.mode === "supabase") {
      const { data, error } = await this.supabase.auth.signInWithPassword({ email: normalized, password });
      if (error) throw new Error(this.friendlyError(error.message));
      await this.loadSupabaseProfile(data.user);
      this.writeSession(data.user.id, remember);
      return this.user;
    }
    const account = store.state.accounts.find((item) => normalizeEmail(item.email) === normalized);
    if (!account) throw new Error("Correo o contraseña incorrectos.");
    const hash = await derive(password, account.salt, account.iterations || ITERATIONS);
    if (hash !== account.passwordHash) throw new Error("Correo o contraseña incorrectos.");
    this.user = safeAccount(account);
    this.writeSession(account.id, remember);
    store.setUser(this.user);
    return this.user;
  }

  async signUp({ name, email, password, role = "FAN", teamId = null }) {
    const normalized = normalizeEmail(email);
    if (!name?.trim()) throw new Error("Escribe tu nombre.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error("Escribe un correo válido.");
    if (String(password).length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres.");
    if (!["FAN", "PLAYER"].includes(role)) role = "FAN";
    if (this.mode === "supabase") {
      const { data, error } = await this.supabase.auth.signUp({
        email: normalized,
        password,
        options: { data: { name: name.trim(), role, team_id: teamId } }
      });
      if (error) throw new Error(this.friendlyError(error.message));
      if (!data.session) {
        throw new Error("Cuenta creada. Revisa tu correo para confirmarla y después inicia sesión.");
      }
      await this.loadSupabaseProfile(data.user);
      this.writeSession(data.user.id, true);
      return this.user;
    }
    if (store.state.accounts.some((item) => normalizeEmail(item.email) === normalized)) {
      throw new Error("Ya existe una cuenta con ese correo.");
    }
    const salt = randomSalt();
    const passwordHash = await derive(password, salt);
    const account = {
      id: uid("u"),
      email: normalized,
      name: name.trim(),
      role,
      teamId: role === "PLAYER" ? teamId : null,
      playerId: null,
      salt,
      iterations: ITERATIONS,
      passwordHash,
      createdAt: new Date().toISOString()
    };
    store.addAccount(account);
    this.user = safeAccount(account);
    this.writeSession(account.id, true);
    store.setUser(this.user);
    return this.user;
  }

  async signOut() {
    if (this.mode === "supabase" && this.supabase) await this.supabase.auth.signOut();
    this.clearSession();
    this.user = null;
    store.setUser(null);
  }

  async changePassword(currentPassword, newPassword) {
    if (String(newPassword).length < 8) throw new Error("La nueva contraseña debe tener al menos 8 caracteres.");
    if (this.mode === "supabase") {
      const { error } = await this.supabase.auth.updateUser({ password: newPassword });
      if (error) throw new Error(this.friendlyError(error.message));
      return;
    }
    const account = store.account(this.user?.id);
    if (!account) throw new Error("Sesión no válida.");
    const currentHash = await derive(currentPassword, account.salt, account.iterations || ITERATIONS);
    if (currentHash !== account.passwordHash) throw new Error("La contraseña actual no es correcta.");
    const salt = randomSalt();
    account.salt = salt;
    account.passwordHash = await derive(newPassword, salt);
    account.iterations = ITERATIONS;
    store.updateAccount(account.id, account);
  }

  async adminSetPassword(accountId, newPassword) {
    if (String(newPassword).length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres.");
    if (this.mode === "supabase") {
      return this.callAdminFunction({ action: "set_password", accountId, password: newPassword });
    }
    const account = store.account(accountId);
    if (!account) throw new Error("Cuenta no encontrada.");
    const salt = randomSalt();
    account.salt = salt;
    account.passwordHash = await derive(newPassword, salt);
    account.iterations = ITERATIONS;
    store.updateAccount(account.id, account);
  }

  async adminCreateAccount({ name, email, password, role, teamId, playerId }) {
    const normalized = normalizeEmail(email);
    if (this.mode === "supabase") {
      return this.callAdminFunction({ action: "create", name, email: normalized, password, role, teamId, playerId });
    }
    if (store.state.accounts.some((item) => normalizeEmail(item.email) === normalized)) {
      throw new Error("Ya existe una cuenta con ese correo.");
    }
    if (String(password).length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres.");
    const salt = randomSalt();
    const account = {
      id: uid("u"),
      email: normalized,
      name,
      role,
      teamId: teamId || null,
      playerId: playerId || null,
      salt,
      iterations: ITERATIONS,
      passwordHash: await derive(password, salt),
      createdAt: new Date().toISOString()
    };
    store.addAccount(account);
    return safeAccount(account);
  }

  async adminUpdateAccount(accountId, patch) {
    if (this.mode === "supabase") {
      return this.callAdminFunction({
        action: "update",
        accountId,
        name: patch.name,
        email: patch.email,
        role: patch.role,
        teamId: patch.teamId || null,
        playerId: patch.playerId || null
      });
    }
    store.updateAccount(accountId, patch);
  }

  async adminDeleteAccount(accountId) {
    if (this.mode === "supabase") {
      return this.callAdminFunction({ action: "delete", accountId });
    }
    store.deleteAccount(accountId);
    if (this.user?.id === accountId) await this.signOut();
  }

  async fetchAccounts() {
    if (this.mode === "supabase") {
      const { data, error } = await this.supabase.from("profiles").select("*").order("created_at", { ascending: true });
      if (error) throw new Error(this.friendlyError(error.message));
      return (data || []).map(mapProfile);
    }
    return store.state.accounts.map(safeAccount);
  }

  async loadSupabaseProfile(authUser) {
    if (!authUser) return null;
    const { data, error } = await this.supabase.from("profiles").select("*").eq("id", authUser.id).maybeSingle();
    if (error) throw new Error(this.friendlyError(error.message));
    if (data) {
      this.user = mapProfile(data);
    } else {
      const profile = {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "Cuenta IMEX",
        role: authUser.user_metadata?.role === "PLAYER" ? "PLAYER" : "FAN",
        team_id: authUser.user_metadata?.team_id || null,
        player_id: null
      };
      const inserted = await this.supabase.from("profiles").insert(profile).select("*").single();
      if (inserted.error) throw new Error(this.friendlyError(inserted.error.message));
      this.user = mapProfile(inserted.data);
    }
    store.setUser(this.user);
    return this.user;
  }

  async callAdminFunction(payload) {
    try {
      const { data, error } = await this.supabase.functions.invoke("admin-account", { body: payload });
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error("La gestión avanzada de cuentas requiere desplegar la función admin-account de Supabase. Revisa la guía de configuración.");
    }
  }

  friendlyError(message = "") {
    if (/invalid login credentials/i.test(message)) return "Correo o contraseña incorrectos.";
    if (/email not confirmed/i.test(message)) return "Confirma tu correo antes de iniciar sesión.";
    if (/user already registered/i.test(message)) return "Ya existe una cuenta con ese correo.";
    if (/password/i.test(message)) return "La contraseña no cumple los requisitos.";
    return message || "No se pudo completar la operación.";
  }
}

export const auth = new Auth();
