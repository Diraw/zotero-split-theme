export { getZoteroMajorVersion, isZotero7 };

function getZoteroMajorVersion() {
  const version = String(
    (Zotero as typeof Zotero & { version?: string }).version,
  );
  const majorVersion = Number.parseInt(version.split(".")[0] || "", 10);
  return Number.isFinite(majorVersion) ? majorVersion : 0;
}

function isZotero7() {
  const majorVersion = getZoteroMajorVersion();
  return majorVersion > 0 && majorVersion < 8;
}
