# Zotero Split Theme

<p align="right"><b>English</b> | <a href="README.zh-CN.md">中文</a></p>

[![Zotero 8](https://img.shields.io/badge/Zotero-8-green?style=flat-square&logo=zotero&logoColor=CC2936)](https://www.zotero.org/) [![Release](https://img.shields.io/github/v/release/Diraw/zotero-split-theme?style=flat-square)](https://github.com/Diraw/zotero-split-theme/releases) [![Using Zotero Plugin Template](https://img.shields.io/badge/Using-Zotero%20Plugin%20Template-blue?style=flat-square&logo=github)](https://github.com/windingwind/zotero-plugin-template)

**This plugin is built for the common mixed-theme workflow that Zotero does not provide out of the box**, such as:

- dark Zotero interface + light PDF reading area
- dark Zotero interface + light PDF reader + dark metadata sidebar
- different themes for PDF toolbar, left sidebar, reading area, and right sidebar

## Preview

![Preview](./img/preview.png)

![Settings](./img/setting.png)

## Features

- Independent theme control for the main Zotero interface
- Independent theme control for PDF reader zones:
  - top toolbar
  - left collapsible sidebar
  - reading area
  - right info sidebar

## Installation

1. Go to the [Releases](https://github.com/Diraw/zotero-split-theme/releases) page.
2. Download the latest `zotero-split-theme.xpi`.
3. In Zotero, open `Tools -> Plugins`.
4. Drag the `.xpi` file into the Plugins window and install it.
5. Restart Zotero if prompted.

## Usage

After installation, open:

`Edit -> Settings -> Zotero Split Theme`

Available settings:

- `Main Interface`
- `PDF Reader -> Top Bar`
- `PDF Reader -> Left Pane`
- `PDF Reader -> Reading Area`
- `PDF Reader -> Right Pane`

Each area can be set to:

- `Follow Zotero`
- `Light`
- `Dark`

## Development

Requirements:

- Zotero 8 beta
- Node.js LTS

Commands:

```powershell
npm install
npm start
npm run build
```

Build output:

- `.scaffold/build/zotero-split-theme.xpi`
- `.scaffold/build/update.json`

## Release

This repository is configured to publish releases through GitHub Actions.

Typical release flow:

```powershell
npm run build
npm run release
```

Pushing a `v*` tag triggers the workflow in [.github/workflows/release.yml](./.github/workflows/release.yml) and publishes the release assets.

## License

[AGPL-3.0-or-later](./LICENSE)
