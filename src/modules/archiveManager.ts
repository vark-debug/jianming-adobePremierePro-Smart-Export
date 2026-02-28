/**
 * 归档管理模块 - 将定稿版文件归档到自定义目录结构中
 * Archive Manager Module - Archive final version files to custom directory structure
 */

import { uxp } from "../globals";

// @ts-ignore - UXP 类型定义中缺少 localFileSystem，运行时可正常访问
const fs = uxp.storage.localFileSystem;

export interface ArchiveResult {
  success: boolean;
  archivePath?: string;  // 归档目标文件夹路径
  archivedFilePath?: string; // 归档后的文件完整路径
  error?: string;
}

/**
 * 解析归档路径模板，返回各级子文件夹名称数组
 *
 * 支持的变量：
 *   YYYY  →  当前四位年份（如 2026）
 *   MM    →  当前月份，不补零（如 2）
 *   DD    →  当前日期，不补零（如 28）
 *   项目名称 → 当前项目名称
 *
 * 分隔符：| 代表下一级子文件夹
 *
 * 示例：
 *   模板: "YYYY年|MM月结案项目|MM_DD项目名称"
 *   结果: ["2026年", "2月结案项目", "2_28宣传片"]
 */
export function resolveArchiveTemplate(
  template: string,
  projectName: string,
  date: Date = new Date()
): string[] {
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString();
  const day = date.getDate().toString();

  const resolved = template
    .replace(/YYYY/g, year)
    .replace(/MM/g, month)
    .replace(/DD/g, day)
    .replace(/项目名称/g, projectName);

  return resolved
    .split("|")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/**
 * 根据模板生成预览路径字符串（仅展示用，不实际创建文件夹）
 */
export function previewArchivePath(
  basePath: string,
  template: string,
  projectName: string,
  date: Date = new Date()
): string {
  if (!basePath || !template) return "";
  const parts = resolveArchiveTemplate(template, projectName, date);
  const separator = basePath.includes("\\") ? "\\" : "/";
  const cleanBase = basePath.replace(/[\/\\]+$/, "");
  return cleanBase + separator + parts.join(separator);
}

/**
 * 递归创建嵌套文件夹，返回最终目标文件夹 Entry
 */
async function createNestedFolders(
  baseEntry: any,
  parts: string[]
): Promise<any> {
  let current = baseEntry;
  for (const part of parts) {
    if (!part) continue;
    let found: any = null;
    try {
      const entries = await current.getEntries();
      found =
        entries.find((e: any) => e.isFolder && e.name === part) ?? null;
    } catch (_) {
      // 忽略扫描错误，继续尝试创建
    }
    if (!found) {
      found = await current.createFolder(part);
    }
    current = found;
  }
  return current;
}

/**
 * 将 native path 转换为 file:// URL
 */
function toFileUrl(nativePath: string): string {
  const normalized = nativePath.replace(/\\/g, "/");
  return normalized.startsWith("/")
    ? "file://" + normalized
    : "file:///" + normalized;
}

/**
 * 将已导出的文件归档到自定义目录结构中
 *
 * @param sourceFilePath    - 源文件的 native path（导出完成后的路径）
 * @param archiveBasePath   - 归档根目录的 native path（用户选择的根目录）
 * @param folderTemplate    - 文件夹层级模板字符串
 * @param projectName       - 项目名称（用于替换 "项目名称" 变量）
 * @returns ArchiveResult
 */
export async function archiveExportedFile(
  sourceFilePath: string,
  archiveBasePath: string,
  folderTemplate: string,
  projectName: string
): Promise<ArchiveResult> {
  try {
    console.log("=== 开始归档流程 ===");
    console.log("源文件:", sourceFilePath);
    console.log("归档根目录:", archiveBasePath);
    console.log("文件夹模板:", folderTemplate);
    console.log("项目名称:", projectName);

    // 1. 解析模板，得到各级子文件夹名
    const folderParts = resolveArchiveTemplate(folderTemplate, projectName);
    console.log("解析后的文件夹层级:", folderParts);

    // 2. 获取归档根目录 Entry
    const baseUrl = toFileUrl(archiveBasePath);
    const baseEntry = await fs.getEntryWithUrl(baseUrl);

    if (!baseEntry || !baseEntry.isFolder) {
      return { success: false, error: "归档根目录不存在或不是文件夹" };
    }

    // 3. 递归创建嵌套子文件夹
    const destFolder = await createNestedFolders(baseEntry, folderParts);
    console.log("✓ 目标文件夹已就绪:", destFolder.nativePath);

    // 4. 获取源文件 Entry
    const sourceUrl = toFileUrl(sourceFilePath);
    const sourceEntry = await fs.getEntryWithUrl(sourceUrl);

    if (!sourceEntry) {
      return { success: false, error: "源文件不存在: " + sourceFilePath };
    }

    // 5. 使用 UXP Entry.copyTo() 复制文件（高效，不需要读入内存）
    await sourceEntry.copyTo(destFolder, { overwrite: true });

    const fileName = sourceFilePath.split(/[\/\\]/).pop() || "";
    const archivedFilePath = destFolder.nativePath + (destFolder.nativePath.includes("\\") ? "\\" : "/") + fileName;

    console.log("✓ 归档完成:", archivedFilePath);
    console.log("=== 归档流程结束 ===");

    return {
      success: true,
      archivePath: destFolder.nativePath,
      archivedFilePath,
    };
  } catch (e: any) {
    console.error("归档失败:", e);
    return { success: false, error: e.message || "归档过程中发生未知错误" };
  }
}
