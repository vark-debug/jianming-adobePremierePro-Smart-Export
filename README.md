# Quick Export - Premiere Pro Smart Export Plugin

> English | [简体中文](README.zh-CN.md)

![Version](https://img.shields.io/badge/version-1.2.0-blue) ![Premiere Pro](https://img.shields.io/badge/Premiere%20Pro-25.6.3%2B-purple) ![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS-lightgrey)

An automated export tool designed for Adobe Premiere Pro. Intelligently analyzes sequence resolution with one click, automatically matches optimal presets, and manages file version numbers smartly to standardize and automate video delivery workflows.

## Technical Architecture

Built on the **Bolt UXP** framework, fully migrated and modernized from legacy CommonJS project:
- **UI Framework**: Vue 3 + TypeScript + Spectrum Web Components
- **Build Tools**: Vite 6 + vite-uxp-plugin
- **Platform**: Adobe UXP (Unified Extensibility Platform) for Premiere Pro 25.6.3+
- **Typography**: Adobe Clean (Spectrum Design System standard font)

## ✨ Key Features

### 🎯 Smart One-Click Export
- **Flexible Export Modes**:
  - **Default Mode**: Uses H.264 10Mbps standard preset, suitable for daily workflows and quick delivery.
  - **Final Version Mode**: When "Final Version" is checked, automatically selects optimal parameters based on sequence resolution:
    - **4K+ (long edge ≥ 3840px)**: Automatically applies 48Mbps high bitrate preset for maximum quality.
    - **1080p and below**: Applies 10Mbps standard preset.
- **Multi-Format Support**:
  - **H.264 (MP4)**: Universal delivery format with best compatibility.
  - **ProRes 422 (MOV)**: High-quality digital intermediate, suitable for archival or post-production.
  - **ProRes 444 (MOV)**: Supports Alpha transparency channel, ideal for VFX compositing.

### 📁 Automatic File Management & Version Control
- **Smart Directory Creation**: Automatically creates an "Export" folder at the parent level of the project directory, keeping projects organized.
- **Automatic Version Iteration**: Say goodbye to chaotic naming like "final", "final_final". The plugin automatically detects and increments version numbers:
  - Supports `V1`, `V2`, `V3...` standard format (infinite increment).
  - Supports Chinese format `第一版`, `第二版`...
  - **Smart Naming Examples**:
    ```
    Base version: "Promo_H.264_10Mbps_V1.mp4"
    Graded version: "Promo_H.264_10Mbps_Graded_V2.mp4"
    Final version: "Promo_H.264_48Mbps_Graded_Final_V3.mp4"
    ProRes version: "Promo_ProRes422_Final_V4.mov"
    ```
- **Custom Project Names**: Supports temporary modification of project names before export while maintaining version continuity.
- **Version Format Options**: Configure globally in Settings:
  - **Numeric format** (default): Custom prefix + number, e.g. prefix `V` → `V1`, `V2`…
  - **Chinese format**: Generates `第一版`, `第二版`… up to `第二十版`
- **Status Marking Management**:
  - **Color Grading Status**: Manually mark whether current export is color graded.
  - **Final Version Mark**: Mark as official delivery version, uses high bitrate preset.
  - **Smart Detection**: Automatically recognizes status marks in existing files and syncs UI.
  - Supported marks: `已调色`, `调色`, `graded`, `cc`, etc.

### 📦 Automatic Final Version Archiving

After exporting with "Final Version" checked, the plugin can automatically **copy and archive** the exported file to a designated directory, making it easy to organize deliveries by project and month.

- **Choose Archive Root Folder**: Set once in Settings — applies globally across all projects.
- **Custom Folder Hierarchy Template**: Use `|` to separate folder levels. Supported variables:

  | Variable | Description | Example (Feb 28, 2026) |
  |----------|-------------|------------------------|
  | `YYYY` | Four-digit year | `2026` |
  | `MM` | Month (no zero-padding) | `2` |
  | `DD` | Day (no zero-padding) | `28` |
  | `项目名称` | Current project name | `Promo` |

- **Live Path Preview**: See the full archive path update in real time as you type the template.
- **Archive Result Feedback**: The success dialog shows the archive destination; errors are shown if archiving fails.

**Template Example**:
```
Input:  YYYY年|MM月结案项目|MM_DD项目名称
Result: D:\Archive\2026年\2月结案项目\2_28Promo\
```

### 💾 Pre-Export Automatic Backup

Two independent backup options can be enabled in Settings. They run automatically each time you click "Start Export". Either option failing does not block the export.

- **Backup Sequence**: Clones the active sequence inside the Premiere Pro project panel and names the copy `ProjectName_VersionNumber` (e.g. `Promo_V3`). Acts as a snapshot of the timeline state at export time for easy reference later.
- **Backup Project File**: Copies the current `.prproj` file in binary to the same project directory, named `ProjectName_VersionNumber_Backup.prproj`. Does **not** change the project path currently open in Premiere Pro.
- **Execution Order** (when both are enabled): Backup sequence → Backup project file (ensuring the backup includes the newly cloned sequence) → Export.

### ⚙️ Global Settings (Persistent)

Click the ⚙ gear icon in the top-right corner to open Settings. All configurations are saved locally via UXP DataFolder and persist across project switches:

| Setting | Description | Default |
|---------|-------------|---------|
| Export Folder Name | Name of the auto-created export directory | `导出` |
| Version Format | Numeric (e.g. `V1`) or Chinese (e.g. `第一版`) | Numeric |
| Numeric Version Prefix | String prepended before the version number | `V` |
| Archive Root Folder | Top-level folder for final version archiving (set once, global) | Empty (no archiving) |
| Auto-Archive Toggle | Whether to automatically archive when exporting final version | Off |
| Archive Folder Structure | Subfolder hierarchy template; supports `YYYY` / `MM` / `DD` / `项目名称` variables, `\|` as level separator | `YYYY\|MM\|DD_项目名称` |
| Backup Sequence on Export | Clones active sequence in the project panel before export, named `ProjectName_VersionNumber` | Off |
| Backup Project File on Export | Saves a `.prproj` copy to the project directory before export, named `ProjectName_VersionNumber_Backup` | Off |

Returning to the main view auto-refreshes the export path and version display, while preserving any manually edited project name.

## 📋 System Requirements

- **Adobe Premiere Pro** 25.6.3 or higher (tested)
- **Operating System**: Windows 10+ or macOS 10.15+

## 🌍 Multi-Language Support

The plugin automatically detects your Premiere Pro UI language and switches both the **interface text and exported filename tags** accordingly.

**Currently Supported Languages**:
- 🇨🇳 **Simplified Chinese** (zh-CN)
- 🇺🇸 **English** (en)

### Multi-Language Filename Examples

**Chinese Interface Export**:
```
宣传片_H.264_10Mbps_已调色_定稿版_V3.mp4
```

**English Interface Export**:
```
Promo_H.264_10Mbps_Graded_Final_V3.mp4
```

> 💡 **Note**: Filename tags ("已调色", "定稿版", etc.) automatically switch to their corresponding translations ("Graded", "Final", etc.) based on the UI language, ensuring consistent file naming across international teams.

### 🤝 Help Us Translate

We welcome contributions to make this plugin accessible to more users worldwide! If you'd like to help translate the plugin into your language:

1. **Check existing translations**: Browse [`src/locales/`](src/locales/) to see available languages
2. **Create a new translation file**: Copy [`src/locales/en.json`](src/locales/en.json) and rename it with the appropriate locale code (e.g., `fr.json`, `de.json`, `ja.json`)
3. **Translate the content**: Replace English text with your language while keeping the JSON structure intact
4. **Update the i18n system**: Add your language to [`src/locales/index.ts`](src/locales/index.ts) (follow existing patterns)
5. **Submit a Pull Request**: Share your translation with the community!

**Translation File Structure**:
```json
{
  "app": {
    "title": "Your Translation"
  },
  "ui": {
    "projectName": "...",
    "export": "..."
  },
  "message": {
    "exportSuccess": "..."
  }
}
```

**Need Help?** Open an issue on GitHub, and we'll guide you through the process!

## 🚀 Development Guide

### Environment Setup
1. Install [Node.js 18+](https://nodejs.org/)
2. Install [Adobe UXP Developer Tool (UDT)](https://developer.adobe.com/photoshop/uxp/2022/guides/devtool/installation/)
3. Install dependencies: `yarn` or `npm install`

### Development Commands
```bash
# Development mode (with hot reload)
yarn dev

# Production build
yarn build

# Package as CCX plugin
yarn ccx

# Package as ZIP archive
yarn zip
```

### Debugging
1. Run `yarn dev` to start development server
2. Load `dist/manifest.json` in UDT
3. Connect to Premiere Pro
4. Click "Debug" in UDT to open Chrome DevTools

## 📖 Usage Instructions

1. **Open Project**: Open and save your project in Premiere Pro.
2. **Launch Plugin**: Select `Window > Extensions > Quick Export` from the menu bar.
3. **Confirm Information**: Plugin automatically detects project name, resolution, version number, etc.
4. **Select Format**: Choose export format as needed (H.264, ProRes 422, ProRes 444).
5. **Mark Status**:
   - Check "Color Graded" to mark current sequence as color graded.
   - Check "Final Version" to enable high bitrate export (H.264 format only).
6. **(Optional) Configure Archiving**: Click the ⚙ icon, select an archive root folder and set a folder structure template in Settings. All subsequent final version exports will archive automatically.
7. **(Optional) Enable Pre-Export Backup**: In Settings, check "Backup Sequence" and/or "Backup Project File" to automatically back up before each export.
8. **(Optional) Adjust Other Settings**: Customize the export folder name and version format. Settings are saved automatically.
9. **Start Export**: Click "Start Export" and wait for completion. If archiving is configured, the success dialog will show the archive path.

## 🔧 Project Structure

```
src/
├── modules/               # Core business modules
│   ├── projectLocationDetector.ts   # Project location detection
│   ├── exportFolderManager.ts       # Export folder management
│   ├── resolutionDetector.ts        # Resolution detection
│   ├── fileVersioner.ts             # Smart version handling
│   ├── sequenceExporter.ts          # Sequence export
│   ├── archiveManager.ts            # Final version archive manager
│   ├── preExportBackup.ts           # Pre-export backup (sequence + project file)
│   └── FileSystemHelper.ts          # File system helper
├── api/                   # Premiere Pro API wrapper
├── components/
│   └── SettingsView.vue             # Settings page component (incl. archive config)
├── stores/
│   └── settings.ts                  # Persistent settings store (UXP DataFolder)
├── main.vue               # Main Vue component
└── globals.ts             # Global UXP/Premiere Pro API imports

public/
└── epr/                   # Export preset files
    ├── h264匹配帧10mbps.epr
    ├── h264匹配帧48mbps.epr
    ├── ProRes 422.epr
    └── ProRes 444.epr
```

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

This project is built on the [Bolt UXP](https://hyperbrew.co/resources/bolt-uxp) framework.

![npm](https://img.shields.io/npm/v/bolt-uxp)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/hyperbrew/bolt-uxp/blob/master/LICENSE)
[![Chat](https://img.shields.io/badge/chat-discord-7289da.svg)](https://discord.gg/PC3EvvuRbc)

