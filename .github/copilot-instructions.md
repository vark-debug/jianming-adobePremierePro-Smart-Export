# PremierePro-Smart-Export Copilot Instructions

一个基于 **Bolt UXP** 框架的 Adobe Premiere Pro 自动化导出插件。使用 Vue 3 + TypeScript + Vite 构建，从旧版 CommonJS 项目完整迁移。核心功能：智能检测分辨率、自动版本管理、一键导出。

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
   - **版本号提取**: 识别 `V1/V2/V3...` 和 `第一版/第二版...` 格式
   - **智能清理**: 移除日期标记（`2025-2-3`、`8月19日`）、码率标记、调色标记、定稿版标记
   - **状态检测**: 识别 `已调色`/`调色`/`graded`/`cc` 和 `定稿版`/`final` 关键词
   - **新文件名生成**: `项目名_码率_调色状态_定稿版_版本号.扩展名`（如 `宣传片_H.264_48Mbps_已调色_定稿版_V4.mp4`）
5. **序列导出** ([sequenceExporter.ts](src/modules/sequenceExporter.ts)): 使用 `EncoderManager.exportSequence()` + `public/epr/*.epr` 预设文件

**重要**: 所有模块返回统一的 `{ success, data?, error? }` 结果对象格式。

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

### 智能文件版本命名
- 支持版本号：`V1/V2/V3...` 或 `第一版/第二版...`
- 自动清理日期标记（`2025-2-3`、`8月19日`）、码率标记、调色标记、定稿版标记
- 输出格式：`项目名_码率_调色状态_定稿版_版本号.扩展名`
- 示例：
  - 默认版本：`宣传片_H.264_10Mbps_V1.mp4`
  - 调色版本：`宣传片_H.264_10Mbps_已调色_V2.mp4`
  - 定稿版本：`宣传片_H.264_48Mbps_已调色_定稿版_V3.mp4`

### 状态标记系统
- **调色状态标记**：`已调色`、`调色`、`graded`、`cc`
- **定稿版标记**：`定稿版`、`final`
- **导出逻辑**：
  - 默认模式：H.264 10mbps（适合日常工作）
  - 定稿版模式：根据分辨率自动选择码率（4K用48mbps，1080p用10mbps）
  - ProRes格式：不受定稿版影响，始终使用固定预设
- 自动同步 UI：检测已有文件的状态标记并更新界面

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
