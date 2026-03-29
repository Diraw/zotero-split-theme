import { registerPrefsScripts } from "./modules/preferenceScript";
import { SplitThemeManager } from "./modules/themeManager";
import { getString, initLocale } from "./utils/locale";

async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);

  initLocale();
  registerPreferencePane();
  registerTabObserver();
  SplitThemeManager.startup();

  addon.data.initialized = true;
}

async function onMainWindowLoad(win: _ZoteroTypes.MainWindow): Promise<void> {
  SplitThemeManager.registerWindow(win);
}

async function onMainWindowUnload(win: Window): Promise<void> {
  SplitThemeManager.unregisterWindow(win);
}

function onShutdown(): void {
  unregisterTabObserver();
  SplitThemeManager.shutdown();
  addon.data.alive = false;
  // @ts-expect-error - Plugin instance is not typed
  delete Zotero[addon.data.config.addonInstance];
}

async function onNotify(
  event: string,
  type: string,
  _ids: Array<string | number>,
  _extraData: { [key: string]: any },
) {
  if (type === "tab") {
    const delay = event === "select" ? 25 : 100;
    SplitThemeManager.refreshAllWindowsSoon(delay);
  }
}

async function onPrefsEvent(type: string, data: { [key: string]: any }) {
  if (type === "load") {
    registerPrefsScripts(data.window);
  }
}

function registerPreferencePane() {
  Zotero.PreferencePanes.register({
    pluginID: addon.data.config.addonID,
    src: rootURI + "content/preferences.xhtml",
    label: getString("prefs-title"),
    image: `chrome://${addon.data.config.addonRef}/content/icons/favicon.png`,
  });
}

function registerTabObserver() {
  if (addon.data.theme?.notifierID) {
    return;
  }

  const callback = {
    notify: async (
      event: string,
      type: string,
      ids: Array<string | number>,
      extraData: { [key: string]: any },
    ) => {
      if (!addon.data.alive) {
        unregisterTabObserver();
        return;
      }
      await addon.hooks.onNotify(event, type, ids, extraData);
    },
  };

  addon.data.theme = addon.data.theme || {};
  addon.data.theme.notifierID = Zotero.Notifier.registerObserver(callback, [
    "tab",
  ]);
}

function unregisterTabObserver() {
  const notifierID = addon.data.theme?.notifierID;
  if (!notifierID) {
    return;
  }

  Zotero.Notifier.unregisterObserver(notifierID);
  addon.data.theme = {};
}

export default {
  onStartup,
  onShutdown,
  onMainWindowLoad,
  onMainWindowUnload,
  onNotify,
  onPrefsEvent,
};
