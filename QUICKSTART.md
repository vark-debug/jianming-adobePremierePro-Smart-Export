# 快速启动指南

## 🚀 5 分钟上手

### 第一步：安装依赖
```bash
yarn
# 或
npm install
```

### 第二步：启动开发模式
```bash
yarn dev
```

等待构建完成，你会看到：
```
vite v6.3.5 building for production...
✓ built in XXXms
```

### 第三步：在 Premiere Pro 中加载插件

1. **打开 Adobe UXP Developer Tool (UDT)**
   - 如果还没安装，从 [这里下载](https://developer.adobe.com/photoshop/uxp/2022/guides/devtool/installation/)

2. **添加插件**
   - 在 UDT 中点击 `Add Plugin...`
   - 导航到项目目录
   - 选择 `dist/manifest.json`
   - 点击 `Load`

3. **在 Premiere Pro 中打开插件**
   - 启动 Adobe Premiere Pro
   - 打开任意项目（必须先保存项目）
   - 菜单栏：`窗口` > `扩展` > `快速导出`

### 第四步：测试功能

1. **验证信息加载**
   - 插件界面应自动显示项目名称
   - 显示推荐的码率（10mbps 或 48mbps）
   - 显示版本号（V1 或更高）

2. **尝试导出**
   - 确保有活动序列
   - 点击 `开始导出`
   - 等待导出完成
   - 检查导出文件夹

## 🐛 调试

### 打开 DevTools
- 在 UDT 中，点击插件旁边的 `Debug` 按钮
- 会打开 Chrome DevTools
- 在 Console 中可以看到所有 `console.log` 输出

### 热重载
- 修改 `src/` 下的任何文件
- 保存后插件会自动重新加载
- 无需手动刷新

## 📝 常用命令

```bash
# 开发模式（热重载）
yarn dev

# 生产构建
yarn build

# 打包为 CCX（用于分发）
yarn ccx

# 打包为 ZIP
yarn zip
```

## ⚡ 快速修改

### 修改插件名称
编辑 `uxp.config.ts`：
```typescript
const name = "你的插件名称";
```

### 修改窗口大小
编辑 `uxp.config.ts`：
```typescript
minimumSize: { width: 430, height: 500 },
preferredDockedSize: { width: 430, height: 600 },
```

### 添加新功能
1. 在 `src/modules/` 创建新模块
2. 在 `src/main.vue` 中导入并使用
3. 保存，查看效果

## 🎯 下一步

- 查看 [README.md](README.md) 了解完整功能
- 查看 [TESTING.md](TESTING.md) 了解测试流程
- 查看 [MIGRATION.md](MIGRATION.md) 了解迁移详情
- 查看 [.github/copilot-instructions.md](.github/copilot-instructions.md) 了解代码架构

## ❓ 常见问题

### Q: 插件无法加载
A: 确保运行了 `yarn dev` 并且 `dist/manifest.json` 存在

### Q: 热重载不工作
A: 检查端口 8080 是否被占用，重启 UDT 和 Premiere Pro

### Q: 找不到预设文件
A: 确认 `public/epr/` 目录下有 `.epr` 文件

### Q: TypeScript 报错
A: 运行 `yarn build` 查看详细错误信息

---

**祝开发愉快！** 🎉
