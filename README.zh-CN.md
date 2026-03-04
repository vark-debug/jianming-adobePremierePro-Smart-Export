# 快速导出（Quick Export）- Premiere Pro 智能导出 UXP 插件

> [English](README.md) | [简体中文](README.zh-CN.md)

[![Latest Release](https://img.shields.io/github/v/release/vark-debug/jianming-adobePremierePro-Smart-Export?label=Latest%20Release)](https://github.com/vark-debug/jianming-adobePremierePro-Smart-Export/releases)
[![License](https://img.shields.io/github/license/vark-debug/jianming-adobePremierePro-Smart-Export?color=blue)](LICENSE)
[![Premiere Pro](https://img.shields.io/badge/Premiere%20Pro-25.6.3+-purple.svg)](https://www.adobe.com/products/premiere.html)
[![Language](https://img.shields.io/badge/Language-English%20%7C%20Simplified%20Chinese-green.svg)](#-多语言支持)

**当前版本：1.4.0（2026-03-04）**

还在为反复调导出参数、文件版本混乱、交付流程手动处理而浪费时间？
这是一款面向 Adobe Premiere Pro 的 UXP 自动化导出插件：一键智能匹配预设、自动版本管理、内置归档与备份，让你把时间留给剪辑，而不是行政流程。

## 🎯 核心亮点
- **一键智能导出**：自动检测序列分辨率并匹配最佳导出预设
- **告别版本混乱**：自动递增版本号，不再出现 `终稿_终稿_最终版.mp4`
- **模板化命名**：通过可配置变量生成文件名，空字段自动省略
- **智能交付管理**：定稿版自动归档，支持自定义目录层级
- **低风险工作流**：每次导出前可自动备份序列和工程文件
- **原生多语言**：界面与文件命名标签支持中英自动切换

双语文档协作规范见 [Translation Guide / 翻译指南](TRANSLATION_GUIDE.md)。

## 📸 预览

![演示](https://github.com/user-attachments/assets/27f4d654-c1cb-4364-a4b5-555b19f313ba)

## 🚀 安装

### 推荐：稳定版安装（适合所有用户）
1. 打开 [Releases 页面](https://github.com/vark-debug/jianming-adobePremierePro-Smart-Export/releases)
2. 下载最新 `.ccx` 安装包
3. 双击 `.ccx` 文件，按 Adobe Creative Cloud 提示完成安装
4. 重启 Premiere Pro，在 `窗口 > UXP 插件 > 快速导出` 中打开插件

### 开发者模式（适合贡献者与测试者）
1. 安装 [Adobe UXP Developer Tool (UDT)](https://developer.adobe.com/udt/)
2. 克隆本仓库到本地
3. 按下文 [开发指南](#-开发指南) 完成构建
4. 使用 UDT 将插件加载到 Premiere Pro

---

## 📖 快速开始
1. 在 Premiere Pro 中打开并保存项目（未保存项目不支持）
2. 通过 `窗口 > UXP 插件 > 快速导出` 启动插件
3. 插件会自动检测项目名、序列分辨率和当前最新版本号
4. 选择导出格式（H.264、ProRes 422、ProRes 444）
5. 点击 `开始导出`，其余流程自动完成

---

## ✨ 核心功能

### 🎯 智能一键导出
无需反复手动调预设，插件会根据序列信息自动匹配导出参数。
- **双导出模式**：
  - 默认模式：使用 H.264 10Mbps 标准预设，适合日常工作与快速交付
  - 定稿版模式：勾选后根据分辨率自动应用更高码率参数
    - 4K+（长边 ≥ 3840px）：48Mbps 高码率预设，保障交付质量
    - 1080p 及以下：10Mbps 标准预设，平衡画质与体积
- **多格式原生支持**：
  - H.264 (MP4)：通用交付格式，跨平台兼容性好
  - ProRes 422 (MOV)：高质量中间片，适合存档与后期交接
  - ProRes 444 (MOV)：支持 Alpha 通道，适合特效合成与动态图形
  - HEVC 预设文件已内置在 `public/epr/`，但受 Premiere Pro UXP API 限制当前不可用

### 📁 自动文件管理与版本控制
告别命名混乱和版本丢失，插件会自动识别并递增版本号。
- **智能版本迭代**：自动扫描导出目录并续增版本
  - 支持数字格式：`V1`、`V2`、`V3...`（可无限递增，前缀可自定义）
  - 支持中文格式：`第一版`、`第二版`...（最多支持 20 版）
- **智能命名**：自动生成包含格式、码率、状态标记、版本号的标准文件名
  - 示例：`宣传片_H.264_10Mbps_已调色_定稿版_V3.mp4`
- **文件名模板变量**：
  - 支持变量：`YYYY`、`MM`、`DD`、`项目名称`、`序列名称`、`码流`、`编码器`、`比例`、`调色标签`、`定稿版标签`、`版本号`
  - 当变量值为空时，对应字段会自动整段省略
- **可配置能力**：
  - 导出前可临时修改项目名，且版本延续不受影响
  - 支持全局版本格式设置与数字前缀自定义
  - 自动从历史文件名同步状态标记（支持 `graded`、`cc`、`已调色`、`调色` 等）

### 📦 定稿版自动归档
避免最终交付文件分散丢失。导出定稿版时，插件可自动复制到指定归档目录，并支持自定义层级。
- 在设置中选择一次全局归档根目录，后续项目复用
- 支持目录模板，用 `|` 分隔层级
- 编辑模板时实时预览最终归档路径
- 导出成功弹窗显示归档结果与目标路径
- **模板变量支持**：

  | 变量 | 说明 | 示例（2026年2月28日） |
  |------|------|----------------------|
  | `YYYY` | 4 位年份 | `2026` |
  | `MM` | 月份（不补零） | `2` |
  | `DD` | 日期（不补零） | `28` |
  | `项目名称` | 当前项目名称 | `宣传片` |

- **模板示例**：
  - 输入：`YYYY年|MM月结案项目|MM_DD项目名称`
  - 输出：`D:\归档\2026年\2月结案项目\2_28宣传片\`

### 💾 导出前自动备份
每次导出前可独立执行两类备份，不影响主工程。
- **序列备份**：克隆当前活动序列到项目面板，命名为当前版本（例如 `宣传片_V3`），形成时间点快照
- **工程文件备份**：将当前 `.prproj` 二进制复制到工程目录，命名为 `项目名_版本号_备份.prproj`
- **执行顺序**：备份序列 → 备份工程文件 → 导出（确保备份包含最新时间线状态）
- 即使备份失败，也不会阻塞核心导出流程

---

## ⚙️ 全局设置（持久化）
所有设置通过 UXP DataFolder 本地持久化保存，重启或切换项目后仍保留。点击右上角 ⚙ 进入设置。

| 设置项 | 说明 | 默认值 |
|--------|------|--------|
| 导出文件夹名称 | 在项目父目录自动创建的导出文件夹名 | `导出` |
| 版本号格式 | 数字（如 `V1`）或中文（如 `第一版`） | 数字 |
| 数字版本号前缀 | 拼接在数字版本前的字符串 | `V` |
| 文件名模板 | 导出文件名结构模板 | `项目名称_编码器_码流_调色标签_定稿版标签_版本号` |
| 归档根目录 | 定稿版自动归档的全局顶层目录 | 空（关闭归档） |
| 自动归档开关 | 是否在导出定稿版时自动归档 | 关闭 |
| 归档文件夹结构 | 支持 `YYYY`/`MM`/`DD`/`项目名称`，`|` 分隔层级 | `YYYY|MM|DD_项目名称` |
| 导出时备份序列 | 导出前自动克隆当前活动序列 | 关闭 |
| 导出时备份工程文件 | 导出前自动备份 `.prproj` 文件 | 关闭 |
| 文件名标签显示 | 是否在主界面显示文件名字段标签 | 开启 |

---

## 📋 系统要求
- Adobe Premiere Pro 25.6.3 或更高（已完整测试）
- 操作系统：Windows 10+ / macOS 10.15+

## 🌍 多语言支持
插件会自动识别 Premiere Pro 界面语言，并同步切换界面文案与导出文件名标签。
- 当前支持：简体中文（zh-CN）/ 英语（en）
- 文件名标签随语言自动切换，便于跨地区团队协作统一规范
  - 中文界面导出：`宣传片_H.264_10Mbps_已调色_定稿版_V3.mp4`
  - 英文界面导出：`Promo_H.264_10Mbps_Graded_Final_V3.mp4`

欢迎提交翻译贡献，详见 [Translation Guide / 翻译指南](TRANSLATION_GUIDE.md) 与 [贡献指南](#-贡献)。

---

## 🔧 开发指南

### 环境准备
1. 安装 Node.js 18+
2. 安装 [Adobe UXP Developer Tool (UDT)](https://developer.adobe.com/udt/)
3. 安装依赖：

```bash
yarn
# 或
npm install

# 启动开发模式（热重载）
yarn dev

# 生产构建
yarn build

# 打包为可安装 CCX
yarn ccx
# 输出到 dist/

# 打包 ZIP 归档
yarn zip
# 输出到 public-zip/
```

### 调试
1. 运行 `yarn dev` 启动开发服务器
2. 打开 Adobe UXP Developer Tool
3. 通过 `dist/manifest.json` 加载插件
4. 连接 Premiere Pro 后点击 “Debug” 打开 Chrome DevTools

### 项目结构
```
src/
├── modules/               # 核心业务模块
│   ├── projectLocationDetector.ts   # 项目路径与位置检测
│   ├── exportFolderManager.ts       # 导出文件夹自动创建与管理
│   ├── resolutionDetector.ts        # 分辨率与帧率检测
│   ├── fileVersioner.ts             # 智能版本迭代与命名
│   ├── sequenceExporter.ts          # 核心导出逻辑与预设匹配
│   ├── archiveManager.ts            # 定稿版自动归档
│   ├── preExportBackup.ts           # 导出前备份（序列/工程）
│   └── FileSystemHelper.ts          # 跨平台文件系统工具
├── api/                   # Premiere Pro API 封装层
├── components/            # Vue 3 UI 组件
│   └── SettingsView.vue             # 设置页组件
├── stores/                # 状态管理
│   └── settings.ts                  # 持久化全局设置
├── locales/               # i18n 语言资源
├── main.vue               # 主应用组件
└── globals.ts             # UXP / Premiere Pro 全局 API 导入

public/
└── epr/                   # Premiere 导出预设文件
    ├── h264匹配帧10mbps.epr
    ├── h264匹配帧48mbps.epr
    ├── HEVC匹配帧 10Mbps.epr
    ├── HEVC匹配帧35Mbps.epr
    ├── ProRes 422.epr
    └── ProRes 444.epr
```

## 🤝 贡献
欢迎提 Issue、提建议和提交 PR。无论是功能优化、Bug 修复还是文档改进，都非常感谢。

## 📄 许可证
本项目基于 MIT License 开源，详见 [LICENSE](LICENSE)。

## 🙏 致谢
本项目基于 Bolt UXP 框架构建，感谢其对 Adobe UXP 生态的支持。