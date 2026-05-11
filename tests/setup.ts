// Test bootstrap. Bun runs this before every test file (configured in
// bunfig.toml's `[test].preload`). Installs a minimal stub for the
// WebExtensions `browser` global so `wxt/browser` (which captures
// `globalThis.browser` at module load) sees something usable.
//
// The browser object reference stays stable across resets — we only reset
// internal state — because `wxt/browser` captures the object once at load.

interface FakeArea {
  __data: Record<string, unknown>;
  get: (keys: string | string[] | null) => Promise<Record<string, unknown>>;
  remove: (keys: string | string[]) => Promise<void>;
  set: (items: Record<string, unknown>) => Promise<void>;
}

function makeArea(): FakeArea {
  const data: Record<string, unknown> = {};
  const area: FakeArea = {
    __data: data,
    get: (keys) => {
      let list: string[];
      if (keys == null) {
        list = Object.keys(data);
      } else if (Array.isArray(keys)) {
        list = keys;
      } else {
        list = [keys];
      }
      const out: Record<string, unknown> = {};
      for (const k of list) {
        if (k in data) {
          out[k] = data[k];
        }
      }
      return Promise.resolve(out);
    },
    set: (items) => {
      Object.assign(data, items);
      return Promise.resolve();
    },
    remove: (keys) => {
      const list = Array.isArray(keys) ? keys : [keys];
      for (const k of list) {
        delete data[k];
      }
      return Promise.resolve();
    },
  };
  return area;
}

export interface FakeTab {
  active?: boolean;
  audible?: boolean;
  favIconUrl?: string;
  id?: number;
  title?: string;
  url?: string;
}

export type RuntimeListener = (
  msg: unknown,
  sender: unknown,
  sendResponse: (r: unknown) => void
) => boolean | undefined;

export interface SetIconCall {
  imageData?: Record<number, unknown>;
  path?: Record<number, string>;
  tabId?: number;
}

interface FakeBrowser {
  __runtimeListeners: RuntimeListener[];
  __setIconCalls: SetIconCall[];
  __tabs: FakeTab[];
  action: {
    setIcon: (details: SetIconCall) => Promise<void>;
  };
  runtime: {
    getURL: (path: string) => string;
    id: string;
    onMessage: {
      addListener: (fn: RuntimeListener) => void;
      removeListener: (fn: RuntimeListener) => void;
    };
    sendMessage: (msg: unknown) => Promise<unknown>;
  };
  storage: {
    local: FakeArea;
    session: FakeArea;
  };
  tabs: {
    get: (id: number) => Promise<FakeTab>;
    onActivated: { addListener: (fn: unknown) => void };
    onRemoved: { addListener: (fn: unknown) => void };
    query: (q: { audible?: boolean }) => Promise<FakeTab[]>;
    sendMessage: (id: number, msg: unknown) => Promise<unknown>;
    update: (id: number, props: { active?: boolean }) => Promise<void>;
  };
}

const fake: FakeBrowser = {
  __setIconCalls: [],
  __runtimeListeners: [],
  __tabs: [],
  action: {
    setIcon: (details) => {
      fake.__setIconCalls.push(details);
      return Promise.resolve();
    },
  },
  runtime: {
    id: "test-extension",
    getURL: (path) => `chrome-extension://test${path}`,
    onMessage: {
      addListener: (fn) => {
        fake.__runtimeListeners.push(fn);
      },
      removeListener: (fn) => {
        const i = fake.__runtimeListeners.indexOf(fn);
        if (i >= 0) {
          fake.__runtimeListeners.splice(i, 1);
        }
      },
    },
    sendMessage: () => Promise.resolve(undefined),
  },
  storage: {
    local: makeArea(),
    session: makeArea(),
  },
  tabs: {
    get: (id) => {
      const t = fake.__tabs.find((x) => x.id === id);
      if (!t) {
        return Promise.reject(new Error(`no tab ${id}`));
      }
      return Promise.resolve(t);
    },
    query: (q) => {
      if (q.audible === true) {
        return Promise.resolve(fake.__tabs.filter((t) => t.audible));
      }
      return Promise.resolve([...fake.__tabs]);
    },
    sendMessage: () => Promise.resolve(undefined),
    onActivated: { addListener: () => undefined },
    onRemoved: { addListener: () => undefined },
    update: () => Promise.resolve(),
  },
};

// `wxt/browser` reads `globalThis.browser` at module-load time. Set it now
// (this preload runs before any test file imports) and never replace the
// reference — only mutate its data.
(globalThis as { browser?: FakeBrowser }).browser = fake;

export function resetBrowserStub(): void {
  fake.__tabs.length = 0;
  fake.__setIconCalls.length = 0;
  fake.__runtimeListeners.length = 0;
  for (const k of Object.keys(fake.storage.local.__data)) {
    delete fake.storage.local.__data[k];
  }
  for (const k of Object.keys(fake.storage.session.__data)) {
    delete fake.storage.session.__data[k];
  }
}

export function fakeBrowser(): FakeBrowser {
  return fake;
}

export function setFakeTabs(tabs: FakeTab[]): void {
  fake.__tabs.length = 0;
  fake.__tabs.push(...tabs);
}
