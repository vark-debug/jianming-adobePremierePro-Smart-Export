# PremierePro-Smart-Export Changelog

## Version 1.0.0 (2026-01-21)

### 🎉 Initial Release - Migration to Bolt UXP

完全重构的现代化版本，从原始 CommonJS 插件迁移到 Bolt UXP 框架。

#### ✨ 新特性
- **现代化技术栈**: Vue 3 + TypeScript + Vite 构建
- **模块化架构**: 清晰的模块划分和类型安全
- **热重载开发**: 支持快速开发调试

#### 核心功能
- ✅ 智能分辨率检测（4K/1080p 自动选择码率）
- ✅ 自动版本号管理（V1/V2/V3... 或 第一版/第二版...）
- ✅ 调色状态标记（已调色/未调色）
- ✅ 自定义项目名称
- ✅ 多格式支持（H.264/ProRes 422/ProRes 444）
- ✅ 智能文件命名（自动清理日期标记）
- ✅ 导出文件夹自动创建和管理

#### 技术改进
- 完整的 TypeScript 类型定义
- Promise-based 异步流程
- 更好的错误处理和日志记录
- 跨平台路径处理优化

#### 已知限制
- 最低要求 Premiere Pro 22.3+
- 需要 UXP Developer Tool 进行开发和调试
