import {
  BasicTool,
  ProgressWindowHelper,
  makeHelperTool,
  unregister,
} from "zotero-plugin-toolkit";
import { config } from "../../package.json";

export { createZToolkit };

function createZToolkit() {
  const _ztoolkit = new MyToolkit();
  initZToolkit(_ztoolkit);
  return _ztoolkit;
}

function initZToolkit(_ztoolkit: ReturnType<typeof createZToolkit>) {
  const env = __env__;
  _ztoolkit.basicOptions.log.prefix = `[${config.addonName}]`;
  _ztoolkit.basicOptions.log.disableConsole = env === "production";
  _ztoolkit.basicOptions.log.disableZLog = env === "production";
  // Getting basicOptions.debug will load global modules like the debug bridge.
  // since we want to deprecate it, should avoid using it unless necessary.
  // _ztoolkit.basicOptions.debug.disableDebugBridgePassword =
  //   __env__ === "development";
  _ztoolkit.basicOptions.api.pluginID = config.addonID;
  _ztoolkit.ProgressWindow.setIconURI(
    "default",
    `chrome://${config.addonRef}/content/icons/favicon.png`,
  );
}

class MyToolkit extends BasicTool {
  ProgressWindow = makeHelperTool(ProgressWindowHelper, this);

  constructor() {
    super();
  }

  unregisterAll() {
    unregister(this);
  }
}
