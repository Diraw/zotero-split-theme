import { getPref } from "../utils/prefs";
import { isWindowAlive } from "../utils/window";

export type ThemeMode = "follow" | "light" | "dark";
type ExplicitThemeMode = Exclude<ThemeMode, "follow">;

type ThemeSettings = {
  enabled: boolean;
  appTheme: ThemeMode;
  readerTheme: ThemeMode;
  readerBackgroundTheme: ThemeMode;
  readerToolbarTheme: ThemeMode;
  readerLeftSidebarTheme: ThemeMode;
  readerSidebarTheme: ThemeMode;
};

type ResolvedThemeSettings = {
  enabled: boolean;
  appTheme: ThemeMode;
  readerTheme: ExplicitThemeMode;
  readerBackgroundTheme: ExplicitThemeMode;
  readerToolbarTheme: ExplicitThemeMode;
  readerLeftSidebarTheme: ExplicitThemeMode;
  readerSidebarTheme: ExplicitThemeMode;
};

type ThemeTokens = Record<string, string>;
type LegacyPDFPageColors = {
  background: string;
  foreground: string;
};

type WindowState = {
  refreshTimer?: number;
  recoveryTimers: Map<number, number>;
  readerLoadListener?: (event: Event) => void;
};

type TimerHandle = {
  win: Window;
  id: number;
};

const APP_STYLE_ID = "zotero-split-theme-app-style";
const APP_ATTR = "data-zst-app-theme";
const READER_TOOLBAR_STYLE_ID = "zotero-split-theme-reader-toolbar-style";
const READER_TOOLBAR_ATTR = "data-zst-reader-toolbar-theme";
const READER_LEFT_SIDEBAR_STYLE_ID =
  "zotero-split-theme-reader-left-sidebar-style";
const READER_LEFT_SIDEBAR_ATTR = "data-zst-reader-left-sidebar-theme";
const READER_THUMBNAIL_STYLE_ID = "zotero-split-theme-reader-thumbnail-style";
const READER_THUMBNAIL_ATTR = "data-zst-reader-thumbnail-theme";
const READER_BACKGROUND_STYLE_ID = "zotero-split-theme-reader-background-style";
const READER_BACKGROUND_ATTR = "data-zst-reader-background-theme";
const READER_SIDEBAR_STYLE_ID = "zotero-split-theme-reader-sidebar-style";
const READER_SIDEBAR_ATTR = "data-zst-reader-sidebar-theme";
const cachedNativeThemeTokens: Partial<Record<ExplicitThemeMode, ThemeTokens>> =
  {};
const appliedReaderColorSchemes = new WeakMap<any, ExplicitThemeMode | null>();
const pendingReaderColorSchemeReadyAt = new WeakMap<any, number>();
const READER_COLOR_SCHEME_STABILIZE_DELAY = 700;
const READER_COLOR_SCHEME_STARTUP_DELAY = 2500;
let startupTimestamp = 0;

const OFFICIAL_APP_TOKENS: Record<ExplicitThemeMode, Record<string, string>> = {
  light: {
    "accent-blue": "#4072e5",
    "accent-blue10": "rgba(64, 114, 229, 0.1019607843)",
    "accent-blue30": "rgba(64, 114, 229, 0.3019607843)",
    "accent-blue50": "rgba(64, 114, 229, 0.5019607843)",
    "accent-gold": "#cc9200",
    "accent-green": "#39bf68",
    "accent-orange": "#ff794c",
    "accent-red": "#db2c3a",
    "accent-teal": "#59adc4",
    "accent-white": "#fff",
    "accent-wood-dark": "#996b6f",
    "accent-wood": "#cc7a52",
    "accent-yellow": "#faa700",
    "accent-highlight": "rgba(255, 234, 0, 0.5019607843)",
    "fill-primary": "rgba(0, 0, 0, 0.8509803922)",
    "fill-secondary": "rgba(0, 0, 0, 0.5490196078)",
    "fill-tertiary": "rgba(0, 0, 0, 0.2509803922)",
    "fill-quarternary": "rgba(0, 0, 0, 0.1019607843)",
    "fill-quinary": "rgba(0, 0, 0, 0.0509803922)",
    "fill-senary": "rgba(0, 0, 0, 0.0196078431)",
    "color-background": "#fff",
    "color-background30": "rgba(255, 255, 255, 0.3019607843)",
    "color-background50": "rgba(255, 255, 255, 0.5019607843)",
    "color-background70": "rgba(255, 255, 255, 0.6980392157)",
    "color-border": "rgba(0, 0, 0, 0.1490196078)",
    "color-border50": "rgba(0, 0, 0, 0.0784313725)",
    "color-button": "#fff",
    "color-control": "#fff",
    "color-menu": "rgba(246, 246, 246, 0.7215686275)",
    "color-panedivider": "#dadada",
    "color-sidepane": "#f2f2f2",
    "color-tabbar": "#f2f2f2",
    "color-toolbar": "#f9f9f9",
    "color-scrollbar": "rgb(194, 194, 194)",
    "color-scrollbar-hover": "rgb(125, 125, 125)",
    "color-scrollbar-background": "transparent",
    "color-stripe": "rgba(0, 0, 0, 0.0392156863)",
    "tag-blue": "#2ea8e5",
    "tag-gray": "#aaa",
    "tag-green": "#5fb236",
    "tag-indigo": "#576dd9",
    "tag-magenta": "#e56eee",
    "tag-orange": "#f19837",
    "tag-plum": "#a6507b",
    "tag-purple": "#a28ae5",
    "tag-red": "#ff6666",
    "tag-teal": "#009980",
    "tag-yellow": "#ffd400",
    "color-quinary-on-background": "#f2f2f2",
    "color-quarternary-on-background": "#e5e5e5",
    "color-quinary-on-sidepane": "#e6e6e6",
    "color-quarternary-on-sidepane": "#d9d9d9",
    "color-stripe-on-background": "whitesmoke",
    "tag-blue-opaque": "#2ea8e5",
    "tag-gray-opaque": "#aaaaaa",
    "tag-green-opaque": "#5fb236",
    "tag-indigo-opaque": "#576dd9",
    "tag-magenta-opaque": "#e56eee",
    "tag-orange-opaque": "#f19837",
    "tag-plum-opaque": "#a6507b",
    "tag-purple-opaque": "#a28ae5",
    "tag-red-opaque": "#ff6666",
    "tag-teal-opaque": "#009980",
    "tag-yellow-opaque": "#ffd400",
    "color-accent": "#4072e5",
    "color-accent-text": "#fff",
    "color-focus-outer-border": "rgba(0, 0, 0, 0.8509803922)",
    "color-focus-border": "#fff",
  },
  dark: {
    "accent-blue": "#4072e5",
    "accent-blue10": "rgba(64, 114, 229, 0.3019607843)",
    "accent-blue30": "rgba(64, 114, 229, 0.4509803922)",
    "accent-blue50": "rgba(64, 114, 229, 0.6)",
    "accent-gold": "rgba(204, 146, 0, 0.8509803922)",
    "accent-green": "rgba(57, 191, 104, 0.8509803922)",
    "accent-orange": "rgba(255, 121, 76, 0.8509803922)",
    "accent-red": "rgba(219, 44, 58, 0.8980392157)",
    "accent-teal": "rgba(89, 173, 196, 0.8980392157)",
    "accent-white": "#fff",
    "accent-wood-dark": "#996b6f",
    "accent-wood": "rgba(204, 122, 82, 0.8980392157)",
    "accent-yellow": "rgba(250, 167, 0, 0.8)",
    "accent-highlight": "rgba(255, 212, 0, 0.1490196078)",
    "fill-primary": "rgba(255, 255, 255, 0.8980392157)",
    "fill-secondary": "rgba(255, 255, 255, 0.5490196078)",
    "fill-tertiary": "rgba(255, 255, 255, 0.3019607843)",
    "fill-quarternary": "rgba(255, 255, 255, 0.1215686275)",
    "fill-quinary": "rgba(255, 255, 255, 0.0588235294)",
    "fill-senary": "rgba(255, 255, 255, 0.031372549)",
    "color-background": "#1e1e1e",
    "color-background30": "rgba(30, 30, 30, 0.3019607843)",
    "color-background50": "rgba(30, 30, 30, 0.5019607843)",
    "color-background70": "rgba(30, 30, 30, 0.6980392157)",
    "color-border": "rgba(255, 255, 255, 0.1803921569)",
    "color-border50": "rgba(255, 255, 255, 0.0901960784)",
    "color-button": "#404040",
    "color-control": "#ccc",
    "color-menu": "rgba(40, 40, 40, 0.5803921569)",
    "color-panedivider": "#404040",
    "color-sidepane": "#303030",
    "color-tabbar": "#1e1e1e",
    "color-toolbar": "#272727",
    "color-scrollbar": "rgb(117, 117, 117)",
    "color-scrollbar-hover": "rgb(158, 158, 158)",
    "color-scrollbar-background": "transparent",
    "color-stripe": "rgba(255, 255, 255, 0.0509803922)",
    "tag-blue": "rgba(46, 168, 229, 0.8509803922)",
    "tag-gray": "rgba(170, 170, 170, 0.8)",
    "tag-green": "rgba(95, 178, 54, 0.8509803922)",
    "tag-indigo": "#576dd9",
    "tag-magenta": "rgba(229, 110, 238, 0.8509803922)",
    "tag-orange": "rgba(241, 152, 55, 0.8)",
    "tag-plum": "#a6507b",
    "tag-purple": "rgba(162, 138, 229, 0.8980392157)",
    "tag-red": "rgba(255, 102, 102, 0.8980392157)",
    "tag-teal": "#009980",
    "tag-yellow": "rgba(255, 212, 0, 0.7490196078)",
    "color-quinary-on-background": "#2b2b2b",
    "color-quarternary-on-background": "#393939",
    "color-quarternary-on-sidepane": "#494949",
    "color-stripe-on-background": "#292929",
    "tag-blue-opaque": "#2ea8e5",
    "tag-gray-opaque": "#aaaaaa",
    "tag-green-opaque": "#5fb236",
    "tag-indigo-opaque": "#576dd9",
    "tag-magenta-opaque": "#e56eee",
    "tag-orange-opaque": "#f19837",
    "tag-plum-opaque": "#a6507b",
    "tag-purple-opaque": "#a28ae5",
    "tag-red-opaque": "#ff6666",
    "tag-teal-opaque": "#009980",
    "tag-yellow-opaque": "#ffd400",
    "color-accent": "#4072e5",
    "color-accent-text": "#fff",
    "color-focus-outer-border": "#fff",
    "color-focus-border": "rgba(0, 0, 0, 0.5019607843)",
  },
};
const THEME_TOKEN_KEYS = Object.keys(OFFICIAL_APP_TOKENS.light);

const windowStates = new Map<Window, WindowState>();
const readerRefreshState = {
  refreshTimer: undefined as TimerHandle | undefined,
  recoveryTimers: new Map<number, TimerHandle>(),
};

export const SplitThemeManager = {
  startup,
  shutdown,
  registerWindow,
  unregisterWindow,
  refreshAllWindows,
  refreshAllWindowsSoon,
  refreshAllWindowsWithRecovery,
  hasLegacyReaders,
};

export function normalizeThemeMode(value: unknown): ThemeMode {
  if (value === "light" || value === "dark" || value === "follow") {
    return value;
  }
  return "follow";
}

function startup() {
  startupTimestamp = Date.now();
  cleanupDeadWindows();
  for (const win of Zotero.getMainWindows()) {
    registerWindow(win);
    applyWindowThemes(win);
  }
  refreshReaderThemesSoon(READER_COLOR_SCHEME_STARTUP_DELAY);
}

function shutdown() {
  const openReaders = getOpenReaders();
  const readersAndPreviews = getOpenReadersAndPreviews();
  for (const win of Array.from(windowStates.keys())) {
    unregisterWindow(win);
  }
  clearReaderRefreshTimers();
  clearReaderThemesFromReaders(openReaders, readersAndPreviews);
  resetReaderThemeToDefaultForReaders(openReaders);
}

function registerWindow(win: Window) {
  if (!isWindowAlive(win)) {
    return;
  }

  if (windowStates.has(win)) {
    refreshWindowSoon(win, 10);
    return;
  }

  const state: WindowState = {
    recoveryTimers: new Map(),
  };
  windowStates.set(win, state);
  state.readerLoadListener = (event: Event) => {
    const doc = event.target as Document | null;
    if (!doc || !isLegacyPDFViewerDocument(doc)) {
      return;
    }
    refreshAllWindowsWithRecovery([0, 150, 500]);
  };
  win.addEventListener("DOMContentLoaded", state.readerLoadListener, true);

  refreshWindowSoon(win, 0);
  scheduleWindowRecoveryRefreshes(win, [300, 1200]);
}

function unregisterWindow(win: Window) {
  const state = windowStates.get(win);
  if (state) {
    if (state.refreshTimer !== undefined) {
      win.clearTimeout(state.refreshTimer);
    }
    for (const timer of state.recoveryTimers.values()) {
      win.clearTimeout(timer);
    }
    if (state.readerLoadListener) {
      win.removeEventListener(
        "DOMContentLoaded",
        state.readerLoadListener,
        true,
      );
    }
    windowStates.delete(win);
  }

  cleanupWindow(win);
}

function refreshAllWindows() {
  cleanupDeadWindows();
  for (const win of Zotero.getMainWindows()) {
    registerWindow(win);
    applyWindowThemes(win);
  }
  refreshReaderThemes();
}

function refreshAllWindowsSoon(delay = 0) {
  cleanupDeadWindows();
  for (const win of Zotero.getMainWindows()) {
    registerWindow(win);
    refreshWindowSoon(win, delay);
  }
  refreshReaderThemesSoon(delay);
}

function refreshAllWindowsWithRecovery(delays: number[]) {
  cleanupDeadWindows();
  for (const win of Zotero.getMainWindows()) {
    registerWindow(win);
    scheduleWindowRecoveryRefreshes(win, delays);
  }
  if (hasLegacyReaders()) {
    scheduleReaderRecoveryRefreshes(delays);
  }
}

function refreshWindowSoon(win: Window, delay = 0) {
  const state = windowStates.get(win);
  if (!state || !isWindowAlive(win)) {
    return;
  }

  if (state.refreshTimer !== undefined) {
    win.clearTimeout(state.refreshTimer);
  }

  state.refreshTimer = win.setTimeout(() => {
    state.refreshTimer = undefined;
    applyWindowThemes(win);
  }, delay);
}

function scheduleWindowRecoveryRefreshes(win: Window, delays: number[]) {
  const state = windowStates.get(win);
  if (!state || !isWindowAlive(win)) {
    return;
  }

  for (const delay of delays) {
    const existingTimer = state.recoveryTimers.get(delay);
    if (existingTimer !== undefined) {
      win.clearTimeout(existingTimer);
    }

    const timer = win.setTimeout(() => {
      state.recoveryTimers.delete(delay);
      applyWindowThemes(win);
    }, delay);

    state.recoveryTimers.set(delay, timer);
  }
}

function applyWindowThemes(win: Window) {
  if (!isWindowAlive(win)) {
    unregisterWindow(win);
    return;
  }

  const settings = readThemeSettings();

  if (!settings.enabled) {
    clearThemeFromDocument(win.document, APP_ATTR, APP_STYLE_ID);
    clearThemeFromDocument(
      win.document,
      READER_SIDEBAR_ATTR,
      READER_SIDEBAR_STYLE_ID,
    );
    return;
  }

  const resolvedSettings = resolveThemeSettings(win.document, settings);
  applyAppThemeToDocument(win.document, settings.appTheme);
  applyReaderSidebarThemeToWindow(win, resolvedSettings.readerSidebarTheme);
}

function refreshReaderThemes() {
  const settings = readThemeSettings();
  const openReaders = getOpenReaders();
  const readersAndPreviews = getOpenReadersAndPreviews();

  if (!settings.enabled) {
    clearReaderThemesFromReaders(openReaders, readersAndPreviews);
    resetReaderThemeToDefaultForReaders(openReaders);
    return;
  }

  const resolutionDoc = getThemeResolutionDocument();
  if (!resolutionDoc) {
    return;
  }
  const resolvedSettings = resolveThemeSettings(resolutionDoc, settings);
  applyReaderThemesToReaders(openReaders, readersAndPreviews, resolvedSettings);
}

function refreshReaderThemesSoon(delay = 0) {
  const timerWin = getThemeTimerWindow();
  if (!timerWin) {
    return;
  }

  if (readerRefreshState.refreshTimer) {
    readerRefreshState.refreshTimer.win.clearTimeout(
      readerRefreshState.refreshTimer.id,
    );
  }

  readerRefreshState.refreshTimer = {
    win: timerWin,
    id: timerWin.setTimeout(() => {
      readerRefreshState.refreshTimer = undefined;
      refreshReaderThemes();
    }, delay),
  };
}

function scheduleReaderRecoveryRefreshes(delays: number[]) {
  const timerWin = getThemeTimerWindow();
  if (!timerWin) {
    return;
  }

  for (const delay of delays) {
    const existingTimer = readerRefreshState.recoveryTimers.get(delay);
    if (existingTimer) {
      existingTimer.win.clearTimeout(existingTimer.id);
    }

    const timer: TimerHandle = {
      win: timerWin,
      id: timerWin.setTimeout(() => {
        readerRefreshState.recoveryTimers.delete(delay);
        refreshReaderThemes();
      }, delay),
    };
    readerRefreshState.recoveryTimers.set(delay, timer);
  }
}

function getThemeTimerWindow() {
  for (const win of Zotero.getMainWindows()) {
    if (isWindowAlive(win)) {
      return win;
    }
  }

  for (const win of windowStates.keys()) {
    if (isWindowAlive(win)) {
      return win;
    }
  }

  return null;
}

function getThemeResolutionDocument() {
  return getThemeTimerWindow()?.document ?? null;
}

function clearReaderRefreshTimers() {
  if (readerRefreshState.refreshTimer) {
    readerRefreshState.refreshTimer.win.clearTimeout(
      readerRefreshState.refreshTimer.id,
    );
    readerRefreshState.refreshTimer = undefined;
  }

  for (const timer of readerRefreshState.recoveryTimers.values()) {
    timer.win.clearTimeout(timer.id);
  }
  readerRefreshState.recoveryTimers.clear();
}

function cleanupDeadWindows() {
  for (const win of Array.from(windowStates.keys())) {
    if (!isWindowAlive(win)) {
      unregisterWindow(win);
    }
  }
}

function cleanupWindow(win: Window) {
  if (!isWindowAlive(win)) {
    return;
  }
  clearThemeFromDocument(win.document, APP_ATTR, APP_STYLE_ID);
  clearThemeFromDocument(
    win.document,
    READER_SIDEBAR_ATTR,
    READER_SIDEBAR_STYLE_ID,
  );
}

function readThemeSettings(): ThemeSettings {
  return {
    enabled: Boolean(getPref("enabled")),
    appTheme: normalizeThemeMode(getPref("appTheme")),
    readerTheme: normalizeThemeMode(getPref("readerTheme")),
    readerBackgroundTheme: normalizeThemeMode(getPref("readerBackgroundTheme")),
    readerToolbarTheme: normalizeThemeMode(getPref("readerToolbarTheme")),
    readerLeftSidebarTheme: normalizeThemeMode(
      getPref("readerLeftSidebarTheme"),
    ),
    readerSidebarTheme: normalizeThemeMode(getPref("readerSidebarTheme")),
  };
}

function resolveThemeSettings(
  doc: Document,
  settings: ThemeSettings,
): ResolvedThemeSettings {
  const nativeAppTheme = detectUnderlyingWindowTheme(doc);

  return {
    enabled: settings.enabled,
    appTheme: settings.appTheme,
    readerTheme: resolveThemeMode(settings.readerTheme, nativeAppTheme),
    readerBackgroundTheme: resolveThemeMode(
      settings.readerBackgroundTheme,
      nativeAppTheme,
    ),
    readerToolbarTheme: resolveThemeMode(
      settings.readerToolbarTheme,
      nativeAppTheme,
    ),
    readerLeftSidebarTheme: resolveThemeMode(
      settings.readerLeftSidebarTheme,
      nativeAppTheme,
    ),
    readerSidebarTheme: resolveThemeMode(
      settings.readerSidebarTheme,
      nativeAppTheme,
    ),
  };
}

function applyAppThemeToDocument(doc: Document, theme: ThemeMode) {
  if (theme === "follow") {
    clearThemeFromDocument(doc, APP_ATTR, APP_STYLE_ID);
    return;
  }

  setThemeOnDocument(
    doc,
    APP_ATTR,
    APP_STYLE_ID,
    theme,
    buildAppThemeCSS(theme),
  );
}

function applyReaderSidebarThemeToWindow(
  win: Window,
  theme: ExplicitThemeMode,
) {
  setThemeOnDocument(
    win.document,
    READER_SIDEBAR_ATTR,
    READER_SIDEBAR_STYLE_ID,
    theme,
    buildReaderSidebarThemeCSS(theme),
  );
}

function applyReaderThemeToReaders(readers: any[], theme: ExplicitThemeMode) {
  let needsDeferredRefresh = false;
  for (const reader of readers) {
    if (!canApplyReaderColorScheme(reader)) {
      continue;
    }
    if (appliedReaderColorSchemes.get(reader) === theme) {
      continue;
    }
    if (!isReaderColorSchemeReady(reader)) {
      needsDeferredRefresh = true;
      continue;
    }
    try {
      if (typeof reader?.setColorScheme === "function") {
        reader.setColorScheme(theme);
        appliedReaderColorSchemes.set(reader, theme);
        pendingReaderColorSchemeReadyAt.delete(reader);
      }
    } catch (_error) {
      // Reader can disappear during async tab/window teardown.
    }
  }
  if (needsDeferredRefresh) {
    refreshReaderThemesSoon(READER_COLOR_SCHEME_STABILIZE_DELAY);
  }
}

function resetReaderThemeToDefaultForReaders(readers: any[]) {
  let needsDeferredRefresh = false;
  for (const reader of readers) {
    if (!canApplyReaderColorScheme(reader)) {
      appliedReaderColorSchemes.delete(reader);
      pendingReaderColorSchemeReadyAt.delete(reader);
      continue;
    }
    if (appliedReaderColorSchemes.get(reader) === null) {
      continue;
    }
    if (!isReaderColorSchemeReady(reader)) {
      needsDeferredRefresh = true;
      continue;
    }
    try {
      if (typeof reader?.setColorScheme === "function") {
        reader.setColorScheme(null);
        appliedReaderColorSchemes.set(reader, null);
        pendingReaderColorSchemeReadyAt.delete(reader);
      }
    } catch (_error) {
      // Reader can disappear during async tab/window teardown.
    }
  }
  if (needsDeferredRefresh) {
    refreshReaderThemesSoon(READER_COLOR_SCHEME_STABILIZE_DELAY);
  }
}

function applyReaderThemesToReaders(
  openReaders: any[],
  readersAndPreviews: any[],
  settings: ResolvedThemeSettings,
) {
  // Zotero 7 still needs the legacy PDF.js/sidebar pipeline, while Zotero 8
  // uses the modern reader view. CSS-based chrome themes therefore target both
  // open tabs and attachment previews.
  applyReaderToolbarThemeToReaders(openReaders, settings.readerToolbarTheme);
  applyReaderLeftSidebarThemeToReaders(
    readersAndPreviews,
    settings.readerLeftSidebarTheme,
  );
  applyReaderThumbnailThemeToReaders(readersAndPreviews, settings.readerTheme);
  applyReaderBackgroundThemeToReaders(
    readersAndPreviews,
    settings.readerBackgroundTheme,
  );
  // Zotero 8's native `setColorScheme()` mutates the live PDF.js viewer state.
  // Only apply it to fully opened reader tabs; preview readers can still be in
  // their create/render pipeline and will throw if we touch them too early.
  applyReaderThemeToReaders(openReaders, settings.readerTheme);
}

function clearReaderThemesFromReaders(
  openReaders: any[],
  readersAndPreviews: any[],
) {
  clearReaderToolbarThemeFromReaders(openReaders);
  clearReaderLeftSidebarThemeFromReaders(readersAndPreviews);
  clearReaderThumbnailThemeFromReaders(readersAndPreviews);
  clearReaderBackgroundThemeFromReaders(readersAndPreviews);
}

function applyReaderToolbarThemeToReaders(
  readers: any[],
  theme: ExplicitThemeMode,
) {
  const cssText = buildReaderToolbarThemeCSS(theme);
  for (const reader of readers) {
    const doc = getReaderShellDocument(reader);
    if (!doc) {
      continue;
    }

    setThemeOnDocument(
      doc,
      READER_TOOLBAR_ATTR,
      READER_TOOLBAR_STYLE_ID,
      theme,
      cssText,
    );
  }
}

function clearReaderToolbarThemeFromReaders(readers: any[]) {
  for (const reader of readers) {
    const doc = getReaderShellDocument(reader);
    if (!doc) {
      continue;
    }

    clearThemeFromDocument(doc, READER_TOOLBAR_ATTR, READER_TOOLBAR_STYLE_ID);
  }
}

function applyReaderLeftSidebarThemeToReaders(
  readers: any[],
  theme: ExplicitThemeMode,
) {
  const cssText = buildReaderLeftSidebarThemeCSS(theme);
  for (const reader of readers) {
    for (const doc of getReaderLeftSidebarDocuments(reader)) {
      setThemeOnDocument(
        doc,
        READER_LEFT_SIDEBAR_ATTR,
        READER_LEFT_SIDEBAR_STYLE_ID,
        theme,
        cssText,
      );
    }
  }
}

function clearReaderLeftSidebarThemeFromReaders(readers: any[]) {
  for (const reader of readers) {
    for (const doc of getReaderLeftSidebarDocuments(reader, true)) {
      clearThemeFromDocument(
        doc,
        READER_LEFT_SIDEBAR_ATTR,
        READER_LEFT_SIDEBAR_STYLE_ID,
      );
    }
  }
}

function applyReaderThumbnailThemeToReaders(
  readers: any[],
  theme: ExplicitThemeMode,
) {
  const cssText = buildReaderThumbnailThemeCSS(theme);
  for (const reader of readers) {
    let needsLegacyRerender = false;
    for (const doc of getReaderLeftSidebarDocuments(reader)) {
      const changed = setThemeOnDocument(
        doc,
        READER_THUMBNAIL_ATTR,
        READER_THUMBNAIL_STYLE_ID,
        theme,
        cssText,
      );
      if (!changed) {
        continue;
      }
      if (applyLegacyReaderThumbnailTheme(doc, theme)) {
        needsLegacyRerender = true;
      }
    }
    if (needsLegacyRerender) {
      rerenderLegacyReaderThumbnails(reader);
    }
  }
}

function clearReaderThumbnailThemeFromReaders(readers: any[]) {
  for (const reader of readers) {
    let needsLegacyRerender = false;
    for (const doc of getReaderLeftSidebarDocuments(reader, true)) {
      const changed = clearThemeFromDocument(
        doc,
        READER_THUMBNAIL_ATTR,
        READER_THUMBNAIL_STYLE_ID,
      );
      if (!changed) {
        continue;
      }
      if (resetLegacyReaderThumbnailTheme(doc)) {
        needsLegacyRerender = true;
      }
    }
    if (needsLegacyRerender) {
      rerenderLegacyReaderThumbnails(reader);
    }
  }
}

function applyReaderBackgroundThemeToReaders(
  readers: any[],
  theme: ExplicitThemeMode,
) {
  const cssText = buildReaderBackgroundThemeCSS(theme);
  for (const reader of readers) {
    for (const doc of getReaderBackgroundDocuments(reader)) {
      setThemeOnDocument(
        doc,
        READER_BACKGROUND_ATTR,
        READER_BACKGROUND_STYLE_ID,
        theme,
        cssText,
      );
    }
  }
}

function clearReaderBackgroundThemeFromReaders(readers: any[]) {
  for (const reader of readers) {
    for (const doc of getReaderBackgroundDocuments(reader, true)) {
      clearThemeFromDocument(
        doc,
        READER_BACKGROUND_ATTR,
        READER_BACKGROUND_STYLE_ID,
      );
    }
  }
}

function getOpenReaders() {
  const readers = (Zotero.Reader as any)?._readers;
  return Array.isArray(readers) ? readers : [];
}

function getOpenReadersAndPreviews() {
  const readers = new Set<any>(getOpenReaders());

  for (const win of Zotero.getMainWindows()) {
    if (!isWindowAlive(win)) {
      continue;
    }

    const previews = win.document.querySelectorAll("attachment-preview");
    for (const preview of previews) {
      const reader = (preview as any)?._reader;
      if (reader) {
        readers.add(reader);
      }
    }
  }

  return Array.from(readers);
}

function hasLegacyReaders() {
  return getOpenReadersAndPreviews().some((reader) => isLegacyReader(reader));
}

function canApplyReaderColorScheme(reader: any) {
  const primaryDoc = getReaderViewDocument(
    reader?._internalReader?._primaryView,
  );
  if (primaryDoc) {
    return true;
  }

  const secondaryDoc = getReaderViewDocument(
    reader?._internalReader?._secondaryView,
  );
  if (secondaryDoc) {
    return true;
  }

  const shellDoc = getReaderShellDocument(reader);
  return Boolean(shellDoc && isLegacyPDFViewerDocument(shellDoc));
}

function isReaderColorSchemeReady(reader: any) {
  if (isLegacyReader(reader)) {
    return true;
  }

  // Cold start is the riskiest point for Zotero 8: the reader object may exist
  // before PDF.js has completed its first render. Hold back native color-scheme
  // updates until startup stabilizes, then use the shorter per-reader debounce.
  if (
    startupTimestamp &&
    Date.now() - startupTimestamp < READER_COLOR_SCHEME_STARTUP_DELAY
  ) {
    return false;
  }

  if (appliedReaderColorSchemes.has(reader)) {
    return true;
  }

  const now = Date.now();
  const readyAt = pendingReaderColorSchemeReadyAt.get(reader);
  if (readyAt === undefined) {
    pendingReaderColorSchemeReadyAt.set(
      reader,
      now + READER_COLOR_SCHEME_STABILIZE_DELAY,
    );
    return false;
  }

  return now >= readyAt;
}

function isLegacyReader(reader: any) {
  const primaryDoc = getReaderViewDocument(
    reader?._internalReader?._primaryView,
  );
  if (primaryDoc && isLegacyPDFViewerDocument(primaryDoc)) {
    return true;
  }

  const secondaryDoc = getReaderViewDocument(
    reader?._internalReader?._secondaryView,
  );
  if (secondaryDoc && isLegacyPDFViewerDocument(secondaryDoc)) {
    return true;
  }

  const shellDoc = getReaderShellDocument(reader);
  return Boolean(shellDoc && isLegacyPDFViewerDocument(shellDoc));
}

function getReaderShellDocument(reader: any) {
  try {
    return (reader?._iframeWindow?.document as Document | undefined) || null;
  } catch (_error) {
    return null;
  }
}

function getLegacyPDFViewerApplication(doc: Document) {
  try {
    return getLegacyPDFViewerWindow(doc)?.PDFViewerApplication ?? null;
  } catch (_error) {
    return null;
  }
}

function getLegacyPDFViewerWindow(doc: Document) {
  try {
    const view = doc.defaultView as
      | (Window & {
          PDFViewerApplication?: any;
          wrappedJSObject?: Window & {
            PDFViewerApplication?: any;
            Object?: ObjectConstructor;
          };
          Object?: ObjectConstructor;
        })
      | null;
    return view?.wrappedJSObject ?? view ?? null;
  } catch (_error) {
    return null;
  }
}

function isLegacyPDFViewerDocument(doc: Document) {
  return Boolean(
    doc.getElementById("viewerContainer") &&
    doc.getElementById("sidebarContainer") &&
    getLegacyPDFViewerApplication(doc),
  );
}

function getLegacyReaderThumbnailPageColors(
  theme: ExplicitThemeMode,
): LegacyPDFPageColors {
  return theme === "dark"
    ? {
        background: "#272727",
        foreground: "#f5f5f5",
      }
    : {
        background: "#ffffff",
        foreground: "#202020",
      };
}

function refreshLegacyThumbnailViewer(viewerApplication: any) {
  try {
    viewerApplication?.forceRendering?.();
  } catch (_error) {
    // Older PDF.js viewer internals are optional across Zotero versions.
  }

  try {
    viewerApplication?.pdfRenderingQueue?.renderHighestPriority?.();
  } catch (_error) {
    // Older PDF.js viewer internals are optional across Zotero versions.
  }
}

function createLegacyPageColorsForViewer(
  doc: Document,
  pageColors: LegacyPDFPageColors | null,
) {
  if (!pageColors) {
    return null;
  }

  const targetView = getLegacyPDFViewerWindow(doc);
  if (!targetView) {
    return pageColors;
  }

  try {
    const TargetObject = targetView.Object ?? Object;
    const scopedPageColors = new TargetObject() as LegacyPDFPageColors;
    scopedPageColors.background = pageColors.background;
    scopedPageColors.foreground = pageColors.foreground;
    return scopedPageColors;
  } catch (_error) {
    return pageColors;
  }
}

function getLegacyReaderPrimaryView(reader: any) {
  return reader?._internalReader?._primaryView ?? reader?._primaryView ?? null;
}

function getLegacyReaderThumbnailController(reader: any) {
  const primaryView = getLegacyReaderPrimaryView(reader);
  const primaryDoc = getReaderViewDocument(primaryView);
  if (!primaryDoc || !isLegacyPDFViewerDocument(primaryDoc)) {
    return null;
  }
  return primaryView?._pdfThumbnails ?? null;
}

function rerenderLegacyThumbnail(thumbnail: any) {
  try {
    thumbnail?.reset?.();
  } catch (_error) {
    // Older thumbnail views may not support reset in every state.
  }
}

function rerenderLegacyReaderThumbnails(reader: any) {
  const pdfThumbnails = getLegacyReaderThumbnailController(reader);
  if (!pdfThumbnails) {
    return;
  }

  if (
    pdfThumbnails.__zstRenderHookInstalled &&
    typeof pdfThumbnails.__zstOriginalRender === "function"
  ) {
    pdfThumbnails._render = pdfThumbnails.__zstOriginalRender;
    delete pdfThumbnails.__zstOriginalRender;
    delete pdfThumbnails.__zstRenderHookInstalled;
  }

  const thumbnails = Array.isArray(pdfThumbnails?._thumbnails)
    ? pdfThumbnails._thumbnails
    : [];
  const renderedPageIndexes: number[] = [];
  const fallbackPageIndexes: number[] = [];
  for (let i = 0; i < thumbnails.length; i += 1) {
    const thumbnail = thumbnails[i];
    if (!thumbnail) {
      continue;
    }
    fallbackPageIndexes.push(i);
    if (thumbnail.image || thumbnail.div?.querySelector?.("img")) {
      renderedPageIndexes.push(i);
    }
  }

  const pageIndexes = renderedPageIndexes.length
    ? renderedPageIndexes
    : fallbackPageIndexes;
  if (pageIndexes.length) {
    pdfThumbnails.render?.(
      createLegacyPageIndexArray(thumbnails, pageIndexes),
      false,
    );
  }
}

function createLegacyPageIndexArray(sourceArray: any, values: number[]) {
  try {
    const TargetArray =
      sourceArray?.constructor && typeof sourceArray.constructor === "function"
        ? sourceArray.constructor
        : Array;
    const scopedValues = new TargetArray();
    for (const value of values) {
      scopedValues.push(value);
    }
    return scopedValues;
  } catch (_error) {
    return values;
  }
}

function syncLegacyThumbnailThemeFromDocument(doc: Document) {
  const theme = doc.documentElement?.getAttribute(READER_THUMBNAIL_ATTR);
  const pageColors =
    theme === "light" || theme === "dark"
      ? getLegacyReaderThumbnailPageColors(theme)
      : null;
  setLegacyThumbnailViewerPageColors(doc, pageColors, false);
}

function installLegacyThumbnailThemeHook(
  doc: Document,
  viewerApplication: any,
) {
  const pdfSidebar = viewerApplication?.pdfSidebar;
  if (!pdfSidebar || pdfSidebar.__zstThumbnailThemeHookInstalled) {
    return;
  }

  const originalOnUpdateThumbnails = pdfSidebar.onUpdateThumbnails;
  pdfSidebar.__zstThumbnailThemeHookInstalled = true;
  pdfSidebar.__zstOriginalOnUpdateThumbnails = originalOnUpdateThumbnails;
  pdfSidebar.onUpdateThumbnails = (...args: any[]) => {
    if (typeof originalOnUpdateThumbnails === "function") {
      originalOnUpdateThumbnails.apply(pdfSidebar, args);
    }
    syncLegacyThumbnailThemeFromDocument(doc);
  };
}

function setLegacyThumbnailViewerPageColors(
  doc: Document,
  pageColors: LegacyPDFPageColors | null,
  installHook = true,
) {
  const viewerApplication = getLegacyPDFViewerApplication(doc);
  const thumbnailViewer = viewerApplication?.pdfThumbnailViewer;
  if (!thumbnailViewer) {
    return;
  }

  if (installHook) {
    installLegacyThumbnailThemeHook(doc, viewerApplication);
  }

  const thumbnails = Array.isArray(thumbnailViewer._thumbnails)
    ? thumbnailViewer._thumbnails
    : [];
  const scopedPageColors = createLegacyPageColorsForViewer(doc, pageColors);

  thumbnailViewer.pageColors = scopedPageColors;
  for (const thumbnail of thumbnails) {
    thumbnail.pageColors = scopedPageColors;
    rerenderLegacyThumbnail(thumbnail);
  }

  refreshLegacyThumbnailViewer(viewerApplication);
}

function applyLegacyReaderThumbnailTheme(
  doc: Document,
  theme: ExplicitThemeMode,
) {
  if (!isLegacyPDFViewerDocument(doc)) {
    return false;
  }

  // Zotero 7 thumbnails still depend on PDF.js `pageColors`. Keep that legacy
  // state in sync with the effective thumbnail theme before asking the old
  // rendering queue to repaint.
  setLegacyThumbnailViewerPageColors(
    doc,
    getLegacyReaderThumbnailPageColors(theme),
  );
  return true;
}

function resetLegacyReaderThumbnailTheme(doc: Document) {
  if (!isLegacyPDFViewerDocument(doc)) {
    return false;
  }

  setLegacyThumbnailViewerPageColors(doc, null);
  return true;
}

function getReaderBackgroundDocuments(reader: any, includeShell = false) {
  const docs: Document[] = [];

  if (includeShell) {
    const shellDoc = getReaderShellDocument(reader);
    if (shellDoc) {
      docs.push(shellDoc);
    }
  }

  const primaryDoc = getReaderViewDocument(
    reader?._internalReader?._primaryView,
  );
  if (primaryDoc) {
    docs.push(primaryDoc);
  }

  const secondaryDoc = getReaderViewDocument(
    reader?._internalReader?._secondaryView,
  );
  if (secondaryDoc && secondaryDoc !== primaryDoc) {
    docs.push(secondaryDoc);
  }

  return docs;
}

function getReaderLeftSidebarDocuments(reader: any, includeShell = true) {
  const seen = new Set<Document>();
  const docs: Document[] = [];

  for (const doc of getReaderBackgroundDocuments(reader, includeShell)) {
    if (seen.has(doc)) {
      continue;
    }
    seen.add(doc);
    docs.push(doc);
  }

  return docs;
}

function getReaderViewDocument(view: any) {
  try {
    return (view?._iframeWindow?.document as Document | undefined) || null;
  } catch (_error) {
    return null;
  }
}

function resolveThemeMode(
  theme: ThemeMode,
  fallbackTheme: ExplicitThemeMode,
): ExplicitThemeMode {
  return theme === "follow" ? fallbackTheme : theme;
}

function isReaderShellDocument(doc: Document | null) {
  if (!doc) {
    return false;
  }

  try {
    if (doc.location?.href === "resource://zotero/reader/reader.html") {
      return true;
    }
  } catch (_error) {
    return isLegacyPDFViewerDocument(doc);
  }

  return isLegacyPDFViewerDocument(doc);
}

function detectDocumentTheme(doc: Document): ExplicitThemeMode {
  const root = doc.documentElement as HTMLElement | null;
  if (!root) {
    return "light";
  }

  const explicitTheme = root.getAttribute(APP_ATTR);
  if (explicitTheme === "light" || explicitTheme === "dark") {
    return explicitTheme;
  }

  try {
    const view = doc.defaultView;
    if (!view) {
      return "light";
    }

    const rootStyle = view.getComputedStyle(root);
    if (!rootStyle) {
      return "light";
    }
    const colorScheme = rootStyle.colorScheme.trim();
    if (colorScheme.includes("dark")) {
      return "dark";
    }
    if (colorScheme.includes("light")) {
      return "light";
    }

    const bodyStyle = doc.body ? view.getComputedStyle(doc.body) : null;
    const background =
      rootStyle.getPropertyValue("--color-background").trim() ||
      rootStyle.backgroundColor ||
      bodyStyle?.backgroundColor ||
      "";

    return isDarkColor(background) ? "dark" : "light";
  } catch (_error) {
    return "light";
  }
}

function detectUnderlyingWindowTheme(doc: Document): ExplicitThemeMode {
  const root = doc.documentElement;
  if (!root) {
    return "light";
  }

  const existingAttr = root.getAttribute(APP_ATTR);
  const existingStyle = doc.getElementById(
    APP_STYLE_ID,
  ) as HTMLStyleElement | null;

  try {
    if (existingAttr !== null) {
      root.removeAttribute(APP_ATTR);
    }
    existingStyle?.remove();
    const theme = detectDocumentTheme(doc);
    cacheThemeTokensFromDocument(doc, theme);
    return theme;
  } finally {
    if (existingAttr === "light" || existingAttr === "dark") {
      root.setAttribute(APP_ATTR, existingAttr);
    }

    if (existingStyle && !doc.getElementById(APP_STYLE_ID)) {
      const parent = doc.head || root;
      parent.appendChild(existingStyle);
    }
  }
}

function cacheThemeTokensFromDocument(doc: Document, theme: ExplicitThemeMode) {
  const tokens = readThemeTokensFromDocument(doc);
  if (Object.keys(tokens).length === 0) {
    return;
  }

  cachedNativeThemeTokens[theme] = {
    ...OFFICIAL_APP_TOKENS[theme],
    ...tokens,
  } as ThemeTokens;
}

function readThemeTokensFromDocument(doc: Document) {
  const root = doc.documentElement;
  const view = doc.defaultView;
  if (!root || !view) {
    return {};
  }

  try {
    const style = view.getComputedStyle(root);
    if (!style) {
      return {};
    }

    return THEME_TOKEN_KEYS.reduce<Partial<ThemeTokens>>((acc, key) => {
      const value = style.getPropertyValue(`--${key}`).trim();
      if (value) {
        acc[key] = value;
      }
      return acc;
    }, {});
  } catch (_error) {
    return {};
  }
}

function isDarkColor(color: string) {
  const rgb = parseColor(color);
  if (!rgb) {
    return false;
  }

  const [r, g, b] = rgb;
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance < 0.5;
}

function parseColor(color: string) {
  const normalized = color.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const hexMatch = normalized.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    const hex = hexMatch[1];
    if (hex.length === 3) {
      return hex.split("").map((value) => parseInt(value.repeat(2), 16));
    }
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  }

  const rgbMatch = normalized.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    return rgbMatch.slice(1, 4).map((value) => Number.parseInt(value, 10));
  }

  return null;
}

function hasActiveReader(win: Window) {
  try {
    return Boolean((win as any).ZoteroStandalone?.currentReader);
  } catch (_error) {
    return false;
  }
}

function setThemeOnDocument(
  doc: Document,
  attrName: string,
  styleID: string,
  theme: Exclude<ThemeMode, "follow">,
  cssText: string,
) {
  const root = doc.documentElement;
  if (!root) {
    return;
  }

  let style = doc.getElementById(styleID) as HTMLStyleElement | null;
  if (root.getAttribute(attrName) === theme && style?.textContent === cssText) {
    return false;
  }

  root.setAttribute(attrName, theme);

  if (!style) {
    style = doc.createElement("style");
    style.id = styleID;
    const parent = doc.head || root;
    parent.appendChild(style);
  }
  style.textContent = cssText;
  return true;
}

function clearThemeFromDocument(
  doc: Document,
  attrName: string,
  styleID: string,
) {
  const root = doc.documentElement;
  const attrPresent = root?.hasAttribute(attrName) ?? false;
  const style = doc.getElementById(styleID);
  if (!attrPresent && !style) {
    return false;
  }
  doc.documentElement?.removeAttribute(attrName);
  style?.remove();
  return true;
}

function buildTokenDeclarations(theme: Exclude<ThemeMode, "follow">) {
  return Object.entries(getThemeTokens(theme))
    .map(([key, value]) => `  --${key}: ${value};`)
    .join("\n");
}

function getThemeTokens(theme: ExplicitThemeMode) {
  return {
    ...OFFICIAL_APP_TOKENS[theme],
    ...(cachedNativeThemeTokens[theme] ?? {}),
  } as ThemeTokens;
}

function buildAppThemeCSS(theme: Exclude<ThemeMode, "follow">) {
  const tokenDeclarations = buildTokenDeclarations(theme);

  return `
:root[${APP_ATTR}="${theme}"] {
  color-scheme: ${theme};
${tokenDeclarations}
  --material-background: var(--color-background);
  --material-background30: var(--color-background30);
  --material-background50: var(--color-background50);
  --material-background70: var(--color-background70);
  --material-button: var(--color-button);
  --material-control: var(--color-control);
  --material-menu: var(--color-menu);
  --material-sidepane: var(--color-sidepane);
  --material-tabbar: var(--color-tabbar);
  --material-toolbar: var(--color-toolbar);
  --material-mix-quinary: var(--color-quinary-on-background);
  --material-mix-quarternary: var(--color-quarternary-on-background);
  --material-stripe: var(--color-stripe-on-background);
  --material-border-transparent: 1px solid transparent;
  --material-border: 1px solid var(--color-border);
  --material-border50: 1px solid var(--color-border50);
  --material-panedivider: 1px solid var(--color-panedivider);
  --material-border-quinary: 1px solid var(--fill-quinary);
  --material-border-quarternary: 1px solid var(--fill-quarternary);
  --default-focusring-width: 1px;
  --width-focus-outer-border: 2px;
  --width-focus-border: 1px;
  --color-form-element-base-background: var(--color-background);
}
`;
}

function buildReaderToolbarThemeCSS(theme: Exclude<ThemeMode, "follow">) {
  const tokenDeclarations = buildTokenDeclarations(theme);

  return `
:root[${READER_TOOLBAR_ATTR}="${theme}"] .toolbar {
${tokenDeclarations}
  --material-background: var(--color-background);
  --material-toolbar: var(--color-toolbar);
  --material-border-quinary: 1px solid var(--fill-quinary);
  --material-panedivider: 1px solid var(--color-panedivider);
  background: var(--material-toolbar) !important;
  border-bottom: var(--material-panedivider) !important;
  color: var(--fill-primary) !important;
}

:root[${READER_TOOLBAR_ATTR}="${theme}"] .toolbar #numPages {
  color: var(--fill-secondary) !important;
}

:root[${READER_TOOLBAR_ATTR}="${theme}"] .toolbar .divider {
  background: var(--fill-quinary) !important;
}

:root[${READER_TOOLBAR_ATTR}="${theme}"] .toolbar .toolbar-button {
  color: var(--fill-secondary) !important;
}

:root[${READER_TOOLBAR_ATTR}="${theme}"] .toolbar .toolbar-button:hover {
  background-color: var(--fill-quinary) !important;
}

:root[${READER_TOOLBAR_ATTR}="${theme}"] .toolbar .toolbar-button:active,
:root[${READER_TOOLBAR_ATTR}="${theme}"] .toolbar .toolbar-button.active,
:root[${READER_TOOLBAR_ATTR}="${theme}"] .toolbar .toolbar-button.active-pseudo-class-fix {
  background-color: var(--fill-quarternary) !important;
}

:root[${READER_TOOLBAR_ATTR}="${theme}"] .toolbar .toolbar-text-input,
:root[${READER_TOOLBAR_ATTR}="${theme}"] .toolbar .select > select {
  background: var(--material-background) !important;
  color: var(--fill-primary) !important;
  border-color: var(--fill-quinary) !important;
}
`;
}

function buildReaderLeftSidebarThemeCSS(theme: Exclude<ThemeMode, "follow">) {
  const tokenDeclarations = buildTokenDeclarations(theme);

  return `
:root[${READER_LEFT_SIDEBAR_ATTR}="${theme}"] :is(
  #sidebarContainer,
  #sidebarContent,
  #toolbarSidebar,
  #thumbnailView,
  #sidebarContainer .sidebar-toolbar,
  #sidebarContainer .toolbar,
  #sidebarContainer .viewWrapper
) {
${tokenDeclarations}
  --material-background: var(--color-background);
  --material-sidepane: var(--color-sidepane);
  --material-toolbar: var(--color-toolbar);
  --material-border-quinary: 1px solid var(--fill-quinary);
  --material-border-quarternary: 1px solid var(--fill-quarternary);
  --material-panedivider: 1px solid var(--color-panedivider);
  --main-color: var(--fill-primary);
  --toolbar-icon-bg-color: var(--fill-secondary);
  --toolbar-icon-hover-bg-color: var(--fill-primary);
  --sidebar-toolbar-bg-color: var(--material-toolbar);
  --sidebar-narrow-bg-color: var(--material-sidepane);
  --button-hover-color: var(--fill-quinary);
  --toggled-btn-color: var(--fill-primary);
  --toggled-btn-bg-color: var(--fill-quarternary);
  --toggled-hover-active-btn-color: var(--fill-quinary);
  --thumbnail-hover-color: var(--fill-quarternary);
  --thumbnail-selected-color: var(--color-accent);
  color-scheme: ${theme};
  background-color: var(--material-sidepane) !important;
  color: var(--fill-primary) !important;
}

:root[${READER_LEFT_SIDEBAR_ATTR}="${theme}"] #sidebarContainer {
  border-inline-end: var(--material-panedivider) !important;
}

:root[${READER_LEFT_SIDEBAR_ATTR}="${theme}"] #sidebarContainer .divider,
:root[${READER_LEFT_SIDEBAR_ATTR}="${theme}"] #sidebarContainer .split-view-resizer,
:root[${READER_LEFT_SIDEBAR_ATTR}="${theme}"] #sidebarResizer {
  background: var(--fill-quinary) !important;
}

:root[${READER_LEFT_SIDEBAR_ATTR}="${theme}"] #sidebarContainer .toolbar-button,
:root[${READER_LEFT_SIDEBAR_ATTR}="${theme}"] #sidebarContainer .toolbarButton,
:root[${READER_LEFT_SIDEBAR_ATTR}="${theme}"] #sidebarContainer .secondaryToolbarButton,
:root[${READER_LEFT_SIDEBAR_ATTR}="${theme}"] #sidebarContainer button {
  color: var(--fill-secondary) !important;
}

:root[${READER_LEFT_SIDEBAR_ATTR}="${theme}"] #sidebarContainer .toolbar-button:hover,
:root[${READER_LEFT_SIDEBAR_ATTR}="${theme}"] #sidebarContainer .toolbarButton:hover,
:root[${READER_LEFT_SIDEBAR_ATTR}="${theme}"] #sidebarContainer .secondaryToolbarButton:hover,
:root[${READER_LEFT_SIDEBAR_ATTR}="${theme}"] #sidebarContainer button:hover {
  background-color: var(--fill-quinary) !important;
}

:root[${READER_LEFT_SIDEBAR_ATTR}="${theme}"] #sidebarContainer .toolbar-button:active,
:root[${READER_LEFT_SIDEBAR_ATTR}="${theme}"] #sidebarContainer .toolbar-button.active,
:root[${READER_LEFT_SIDEBAR_ATTR}="${theme}"] #sidebarContainer .toolbar-button.active-pseudo-class-fix,
:root[${READER_LEFT_SIDEBAR_ATTR}="${theme}"] #sidebarContainer .toolbarButton:active,
:root[${READER_LEFT_SIDEBAR_ATTR}="${theme}"] #sidebarContainer .toolbarButton.toggled,
:root[${READER_LEFT_SIDEBAR_ATTR}="${theme}"] #sidebarContainer .secondaryToolbarButton:active,
:root[${READER_LEFT_SIDEBAR_ATTR}="${theme}"] #sidebarContainer .secondaryToolbarButton.toggled,
:root[${READER_LEFT_SIDEBAR_ATTR}="${theme}"] #sidebarContainer button:active,
:root[${READER_LEFT_SIDEBAR_ATTR}="${theme}"] #sidebarContainer button[aria-pressed="true"] {
  background-color: var(--fill-quarternary) !important;
}

:root[${READER_LEFT_SIDEBAR_ATTR}="${theme}"] #sidebarContainer :is(
  input,
  .search-input,
  .toolbar-text-input,
  .text-input
) {
  background: var(--material-background) !important;
  color: var(--fill-primary) !important;
  border-color: var(--fill-quinary) !important;
}

:root[${READER_LEFT_SIDEBAR_ATTR}="${theme}"] #sidebarContainer :is(
  .secondary,
  .placeholder,
  .muted
) {
  color: var(--fill-secondary) !important;
}

`;
}

function buildReaderThumbnailThemeCSS(theme: Exclude<ThemeMode, "follow">) {
  const pageBackground = theme === "dark" ? "#272727" : "#ffffff";
  const imageFilter =
    theme === "dark"
      ? "invert(90%) saturate(100%) hue-rotate(180deg) brightness(100%) contrast(125%)"
      : "none";

  return `
/* Zotero 7 uses the legacy #thumbnailView/.thumbnailImage tree, while Zotero 8
   renders React thumbnails under .thumbnails-view and applies its own invert
   filter to the .image container in dark content mode. */
:root[${READER_THUMBNAIL_ATTR}="${theme}"] #thumbnailView .thumbnail,
:root[${READER_THUMBNAIL_ATTR}="${theme}"] #thumbnailView .thumbnailImage,
:root[${READER_THUMBNAIL_ATTR}="${theme}"] .thumbnails-view .thumbnail .image,
:root[${READER_THUMBNAIL_ATTR}="${theme}"] .thumbnails-view .thumbnail .placeholder {
  background-color: ${pageBackground} !important;
}

:root[${READER_THUMBNAIL_ATTR}="${theme}"] .thumbnails-view .thumbnail .image {
  background-color: ${pageBackground} !important;
  filter: ${imageFilter} !important;
}

:root[${READER_THUMBNAIL_ATTR}="${theme}"] #thumbnailView .thumbnailImage {
  background-color: ${pageBackground} !important;
  filter: ${imageFilter} !important;
}

:root[${READER_THUMBNAIL_ATTR}="${theme}"] .thumbnails-view .thumbnail img {
  background-color: ${pageBackground} !important;
  filter: none !important;
}
`;
}

function buildReaderSidebarThemeCSS(theme: Exclude<ThemeMode, "follow">) {
  const tokenDeclarations = buildTokenDeclarations(theme);

  return `
:root[${READER_SIDEBAR_ATTR}="${theme}"] :is(
  #zotero-context-pane-inner,
  #zotero-context-pane-deck,
  #zotero-context-pane-item-deck,
  #zotero-context-pane-notes-deck,
  #zotero-context-pane-sidenav,
  #zotero-context-pane-inner .zotero-item-pane-content,
  #zotero-context-pane-inner .notes-pane-deck
) {
${tokenDeclarations}
  --material-background: var(--color-background);
  --material-sidepane: var(--color-sidepane);
  --material-toolbar: var(--color-toolbar);
  --material-border-quinary: 1px solid var(--fill-quinary);
  --material-border-quarternary: 1px solid var(--fill-quarternary);
  --material-panedivider: 1px solid var(--color-panedivider);
  color-scheme: ${theme};
  background-color: var(--material-sidepane) !important;
  color: var(--fill-primary) !important;
}

:root[${READER_SIDEBAR_ATTR}="${theme}"] #zotero-context-pane-inner :is(
  .meta-label,
  .key,
  .secondary,
  .tag-selector-message
) {
  color: var(--fill-secondary) !important;
}
`;
}

function buildReaderBackgroundThemeCSS(theme: Exclude<ThemeMode, "follow">) {
  const backgroundColor = theme === "dark" ? "#272727" : "#f2f2f2";

  return `
:root[${READER_BACKGROUND_ATTR}="${theme}"] body,
:root[${READER_BACKGROUND_ATTR}="${theme}"] #viewerContainer,
:root[${READER_BACKGROUND_ATTR}="${theme}"] body #viewerContainer {
  background-color: ${backgroundColor} !important;
}

:root[${READER_BACKGROUND_ATTR}="${theme}"] :is(
  body,
  #viewerContainer
) {
  background-image: none !important;
}
`;
}
