import { config } from "../../package.json";
import { getPref, setPref } from "../utils/prefs";
import { isZotero7 } from "../utils/zotero";
import { SplitThemeManager, normalizeThemeMode } from "./themeManager";

type ThemeControl = {
  value: string;
  disabled: boolean;
  selectedItem?: any;
  menupopup?: Element | null;
  setAttribute?: (name: string, value: string) => void;
  removeAttribute?: (name: string) => void;
  appendChild?: (node: Node) => Node;
  addEventListener: (
    type: string,
    listener: (event: Event) => void,
    options?: boolean | AddEventListenerOptions,
  ) => void;
  querySelector?: (selectors: string) => Element | null;
};

const THEME_CONTROL_DEFS = [
  { name: "app-theme", pref: "appTheme" },
  { name: "reader-toolbar-theme", pref: "readerToolbarTheme" },
  { name: "reader-left-sidebar-theme", pref: "readerLeftSidebarTheme" },
  { name: "reader-theme", pref: "readerTheme" },
  { name: "reader-background-theme", pref: "readerBackgroundTheme" },
  { name: "reader-sidebar-theme", pref: "readerSidebarTheme" },
] as const;

type ThemeControlDef = (typeof THEME_CONTROL_DEFS)[number];

export function registerPrefsScripts(_window: Window) {
  addon.data.prefs = {
    window: _window,
  };

  const doc = _window.document;
  const zotero7 = isZotero7();
  syncControlVisibility(doc, zotero7);
  const root = doc.querySelector(".split-theme-root") as HTMLElement | null;
  const enabledInput = doc.querySelector(
    `#zotero-prefpane-${config.addonRef}-enabled`,
  ) as XUL.Checkbox | null;
  const themeControls = THEME_CONTROL_DEFS.map((def) => ({
    ...def,
    control: getThemeControl(doc, def.name, zotero7),
    value: normalizeThemeMode(getPref(def.pref)),
  }));

  if (!root || !enabledInput || themeControls.some(({ control }) => !control)) {
    return;
  }
  const resolvedThemeControls = themeControls as Array<
    ThemeControlDef & { control: ThemeControl; value: string }
  >;

  root.classList.toggle("split-theme-zotero-7", zotero7);
  if (zotero7) {
    for (const { name } of resolvedThemeControls) {
      rebuildMenulistFromSelect(doc, name);
    }
  }

  const enabledCheckbox = enabledInput;
  const controlledInputs = resolvedThemeControls.map(({ control }) => control);

  function updateEnabledState() {
    const enabled = Boolean(enabledCheckbox.checked);
    for (const input of controlledInputs) {
      input.disabled = !enabled;
    }
  }

  enabledCheckbox.checked = Boolean(getPref("enabled"));
  if (!zotero7) {
    for (const { control, value } of resolvedThemeControls) {
      setThemeControlValue(control, value);
    }
  }
  updateEnabledState();

  enabledCheckbox.addEventListener("command", () => {
    setPref("enabled", Boolean(enabledCheckbox.checked));
    updateEnabledState();
    SplitThemeManager.refreshAllWindowsSoon();
  });

  for (const { pref, control } of resolvedThemeControls) {
    addControlListener(control, zotero7, () => {
      if (!zotero7) {
        setPref(pref, normalizeThemeMode(control.value));
      }
      SplitThemeManager.refreshAllWindowsSoon();
    });
  }
}

function getThemeControl(
  doc: Document,
  name: string,
  zotero7: boolean,
): ThemeControl | null {
  const suffix = zotero7 ? "menulist" : "select";
  return doc.querySelector(
    `#zotero-prefpane-${config.addonRef}-${name}-${suffix}`,
  ) as ThemeControl | null;
}

function getThemeSelect(doc: Document, name: string) {
  return doc.querySelector(
    `#zotero-prefpane-${config.addonRef}-${name}-select`,
  ) as HTMLSelectElement | null;
}

function getThemeMenulist(doc: Document, name: string) {
  return doc.querySelector(
    `#zotero-prefpane-${config.addonRef}-${name}-menulist`,
  ) as ThemeControl | null;
}

function syncControlVisibility(doc: Document, zotero7: boolean) {
  // Zotero 7 renders native XUL menulists; Zotero 8 uses HTML selects.
  // Keep both controls in markup, then reveal only the version supported by
  // the running Zotero build.
  for (const { name } of THEME_CONTROL_DEFS) {
    const select = getThemeSelect(doc, name) as ThemeControl | null;
    const menulist = getThemeMenulist(doc, name);
    if (zotero7) {
      select?.setAttribute?.("hidden", "true");
      menulist?.removeAttribute?.("hidden");
    } else {
      menulist?.setAttribute?.("hidden", "true");
      select?.removeAttribute?.("hidden");
    }
  }
}

function rebuildMenulistFromSelect(doc: Document, name: string) {
  const select = getThemeSelect(doc, name);
  const menulist = getThemeMenulist(doc, name);
  if (!select || !menulist) {
    return;
  }

  // Zotero 7's native menulist wants XUL menuitems, while our source of truth
  // stays in the HTML select markup shared with Zotero 8.
  menulist.selectedItem = null;
  const popup = (menulist.menupopup ??
    menulist.querySelector?.("menupopup") ??
    doc.createXULElement("menupopup")) as Element & {
    replaceChildren: (...nodes: Node[]) => void;
    appendChild: (node: Node) => Node;
    parentNode: Node | null;
  };
  if (popup.parentNode !== (menulist as unknown as Node)) {
    menulist.appendChild?.(popup);
  }
  popup.replaceChildren();

  const options = Array.from(select.options) as HTMLOptionElement[];
  options.forEach((option) => {
    const item = doc.createXULElement("menuitem");
    item.setAttribute("value", option.value);
    item.setAttribute(
      "label",
      option.textContent?.trim() || option.label || "",
    );
    popup.appendChild(item);
  });
}

function addControlListener(
  control: ThemeControl,
  zotero7: boolean,
  listener: () => void,
) {
  control.addEventListener(zotero7 ? "command" : "change", listener);
}

function setThemeControlValue(control: ThemeControl, value: string) {
  control.value = value;
}
