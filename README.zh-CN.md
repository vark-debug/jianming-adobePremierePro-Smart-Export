# 快速导出 (Quick Export) - Premiere Pro 智能导出插件

> [English](README.md) | 简体中文

![Version](https://img.shields.io/badge/version-1.2.0-blue) ![Premiere Pro](https://img.shields.io/badge/Premiere%20Pro-25.6.3%2B-purple) ![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS-lightgrey)

专为 Adobe Premiere Pro 设计的自动化导出工具。一键智能分析序列分辨率，自动匹配最佳预设，智能管理文件版本号，让视频交付流程标准化、自动化。

## 技术架构

本插件基于 **Bolt UXP** 框架构建，从旧版 CommonJS 项目完整迁移并现代化重构：
- **UI框架**: Vue 3 + TypeScript + Spectrum Web Components
- **构建工具**: Vite 6 + vite-uxp-plugin
- **平台**: Adobe UXP (Unified Extensibility Platform) for Premiere Pro 25.6.3+
- **字体**: Adobe Clean（Spectrum 设计系统标准字体）

## ✨ 主要功能

### 🎯 智能一键导出
- **灵活的导出模式**：
  - **默认模式**：使用 H.264 10Mbps 标准预设，适合日常工作流程和快速交付。
  - **定稿版模式**：勾选"定稿版"后，根据序列分辨率自动选择最佳参数：
    - **4K+ (长边 ≥ 3840px)**：自动应用 48Mbps 高码率预设，确保最高画质。
    - **1080p 及以下**：应用 10Mbps 标准预设。
- **多格式支持**：
  - **H.264 (MP4)**：通用交付格式，兼容性最佳。
  - **ProRes 422 (MOV)**：高画质数字中间片，适合存档或后续制作。
  - **ProRes 444 (MOV)**：支持 Alpha 透明通道，适合特效合成素材。

### 📁 自动文件管理与版本控制
- **智能目录创建**：自动在项目所在目录的上级创建 "导出" 文件夹，保持项目整洁。
- **自动版本迭代**：告别 "最终版"、"最最终版" 的混乱命名。插件自动检测并递增版本号：
  - 支持 `V1`, `V2`, `V3...` 标准格式（无限递增）。
  - 支持 `第一版`, `第二版`... 中文格式。
  - **智能命名示例**：
    ```
    基础版本: "宣传片_H.264_10Mbps_V1.mp4"
    调色版本: "宣传片_H.264_10Mbps_已调色_V2.mp4"
    定稿版本: "宣传片_H.264_48Mbps_已调色_定稿版_V3.mp4"
    ProRes版本: "宣传片_ProRes422_定稿版_V4.mov"
    ```
- **自定义项目名称**：支持导出前临时修改项目名称，且保持版本号延续。
- **版本号格式选择**：在设置中可全局选择版本号风格：
  - **数字格式**（默认）：支持自定义前缀，例如前缀 `V` 生成 `V1`、`V2`…；前缀 `第` 生成 `第1`、`第2`…
  - **中文格式**：自动生成 `第一版`、`第二版`…`第二十版`
- **状态标记管理**：
  - **调色状态**：手动标记当前导出是否已调色。
  - **定稿版标记**：标记为正式交付版本，使用高码率预设。
  - **智能检测**：自动识别已有文件的状态标记并同步 UI。
  - 支持标记：`已调色`、`调色`、`graded`、`cc` 等。

### 📦 定稿版自动归档

勾选"定稿版"并完成导出后，插件可自动将导出文件**复制归档**到指定目录，方便按项目、按月份整理交付存档。

- **选择归档根目录**：在设置页选取一次，全局生效，无需每个项目单独配置。
- **自定义文件夹层级模板**：用 `|` 分隔各级子文件夹，支持以下变量：

  | 变量 | 说明 | 示例（2026年2月28日） |
  |------|------|----------------------|
  | `YYYY` | 四位年份 | `2026` |
  | `MM` | 月份（不补零） | `2` |
  | `DD` | 日期（不补零） | `28` |
  | `项目名称` | 当前项目名 | `宣传片` |

- **实时路径预览**：在设置页输入模板后即可预览完整归档路径，所见即所得。
- **归档结果反馈**：导出成功弹窗中显示归档目标路径，失败时显示具体错误信息。

**模板示例**：
```
输入：YYYY年|MM月结案项目|MM_DD项目名称
结果：D:\归档\2026年\2月结案项目\2_28宣传片\
```

### 💾 导出前自动备份

在设置页可开启两项独立的备份功能，每次点击"开始导出"时自动执行，任意一项失败均不影响正常导出流程。

- **备份序列**：在 Premiere Pro 项目面板中克隆当前活动序列，副本命名为 `项目名称_版本号`（如 `宣传片_V3`），可作为导出时序列状态的快照，方便日后回溯。
- **备份工程文件**：将当前 `.prproj` 文件以二进制方式复制到工程目录，命名为 `项目名称_版本号_备份.prproj`，不改变 Premiere Pro 当前打开的项目路径。
- **执行顺序**（两项都勾选时）：先备份序列 → 再备份工程文件（确保工程文件副本包含最新克隆的序列）→ 最后执行导出。

### ⚙️ 全局设置（持久化）

点击右上角 ⚙ 图标进入设置页面，以下配置会持久保存到本地，不随项目切换而丢失：

| 设置项 | 说明 | 默认值 |
|--------|------|--------|
| 导出文件夹名称 | 自动创建的导出目录名称 | `导出` |
| 版本号格式 | 数字（如 `V1`）或中文（如 `第一版`） | 数字格式 |
| 数字版本号前缀 | 拼接在版本数字前的字符串 | `V` |
| 归档根目录 | 定稿版归档的顶层文件夹（一次设置，全局生效） | 空（不归档） |
| 归档自动开关 | 导出定稿版时是否自动归档 | 关闭 |
| 归档文件夹结构 | 子文件夹层级模板，支持 `YYYY` / `MM` / `DD` / `项目名称` 变量，`|` 为层级分隔符 | `YYYY\|MM\|DD_项目名称` |
| 导出时备份序列 | 导出前在项目面板中克隆当前序列，命名为 `项目名_版本号` | 关闭 |
| 导出时备份工程文件 | 导出前在工程目录保存 `.prproj` 副本，命名为 `项目名_版本号_备份` | 关闭 |

返回主页时，导出路径和版本号显示会自动刷新，已手动修改的项目名称不会被覆盖。

## 📋 系统要求

- **Adobe Premiere Pro** 25.6.3 或更高版本（已测试）
- **操作系统**: Windows 10+ 或 macOS 10.15+

## 🌍 多语言支持

插件会自动检测您的 Premiere Pro 界面语言并自动切换，**包括界面文本和导出文件名标签**。

**当前支持的语言**：
- 🇨🇳 **简体中文** (zh-CN)
- 🇺🇸 **英语** (en)

### 多语言文件命名示例

**中文界面导出**：
```
宣传片_H.264_10Mbps_已调色_定稿版_V3.mp4
```

**英文界面导出**：
```
Promo_H.264_10Mbps_Graded_Final_V3.mp4
```

> 💡 **提示**：文件名中的标签（"已调色"、"定稿版" 等）会根据界面语言自动切换为对应翻译（"Graded"、"Final" 等），确保团队协作时文件命名保持一致。

### 🤝 帮助我们翻译

我们欢迎社区贡献者帮助将插件翻译成更多语言！如果您愿意帮忙翻译：

1. **查看现有翻译**：浏览 [`src/locales/`](src/locales/) 查看已支持的语言
2. **创建新的翻译文件**：复制 [`src/locales/en.json`](src/locales/en.json) 并重命名为对应的语言代码（如 `fr.json`, `de.json`, `ja.json`）
3. **翻译内容**：将英文替换为您的语言，保持 JSON 结构不变
4. **更新 i18n 系统**：在 [`src/locales/index.ts`](src/locales/index.ts) 中添加您的语言（参考现有代码）
5. **提交 Pull Request**：与社区分享您的翻译！

**翻译文件结构**：
```json
{
  "app": {
    "title": "您的翻译"
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

**需要帮助？**在 GitHub 提交 issue，我们会指导您完成翻译流程！

## 🚀 开发指南

### 环境准备
1. 安装 [Node.js 18+](https://nodejs.org/)
2. 安装 [Adobe UXP Developer Tool (UDT)](https://developer.adobe.com/photoshop/uxp/2022/guides/devtool/installation/)
3. 安装依赖：`yarn` 或 `npm install`

### 开发命令
```bash
# 开发模式（启用热重载）
yarn dev

# 生产构建
yarn build

# 打包为 CCX 插件
yarn ccx

# 打包为 ZIP 归档
yarn zip
```

### 调试
1. 运行 `yarn dev` 启动开发服务器
2. 在 UDT 中加载 `dist/manifest.json`
3. 连接到 Premiere Pro
4. 在 UDT 中点击 "Debug" 打开 Chrome DevTools

## 📖 使用说明

1. **打开项目**：在 Premiere Pro 中打开你的项目并保存。
2. **启动插件**：从菜单栏选择 `窗口 > 扩展 > 快速导出`。
3. **确认信息**：插件会自动检测项目名称、分辨率、版本号等信息。
4. **选择格式**：根据需要选择导出格式（H.264、ProRes 422、ProRes 444）。
5. **标记状态**：
   - 勾选 "已调色" 标记当前序列已完成调色。
   - 勾选 "定稿版" 启用高码率导出（仅H.264格式）。
6. **（可选）配置归档**：点击右上角 ⚙ 图标，在设置页选择归档根目录并设置文件夹结构模板，之后每次定稿版导出都会自动归档。
7. **（可选）开启导出前备份**：在设置页勾选"备份序列"和/或"备份工程文件"，之后每次导出前将自动备份。
8. **（可选）调整其他设置**：可自定义导出文件夹名称和版本号格式，设置自动持久保存。
9. **开始导出**：点击 "开始导出" 按钮，等待导出完成。如已配置归档，弹窗会显示归档路径。

## 🔧 项目结构

```
src/
├── modules/               # 核心业务模块
│   ├── projectLocationDetector.ts   # 项目位置检测
│   ├── exportFolderManager.ts       # 导出文件夹管理
│   ├── resolutionDetector.ts        # 分辨率检测
│   ├── fileVersioner.ts             # 版本号智能处理
│   ├── sequenceExporter.ts          # 序列导出
│   ├── archiveManager.ts            # 定稿版归档管理
│   ├── preExportBackup.ts           # 导出前备份（序列 + 工程文件）
│   └── FileSystemHelper.ts          # 文件系统辅助工具
├── api/                   # Premiere Pro API 封装
├── components/
│   └── SettingsView.vue             # 设置页面组件（含归档配置）
├── stores/
│   └── settings.ts                  # 持久化设置 Store（UXP DataFolder）
├── main.vue               # 主 Vue 组件
└── globals.ts             # 全局 UXP/Premiere Pro API 导入

public/
└── epr/                   # 导出预设文件
    ├── h264匹配帧10mbps.epr
    ├── h264匹配帧48mbps.epr
    ├── ProRes 422.epr
    └── ProRes 444.epr
```

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

本项目基于 [Bolt UXP](https://hyperbrew.co/resources/bolt-uxp) 框架构建。

![npm](https://img.shields.io/npm/v/bolt-uxp)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/hyperbrew/bolt-uxp/blob/master/LICENSE)
[![Chat](https://img.shields.io/badge/chat-discord-7289da.svg)](https://discord.gg/PC3EvvuRbc)
