import { config } from "../../package.json";
import { getPref, setPref } from "../utils/prefs";
import { SplitThemeManager, normalizeThemeMode } from "./themeManager";

export function registerPrefsScripts(_window: Window) {
  addon.data.prefs = {
    window: _window,
  };

  const doc = _window.document;
  const enabledInput = doc.querySelector(
    `#zotero-prefpane-${config.addonRef}-enabled`,
  ) as XUL.Checkbox | null;
  const appThemeInput = doc.querySelector(
    `#zotero-prefpane-${config.addonRef}-app-theme`,
  ) as HTMLSelectElement | null;
  const readerToolbarThemeInput = doc.querySelector(
    `#zotero-prefpane-${config.addonRef}-reader-toolbar-theme`,
  ) as HTMLSelectElement | null;
  const readerLeftSidebarThemeInput = doc.querySelector(
    `#zotero-prefpane-${config.addonRef}-reader-left-sidebar-theme`,
  ) as HTMLSelectElement | null;
  const readerThemeInput = doc.querySelector(
    `#zotero-prefpane-${config.addonRef}-reader-theme`,
  ) as HTMLSelectElement | null;
  const readerSidebarThemeInput = doc.querySelector(
    `#zotero-prefpane-${config.addonRef}-reader-sidebar-theme`,
  ) as HTMLSelectElement | null;

  if (
    !enabledInput ||
    !appThemeInput ||
    !readerToolbarThemeInput ||
    !readerLeftSidebarThemeInput ||
    !readerThemeInput ||
    !readerSidebarThemeInput
  ) {
    return;
  }

  const enabledCheckbox = enabledInput;

  const controlledInputs = [
    appThemeInput,
    readerToolbarThemeInput,
    readerLeftSidebarThemeInput,
    readerThemeInput,
    readerSidebarThemeInput,
  ];

  function updateEnabledState() {
    const enabled = Boolean(enabledCheckbox.checked);
    for (const input of controlledInputs) {
      input.disabled = !enabled;
    }
  }

  enabledCheckbox.checked = Boolean(getPref("enabled"));
  appThemeInput.value = normalizeThemeMode(getPref("appTheme"));
  readerToolbarThemeInput.value = normalizeThemeMode(
    getPref("readerToolbarTheme"),
  );
  readerLeftSidebarThemeInput.value = normalizeThemeMode(
    getPref("readerLeftSidebarTheme"),
  );
  readerThemeInput.value = normalizeThemeMode(getPref("readerTheme"));
  readerSidebarThemeInput.value = normalizeThemeMode(
    getPref("readerSidebarTheme"),
  );
  updateEnabledState();

  enabledCheckbox.addEventListener("command", () => {
    setPref("enabled", Boolean(enabledCheckbox.checked));
    updateEnabledState();
    SplitThemeManager.refreshAllWindowsSoon();
  });

  appThemeInput.addEventListener("change", () => {
    setPref("appTheme", normalizeThemeMode(appThemeInput.value));
    SplitThemeManager.refreshAllWindowsSoon();
  });

  readerToolbarThemeInput.addEventListener("change", () => {
    setPref(
      "readerToolbarTheme",
      normalizeThemeMode(readerToolbarThemeInput.value),
    );
    SplitThemeManager.refreshAllWindowsSoon();
  });

  readerLeftSidebarThemeInput.addEventListener("change", () => {
    setPref(
      "readerLeftSidebarTheme",
      normalizeThemeMode(readerLeftSidebarThemeInput.value),
    );
    SplitThemeManager.refreshAllWindowsSoon();
  });

  readerThemeInput.addEventListener("change", () => {
    setPref("readerTheme", normalizeThemeMode(readerThemeInput.value));
    SplitThemeManager.refreshAllWindowsSoon();
  });

  readerSidebarThemeInput.addEventListener("change", () => {
    setPref(
      "readerSidebarTheme",
      normalizeThemeMode(readerSidebarThemeInput.value),
    );
    SplitThemeManager.refreshAllWindowsSoon();
  });
}
