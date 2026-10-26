/**
 * URL-guard plugin for the Scramjet 2.0.67-alpha.2 controller engine.
 *
 * Ported from AIO (src/lib/scramjet-search-url-guard.ts) via the user-supplied
 * Proxy3 examples, cross-checked against MercuryWorkshop's controller demo.
 * Stock 2.0.67-alpha.2 coerces missing values into real navigations:
 *   location = undefined   -> /undefined
 *   `/?q=${undefined}`     -> ?q=undefined
 * Sites like TikTok then land on their own 404 page ("fromUrl=/undefined").
 * This guard intercepts rewriteUrl / the client url setter, blocks or
 * sanitizes those garbage navigations, and reinstates a minimal Navigation
 * API stub (Scramjet deletes window.navigation, which DDG-style SPA search
 * relies on).
 *
 * Exposed as a ManagedPlugin so it can be passed to
 * controller.createFrame(iframe, { plugins: [createScramjetUrlGuardPlugin(api)] }).
 */
(() => {
  const GARBAGE_VALUES = new Set(["undefined", "null", "nan", "[object object]"]);

  const isGarbageValue = (value) => GARBAGE_VALUES.has(value.trim().toLowerCase());

  const isGarbagePathname = (pathname) =>
    pathname.split("/").filter(Boolean).some((segment) => isGarbageValue(segment));

  /** Read the visible search box value from a proxied document (DDG / generic). */
  const readProxiedSearchInputQuery = (doc) => {
    if (!doc) return "";
    const selectors = [
      "#search_form_input",
      "input[name='q']",
      "input[type='search']",
      "input[name='query']",
      "textarea[name='q']",
    ];
    for (const selector of selectors) {
      const el = doc.querySelector(selector);
      if (el && "value" in el && typeof el.value === "string") {
        const value = el.value.trim();
        if (value && !isGarbageValue(value)) return value;
      }
    }
    return "";
  };

  /**
   * Sanitize a navigate/rewrite target.
   * - Returns a fixed absolute or relative URL string when recoverable.
   * - Returns null when the navigation should be aborted.
   * - Returns the original string when it is already fine.
   */
  const sanitizeScramjetNavigateUrl = (raw, baseHref, recoveryQuery) => {
    if (raw == null) {
      const q = recoveryQuery?.trim();
      return q && !isGarbageValue(q) ? `/?q=${encodeURIComponent(q)}` : null;
    }

    const asString = typeof raw === "string" ? raw : String(raw);
    if (!asString.trim()) return null;
    if (isGarbageValue(asString)) {
      const q = recoveryQuery?.trim();
      return q && !isGarbageValue(q) ? `/?q=${encodeURIComponent(q)}` : null;
    }

    try {
      const base = baseHref.trim() || "https://example.com/";
      const u = new URL(asString, base);
      const qParam = u.searchParams.get("q");
      const pathGarbage = isGarbagePathname(u.pathname);
      const queryGarbage = qParam != null && isGarbageValue(qParam);
      if (!pathGarbage && !queryGarbage) return asString;

      const q = recoveryQuery?.trim();
      if (!q || isGarbageValue(q)) return null;

      const next = new URL(u.href);
      if (pathGarbage) next.pathname = "/";
      next.search = "";
      next.searchParams.set("q", q);
      for (const [key, value] of u.searchParams) {
        if (key === "q") continue;
        if (isGarbageValue(value)) continue;
        next.searchParams.set(key, value);
      }
      // Prefer relative when the site used a relative target (keeps SPAs happier).
      if (/^https?:\/\//i.test(asString.trim())) return next.href;
      return `${next.pathname}${next.search}${next.hash}`;
    } catch {
      return asString;
    }
  };

  const GUARD_INSTALLED = Symbol.for("ojjy runtime url guard");

  /**
   * Install rewriteUrl + url-setter guards on a Scramjet client, and a minimal
   * Navigation API stub (Scramjet deletes the real one; DDG search relies on it).
   */
  const installScramjetSearchUrlGuard = (win, client) => {
    if (win[GUARD_INSTALLED]) return;
    win[GUARD_INSTALLED] = true;

    const recoveryQuery = () => readProxiedSearchInputQuery(win.document);

    const readClientHref = () => {
      try {
        const current = client.url;
        if (typeof current === "string") return current;
        return current?.href ?? "https://example.com/";
      } catch {
        return "https://example.com/";
      }
    };

    const origRewrite = client.rewriteUrl.bind(client);
    client.rewriteUrl = (url, options) => {
      const fixed = sanitizeScramjetNavigateUrl(url, readClientHref(), recoveryQuery());
      if (fixed == null) {
        return origRewrite(readClientHref(), options);
      }
      return origRewrite(fixed, options);
    };

    const proto = Object.getPrototypeOf(client);
    const descriptor =
      Object.getOwnPropertyDescriptor(client, "url") ??
      (proto ? Object.getOwnPropertyDescriptor(proto, "url") : undefined);
    if (descriptor?.get && descriptor?.set) {
      const origGet = descriptor.get;
      const origSet = descriptor.set;
      Object.defineProperty(client, "url", {
        configurable: true,
        enumerable: true,
        get() {
          return origGet.call(this);
        },
        set(value) {
          let base = "https://example.com/";
          try {
            base = String(origGet.call(this)?.href ?? base);
          } catch {
            /* ignore */
          }
          const fixed = sanitizeScramjetNavigateUrl(value, base, recoveryQuery());
          if (fixed == null) return;
          return origSet.call(this, fixed);
        },
      });
    }

    installNavigationApiStub(win, client);
  };

  const installNavigationApiStub = (win, client) => {
    // Scramjet deletes window.navigation; DDG's SPA search often needs it.
    try {
      if ("navigation" in win && win.navigation) return;
    } catch {
      /* continue */
    }

    const makeEntry = () => {
      let href = "about:blank";
      try {
        const current = client.url;
        href = typeof current === "string" ? current : current?.href ?? href;
      } catch {
        /* ignore */
      }
      return {
        url: href,
        key: "ojjy-stub",
        id: "ojjy-stub",
        index: 0,
        sameDocument: true,
        getState: () => null,
      };
    };

    const listeners = new Map();

    const navigation = {
      get currentEntry() {
        return makeEntry();
      },
      get transition() {
        return null;
      },
      get canGoBack() {
        return win.history.length > 1;
      },
      get canGoForward() {
        return false;
      },
      entries() {
        return [makeEntry()];
      },
      navigate(url) {
        try {
          client.url = url;
        } catch {
          /* ignore */
        }
        const entry = makeEntry();
        return {
          committed: Promise.resolve(entry),
          finished: Promise.resolve(entry),
        };
      },
      reload() {
        try {
          win.location.reload();
        } catch {
          /* ignore */
        }
        const entry = makeEntry();
        return {
          committed: Promise.resolve(entry),
          finished: Promise.resolve(entry),
        };
      },
      back() {
        try {
          win.history.back();
        } catch {
          /* ignore */
        }
      },
      forward() {
        try {
          win.history.forward();
        } catch {
          /* ignore */
        }
      },
      traverseTo() {
        /* unsupported stub */
      },
      updateCurrentEntry() {
        /* unsupported stub */
      },
      addEventListener(type, listener) {
        let set = listeners.get(type);
        if (!set) {
          set = new Set();
          listeners.set(type, set);
        }
        set.add(listener);
      },
      removeEventListener(type, listener) {
        listeners.get(type)?.delete(listener);
      },
      dispatchEvent() {
        return true;
      },
    };

    try {
      Object.defineProperty(win, "navigation", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: navigation,
      });
    } catch {
      try {
        win.navigation = navigation;
      } catch {
        /* ignore */
      }
    }
  };

  /**
   * Build the ManagedPlugin handed to controller.createFrame(iframe, { plugins }).
   * `api` is the $scramjetController global (must expose ManagedPlugin).
   */
  globalThis.createScramjetUrlGuardPlugin = (api) => {
    if (!api?.ManagedPlugin) return null;

    class ScramjetUrlGuardPlugin extends api.ManagedPlugin {
      constructor() {
        super("url-guard", []);
      }

      install(frame) {
        this.tap(frame.hooks.init.post, (context) => {
          if (context.isTopLevel === false) return;
          installScramjetSearchUrlGuard(context.window, context.client);
        });
      }
    }

    return new ScramjetUrlGuardPlugin();
  };
})();
