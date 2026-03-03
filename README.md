# Quick Export - Premiere Pro Smart Export UXP Plugin
[![Latest Release](https://img.shields.io/github/v/release/vark-debug/jianming-adobePremierePro-Smart-Export?label=Latest%20Release)](https://github.com/vark-debug/jianming-adobePremierePro-Smart-Export/releases)
[![License](https://img.shields.io/github/license/vark-debug/jianming-adobePremierePro-Smart-Export?color=blue)](LICENSE)
[![Premiere Pro](https://img.shields.io/badge/Premiere%20Pro-25.6.3+-purple.svg)](https://www.adobe.com/products/premiere.html)
[![Language](https://img.shields.io/badge/Language-English%20%7C%20Simplified%20Chinese-green.svg)](#-multi-language-support)

Stop wasting time on repetitive export tweaks, messy file versions, and manual delivery workflows.
This UXP plugin automates your entire video export pipeline for Adobe Premiere Pro, with one-click smart presets, auto version control, and built-in archiving & backup — so you can focus on editing, not admin.

## 🎯 Core Highlights At A Glance
- **One-click smart export**: Auto-detect sequence resolution and match the optimal export preset
- **End version chaos**: Automatic file version iteration, no more `final_final_FINAL.mp4`
- **Smart delivery management**: Auto-archive final versions, with customizable folder structure
- **Zero-risk editing**: Auto-backup sequences and project files before every export
- **Native multi-language**: Auto-switch UI and file naming between English and Simplified Chinese

## 📸 Preview

![演示](https://github.com/user-attachments/assets/27f4d654-c1cb-4364-a4b5-555b19f313ba)

## 🚀 Installation
### Recommended: Stable Release (For All Users)
1. Go to the [Releases Page](https://github.com/vark-debug/jianming-adobePremierePro-Smart-Export/releases)
2. Download the latest `.ccx` installation package
3. Double-click the `.ccx` file, Adobe Creative Cloud will guide you through the installation automatically
4. Restart Adobe Premiere Pro, you can find the plugin via `Window > UXP Plugins > 快速导出`

### Developer Mode (For Contributors & Testers)
1. Install [Adobe UXP Developer Tool (UDT)](https://developer.adobe.com/udt/)
2. Clone this repository to your local machine
3. Follow the [Development Guide](#-development-guide) below to build the project
4. Load the plugin via UDT into Premiere Pro

---

## 📖 Quick Start
1. Open and save your Premiere Pro project (unsaved projects are not supported)
2. Launch the plugin via `Window > UXP Plugins > 快速导出`
3. The plugin will auto-detect your project name, sequence resolution, and latest version number
4. Select your desired export format (H.264, ProRes 422, ProRes 444)
5. Click `Start Export` — the plugin will handle the rest automatically

---

## ✨ Core Features
### 🎯 Smart One-Click Export
Eliminate repetitive preset tweaks — the plugin automatically matches the best export parameters for your sequence, no manual setup needed.
- **Dual Export Modes**:
  - Default Mode: Uses H.264 10Mbps standard preset, perfect for daily workflows and quick delivery
  - Final Version Mode: Auto-applies resolution-matched high-bitrate parameters when checked
    - 4K+ (long edge ≥ 3840px): 48Mbps high-bitrate preset for maximum delivery quality
    - 1080p and below: 10Mbps standard preset for balance of quality and file size
- **Multi-Format Native Support**:
  - H.264 (MP4): Universal delivery format with best cross-platform compatibility
  - ProRes 422 (MOV): Industry-standard high-quality digital intermediate, for archiving and post-production handoff
  - ProRes 444 (MOV): Supports Alpha transparency channel, ideal for VFX compositing and motion graphics

### 📁 Automatic File Management & Version Control
Say goodbye to chaotic file naming and lost version history. The plugin automatically tracks and increments version numbers, keeping your projects organized.
- **Smart Version Iteration**: Auto-detects existing versions in the export folder and increments numbers seamlessly
  - Supports standard numeric format: `V1`, `V2`, `V3...` (infinite increment, customizable prefix)
  - Supports Chinese format: `第一版`, `第二版`... (up to 20 versions)
- **Intelligent File Naming**: Auto-generates standardized filenames with format, bitrate, status marks, and version
  - Example: `Promo_H.264_10Mbps_Graded_Final_V3.mp4`
- **Customizable Options**:
  - Temporary project name modification before export, while maintaining version continuity
  - Global version format settings, with custom numeric prefix support
  - Auto-sync status marks from existing filenames (supports `graded`, `cc`, `已调色`, `调色` and more)

### 📦 Automatic Final Version Archiving
Never lose track of your final delivery files. The plugin automatically archives your final exports to a designated directory, with fully customizable folder structure.
- Set a global archive root folder once in settings, applies to all projects
- Custom folder hierarchy template with dynamic variables, use `|` to separate folder levels
- Real-time path preview as you edit the template
- Full feedback on archive results in the export success dialog
- **Supported Template Variables**:
  | Variable | Description | Example (Feb 28, 2026) |
  |----------|-------------|--------------------------|
  | `YYYY` | 4-digit year | `2026` |
  | `MM` | Month (no zero-padding) | `2` |
  | `DD` | Day (no zero-padding) | `28` |
  | `项目名称` | Current project name | `Promo` |
- **Template Example**:
  - Input: `YYYY年|MM月结案项目|MM_DD项目名称`
  - Output: `D:\Archive\2026年\2月结案项目\2_28Promo\`

### 💾 Pre-Export Automatic Backup
Eliminate the risk of losing timeline edits or project files. Two independent backup options run automatically before every export, with no impact on your main project.
- **Sequence Backup**: Clones the active sequence in your Premiere Pro project panel, named with the current version number (e.g. `Promo_V3`), creating a snapshot of your timeline at export time
- **Project File Backup**: Creates a full binary copy of your `.prproj` file in the project directory, named `ProjectName_VersionNumber_Backup.prproj`
- **Execution Order**: Backup Sequence → Backup Project File → Export (ensures backups include the latest timeline snapshot)
- Failed backups will never block the core export process

---

## ⚙️ Global Settings (Persistent)
All configurations are saved locally via UXP DataFolder, and persist across project restarts and switches. Access settings via the ⚙ gear icon in the top-right corner.

| Setting | Description | Default Value |
|---------|-------------|---------------|
| Export Folder Name | Name of the auto-created export directory at the project parent level | `Export` |
| Version Format | Numeric (e.g. `V1`) or Chinese (e.g. `第一版`) version naming | Numeric |
| Numeric Version Prefix | Custom string prepended before the version number | `V` |
| Archive Root Folder | Global top-level folder for final version archiving | Empty (archiving off) |
| Auto-Archive Toggle | Enable/disable automatic archiving when exporting final version | Off |
| Archive Folder Structure | Subfolder hierarchy template, supports `YYYY`/`MM`/`DD`/`项目名称` variables, `|` as level separator | `YYYY|MM|DD_项目名称` |
| Backup Sequence on Export | Auto-clone active sequence before export | Off |
| Backup Project File on Export | Auto-save a copy of the .prproj file before export | Off |

---

## 📋 System Requirements
- Adobe Premiere Pro 25.6.3 or higher (fully tested)
- Operating System: Windows 10+ / macOS 10.15+

## 🌍 Multi-Language Support
The plugin automatically detects your Premiere Pro UI language, and switches both the interface text and exported filename tags accordingly.
- Currently Supported Languages: Simplified Chinese (zh-CN) / English (en)
- Filename tags auto-switch with UI language, ensuring consistent naming across international teams
  - Chinese UI Export: `宣传片_H.264_10Mbps_已调色_定稿版_V3.mp4`
  - English UI Export: `Promo_H.264_10Mbps_Graded_Final_V3.mp4`

We welcome translation contributions! See the [Contributing Guide](#-contributing) for details.

---

## 🔧 Development Guide
### Environment Setup
1. Install Node.js 18+
2. Install [Adobe UXP Developer Tool (UDT)](https://developer.adobe.com/udt/)
3. Install dependencies:
```bash
yarn
# OR
npm install
# Start development mode with hot reload
yarn dev

# Build for production
yarn build

# Package as installable CCX plugin
yarn ccx
# Output to dist/ directory

# Package as ZIP archive
yarn zip
# Output to public-zip/ directory
```

**Debugging
1. Run yarn dev to start the development server
2. Open Adobe UXP Developer Tool
3. Load the plugin via dist/manifest.json
4. Connect to Premiere Pro, click "Debug" to open Chrome DevTools


Project Structure**
```
src/
├── modules/               # Core business modules
│   ├── projectLocationDetector.ts   # Project path & location detection
│   ├── exportFolderManager.ts       # Auto-creation & management of export folders
│   ├── resolutionDetector.ts        # Sequence resolution & frame rate detection
│   ├── fileVersioner.ts             # Smart version number iteration & naming
│   ├── sequenceExporter.ts          # Core export logic & preset matching
│   ├── archiveManager.ts            # Final version auto-archiving
│   ├── preExportBackup.ts           # Pre-export sequence & project backup
│   └── FileSystemHelper.ts          # Cross-platform file system utilities
├── api/                   # Premiere Pro API wrapper layer
├── components/            # Vue 3 UI components
│   └── SettingsView.vue             # Full settings page component
├── stores/                # State management
│   └── settings.ts                  # Persistent global settings store
├── locales/               # i18n multi-language files
├── main.vue               # Main app component
└── globals.ts             # Global UXP / Premiere Pro API imports

public/
└── epr/                   # Native Premiere Pro export preset files
    ├── h264_10Mbps.epr
    ├── h264_48Mbps.epr
    ├── ProRes 422.epr
    └── ProRes 444.epr
```
📄 License

This project is licensed under the MIT License - see the LICENSE file for full details.

🙏 Acknowledgments

This project is built on the Bolt UXP framework, the modern toolkit for Adobe UXP plugin development.
