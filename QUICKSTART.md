# 快速启动指南 | Quick Start Guide

## 🚀 5 分钟上手 | Get Started in 5 Minutes

### 第一步：安装依赖 | Step 1: Install Dependencies
```bash
yarn
# 或 / or
npm install
```

### 第二步：启动开发模式 | Step 2: Start Dev Mode
```bash
yarn dev
```

等待构建完成，你会看到类似输出：
Wait for build to finish, you should see output like:
```
vite v6.3.5 building for production...
✓ built in XXXms
```

### 第三步：在 Premiere Pro 中加载插件 | Step 3: Load Plugin in Premiere Pro

1. **打开 Adobe UXP Developer Tool (UDT) | Open Adobe UXP Developer Tool (UDT)**
   - 如果还没安装，从 [这里下载](https://developer.adobe.com/photoshop/uxp/2022/guides/devtool/installation/)
   - If not installed yet, download it [here](https://developer.adobe.com/photoshop/uxp/2022/guides/devtool/installation/)

2. **添加插件 | Add Plugin**
   - 在 UDT 中点击 `Add Plugin...`
   - 导航到项目目录
   - 选择 `dist/manifest.json`
   - 点击 `Load`
   - In UDT, click `Add Plugin...`
   - Navigate to the project folder
   - Select `dist/manifest.json`
   - Click `Load`

3. **在 Premiere Pro 中打开插件 | Open Plugin in Premiere Pro**
   - 启动 Adobe Premiere Pro
   - 打开任意项目（必须先保存项目）
   - 菜单栏：`窗口` > `扩展` > `快速导出`
   - Launch Adobe Premiere Pro
   - Open any project (project must be saved first)
   - Menu: `Window` > `Extensions` > `快速导出`

### 第四步：测试功能 | Step 4: Test Features

1. **验证信息加载 | Verify Initial Info**
   - 插件界面应自动显示项目名称
   - 显示推荐码率（10mbps 或 48mbps）
   - 显示版本号（V1 或更高）
   - The plugin UI should auto-display project name
   - Recommended bitrate should appear (10mbps or 48mbps)
   - Version number should appear (V1 or above)

2. **尝试导出 | Try Exporting**
   - 确保有活动序列
   - 点击 `开始导出`
   - 等待导出完成
   - 检查导出文件夹
   - Make sure an active sequence exists
   - Click `开始导出`
   - Wait for export completion
   - Check the export folder

## 🐛 调试 | Debugging

### 打开 DevTools | Open DevTools
- 在 UDT 中点击插件旁边的 `Debug` 按钮
- 会打开 Chrome DevTools
- 在 Console 中查看所有 `console.log` 输出
- In UDT, click the `Debug` button next to your plugin
- Chrome DevTools will open
- Check all `console.log` output in Console

### 热重载 | Hot Reload
- 修改 `src/` 下任意文件
- 保存后插件会自动重新加载
- 无需手动刷新
- Edit any file under `src/`
- Plugin reloads automatically after save
- No manual refresh needed

## 📝 常用命令 | Common Commands

```bash
# 开发模式（热重载）/ Dev mode (hot reload)
yarn dev

# 生产构建 / Production build
yarn build

# 打包为 CCX（用于分发）/ Package as CCX (distribution)
yarn ccx

# 打包为 ZIP / Package as ZIP
yarn zip
```

## ⚡ 快速修改 | Quick Edits

### 修改插件名称 | Change Plugin Name
编辑 / Edit `uxp.config.ts`:
```typescript
const name = "你的插件名称";
```

### 修改窗口大小 | Change Panel Size
编辑 / Edit `uxp.config.ts`:
```typescript
minimumSize: { width: 430, height: 500 },
preferredDockedSize: { width: 430, height: 600 },
```

### 添加新功能 | Add New Feature
1. 在 `src/modules/` 创建新模块
2. 在 `src/main.vue` 中导入并使用
3. 保存并查看效果
1. Create a new module under `src/modules/`
2. Import and use it in `src/main.vue`
3. Save and verify changes

## 🎯 下一步 | Next Steps

- 查看 [README.md](README.md) 了解完整功能
- 查看 [README.zh-CN.md](README.zh-CN.md) 阅读中文完整说明
- 查看 [CHANGELOG_PROJECT.md](CHANGELOG_PROJECT.md) 了解版本变化
- 查看 [.github/copilot-instructions.md](.github/copilot-instructions.md) 了解项目架构约定
- Read [README.md](README.md) for full feature overview
- Read [README.zh-CN.md](README.zh-CN.md) for full Chinese documentation
- Read [CHANGELOG_PROJECT.md](CHANGELOG_PROJECT.md) for version changes
- Read [.github/copilot-instructions.md](.github/copilot-instructions.md) for architecture conventions

## ❓ 常见问题 | FAQ

### Q: 插件无法加载 / Plugin failed to load
A: 确保已运行 `yarn dev` 且 `dist/manifest.json` 存在。
A: Make sure `yarn dev` is running and `dist/manifest.json` exists.

### Q: 热重载不工作 / Hot reload not working
A: 检查端口 8080 是否被占用，并重启 UDT 与 Premiere Pro。
A: Check whether port 8080 is occupied, then restart UDT and Premiere Pro.

### Q: 找不到预设文件 / Preset files not found
A: 确认 `public/epr/` 目录中存在 `.epr` 文件。
A: Make sure `.epr` files exist under `public/epr/`.

### Q: TypeScript 报错 / TypeScript errors
A: 运行 `yarn build` 查看详细报错信息。
A: Run `yarn build` to see detailed error output.

---

**祝开发愉快！| Happy coding!** 🎉
