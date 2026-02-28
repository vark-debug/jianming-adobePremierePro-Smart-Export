<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from '../locales';
import { uxp } from '../globals';
import { exportFolderName, versionMode, versionPrefix, archiveEnabled, archiveBasePath, archiveFolderTemplate, backupSequenceBeforeExport, backupProjectBeforeExport, saveSettings } from '../stores/settings';
import { previewArchivePath } from '../modules/archiveManager';

// @ts-ignore - UXP 类型定义限制
const fs = uxp.storage.localFileSystem;

const { t } = useI18n();

const emit = defineEmits<{ (e: 'back'): void }>();

// 本地草稿
const draftFolderName = ref(exportFolderName.value);
const draftVersionMode = ref<'numeric' | 'chinese'>(versionMode.value);
const draftVersionPrefix = ref(versionPrefix.value);
const draftArchiveBasePath = ref(archiveBasePath.value);
const draftArchiveEnabled = ref(archiveEnabled.value);
const draftArchiveTemplate = ref(archiveFolderTemplate.value);
const draftBackupSequence = ref(backupSequenceBeforeExport.value);
const draftBackupProject = ref(backupProjectBeforeExport.value);
const saveStatus = ref<'idle' | 'success' | 'error'>('idle');
const saveErrorMsg = ref('');
let statusTimer: ReturnType<typeof setTimeout> | null = null;

const DEFAULT_FOLDER_NAME = '导出';
const DEFAULT_PREFIX = 'V';
const DEFAULT_ARCHIVE_TEMPLATE = 'YYYY|MM|DD_项目名称';

/** 实时预览归档路径 */
const archivePreviewPath = computed(() => {
  if (!draftArchiveBasePath.value || !draftArchiveTemplate.value) return '';
  return previewArchivePath(
    draftArchiveBasePath.value,
    draftArchiveTemplate.value,
    '项目名称'
  );
});

onMounted(() => {
  draftFolderName.value = exportFolderName.value;
  draftVersionMode.value = versionMode.value;
  draftVersionPrefix.value = versionPrefix.value;
  draftArchiveBasePath.value = archiveBasePath.value;
  draftArchiveEnabled.value = archiveEnabled.value;
  draftArchiveTemplate.value = archiveFolderTemplate.value;
  draftBackupSequence.value = backupSequenceBeforeExport.value;
  draftBackupProject.value = backupProjectBeforeExport.value;
});

/** 调用系统文件夹选择器 */
async function selectArchiveFolder() {
  try {
    const folder = await fs.getFolder();
    if (!folder) return;
    draftArchiveBasePath.value = folder.nativePath;
  } catch (e: any) {
    console.error('[Settings] 选择归档文件夹失败:', e);
  }
}

function onVersionModeChange(event: any) {
  draftVersionMode.value = event.target.value as 'numeric' | 'chinese';
}

async function handleSave() {
  const trimmedFolder = draftFolderName.value.trim();
  draftFolderName.value = trimmedFolder || DEFAULT_FOLDER_NAME;

  const trimmedPrefix = draftVersionPrefix.value.trim();
  draftVersionPrefix.value = trimmedPrefix || DEFAULT_PREFIX;

  const trimmedTemplate = draftArchiveTemplate.value.trim();
  draftArchiveTemplate.value = trimmedTemplate || DEFAULT_ARCHIVE_TEMPLATE;

  exportFolderName.value = draftFolderName.value;
  versionMode.value = draftVersionMode.value;
  versionPrefix.value = draftVersionPrefix.value;
  archiveBasePath.value = draftArchiveBasePath.value;
  archiveEnabled.value = draftArchiveEnabled.value;
  archiveFolderTemplate.value = draftArchiveTemplate.value;
  backupSequenceBeforeExport.value = draftBackupSequence.value;
  backupProjectBeforeExport.value = draftBackupProject.value;

  const result = await saveSettings();

  if (statusTimer) clearTimeout(statusTimer);
  if (result.success) {
    saveStatus.value = 'success';
  } else {
    saveStatus.value = 'error';
    saveErrorMsg.value = result.error || '';
  }
  statusTimer = setTimeout(() => { saveStatus.value = 'idle'; }, 2000);
}

function handleReset() {
  draftFolderName.value = DEFAULT_FOLDER_NAME;
  draftVersionMode.value = 'numeric';
  draftVersionPrefix.value = DEFAULT_PREFIX;
  draftArchiveBasePath.value = '';
  draftArchiveEnabled.value = false;
  draftArchiveTemplate.value = DEFAULT_ARCHIVE_TEMPLATE;
  draftBackupSequence.value = false;
  draftBackupProject.value = false;
}

function handleBack() {
  emit('back');
}
</script>

<template>
  <div class="settings-container">
    <!-- 顶部导航栏 -->
    <div class="settings-header">
      <sp-action-button quiet @click="handleBack" class="back-btn">
        ← {{ t('ui.back') }}
      </sp-action-button>
      <span class="settings-title">{{ t('settings.title') }}</span>
    </div>

    <sp-divider size="medium"></sp-divider>

    <!-- 可滚动内容区 -->
    <div class="settings-body">
    <!-- 导出文件夹名称设置 -->
    <div class="settings-section">
      <sp-field-label for="export-folder-name-input">
        {{ t('settings.exportFolderName') }}
      </sp-field-label>
      <sp-textfield
        id="export-folder-name-input"
        :value="draftFolderName"
        @input="draftFolderName = $event.target.value"
        style="width: 100%; margin-bottom: 6px;"
      ></sp-textfield>
      <p class="settings-hint">{{ t('settings.exportFolderNameHint') }}</p>
    </div>

    <sp-divider size="medium"></sp-divider>

    <!-- 版本号格式设置 -->
    <div class="settings-section">
      <sp-field-label for="version-mode-picker">
        {{ t('settings.versionMode') }}
      </sp-field-label>
      <sp-picker
        id="version-mode-picker"
        :value="draftVersionMode"
        @change="onVersionModeChange"
        style="width: 100%; margin-bottom: 10px;"
      >
        <sp-menu>
          <sp-menu-item value="numeric" :selected="draftVersionMode === 'numeric'">
            {{ t('settings.versionModeNumeric') }}
          </sp-menu-item>
          <sp-menu-item value="chinese" :selected="draftVersionMode === 'chinese'">
            {{ t('settings.versionModeChinese') }}
          </sp-menu-item>
        </sp-menu>
      </sp-picker>

      <!-- 仅数字模式下显示前缀输入 -->
      <template v-if="draftVersionMode === 'numeric'">
        <sp-field-label for="version-prefix-input">
          {{ t('settings.versionPrefix') }}
        </sp-field-label>
        <sp-textfield
          id="version-prefix-input"
          :value="draftVersionPrefix"
          @input="draftVersionPrefix = $event.target.value"
          style="width: 100%; margin-bottom: 6px;"
        ></sp-textfield>
        <p class="settings-hint">{{ t('settings.versionPrefixHint') }}</p>
      </template>
    </div>

    <sp-divider size="medium"></sp-divider>
    <!-- 定稿归档设置 -->
    <div class="settings-section">
      <sp-field-label class="archive-section-label">📦 {{ t('settings.archiveTitle') }}</sp-field-label>

      <!-- 归档总开关 -->
      <div class="backup-option" style="margin-bottom: 10px;">
        <sp-checkbox
          :checked="draftArchiveEnabled"
          @change="draftArchiveEnabled = $event.target.checked">
          {{ t('settings.archiveEnable') }}
        </sp-checkbox>
      </div>

      <!-- 仅开启时显示具体配置 -->
      <template v-if="draftArchiveEnabled">
        <!-- 第一步：归档根目录 -->
        <div class="archive-row-label">
          <span class="archive-step-badge">1</span>
          {{ t('archive.baseFolder') }}
        </div>
        <div class="archive-base-row">
          <sp-textfield
            :value="draftArchiveBasePath"
            readonly
            quiet
            :placeholder="t('archive.baseFolderPlaceholder')"
            class="archive-path-field">
          </sp-textfield>
          <sp-button variant="secondary" size="s" @click="selectArchiveFolder" class="archive-select-btn">
            📁 {{ t('archive.selectFolder') }}
          </sp-button>
        </div>

        <!-- 第二步：文件夹结构模板 -->
        <div class="archive-row-label" style="margin-top: 10px;">
          <span class="archive-step-badge">2</span>
          {{ t('archive.folderTemplate') }}
        </div>
        <sp-textfield
          :value="draftArchiveTemplate"
          @input="draftArchiveTemplate = $event.target.value"
          :placeholder="t('archive.folderTemplatePlaceholder')"
          style="width: 100%; margin-bottom: 4px;">
        </sp-textfield>
        <p class="settings-hint">{{ t('archive.templateHint') }}</p>

        <!-- 路径预览 -->
        <div v-if="archivePreviewPath" class="archive-preview">
          <span class="archive-preview-label">{{ t('archive.pathPreview') }}：</span>
          <span class="archive-preview-path">{{ archivePreviewPath }}</span>
        </div>
      </template>
    </div>

    <sp-divider size="medium"></sp-divider>

    <!-- 导出前备份设置 -->
    <div class="settings-section">
      <sp-field-label class="backup-section-label">💾 {{ t('settings.backupTitle') }}</sp-field-label>

      <div class="backup-option">
        <sp-checkbox
          :checked="draftBackupSequence"
          @change="draftBackupSequence = $event.target.checked">
          {{ t('settings.backupSequence') }}
        </sp-checkbox>
      </div>

      <div class="backup-option" style="margin-top: 6px;">
        <sp-checkbox
          :checked="draftBackupProject"
          @change="draftBackupProject = $event.target.checked">
          {{ t('settings.backupProject') }}
        </sp-checkbox>
      </div>

      <p class="settings-hint" style="margin-top: 8px;">
        备份命名格式：<code style="background:#1a1a1a;padding:1px 4px;border-radius:3px;font-size:11px;">项目名称_版本号</code>（如 <code style="background:#1a1a1a;padding:1px 4px;border-radius:3px;font-size:11px;">宣传片_V3</code>）；两项都勾选时先备份序列、再备份工程。
      </p>
    </div>

    <sp-divider size="medium"></sp-divider>
    <!-- 操作按钮 -->
    <div class="settings-actions">
      <sp-button variant="secondary" @click="handleReset">
        {{ t('settings.reset') }}
      </sp-button>
      <sp-button variant="cta" @click="handleSave">
        {{ t('settings.save') }}
      </sp-button>
    </div>

    <!-- 保存状态提示 -->
    <transition name="fade">
      <div v-if="saveStatus !== 'idle'" :class="['save-status', saveStatus]">
        <span v-if="saveStatus === 'success'">✅ {{ t('settings.saveSuccess') }}</span>
        <span v-else>❌ {{ t('settings.saveFailed') }}: {{ saveErrorMsg }}</span>
      </div>
    </transition>
    </div><!-- /settings-body -->
  </div>
</template>

<style lang="scss">
.settings-container {
  padding: 16px 16px 0 16px;
  font-family: adobe-clean, "Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
}

.settings-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: 16px;
}

.settings-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;

  .back-btn {
    cursor: pointer;
    flex-shrink: 0;
  }

  .settings-title {
    font-size: 18px;
    font-weight: 700;
    color: floralwhite;
    flex: 1;
    text-align: center;
    padding-right: 60px; // 平衡返回按钮占位
  }
}

.settings-section {
  margin: 12px 0;

  sp-field-label {
    font-size: 14px;
    font-weight: 600;
    color: floralwhite;
    margin-bottom: 6px;
    display: block;
  }
}

.settings-hint {
  font-size: 11px;
  color: #aaa;
  margin: 0;
  line-height: 1.4;
}

/* ──────────── 归档设置区 --─── */
.archive-section-label {
  font-size: 14px !important;
  font-weight: 700 !important;
  color: #e8c35a !important;
  margin-bottom: 10px !important;
}

.archive-row-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #bbb;
  margin-bottom: 5px;
  font-weight: 500;
}

.archive-step-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background-color: #e8c35a;
  color: #1a1a1a;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.archive-base-row {
  display: flex;
  align-items: center;
  gap: 8px;

  .archive-path-field {
    flex: 1;
    min-width: 0;
  }

  .archive-select-btn {
    flex-shrink: 0;
  }
}

.archive-preview {
  background-color: #1e1e1e;
  border-radius: 4px;
  padding: 6px 10px;
  border-left: 3px solid #e8c35a;
  margin-top: 6px;
}

.archive-preview-label {
  font-size: 11px;
  color: #888;
}

.archive-preview-path {
  font-size: 12px;
  color: #d4b44a;
  word-break: break-all;
  line-height: 1.5;
  display: block;
  margin-top: 2px;
}

.backup-section-label {
  font-size: 14px !important;
  font-weight: 700 !important;
  color: #a0c8e8 !important;
  margin-bottom: 10px !important;
  display: block;
}

.backup-option {
  display: flex;
  align-items: center;
}

.settings-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 16px;
}

.save-status {
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 13px;
  text-align: center;

  &.success {
    background-color: rgba(72, 187, 120, 0.15);
    color: #9ae6b4;
    border: 1px solid rgba(72, 187, 120, 0.3);
  }

  &.error {
    background-color: rgba(245, 101, 101, 0.15);
    color: #fc8181;
    border: 1px solid rgba(245, 101, 101, 0.3);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
