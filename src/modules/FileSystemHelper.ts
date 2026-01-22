/**
 * FileSystemHelper - 文件系统操作辅助工具
 * 提供打开文件夹等功能
 */

import { uxp } from "../globals";

export class FileSystemHelper {
  private shell: any;
  private fs: any;

  constructor() {
    this.shell = uxp.shell;
    this.fs = uxp.storage.localFileSystem;
    console.log('FileSystemHelper: Initialized');
  }

  /**
   * 在访达/资源管理器中打开文件夹
   * @param folderPath - 文件夹路径，如果为空则打开插件根目录
   */
  async openFolderInFinder(folderPath?: string): Promise<boolean> {
    try {
      let targetPath = folderPath;
      
      // 如果没有指定路径，使用插件根目录
      if (!targetPath) {
        const pluginFolder = await this.fs.getPluginFolder();
        targetPath = pluginFolder.nativePath;
      }
      
      console.log('FileSystemHelper: Opening folder:', targetPath);
      
      const result = await this.shell.openPath(targetPath);
      
      if (result === 0 || result === '' || result === undefined) {
        console.log('FileSystemHelper: ✅ 文件夹已打开');
        return true;
      } else {
        console.error('FileSystemHelper: ❌ 打开文件夹失败:', result);
        return false;
      }
    } catch (error: any) {
      console.error('FileSystemHelper: 打开文件夹时出错:', error);
      return false;
    }
  }

  /**
   * 打开插件根目录
   */
  async openPluginFolder(): Promise<boolean> {
    return await this.openFolderInFinder();
  }
}
