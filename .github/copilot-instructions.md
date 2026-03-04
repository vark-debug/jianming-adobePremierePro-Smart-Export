# PremierePro-Smart-Export Copilot Instructions

**版本 1.4.0** — 一个基于 **Bolt UXP** 框架的 Adobe Premiere Pro 自动化导出插件。使用 Vue 3 + TypeScript + Vite 构建，从旧版 CommonJS 项目完整迁移。核心功能：智能检测分辨率、自动版本管理、可配置文件名模板、归档管理、导出前备份、多格式导出（H.264/ProRes）、一键导出。

## 技术栈 & 关键约束

- **Bolt UXP**: Vite-based UXP plugin builder + 热重载 (port 8080)
- **UI**: Vue 3 + TypeScript + Spectrum Web Components (注意：不支持 `v-model`，使用 `:value` + `@input`)
- **构建**: Vite 6 (IIFE 格式防止全局变量覆盖) + vite-uxp-plugin
- **API**: Premiere Pro UXP API (`premierepro`) + UXP Storage API (`uxp.storage.localFileSystem`)
- **类型**: `@adobe/cc-ext-uxp-types` + [src/types/ppro.d.ts](src/types/ppro.d.ts) 扩展
- **全局导入**: 使用 [src/globals.ts](src/globals.ts) 统一导入 UXP 和宿主 API（`uxp`, `premierepro` 等），避免直接 `require()`

## 核心业务流程

插件通过**管道式数据流**完成导出（参考 [main.vue](src/main.vue) `startExport()` 和 `refreshProjectInfo()`）：

1. **项目位置检测** ([projectLocationDetector.ts](src/modules/projectLocationDetector.ts)): 通过 `Project.getActiveProject().path` 获取 `.prproj` 文件路径
2. **导出文件夹创建** ([exportFolderManager.ts](src/modules/exportFolderManager.ts)): 在项目父目录的上级创建 "导出" 文件夹（使用 `file:///` URL + `fs.getEntryWithUrl()`）
3. **分辨率检测** ([resolutionDetector.ts](src/modules/resolutionDetector.ts)): 通过 `sequence.getSettings().getVideoFrameRect()` 判断 4K (≥3840px) 或 1080p，推荐 48mbps/10mbps 码率
4. **版本号智能处理** ([fileVersioner.ts](src/modules/fileVersioner.ts)): 
   - **递归遍历**导出文件夹所有视频文件 (`.mp4`, `.mov`, `.avi`, `.mkv`, `.mxf`)
   - **版本号提取**: 识别 `V1/V2/V3...` 和 `第一版/第二版...` 格式，支持自定义前缀（`versionPrefix`）
   - **版本模式**: `numeric`（如 V1/V2）或 `chinese`（如 第一版/第二版），由 `versionMode` 设置控制
   - **智能清理**: 移除日期标记（`2025-2-3`、`8月19日`）、码率标记、调色标记、定稿版标记
   - **状态检测**: 识别 `已调色`/`调色`/`graded`/`cc` 和 `定稿版`/`final` 关键词
   - **文件名模板**: 通过 `resolveFilenameTemplate(template, vars)` 解析，支持变量：`YYYY`、`MM`、`DD`、`项目名称`、`序列名称`、`码流`、`编码器`、`比例`、`调色标签`、`定稿版标签`、`版本号`；空值段自动省略
   - 默认模板：`项目名称_编码器_码流_调色标签_定稿版标签_版本号`（可在设置中自定义）
   - `previewFilenameTemplate()` 供 UI 实时预览
5. **序列导出** ([sequenceExporter.ts](src/modules/sequenceExporter.ts)): 使用 `EncoderManager.exportSequence()` + `public/epr/*.epr` 预设文件（H.264 10Mbps/48Mbps、ProRes 422/444）；HEVC 预设文件（`.epr`）已备好但 Adobe 暂未开放对应 API，**当前不可用**
6. **归档管理**（可选，[archiveManager.ts](src/modules/archiveManager.ts)）: 定稿版文件自动复制到自定义归档目录；路径由模板生成（`|` 分隔层级，支持 `YYYY`/`MM`/`DD`/`项目名称` 变量）
7. **导出前备份**（可选，[preExportBackup.ts](src/modules/preExportBackup.ts)）: 导出前克隆活动序列（项目面板追加备份副本）和/或在工程文件目录创建 `.prproj` 带时间戳备份副本

**重要**: 所有模块返回统一的 `{ success, data?, error? }` 结果对象格式。

### 设置系统

全局设置通过 [src/stores/settings.ts](src/stores/settings.ts) 管理，使用 **UXP DataFolder** 持久化（不受项目切换影响），由 [components/SettingsView.vue](src/components/SettingsView.vue) 提供 UI：

| 设置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `exportFolderName` | string | `'导出'` | 导出文件夹名称 |
| `versionMode` | `'numeric'\|'chinese'` | `'numeric'` | 版本号模式 |
| `versionPrefix` | string | `'V'` | 版本号前缀（数字模式） |
| `filenameTemplate` | string | `'项目名称_编码器_码流_调色标签_定稿版标签_版本号'` | 文件名模板 |
| `archiveEnabled` | boolean | `false` | 是否启用归档 |
| `archiveBasePath` | string | `''` | 归档根目录（原生路径） |
| `archiveFolderTemplate` | string | `'YYYY\|MM\|DD_项目名称'` | 归档路径模板 |
| `backupSequenceBeforeExport` | boolean | `false` | 导出前备份序列 |
| `backupProjectBeforeExport` | boolean | `false` | 导出前备份工程文件 |
| `showFilenameLabels` | boolean | `true` | UI 是否显示文件名字段标签 |

## 关键架构决策 & 陷阱

### Bolt UXP 框架层
- **统一 API 层**: [src/api/api.ts](src/api/api.ts) 根据宿主应用动态导出 API（`if (hostName.startsWith("premierepro")) host = premierepro;`）
- **配置驱动**: [uxp.config.ts](uxp.config.ts) 声明 manifest、权限、入口点（面板大小、热重载端口等）
- **External 声明**: Premiere Pro API (`premierepro`)、UXP API (`uxp`)、Node.js 模块 (`fs`, `path`) **必须**在 [vite.config.ts](vite.config.ts#L21-L28) 的 `rollupOptions.external` 中声明
- **IIFE 输出**: Vue 3 需要 `format: "iife"` 防止全局变量覆盖 ([vite.config.ts](vite.config.ts#L22-L26))
- **打包命令**: 
  - `yarn dev` - 开发模式（热重载）
  - `yarn build` - 生产构建至 `dist/`
  - `yarn ccx` - 打包为 `.ccx` 插件包（用于分发）
  - `yarn zip` - 打包为 `.zip` 归档

### UXP 文件系统陷阱
- **路径转换**: 使用 `file:///` URL 访问本地路径（如 `file:///C:/Users/...` 或 `file:///Users/...`）
- **获取文件夹对象**: `await fs.getEntryWithUrl(fileUrl)` → **必须验证** `entry.isFolder` 属性
- **插件预设文件**: 通过 `fs.getPluginFolder()` 访问 `public/epr/` 目录（Bolt UXP 构建后 epr 在 dist 根目录）
- **打开系统文件夹**: 使用 `uxp.shell.openPath(nativePath)` 在访达/资源管理器中打开（见 [FileSystemHelper.ts](src/modules/FileSystemHelper.ts)）
- **跨平台路径**: Mac 使用 `/`，Windows 使用 `\`，需根据 `nativePath.includes('\\')` 判断

### Spectrum Web Components 特殊处理
- **不支持 `v-model`**: 使用 `:value` + `@input` 或 `:selected` + `@change` 绑定
- **示例** ([main.vue](src/main.vue#L275-L282)):
  ```vue
  <sp-radio-group :selected="exportFormat" @change="onExportFormatChange">
    <sp-radio value="h264">H.264（默认）</sp-radio>
  </sp-radio-group>
  
  function onExportFormatChange(event: any) {
    exportFormat.value = event.target.selected;
  }
  ```

## 开发工作流

### 首次启动
1. 安装 [Adobe UXP Developer Tool (UDT)](https://developer.adobe.com/photoshop/uxp/2022/guides/devtool/installation/)
2. `yarn` 安装依赖
3. `yarn dev` 启动开发服务器
4. UDT 中加载 `dist/manifest.json` 并连接到 Premiere Pro

### 热重载
- Vite 监听 `src/` 变化并重新构建到 `dist/`
- 插件通过 WebSocket (`ws://localhost:8080`) 接收更新通知
- UXP 插件自动重载（需确保 [uxp.config.ts](uxp.config.ts#L7) 中 `hotReloadPort` = 8080）

### 添加新功能模块
1. 在 `src/modules/` 创建 TypeScript 文件
2. 导出函数时使用统一的结果对象格式：
   ```typescript
   export async function myFunction(): Promise<{ success: boolean; data?: any; error?: string }> {
     try {
       return { success: true, data: result };
     } catch (e) {
       return { success: false, error: e.message };
     }
   }
   ```
3. 在 Vue 组件中导入并调用

### 调试技巧
- **Chrome DevTools**: UDT 中点击 "Debug" 按钮
- **Console 日志**: `console.log()` 输出到 DevTools
- **错误追踪**: 开发模式启用 sourcemap ([vite.config.ts](vite.config.ts#L17))

## 项目特定约定

### 旧版迁移 (从 PR-Smart-Export)
- `require('./module')` → `import { func } from './module'`
- `module.exports = { ... }` → `export const func = ...`
- 旧版 `.epr` 预设文件位于项目根 `epr/` → 新版在 `public/epr/`

### 智能文件版本命名（模板驱动）
- **文件名由模板生成**，默认模板：`项目名称_编码器_码流_调色标签_定稿版标签_版本号`
- 空值段自动省略（如无调色标签时 `_调色标签` 整段省略）
- 模板变量：`YYYY`/`MM`/`DD`（日期）、`项目名称`、`序列名称`、`码流`、`编码器`、`比例`、`调色标签`、`定稿版标签`、`版本号`
- 版本号支持：数字模式（`V1`/`V2`）或中文模式（`第一版`/`第二版`），前缀可自定义
- 示例（默认模板）：
  - 默认版本：`宣传片_H.264_10Mbps_V1.mp4`
  - 调色版本：`宣传片_H.264_10Mbps_已调色_V2.mp4`
  - 定稿版本：`宣传片_H.264_48Mbps_已调色_定稿版_V3.mp4`
  - HEVC版本：（预留，目前 Adobe 未开放 API，暂不可用）

### 状态标记系统
- **调色状态标记**：`已调色`、`调色`、`graded`、`cc`
- **定稿版标记**：`定稿版`、`final`
- **导出逻辑**：
  - 默认模式：H.264 10mbps（适合日常工作）
  - 定稿版模式：根据分辨率自动选择码率（4K用48mbps，1080p用10mbps）
  - ProRes格式：不受定稿版影响，始终使用固定预设
- 自动同步 UI：检测已有文件的状态标记并更新界面

### 语言检测
- [languageDetector.ts](src/modules/languageDetector.ts) 通过 `uxp.host.uiLocale`（后备 `navigator.language`）检测运行环境语言
- 返回 `isChineseSimplified`/`isChineseTraditional`/`isEnglish` 布尔值

### 归档功能
- 由 [archiveManager.ts](src/modules/archiveManager.ts) 实现，仅在用户启用归档且设置了 `archiveBasePath` 时生效
- 归档路径模板支持 `YYYY`/`MM`/`DD`/`项目名称`，`|` 为层级分隔符
- 示例：`YYYY年|MM月结案|项目名称` → `2026年/3月结案/宣传片/`
- `previewArchivePath(basePath, template, projectName)` 可生成预览路径

### 导出前备份
- 由 [preExportBackup.ts](src/modules/preExportBackup.ts) 实现
- `backupCurrentSequence()`：在项目面板中克隆活动序列，命名含时间戳
- `backupProjectFile()`：在 `.prproj` 同级目录创建带时间戳的备份副本
- 推荐顺序：先备份序列 → 再备份工程 → 再导出（确保工程备份包含序列克隆）

## 常见问题排查

### 权限错误
- 检查 [uxp.config.ts](uxp.config.ts#L100-L127) 的 `requiredPermissions`
- 文件系统需要 `localFileSystem: "fullAccess"`

### 构建错误: "Cannot resolve module 'premierepro'"
- 确保在 [vite.config.ts](vite.config.ts#L21-L28) 的 `rollupOptions.external` 中声明

### 热重载失败
- 检查端口 8080 是否被占用
- 确认 [uxp.config.ts](uxp.config.ts#L7) 中 `hotReloadPort` 与 Vite 配置一致
- 确认网络权限包含 `ws://localhost:8080`

### TypeScript 类型错误
- Premiere Pro API 类型来自 `@adobe/cc-ext-uxp-types`
- 自定义类型扩展在 [src/types/ppro.d.ts](src/types/ppro.d.ts)

## 相关资源

- [Bolt UXP 官方文档](https://hyperbrew.co/resources/bolt-uxp)
- [Adobe UXP 开发指南](https://developer.adobe.com/photoshop/uxp/)
- [Premiere Pro UXP API 参考](https://developer.adobe.com/premiere-pro/uxp/)
