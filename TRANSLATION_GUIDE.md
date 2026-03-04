# Translation Guide / 翻译指南

> This document defines how to write and maintain bilingual content for this project.
> 本文档用于规范本项目的双语文档写作与维护方式。

## 1) Scope / 适用范围

- Applies to: `README.md`, `README.zh-CN.md`, UI locale files in `src/locales/`, release notes, and user-facing copy.
- 适用于：`README.md`、`README.zh-CN.md`、`src/locales/` 下的界面文案、发布说明及所有用户可见文本。

## 2) Bilingual Writing Style / 双语写法规范

- Keep meaning equivalent, not word-for-word rigid translation.
- 中英文保持语义一致，不要求逐词直译。
- Prefer short, direct sentences for product instructions.
- 产品说明优先使用简短、直接句式。
- Keep product terms and feature names consistent across files.
- 功能名称与产品术语在所有文件中保持一致。
- For mixed-language headings, use `English / 中文` format.
- 双语标题使用 `English / 中文` 格式。

## 3) Terminology / 术语对照

| English | 中文 | Notes |
|---|---|---|
| Smart Export | 智能导出 | Plugin core value |
| One-click Export | 一键导出 | Keep action-focused |
| Final Version | 定稿版 | Status tag |
| Graded | 已调色 | Status tag |
| Archive | 归档 | File copy workflow |
| Pre-export Backup | 导出前备份 | Sequence + project backup |
| Filename Template | 文件名模板 | `filenameTemplate` setting |
| Version Mode | 版本号模式 | `numeric` / `chinese` |
| Version Prefix | 版本号前缀 | `versionPrefix` setting |
| Export Folder | 导出文件夹 | Default: `导出` |
| Sequence | 序列 | Premiere timeline sequence |

## 4) Locale Keys & Variables / 文案键值与变量

- Do not rename existing locale keys unless refactor is planned.
- 未计划重构时，不要随意改动已有 locale key 名称。
- Keep placeholders identical between languages.
- 中英文占位符必须一致。
- Recommended placeholder style: `{projectName}`, `{version}`.
- 推荐占位符写法：`{projectName}`、`{version}`。
- Template variables must stay exactly as defined: `YYYY`, `MM`, `DD`, `项目名称`, `序列名称`, `码流`, `编码器`, `比例`, `调色标签`, `定稿版标签`, `版本号`.
- 文件名模板变量必须严格使用既定名称：`YYYY`、`MM`、`DD`、`项目名称`、`序列名称`、`码流`、`编码器`、`比例`、`调色标签`、`定稿版标签`、`版本号`。

## 5) Documentation Sync Checklist / 文档同步清单

When adding/changing a feature, update in one pass:
新增/变更功能时，请一次性同步以下内容：

1. `README.md` (EN) and `README.zh-CN.md` (ZH).
2. `README.md`（英文）与 `README.zh-CN.md`（中文）。
3. `src/locales/en.json` and `src/locales/zh-CN.json`.
4. `src/locales/en.json` 与 `src/locales/zh-CN.json`。
5. `CHANGELOG_PROJECT.md` version notes.
6. `CHANGELOG_PROJECT.md` 版本记录。

## 6) Tone & Quality / 语气与质量

- Product voice: practical, concise, and workflow-oriented.
- 产品语气：务实、简洁、面向工作流。
- Avoid exaggerated claims (e.g. “perfect”, “100% guaranteed”).
- 避免夸张表述（如“完美”“100%保证”）。
- Keep examples realistic for editors and post-production teams.
- 示例应贴近剪辑与后期团队的真实使用场景。

## 7) Pull Request Note Template / PR 说明模板

- EN: Updated bilingual docs and locale text for feature X; checked terminology consistency and placeholders.
- 中文：已更新功能 X 的中英文文档与界面文案；已检查术语一致性与占位符一致性。

---

Maintainer note: this guide is intentionally lightweight. Keep it strict on consistency, simple in process.
维护说明：本指南保持轻量化，重点保证一致性，流程尽量简单。
