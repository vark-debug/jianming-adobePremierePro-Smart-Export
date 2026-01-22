/**
 * 导出文件夹管理模块 - 检查和创建"导出"文件夹
 * Export Folder Manager Module - Check and create export folder
 */

import { uxp } from "../globals";

const fs = uxp.storage.localFileSystem;

export interface ExportFolderResult {
  success: boolean;
  exportFolderPath: string;
  exportFolder: any | null;
  created: boolean;
  error: string | null;
}

/**
 * 获取或创建导出文件夹
 * @param projectPath - 项目文件完整路径
 * @returns 导出文件夹信息
 */
export async function getOrCreateExportFolder(projectPath: string): Promise<ExportFolderResult> {
  const result: ExportFolderResult = {
    success: false,
    exportFolderPath: '',
    exportFolder: null,
    created: false,
    error: null
  };
  
  try {
    console.log('=== 开始获取/创建导出文件夹 ===');
    console.log(`项目文件路径: ${projectPath}`);
    
    if (!projectPath || projectPath === '') {
      result.error = "项目路径为空";
      console.log(result.error);
      return result;
    }
    
    // 跨平台路径处理
    let cleanPath = projectPath;
    
    // Windows: 提取从盘符开始的路径
    const driveMatch = cleanPath.match(/([A-Z]:\\)/i);
    if (driveMatch) {
      const driveIndex = cleanPath.indexOf(driveMatch[0]);
      cleanPath = cleanPath.substring(driveIndex);
      console.log('Windows 路径（提取盘符后）:', cleanPath);
    } else {
      // Mac/Unix: 直接使用路径，无需转换分隔符
      console.log('Mac/Unix 路径（原始）:', cleanPath);
    }
    
    // 移除末尾的分隔符
    cleanPath = cleanPath.replace(/[\\\/]+$/, '');
    
    console.log('清理后的项目路径:', cleanPath);
    
    // 通过字符串操作获取父文件夹路径
    // 第一步：获取项目文件所在文件夹
    const firstSlash = Math.max(
      cleanPath.lastIndexOf('/'),
      cleanPath.lastIndexOf('\\')
    );
    
    if (firstSlash === -1) {
      result.error = "无法解析项目路径";
      console.log(result.error);
      return result;
    }
    
    const projectFolderPath = cleanPath.substring(0, firstSlash);
    console.log('项目文件夹路径:', projectFolderPath);
    
    // 第二步：获取项目文件夹的父文件夹
    const secondSlash = Math.max(
      projectFolderPath.lastIndexOf('/'),
      projectFolderPath.lastIndexOf('\\')
    );
    
    if (secondSlash === -1) {
      result.error = "无法获取父文件夹路径";
      console.log(result.error);
      return result;
    }
    
    const parentFolderPath = projectFolderPath.substring(0, secondSlash);
    console.log('父文件夹路径:', parentFolderPath);
    
    // 转换为 file:// URL 并获取父文件夹对象
    // 统一转换为正斜杠（Windows 和 Mac 的 file:// URL 都使用正斜杠）
    const normalizedPath = parentFolderPath.replace(/\\/g, '/');
    const parentFolderUrl = 'file:///' + normalizedPath;
    console.log('父文件夹URL:', parentFolderUrl);
    
    const parentFolder = await fs.getEntryWithUrl(parentFolderUrl);
    if (!parentFolder) {
      result.error = "无法访问项目父目录";
      console.log(result.error);
      return result;
    }
    
    console.log(`父目录: ${parentFolder.nativePath}`);
    
    // 检查是否已存在"导出"文件夹
    let exportFolder: any = null;
    try {
      console.log('开始检查父文件夹中的条目...');
      const entries = await parentFolder.getEntries();
      console.log(`父文件夹中有 ${entries.length} 个条目`);
      
      for (const entry of entries) {
        console.log(`检查条目: ${entry.name} (isFolder: ${entry.isFolder})`);
        if (entry.isFolder && entry.name === "导出") {
          exportFolder = entry;
          console.log('✓ 找到现有导出文件夹');
          console.log('导出文件夹对象:', exportFolder);
          console.log('导出文件夹路径:', exportFolder.nativePath);
          console.log('导出文件夹 isFolder:', exportFolder.isFolder);
          break;
        }
      }
    } catch (error: any) {
      console.log('检查现有文件夹时出错，将尝试创建:', error.message);
    }
    
    // 如果不存在，创建"导出"文件夹
    if (!exportFolder) {
      try {
        console.log('导出文件夹不存在，开始创建...');
        exportFolder = await parentFolder.createFolder("导出");
        result.created = true;
        console.log('✓ 成功创建导出文件夹');
        console.log('新建文件夹对象:', exportFolder);
        console.log('新建文件夹路径:', exportFolder.nativePath);
        console.log('新建文件夹 isFolder:', exportFolder.isFolder);
      } catch (error: any) {
        result.error = `创建导出文件夹失败: ${error.message}`;
        console.error(result.error);
        return result;
      }
    }
    
    // 验证 exportFolder 对象
    if (!exportFolder) {
      result.error = "无法获取导出文件夹对象";
      console.error(result.error);
      return result;
    }
    
    if (!exportFolder.isFolder) {
      result.error = "导出路径不是文件夹";
      console.error(result.error);
      return result;
    }
    
    console.log('最终导出文件夹验证:');
    console.log('  - 对象存在:', !!exportFolder);
    console.log('  - 是文件夹:', exportFolder.isFolder);
    console.log('  - 路径:', exportFolder.nativePath);
    console.log('  - 名称:', exportFolder.name);
    
    result.success = true;
    result.exportFolder = exportFolder;
    result.exportFolderPath = exportFolder.nativePath;
    
    console.log(`导出文件夹路径: ${result.exportFolderPath}`);
    console.log('=== 获取/创建导出文件夹完成 ===');
    
  } catch (error: any) {
    console.error('Error in getOrCreateExportFolder:', error);
    console.error('Error stack:', error.stack);
    result.error = error.message || '获取/创建导出文件夹时发生错误';
  }
  
  return result;
}
