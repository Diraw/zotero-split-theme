import { getPref } from "../utils/prefs";
import { isWindowAlive } from "../utils/window";

export type ThemeMode = "follow" | "light" | "dark";

type ThemeSettings = {
  enabled: boolean;
  appTheme: ThemeMode;
  readerTheme: ThemeMode;
  readerToolbarTheme: ThemeMode;
  readerLeftSidebarTheme: ThemeMode;
  readerSidebarTheme: ThemeMode;
};

type WindowState = {
  refreshTimer?: number;
};

const APP_STYLE_ID = "zotero-split-theme-app-style";
const APP_ATTR = "data-zst-app-theme";
const READER_TOOLBAR_STYLE_ID = "zotero-split-theme-reader-toolbar-style";
const READER_TOOLBAR_ATTR = "data-zst-reader-toolbar-theme";
const READER_LEFT_SIDEBAR_STYLE_ID =
  "zotero-split-theme-reader-left-sidebar-style";
const READER_LEFT_SIDEBAR_ATTR = "data-zst-reader-left-sidebar-theme";
const READER_SIDEBAR_STYLE_ID = "zotero-split-theme-reader-sidebar-style";
const READER_SIDEBAR_ATTR = "data-zst-reader-sidebar-theme";
let lastAppliedReaderScheme: Exclude<ThemeMode, "follow"> | null | undefined;

const OFFICIAL_APP_TOKENS: Record<
  Exclude<ThemeMode, "follow">,
  Record<string, string>
> = {
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

const windowStates = new Map<Window, WindowState>();

export const SplitThemeManager = {
  startup,
  shutdown,
  registerWindow,
  unregisterWindow,
  refreshAllWindows,
  refreshAllWindowsSoon,
};

export function normalizeThemeMode(value: unknown): ThemeMode {
  if (value === "light" || value === "dark" || value === "follow") {
    return value;
  }
  return "follow";
}

function startup() {
  refreshAllWindows();
}

function shutdown() {
  for (const win of Array.from(windowStates.keys())) {
    unregisterWindow(win);
  }
  clearReaderLeftSidebarThemeFromOpenReaders();
  clearReaderToolbarThemeFromOpenReaders();
  applyReaderThemeToOpenReaders("follow");
  lastAppliedReaderScheme = undefined;
}

function registerWindow(win: Window) {
  if (!isWindowAlive(win)) {
    return;
  }

  if (windowStates.has(win)) {
    refreshWindowSoon(win, 10);
    return;
  }

  const state: WindowState = {};
  windowStates.set(win, state);

  refreshWindowSoon(win, 0);
  refreshWindowSoon(win, 300);
  refreshWindowSoon(win, 1200);
}

function unregisterWindow(win: Window) {
  const state = windowStates.get(win);
  if (state) {
    if (state.refreshTimer !== undefined) {
      win.clearTimeout(state.refreshTimer);
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
}

function refreshAllWindowsSoon(delay = 0) {
  cleanupDeadWindows();
  for (const win of Zotero.getMainWindows()) {
    registerWindow(win);
    refreshWindowSoon(win, delay);
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
    clearReaderLeftSidebarThemeFromOpenReaders();
    clearReaderToolbarThemeFromOpenReaders();
    applyReaderThemeToOpenReaders("follow");
    return;
  }

  applyAppThemeToDocument(win.document, settings.appTheme);
  applyReaderSidebarThemeToWindow(win, settings.readerSidebarTheme);
  applyReaderLeftSidebarThemeToOpenReaders(settings.readerLeftSidebarTheme);
  applyReaderToolbarThemeToOpenReaders(settings.readerToolbarTheme);
  applyReaderThemeToOpenReaders(settings.readerTheme);
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
    readerToolbarTheme: normalizeThemeMode(getPref("readerToolbarTheme")),
    readerLeftSidebarTheme: normalizeThemeMode(
      getPref("readerLeftSidebarTheme"),
    ),
    readerSidebarTheme: normalizeThemeMode(getPref("readerSidebarTheme")),
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

function applyReaderToolbarThemeToOpenReaders(theme: ThemeMode) {
  for (const reader of getOpenReaders()) {
    const doc = getReaderShellDocument(reader);
    if (!doc) {
      continue;
    }

    if (theme === "follow") {
      clearThemeFromDocument(doc, READER_TOOLBAR_ATTR, READER_TOOLBAR_STYLE_ID);
      continue;
    }

    setThemeOnDocument(
      doc,
      READER_TOOLBAR_ATTR,
      READER_TOOLBAR_STYLE_ID,
      theme,
      buildReaderToolbarThemeCSS(theme),
    );
  }
}

function applyReaderLeftSidebarThemeToOpenReaders(theme: ThemeMode) {
  for (const reader of getOpenReaders()) {
    const doc = getReaderShellDocument(reader);
    if (!doc) {
      continue;
    }

    if (theme === "follow") {
      clearThemeFromDocument(
        doc,
        READER_LEFT_SIDEBAR_ATTR,
        READER_LEFT_SIDEBAR_STYLE_ID,
      );
      continue;
    }

    setThemeOnDocument(
      doc,
      READER_LEFT_SIDEBAR_ATTR,
      READER_LEFT_SIDEBAR_STYLE_ID,
      theme,
      buildReaderLeftSidebarThemeCSS(theme),
    );
  }
}

function clearReaderToolbarThemeFromOpenReaders() {
  for (const reader of getOpenReaders()) {
    const doc = getReaderShellDocument(reader);
    if (!doc) {
      continue;
    }

    clearThemeFromDocument(doc, READER_TOOLBAR_ATTR, READER_TOOLBAR_STYLE_ID);
  }
}

function clearReaderLeftSidebarThemeFromOpenReaders() {
  for (const reader of getOpenReaders()) {
    const doc = getReaderShellDocument(reader);
    if (!doc) {
      continue;
    }

    clearThemeFromDocument(
      doc,
      READER_LEFT_SIDEBAR_ATTR,
      READER_LEFT_SIDEBAR_STYLE_ID,
    );
  }
}

function applyReaderSidebarThemeToWindow(win: Window, theme: ThemeMode) {
  if (theme === "follow") {
    clearThemeFromDocument(
      win.document,
      READER_SIDEBAR_ATTR,
      READER_SIDEBAR_STYLE_ID,
    );
    return;
  }

  setThemeOnDocument(
    win.document,
    READER_SIDEBAR_ATTR,
    READER_SIDEBAR_STYLE_ID,
    theme,
    buildReaderSidebarThemeCSS(theme),
  );
}

function applyReaderThemeToOpenReaders(theme: ThemeMode) {
  const colorScheme = theme === "follow" ? null : theme;

  if (lastAppliedReaderScheme === colorScheme) {
    return;
  }

  lastAppliedReaderScheme = colorScheme;

  for (const reader of getOpenReaders()) {
    try {
      if (typeof reader?.setColorScheme === "function") {
        reader.setColorScheme(colorScheme);
      }
    } catch (_error) {
      // Reader can disappear during async tab/window teardown.
    }
  }
}

function getOpenReaders() {
  const readers = (Zotero.Reader as any)?._readers;
  return Array.isArray(readers) ? readers : [];
}

function getReaderShellDocument(reader: any) {
  try {
    return (reader?._iframeWindow?.document as Document | undefined) || null;
  } catch (_error) {
    return null;
  }
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
    return;
  }

  root.setAttribute(attrName, theme);

  if (!style) {
    style = doc.createElement("style");
    style.id = styleID;
    const parent = doc.head || root;
    parent.appendChild(style);
  }
  style.textContent = cssText;
}

function clearThemeFromDocument(
  doc: Document,
  attrName: string,
  styleID: string,
) {
  doc.documentElement?.removeAttribute(attrName);
  doc.getElementById(styleID)?.remove();
}

function buildTokenDeclarations(theme: Exclude<ThemeMode, "follow">) {
  return Object.entries(OFFICIAL_APP_TOKENS[theme])
    .map(([key, value]) => `  --${key}: ${value};`)
    .join("\n");
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
  color-scheme: ${theme};
  background-color: var(--material-sidepane) !important;
  color: var(--fill-primary) !important;
}

:root[${READER_LEFT_SIDEBAR_ATTR}="${theme}"] #sidebarContainer {
  border-inline-end: var(--material-panedivider) !important;
}

:root[${READER_LEFT_SIDEBAR_ATTR}="${theme}"] #sidebarContainer .divider,
:root[${READER_LEFT_SIDEBAR_ATTR}="${theme}"] #sidebarContainer .split-view-resizer {
  background: var(--fill-quinary) !important;
}

:root[${READER_LEFT_SIDEBAR_ATTR}="${theme}"] #sidebarContainer .toolbar-button,
:root[${READER_LEFT_SIDEBAR_ATTR}="${theme}"] #sidebarContainer button {
  color: var(--fill-secondary) !important;
}

:root[${READER_LEFT_SIDEBAR_ATTR}="${theme}"] #sidebarContainer .toolbar-button:hover,
:root[${READER_LEFT_SIDEBAR_ATTR}="${theme}"] #sidebarContainer button:hover {
  background-color: var(--fill-quinary) !important;
}

:root[${READER_LEFT_SIDEBAR_ATTR}="${theme}"] #sidebarContainer .toolbar-button:active,
:root[${READER_LEFT_SIDEBAR_ATTR}="${theme}"] #sidebarContainer .toolbar-button.active,
:root[${READER_LEFT_SIDEBAR_ATTR}="${theme}"] #sidebarContainer .toolbar-button.active-pseudo-class-fix,
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
