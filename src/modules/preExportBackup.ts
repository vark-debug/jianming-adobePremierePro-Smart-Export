/**
 * 导出前备份模块
 * Pre-Export Backup Module
 *
 * 支持两种备份操作（可独立或组合使用）：
 * 1. backupCurrentSequence  — 在项目面板中克隆当前活动序列并重命名
 * 2. backupProjectFile      — 在工程文件同级目录创建 .prproj 备份副本
 *
 * 推荐调用顺序（两项都勾选时）：
 *   backupCurrentSequence → backupProjectFile → 导出
 * 这样工程文件备份时会包含已克隆的序列。
 */

import { premierepro, uxp } from "../globals";

// @ts-ignore - UXP 类型定义限制
const fs = uxp.storage.localFileSystem;

// ─────────────────────────────────────────────
// Result types
// ─────────────────────────────────────────────

export interface SequenceBackupResult {
  success: boolean;
  backupName?: string;
  error?: string;
}

export interface ProjectBackupResult {
  success: boolean;
  backupPath?: string;
  error?: string;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * 将 Premiere Pro 返回的 project.path 或普通原生路径统一转换为 file:// URL。
 * project.path 可能已经是 "file:///D:/..." 形式，直接返回；
 * Windows 原生路径 "D:\..." 或 "D:/..." 则补全为 "file:///D:/..."；
 * Mac/Unix 路径 "/Users/..." 则转为 "file:///Users/..."。
 */
function toFileUrl(rawPath: string): string {
  if (!rawPath) return "";
  // 已经是 file:// URL，直接返回（统一用正斜杠）
  if (rawPath.startsWith("file://")) {
    return rawPath.replace(/\\/g, "/");
  }
  // Windows：可能带盘符，提取从盘符开始的部分（exportFolderManager 同样逻辑）
  const driveMatch = rawPath.match(/([A-Za-z]:[\\\/])/);
  if (driveMatch) {
    const driveIdx = rawPath.indexOf(driveMatch[0]);
    const nativePart = rawPath.substring(driveIdx).replace(/\\/g, "/");
    return "file:///" + nativePart;
  }
  // Mac/Unix
  const normalized = rawPath.replace(/\\/g, "/");
  return normalized.startsWith("/") ? "file://" + normalized : "file:///" + normalized;
}

function getParentPath(filePath: string): string {
  const idx = Math.max(filePath.lastIndexOf("/"), filePath.lastIndexOf("\\"));
  return idx === -1 ? "" : filePath.substring(0, idx);
}

function getExtension(filePath: string): string {
  const base = filePath.split(/[/\\]/).pop() || "";
  const dot = base.lastIndexOf(".");
  return dot === -1 ? ".prproj" : base.substring(dot);
}

// ─────────────────────────────────────────────
// 1. 序列备份
// ─────────────────────────────────────────────

/**
 * 克隆当前活动序列，并将副本重命名为 backupName。
 * 副本会出现在项目面板的同一 bin 中。
 *
 * 实现步骤：
 *   a. 记录克隆前所有序列的 GUID 集合
 *   b. 通过 executeTransaction + createCloneAction 克隆
 *   c. 对比找出新序列
 *   d. 通过 projectItem.createSetNameAction 重命名
 */
export async function backupCurrentSequence(
  backupName: string
): Promise<SequenceBackupResult> {
  try {
    console.log(`[序列备份] 开始备份，目标名称: ${backupName}`);

    const project = await premierepro.Project.getActiveProject();
    if (!project) return { success: false, error: "没有打开的项目" };

    const sequence = await project.getActiveSequence();
    if (!sequence) return { success: false, error: "没有活动的序列" };

    // 记录备份前的序列 GUID 集合
    const beforeSeqs: any[] = await project.getSequences();
    const beforeGuids = new Set(
      beforeSeqs.map((s: any) => String(s.guid))
    );
    console.log(`[序列备份] 克隆前共 ${beforeSeqs.length} 个序列`);

    // 执行克隆
    const cloneAction = sequence.createCloneAction();
    const cloneOk = project.executeTransaction((compoundAction: any) => {
      compoundAction.addAction(cloneAction);
    }, `克隆序列: ${sequence.name}`);

    if (!cloneOk) {
      return { success: false, error: "executeTransaction 返回失败" };
    }

    // 找出新序列（GUID 不在之前集合中）
    const afterSeqs: any[] = await project.getSequences();
    const newSeq = afterSeqs.find((s: any) => !beforeGuids.has(String(s.guid)));

    if (!newSeq) {
      return { success: false, error: "克隆后未找到新序列，可能已有同名序列" };
    }

    console.log(`[序列备份] 找到新序列: ${newSeq.name}`);

    // 重命名新序列的 ProjectItem
    const projectItem = await newSeq.getProjectItem();
    const renameAction = projectItem.createSetNameAction(backupName);
    project.executeTransaction((compoundAction: any) => {
      compoundAction.addAction(renameAction);
    }, `重命名序列: ${backupName}`);

    console.log(`[序列备份] ✓ 序列已备份为: ${backupName}`);
    return { success: true, backupName };
  } catch (e: any) {
    console.error("[序列备份] 失败:", e);
    return { success: false, error: e.message || "序列备份时发生未知错误" };
  }
}

// ─────────────────────────────────────────────
// 2. 工程文件备份
// ─────────────────────────────────────────────

/**
 * 在工程文件同级目录创建 .prproj 备份副本。
 *
 * 实现步骤：
 *   a. 先调用 project.save() 确保磁盘文件包含最新状态
 *   b. 以二进制方式读取 .prproj 文件
 *   c. 在同目录写入新文件，文件名为 backupName + 原扩展名
 *
 * 使用二进制读写而非 saveAs，避免改变当前项目路径。
 *
 * @param projectPath  工程文件的 native path（如 C:\xxx\Project.prproj）
 * @param backupName   备份文件基础名（不含扩展名）
 */
export async function backupProjectFile(
  projectPath: string,
  backupName: string
): Promise<ProjectBackupResult> {
  try {
    console.log(`[工程备份] 开始备份，目标名: ${backupName}`);
    console.log(`[工程备份] 工程路径: ${projectPath}`);

    // 先保存确保磁盘是最新状态
    const project = await premierepro.Project.getActiveProject();
    if (!project) return { success: false, error: "没有打开的项目" };

    console.log("[工程备份] 保存项目...");
    await project.save();
    console.log("[工程备份] ✓ 项目已保存");

    // 获取工程文件 Entry
    const sourceUrl = toFileUrl(projectPath);
    const sourceEntry = await fs.getEntryWithUrl(sourceUrl);
    if (!sourceEntry) {
      return { success: false, error: "无法访问工程文件: " + projectPath };
    }

    // 获取工程文件所在目录 Entry
    const folderPath = getParentPath(projectPath);
    const folderUrl = toFileUrl(folderPath);
    const folderEntry = await fs.getEntryWithUrl(folderUrl);
    if (!folderEntry) {
      return { success: false, error: "无法访问工程目录: " + folderPath };
    }

    // 构造备份文件名（保留原扩展名，通常为 .prproj）
    const ext = getExtension(projectPath);
    const backupFileName = backupName + ext;

    // 二进制读取 → 写入新文件（不改变当前活动项目路径）
    console.log("[工程备份] 读取工程文件内容...");
    // @ts-ignore - UXP storage binary format
    const content = await sourceEntry.read({ format: uxp.storage.formats.binary });

    console.log("[工程备份] 写入备份文件:", backupFileName);
    const backupFile = await folderEntry.createFile(backupFileName, { overwrite: true });
    // @ts-ignore
    await backupFile.write(content, { format: uxp.storage.formats.binary });

    const sep = projectPath.includes("\\") ? "\\" : "/";
    const backupPath = folderPath + sep + backupFileName;

    console.log(`[工程备份] ✓ 工程已备份至: ${backupPath}`);
    return { success: true, backupPath };
  } catch (e: any) {
    console.error("[工程备份] 失败:", e);
    return { success: false, error: e.message || "工程备份时发生未知错误" };
  }
}
