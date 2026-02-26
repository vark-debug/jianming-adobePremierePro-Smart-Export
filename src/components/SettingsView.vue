<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from '../locales';
import { exportFolderName, versionMode, versionPrefix, saveSettings } from '../stores/settings';

const { t } = useI18n();

const emit = defineEmits<{ (e: 'back'): void }>();

// 本地草稿
const draftFolderName = ref(exportFolderName.value);
const draftVersionMode = ref<'numeric' | 'chinese'>(versionMode.value);
const draftVersionPrefix = ref(versionPrefix.value);
const saveStatus = ref<'idle' | 'success' | 'error'>('idle');
const saveErrorMsg = ref('');
let statusTimer: ReturnType<typeof setTimeout> | null = null;

const DEFAULT_FOLDER_NAME = '导出';
const DEFAULT_PREFIX = 'V';

onMounted(() => {
  draftFolderName.value = exportFolderName.value;
  draftVersionMode.value = versionMode.value;
  draftVersionPrefix.value = versionPrefix.value;
});

function onVersionModeChange(event: any) {
  draftVersionMode.value = event.target.value as 'numeric' | 'chinese';
}

async function handleSave() {
  const trimmedFolder = draftFolderName.value.trim();
  draftFolderName.value = trimmedFolder || DEFAULT_FOLDER_NAME;

  const trimmedPrefix = draftVersionPrefix.value.trim();
  draftVersionPrefix.value = trimmedPrefix || DEFAULT_PREFIX;

  exportFolderName.value = draftFolderName.value;
  versionMode.value = draftVersionMode.value;
  versionPrefix.value = draftVersionPrefix.value;

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
  </div>
</template>

<style lang="scss">
.settings-container {
  padding: 16px;
  font-family: adobe-clean, "Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  height: 100%;
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
