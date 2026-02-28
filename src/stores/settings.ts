/**
 * 全局设置 Store - 持久化存储（使用 UXP DataFolder，不受项目切换影响）
 * Global Settings Store - Persistent storage via UXP DataFolder
 */

import { ref } from 'vue';
import { uxp } from '../globals';

// @ts-ignore - UXP 类型定义限制
const fs = uxp.storage.localFileSystem;
const SETTINGS_FILENAME = 'app-settings.json';

export interface AppSettings {
  exportFolderName: string;
  versionMode: 'numeric' | 'chinese';
  versionPrefix: string;
  archiveEnabled: boolean;
  archiveBasePath: string;
  archiveFolderTemplate: string;
  backupSequenceBeforeExport: boolean;
  backupProjectBeforeExport: boolean;
}

// 默认导出文件夹名称（中文用户习惯）
const DEFAULT_EXPORT_FOLDER_NAME = '导出';
const DEFAULT_VERSION_MODE: 'numeric' | 'chinese' = 'numeric';
const DEFAULT_VERSION_PREFIX = 'V';
const DEFAULT_ARCHIVE_BASE_PATH = '';
const DEFAULT_ARCHIVE_ENABLED = false;
const DEFAULT_ARCHIVE_FOLDER_TEMPLATE = 'YYYY|MM|DD_项目名称';
const DEFAULT_BACKUP_SEQUENCE = false;
const DEFAULT_BACKUP_PROJECT = false;

// 响应式设置状态（整个应用共享同一个 ref 实例）
export const exportFolderName = ref<string>(DEFAULT_EXPORT_FOLDER_NAME);
export const versionMode = ref<'numeric' | 'chinese'>(DEFAULT_VERSION_MODE);
export const versionPrefix = ref<string>(DEFAULT_VERSION_PREFIX);
export const archiveEnabled = ref<boolean>(DEFAULT_ARCHIVE_ENABLED);
export const archiveBasePath = ref<string>(DEFAULT_ARCHIVE_BASE_PATH);
export const archiveFolderTemplate = ref<string>(DEFAULT_ARCHIVE_FOLDER_TEMPLATE);
export const backupSequenceBeforeExport = ref<boolean>(DEFAULT_BACKUP_SEQUENCE);
export const backupProjectBeforeExport = ref<boolean>(DEFAULT_BACKUP_PROJECT);

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
      if (settings.versionMode === 'numeric' || settings.versionMode === 'chinese') {
        versionMode.value = settings.versionMode;
      }
      if (settings.versionPrefix && typeof settings.versionPrefix === 'string') {
        versionPrefix.value = settings.versionPrefix;
      }
      if (typeof settings.archiveBasePath === 'string') {
        archiveBasePath.value = settings.archiveBasePath;
      }
      if (typeof settings.archiveEnabled === 'boolean') {
        archiveEnabled.value = settings.archiveEnabled;
      }
      if (typeof settings.archiveFolderTemplate === 'string' && settings.archiveFolderTemplate.length > 0) {
        archiveFolderTemplate.value = settings.archiveFolderTemplate;
      }
      if (typeof settings.backupSequenceBeforeExport === 'boolean') {
        backupSequenceBeforeExport.value = settings.backupSequenceBeforeExport;
      }
      if (typeof settings.backupProjectBeforeExport === 'boolean') {
        backupProjectBeforeExport.value = settings.backupProjectBeforeExport;
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
      versionMode: versionMode.value,
      versionPrefix: versionPrefix.value,
      archiveEnabled: archiveEnabled.value,
      archiveBasePath: archiveBasePath.value,
      archiveFolderTemplate: archiveFolderTemplate.value,
      backupSequenceBeforeExport: backupSequenceBeforeExport.value,
      backupProjectBeforeExport: backupProjectBeforeExport.value,
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
