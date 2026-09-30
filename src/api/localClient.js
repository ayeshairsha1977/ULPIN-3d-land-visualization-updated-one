import { PROPERTIES } from "@/data/properties";

const STORE_KEY = "ulpin-local-data-v1";
const USER_KEY = "ulpin-local-user-v1";
const FILE_DB = "ulpin-local-files-v1";
const ENTITY_NAMES = [
  "Complaint",
  "Notification",
  "PropertyHistory",
  "PropertyPhoto",
  "PropertyStatus",
  "ULPINApplication",
  "Verification",
];

const defaultUser = () => ({
  id: "local-demo-user",
  email: "demo@local.test",
  full_name: "Local Demo User",
  demo_role: "citizen",
  created_date: new Date().toISOString(),
});

function defaultStore() {
  const entities = Object.fromEntries(ENTITY_NAMES.map((name) => [name, []]));
  entities.PropertyStatus = PROPERTIES.map((property) => ({
    id: `status-${property.id}`,
    property_id: property.id,
    ulpin: "",
    ulpin_status: "Not Requested",
    verification_status: "Pending Verification",
    created_date: new Date().toISOString(),
  }));
  return { entities };
}

function readStore() {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return defaultStore();
    const value = JSON.parse(raw);
    return { entities: { ...defaultStore().entities, ...value.entities } };
  } catch {
    return defaultStore();
  }
}

function writeStore(store) {
  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

export function getLocalUser() {
  try {
    return JSON.parse(window.localStorage.getItem(USER_KEY)) || defaultUser();
  } catch {
    return defaultUser();
  }
}

function saveLocalUser(user) {
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

function sortedRows(rows, sort, limit) {
  const descending = sort?.startsWith("-");
  const field = descending ? sort.slice(1) : sort;
  const result = [...rows];
  if (field) {
    result.sort((a, b) => {
      const left = a[field] ?? "";
      const right = b[field] ?? "";
      const comparison = left < right ? -1 : left > right ? 1 : 0;
      return descending ? -comparison : comparison;
    });
  }
  return result.slice(0, limit ?? result.length);
}

function entityApi(name) {
  if (!ENTITY_NAMES.includes(name)) throw new Error(`Unknown local data collection: ${name}`);

  return {
    async list(sort, limit) {
      return sortedRows(readStore().entities[name], sort, limit);
    },
    async filter(query = {}, sort, limit) {
      const rows = readStore().entities[name].filter((row) =>
        Object.entries(query).every(([key, value]) => row[key] === value),
      );
      return sortedRows(rows, sort, limit);
    },
    async create(payload) {
      const store = readStore();
      const timestamp = new Date().toISOString();
      const row = {
        ...payload,
        id: globalThis.crypto?.randomUUID?.() || `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        created_date: timestamp,
        updated_date: timestamp,
        created_by_id: payload.created_by_id || getLocalUser().id,
      };
      store.entities[name].push(row);
      writeStore(store);
      return row;
    },
    async update(id, patch) {
      const store = readStore();
      const index = store.entities[name].findIndex((row) => row.id === id);
      if (index < 0) throw new Error(`${name} record not found`);
      const row = { ...store.entities[name][index], ...patch, id, updated_date: new Date().toISOString() };
      store.entities[name][index] = row;
      writeStore(store);
      return row;
    },
    async delete(id) {
      const store = readStore();
      store.entities[name] = store.entities[name].filter((row) => row.id !== id);
      writeStore(store);
    },
  };
}

const entities = new Proxy({}, { get: (_target, name) => entityApi(name) });

function openFileDb() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(FILE_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("files");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function storeFile(file) {
  const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const db = await openFileDb();
  await new Promise((resolve, reject) => {
    const request = db.transaction("files", "readwrite").objectStore("files").put(file, id);
    request.onsuccess = resolve;
    request.onerror = () => reject(request.error);
  });
  return `local-file:${id}`;
}

async function readFile(uri) {
  const id = uri.slice("local-file:".length);
  const db = await openFileDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction("files", "readonly").objectStore("files").get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const localClient = {
  entities,
  session: {
    getUser() {
      return getLocalUser();
    },
    updateUser(patch) {
      return saveLocalUser({ ...getLocalUser(), ...patch });
    },
    logout() {
      window.localStorage.removeItem(USER_KEY);
    },
  },
  files: {
    async upload(file) {
      return { file_uri: await storeFile(file) };
    },
    async getUrl(file_uri) {
      if (!file_uri?.startsWith("local-file:")) return file_uri || "";
      const file = await readFile(file_uri);
      return file ? URL.createObjectURL(file) : "";
    },
  },
};