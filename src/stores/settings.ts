/**
 * 全局设置 Store - 持久化存储（使用 UXP DataFolder，不受项目切换影响）
 * Global Settings Store - Persistent storage via UXP DataFolder
 */

import { ref } from 'vue';
import { uxp } from '../globals';

const fs = uxp.storage.localFileSystem;
const SETTINGS_FILENAME = 'app-settings.json';

export interface AppSettings {
  exportFolderName: string;
}

// 默认导出文件夹名称（中文用户习惯）
const DEFAULT_EXPORT_FOLDER_NAME = '导出';

// 响应式设置状态（整个应用共享同一个 ref 实例）
export const exportFolderName = ref<string>(DEFAULT_EXPORT_FOLDER_NAME);

/** 从 UXP DataFolder 加载设置 */
export async function loadSettings(): Promise<void> {
  try {
    const dataFolder = await fs.getDataFolder();
    const entries = await dataFolder.getEntries();
    const settingsFile = entries.find(
      (e: any) => !e.isFolder && e.name === SETTINGS_FILENAME
    );

    if (settingsFile) {
      const content = (await settingsFile.read({
        format: uxp.storage.formats.utf8,
      })) as string;
      const settings: Partial<AppSettings> = JSON.parse(content);

      if (settings.exportFolderName && typeof settings.exportFolderName === 'string') {
        exportFolderName.value = settings.exportFolderName;
      }
      console.log('[Settings] 加载成功:', settings);
    } else {
      console.log('[Settings] 未找到设置文件，使用默认值');
    }
  } catch (e: any) {
    console.warn('[Settings] 加载失败，使用默认值:', e.message);
  }
}

/** 将当前设置持久化到 UXP DataFolder */
export async function saveSettings(): Promise<{ success: boolean; error?: string }> {
  try {
    const dataFolder = await fs.getDataFolder();
    const settings: AppSettings = {
      exportFolderName: exportFolderName.value,
    };
    const content = JSON.stringify(settings, null, 2);

    // createFile 带 overwrite:true 可直接覆盖已有文件
    const settingsFile = await dataFolder.createFile(SETTINGS_FILENAME, {
      overwrite: true,
    });
    await settingsFile.write(content, { format: uxp.storage.formats.utf8 });

    console.log('[Settings] 保存成功:', settings);
    return { success: true };
  } catch (e: any) {
    console.error('[Settings] 保存失败:', e);
    return { success: false, error: e.message };
  }
}
