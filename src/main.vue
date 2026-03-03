<script setup lang="ts">
import { ref, onMounted } from "vue";
import { uxp, premierepro } from "./globals";
import { getProjectLocation } from "./modules/projectLocationDetector";
import { getOrCreateExportFolder } from "./modules/exportFolderManager";
import { detectResolution } from "./modules/resolutionDetector";
import { detectLatestVersionAndGenerateFilename } from "./modules/fileVersioner";
import { exportCurrentSequence } from "./modules/sequenceExporter";
import { FileSystemHelper } from "./modules/FileSystemHelper";
import { detectLanguage } from "./modules/languageDetector";
import { initI18n, useI18n } from "./locales";
import SettingsView from "./components/SettingsView.vue";
import { exportFolderName, versionMode, versionPrefix, archiveEnabled, archiveBasePath, archiveFolderTemplate, backupSequenceBeforeExport, backupProjectBeforeExport, showFilenameLabels, loadSettings } from "./stores/settings";
import { generateVersionStringWithSettings } from "./modules/fileVersioner";
import { archiveExportedFile } from "./modules/archiveManager";
import { backupCurrentSequence, backupProjectFile } from "./modules/preExportBackup";

const { t } = useI18n();

// 视图切换：'main' | 'settings'
const currentView = ref<'main' | 'settings'>('main');

// UI 状态
const projectName = ref('');
const bitrateDisplay = ref('_10mbps');
const versionDisplay = ref('_V1');
const gradingDisplay = ref('');
const finalVersionDisplay = ref('');
const exportPath = ref('');
const exportFormat = ref('h264');
const isColorGraded = ref(false);
const isFinalVersion = ref(false);
const isExporting = ref(false);
const pickerKey = ref(0);

// DOM 引用
const exportFormatPicker = ref<any>(null);

// @ts-ignore - UXP 类型定义限制
const fs = uxp.storage.localFileSystem;

// 内部状态
let exportFolder: any = null;
let detectedBitrate = '10mbps';
let detectedColorGrading: 'graded' | 'ungraded' | null = null;
const showSuccessDialog = ref(false);
const exportedFilePath = ref('');
const previewVideo = ref<HTMLVideoElement | null>(null);

// 自定义导出路径（会话内临时状态，不持久化）
const useCustomExportPath = ref(false);
const customExportPath = ref('');

const fileSystemHelper = new FileSystemHelper();

// 归档状态
const archiveResultPath = ref('');    // 本次归档后的目标文件夹路径（供弹窗显示）
const archiveErrorMsg = ref('');      // 归档失败时的错误信息

/**
 * 视频加载错误处理
 */
function onVideoError(e: Event) {
  console.error('[视频预览] 加载失败:', e);
  const video = e.target as HTMLVideoElement;
  if (video && video.error) {
    console.error('[视频预览] 错误代码:', video.error.code);
    console.error('[视频预览] 错误信息:', video.error.message);
  }
}

/**
 * 视频加载成功处理
 */
function onVideoLoaded() {
  console.log('[视频预览] 视频元数据加载成功');
}

/**
 * 关闭成功弹窗
 */
async function closeSuccessDialog() {
  showSuccessDialog.value = false;
  exportedFilePath.value = ''; // 清除路径，停止视频加载
  
  // 弹窗关闭后再刷新项目信息，计算下一个版本号
  await refreshProjectInfo();
}

/**
 * 打开文件夹并关闭弹窗
 */
async function openFolderAndCloseSuccessDialog() {
  await openExportFolder();
  closeSuccessDialog();
}

/** * 选择自定义导出路径（在主面板直接操作）
 */
async function selectCustomExportPath() {
  try {
    const folder = await fs.getFolder();
    if (!folder) return;
    customExportPath.value = folder.nativePath;
    useCustomExportPath.value = true;
    exportFolder = folder;
    exportPath.value = folder.nativePath;
  } catch (e: any) {
    console.error('[\u81ea\u5b9a\u4e49\u5bfc\u51fa\u8def\u5f84] \u9009\u62e9\u5931\u8d25:', e);
  }
}

/** * 手动更新导出格式选择器的值
 */
function updateExportFormatPicker() {
  pickerKey.value++;
}

/**
 * 刷新项目信息
 * @param options.preserveProjectName - 为 true 时保留用户自定义的项目名称，其余数据全部刷新
 */
async function refreshProjectInfo(options: { preserveProjectName?: boolean } = {}) {
  try {
    console.log('=== 开始刷新项目信息 ===');
    
    // 1. 获取项目位置
    const projectResult = await getProjectLocation();
    if (!projectResult.success) {
      console.error('获取项目位置失败:', projectResult.error);
      return;
    }
    
    console.log('项目信息:', projectResult);
    
    // 2. 获取/创建导出文件夹（刷新时始终使用智能路径，重置自定义路径状态）
    useCustomExportPath.value = false;
    customExportPath.value = '';
    const folderResult = await getOrCreateExportFolder(projectResult.projectPath, exportFolderName.value);
    if (!folderResult.success) {
      console.error('获取导出文件夹失败:', folderResult.error);
      return;
    }
    
    exportFolder = folderResult.exportFolder;
    exportPath.value = folderResult.exportFolderPath;
    
    // 3. 检测分辨率
    const resolutionResult = await detectResolution();
    if (resolutionResult.success) {
      detectedBitrate = resolutionResult.bitrate;
      console.log('[refreshProjectInfo] 检测到码率:', detectedBitrate);
      console.log('[refreshProjectInfo] 当前导出格式:', exportFormat.value);
      // 根据当前格式更新显示
      updateBitrateDisplay();
    }
    
    // 4. 检测版本和项目名称
    const versionResult = await detectLatestVersionAndGenerateFilename(
      exportFolder,
      detectedBitrate,
      null,
      "",
      versionMode.value,
      versionPrefix.value
    );
    
    console.log('版本检测结果:', versionResult);
    
    if (versionResult.success) {
      // 仅在未保留用户自定义名称时才更新项目名称
      if (!options.preserveProjectName) {
        projectName.value = versionResult.baseFilename;
      }
      const verStr = generateVersionStringWithSettings(versionResult.newVersion, versionMode.value, versionPrefix.value);
      versionDisplay.value = `_${verStr}`;
      
      // 检测调色状态
      if (versionResult.colorGrading) {
        detectedColorGrading = versionResult.colorGrading;
        isColorGraded.value = versionResult.colorGrading === 'graded';
        gradingDisplay.value = versionResult.colorGrading === 'graded' ? t('filename.graded') : '';
      } else {
        // 没有检测到调色状态，默认为未调色
        detectedColorGrading = null;
        isColorGraded.value = false;
        gradingDisplay.value = '';
      }
    }
    
    console.log('=== 项目信息刷新完成 ===');
    console.log('最终显示 - 项目名称:', projectName.value, '版本:', versionDisplay.value);
    
    // 手动更新导出格式选择器
    updateExportFormatPicker();
    
  } catch (error: any) {
    console.error('刷新项目信息时出错:', error);
    alert(`${t('message.refreshFailed')}: ${error.message}`);
  }
}

/**
 * 打开导出文件夹
 */
async function openExportFolder() {
  if (!exportFolder) {
    alert(t('message.folderNotCreated'));
    return;
  }
  
  await fileSystemHelper.openFolderInFinder(exportFolder.nativePath);
}

/**
 * 更新显示的码流信息
 */
function updateBitrateDisplay() {
  console.log('[updateBitrateDisplay] 当前导出格式:', exportFormat.value);
  console.log('[updateBitrateDisplay] 检测到的码率:', detectedBitrate);
  console.log('[updateBitrateDisplay] 是否定稿版:', isFinalVersion.value);
  
  if (exportFormat.value === 'h264') {
    // H.264: 根据是否定稿版决定码率
    let actualBitrate = '10mbps'; // 默认10mbps
    if (isFinalVersion.value) {
      actualBitrate = detectedBitrate; // 定稿版使用检测到的码率
    }
    const bitrateValue = actualBitrate.replace('mbps', 'Mbps');
    bitrateDisplay.value = `_H.264_${bitrateValue}`;
  } else if (exportFormat.value === 'prores422') {
    bitrateDisplay.value = '_ProRes422';
  } else if (exportFormat.value === 'prores444') {
    bitrateDisplay.value = '_ProRes444';
  }
  
  console.log('[updateBitrateDisplay] 更新后的显示:', bitrateDisplay.value);
}

/**
 * 导出格式变化处理
 */
function onExportFormatChange(event: any) {
  console.log('[onExportFormatChange] 事件对象:', event);
  console.log('[onExportFormatChange] value 值:', event.target.value);
  exportFormat.value = event.target.value;
  console.log('[onExportFormatChange] exportFormat.value 已更新为:', exportFormat.value);
  updateBitrateDisplay();
}

/**
 * 更新显示的调色状态
 */
function updateGradingDisplay() {
  gradingDisplay.value = isColorGraded.value ? t('filename.graded') : '';
}

/**
 * 调色状态变化处理
 */
function onColorGradingChange(event: any) {
  isColorGraded.value = event.target.checked;
  updateGradingDisplay();
}

/**
 * 更新显示的定稿版状态
 */
function updateFinalVersionDisplay() {
  finalVersionDisplay.value = isFinalVersion.value ? t('filename.finalVersion') : '';
}

/**
 * 定稿版状态变化处理
 */
async function onFinalVersionChange(event: any) {
  isFinalVersion.value = event.target.checked;
  updateFinalVersionDisplay();
  
  // 只有H.264格式才需要根据定稿版状态更新码率
  if (exportFormat.value === 'h264') {
    // 如果勾选了定稿版，重新检测分辨率以获取正确的码率
    if (isFinalVersion.value) {
      const resolutionResult = await detectResolution();
      if (resolutionResult.success) {
        detectedBitrate = resolutionResult.bitrate;
        console.log('[onFinalVersionChange] 重新检测码率:', detectedBitrate);
      }
    }
    
    updateBitrateDisplay(); // 更新码率显示
  }
}

/**
 * 开始导出
 */
async function startExport() {
  if (isExporting.value) {
    console.log('已经在导出中，跳过');
    return;
  }
  
  isExporting.value = true;
  
  try {
    console.log('=== 开始导出流程 ===');
    
    // 1. 确保有项目位置
    const projectResult = await getProjectLocation();
    if (!projectResult.success) {
      alert(`${t('message.error')}: ${projectResult.error}`);
      return;
    }
    
    // 2. 确保有导出文件夹
    if (!exportFolder) {
      // 如果启用了自定义路径，尝试加载自定义文件夹
      if (useCustomExportPath.value && customExportPath.value) {
        try {
          const pathUrl = customExportPath.value.includes('\\')
            ? 'file:///' + customExportPath.value.replace(/\\/g, '/')
            : 'file://' + customExportPath.value;
          const customFolder = await fs.getEntryWithUrl(pathUrl);
          if (customFolder && customFolder.isFolder) {
            exportFolder = customFolder;
          }
        } catch (e: any) {
          console.warn('[\u5bfc\u51fa] \u81ea\u5b9a\u4e49\u8def\u5f84\u52a0\u8f7d\u5931\u8d25，回\u9000至默\u8ba4\u8def\u5f84:', e.message);
        }
      }
    }
    if (!exportFolder) {
      const folderResult = await getOrCreateExportFolder(projectResult.projectPath, exportFolderName.value);
      if (!folderResult.success) {
        alert(`${t('message.error')}: ${folderResult.error}`);
        return;
      }
      exportFolder = folderResult.exportFolder;
    }
    
    // 3. 确定最终码率和预设
    let finalBitrate = detectedBitrate;
    let finalPresetName = '';
    
    if (exportFormat.value === "prores422") {
      finalBitrate = "prores422";
      finalPresetName = "ProRes 422 (数字中间片)";
    } else if (exportFormat.value === "prores444") {
      finalBitrate = "prores444";
      finalPresetName = "ProRes 444 (带通道)";
    } else {
      // 根据是否勾选定稿版决定码率
      if (isFinalVersion.value) {
        // 定稿版：使用检测到的分辨率配合码率
        const resolutionResult = await detectResolution();
        if (resolutionResult.success) {
          finalBitrate = resolutionResult.bitrate;
          finalPresetName = resolutionResult.recommendedPreset;
        }
      } else {
        // 默认：使用 H.264 10mbps
        finalBitrate = "10mbps";
        finalPresetName = "H.264 匹配帧 10Mbps (1080p)";
      }
    }
    
    console.log(`导出格式: ${finalPresetName || finalBitrate}`);
    
    // 4. 获取自定义项目名称和各种标记
    const customProjectName = projectName.value.trim();
    const gradingMarker = isColorGraded.value ? t('filename.graded') : '';
    const finalVersionMarker = isFinalVersion.value ? t('filename.finalVersion') : '';
    const combinedMarker = gradingMarker + finalVersionMarker;
    
    // 5. 检测版本并生成文件名（传入组合标记）
    const versionResult = await detectLatestVersionAndGenerateFilename(
      exportFolder,
      finalBitrate,
      customProjectName || null,
      combinedMarker,
      versionMode.value,
      versionPrefix.value
    );
    
    if (!versionResult.success) {
      alert(`${t('message.error')}: ${versionResult.error}`);
      return;
    }
    
    // 使用生成的文件名（已包含调色标记）
    let finalFilename: string;
    if (!showFilenameLabels.value) {
      // 关闭自动标签：仅使用用户在输入框中填写的项目名称 + 对应扩展名
      const ext = versionResult.newFilename.match(/\.[^.]+$/)?.[0] ?? '.mp4';
      finalFilename = customProjectName ? customProjectName + ext : versionResult.newFilename;
    } else {
      finalFilename = versionResult.newFilename;
    }
    
    console.log(`正在导出: ${finalFilename} (showFilenameLabels=${showFilenameLabels.value})`);

    // 5.5 导出前备份（序列 + 工程文件）
    const backupBaseName = `${customProjectName || projectName.value.trim()}_${generateVersionStringWithSettings(versionResult.newVersion, versionMode.value, versionPrefix.value)}`;
    if (backupSequenceBeforeExport.value) {
      const seqBackupResult = await backupCurrentSequence(backupBaseName);
      if (seqBackupResult.success) {
        console.log('[备份] ✓ 序列已备份为:', seqBackupResult.backupName);
      } else {
        console.warn('[备份] 序列备份失败（不影响导出）:', seqBackupResult.error);
      }
    }
    if (backupProjectBeforeExport.value) {
      const projBackupResult = await backupProjectFile(projectResult.projectPath, backupBaseName + '_备份');
      if (projBackupResult.success) {
        console.log('[备份] ✓ 工程文件已备份至:', projBackupResult.backupPath);
      } else {
        console.warn('[备份] 工程文件备份失败（不影响导出）:', projBackupResult.error);
      }
    }
    
    // 6. 执行导出
    const exportResult = await exportCurrentSequence(
      exportFolder,
      finalFilename,
      finalBitrate
    );
    
    if (!exportResult.success) {
      alert(`${t('message.exportFailed')}: ${exportResult.error}`);
      return;
    }
    
    // 导出成功
    // alert(t('message.exportSuccess'));
    // 归档处理（仅在勾选定稿版且设置了归档根目录时执行）
    archiveResultPath.value = '';
    archiveErrorMsg.value = '';
    if (isFinalVersion.value && archiveEnabled.value && archiveBasePath.value && archiveFolderTemplate.value) {
      console.log('[归档] 导出成功，开始归档定稿版...');
      const archiveResult = await archiveExportedFile(
        exportResult.exportPath!,
        archiveBasePath.value,
        archiveFolderTemplate.value,
        projectName.value.trim() || 'project'
      );
      if (archiveResult.success) {
        archiveResultPath.value = archiveResult.archivePath || '';
        console.log('[归档] ✓ 归档成功:', archiveResultPath.value);
      } else {
        archiveErrorMsg.value = archiveResult.error || '';
        console.error('[归档] ✗ 归档失败:', archiveErrorMsg.value);
      }
    }

    // 保存完整文件路径用于预览（需要转换为 file:// URL 形式）
    if (exportResult.exportPath) {
      console.log('[预览调试] 用于预览的原始路径:', exportResult.exportPath);
      
      let fileUrl = exportResult.exportPath;
      
      // 路径转换逻辑
      // 1. 统一分隔符为 /
      const normalizedPath = exportResult.exportPath.replace(/\\/g, '/');
      
      // 2. 将路径分段进行 URI 编码（处理中文和特殊字符）
      const pathParts = normalizedPath.split('/');
      const encodedPathParts = pathParts.map((part: string) => encodeURIComponent(part));
      const encodedPath = encodedPathParts.join('/');
      
      // 3. 添加 file协议
      // 注意：split之后，如果是绝对路径，第一部分可能是空字符串（Mac/Linux）或盘符（Windows）
      // Mac: /Users/vark -> ["", "Users", "vark"] -> join -> /Users/vark (需要补 file://)
      // Windows: C:/Users -> ["C:", "Users"] -> join -> C:/Users (需要补 file:///)
      
      if (normalizedPath.startsWith('/')) {
        // Mac/Linux
        fileUrl = 'file://' + encodedPath;
      } else {
        // Windows
        fileUrl = 'file:///' + encodedPath;
      }
      
      console.log('[预览调试] 转换后的 file URL:', fileUrl);
      exportedFilePath.value = fileUrl;
    } else {
      console.error('[预览调试] 导出结果中没有 exportPath:', exportResult);
    }
    
    showSuccessDialog.value = true;
    console.log('=== 导出流程完成，等待用户关闭弹窗 ===');
    
    // 注意：移除这里的 refreshProjectInfo()，移至 closeSuccessDialog 中执行
    // 避免弹窗显示时后台刷新导致界面重绘或性能抢占
    
  } catch (error: any) {
    console.error('导出过程发生错误:', error);
    alert(`${t('message.exportFailed')}: ${error.message}`);
  } finally {
    isExporting.value = false;
  }
}

// 组件挂载时刷新项目信息
onMounted(async () => {
  try {
    console.log('=== 插件冷启动：开始初始化 ===');
    
    // 初始化多语言
    await initI18n();
    exportPath.value = t('ui.waiting');
    
    console.log('=== 插件冷启动：多语言初始化完成，加载持久化设置 ===');
    
    // 加载持久化设置（导出文件夹名称等）
    await loadSettings();
    
    console.log('=== 插件冷启动：设置加载完成，开始刷新项目信息 ===');
    
    await refreshProjectInfo();
    
    console.log('=== 插件冷启动：项目信息刷新完成 ===');
    
    // 确保导出格式选择器正确显示
    updateExportFormatPicker();
  } catch (error) {
    console.error('挂载时刷新项目信息失败:', error);
    // 显示错误信息给用户
    exportPath.value = `初始化失败: ${(error as any).message}`;
  }
});

</script>

<template>
  <div class="app-root">
    <!-- 设置视图 -->
    <SettingsView
      v-if="currentView === 'settings'"
      @back="currentView = 'main'; refreshProjectInfo({ preserveProjectName: true })"
    />

    <!-- 主视图 -->
    <div v-else class="container">
      <!-- 标题栏 -->
      <div class="app-header">
        <sp-heading>{{ t('app.title') }}</sp-heading>
        <sp-action-button
          quiet
          class="settings-btn"
          :title="t('ui.settings')"
          @click="currentView = 'settings'"
        >⚙</sp-action-button>
      </div>
      
      <!-- 分隔线 -->
      <sp-divider size="medium"></sp-divider>
    
    <!-- 项目名称输入框 -->
    <sp-field-label for="project-name-input">{{ t('ui.projectName') }}</sp-field-label>
    <div class="filename-row">
      <sp-textfield 
        id="project-name-input"
        :value="projectName"
        @input="projectName = $event.target.value"
        :placeholder="t('ui.loading')">
      </sp-textfield>
      <template v-if="showFilenameLabels">
        <span class="filename-tag">{{ bitrateDisplay }}</span>
        <span class="filename-tag" v-if="gradingDisplay">{{ gradingDisplay }}</span>
        <span class="filename-tag" v-if="finalVersionDisplay">{{ finalVersionDisplay }}</span>
        <span class="filename-tag">{{ versionDisplay }}</span>
      </template>
    </div>
    
    <!-- 操作按钮与状态选择 -->
    <div style="display: flex; align-items: center; margin-bottom: 12px;">
      <sp-button variant="cta" @click="refreshProjectInfo" style="margin-right: 6px;">
        🔄 {{ t('ui.refresh') }}
      </sp-button>
      <sp-button variant="secondary" @click="openExportFolder" style="margin-right: 24px;">
        📁 {{ t('ui.openFolder') }}
      </sp-button>

      <sp-checkbox 
        id="color-grading-checkbox"
        :checked="isColorGraded"
        @change="onColorGradingChange"
        style="margin-right: 10px;">
        {{ t('ui.colorGraded') }}
      </sp-checkbox>
      
      <sp-checkbox 
        id="final-version-checkbox"
        :checked="isFinalVersion"
        @change="onFinalVersionChange">
        {{ t('ui.finalVersion') }}
      </sp-checkbox>
    </div>
    
    <!-- 分隔线 -->
    <sp-divider size="medium"></sp-divider>
    
    <!-- 导出格式选择 -->
    <sp-field-label for="export-format-picker">{{ t('ui.exportFormat') }}</sp-field-label>
    <sp-picker 
      ref="exportFormatPicker"
      :key="pickerKey"
      id="export-format-picker"
      value="h264"
      @change="onExportFormatChange"
      style="width: 100%; margin-bottom: 12px;">
      <sp-menu>
        <sp-menu-item value="h264" selected>{{ t('ui.formatH264') }}</sp-menu-item>
        <sp-menu-item value="prores422">{{ t('ui.formatProRes422') }}</sp-menu-item>
        <sp-menu-item value="prores444">{{ t('ui.formatProRes444') }}</sp-menu-item>
      </sp-menu>
    </sp-picker>
    

    
    <!-- 分隔线 -->
    <sp-divider size="medium"></sp-divider>
    
    <!-- 导出路径显示 -->
    <sp-field-label for="export-path-display">{{ t('ui.exportPath') }}
      <span v-if="useCustomExportPath" class="custom-path-badge">✏️ {{ t('ui.customPathActive') }}</span>
    </sp-field-label>
    <div class="export-path-row">
      <sp-textfield 
        id="export-path-display"
        :value="exportPath"
        readonly
        quiet
        style="flex: 1; background-color: #242424;">
      </sp-textfield>
      <sp-button variant="secondary" size="s" @click="selectCustomExportPath" class="export-path-btn">
        📁 {{ t('ui.changeExportPath') }}
      </sp-button>
    </div>
    
    <!-- 分隔线 -->
    <sp-divider size="medium"></sp-divider>
    
    <!-- 主要操作按钮 -->
    <sp-button 
      variant="cta" 
      @click="startExport" 
      :disabled="isExporting"
      style="width: 100%;">
      {{ isExporting ? t('ui.exporting') : t('ui.export') }}
    </sp-button>

    <!-- 导出成功对话框 -->
    <div v-if="showSuccessDialog" class="dialog-overlay">
      <div class="dialog-content">
        <h2 class="dialog-title">✅ {{ t('message.exportSuccess') }}</h2>
        
        <!-- 视频预览区域 -->
        <div class="video-preview-container" v-if="exportedFilePath">
          <video 
            ref="previewVideo"
            :src="exportedFilePath" 
            controls 
            autoplay 
            muted
            class="video-preview"
            :title="t('ui.clickToPlay')"
            @error="onVideoError"
            @loadedmetadata="onVideoLoaded">
          </video>
        </div>
        
        <div class="dialog-buttons">
          <sp-button variant="secondary" @click="closeSuccessDialog">
            {{ t('ui.close') }}
          </sp-button>
          <sp-button variant="cta" @click="openFolderAndCloseSuccessDialog">
            📁 {{ t('ui.openFolder') }}
          </sp-button>
        </div>

        <!-- 归档结果提示 -->
        <div v-if="archiveResultPath" class="archive-dialog-result archive-dialog-success">
          📦 {{ t('message.archiveSuccess') }}<br/>
          <span class="archive-dialog-path">{{ archiveResultPath }}</span>
        </div>
        <div v-else-if="archiveErrorMsg" class="archive-dialog-result archive-dialog-error">
          ⚠️ {{ t('message.archiveFailed') }}: {{ archiveErrorMsg }}
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<style lang="scss">
.container {
  padding: 16px;
  font-family: adobe-clean, "Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  
  sp-heading {
    margin-bottom: 12px;
  }
  
  sp-divider {
    margin: 12px 0;
  }
  
  sp-field-label {
    font-size: 18px;
    font-weight: 600;
    color: floralwhite;
    margin-bottom: 6px;
    display: block;
  }
  
  sp-textfield {
    &[readonly] {
      pointer-events: none;
    }
    
    // 确保内容可见，不被裁剪
    &[quiet] {
      overflow: visible !important;
      text-overflow: clip !important;
    }
  }
  
  sp-button {
    &[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  
  sp-radio-group {
    display: block;
  }
}

.video-preview-container {
  width: 100%;
  max-width: 320px;
  margin: 0 auto 16px auto;
  border-radius: 4px;
  overflow: hidden;
  background-color: #000;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.video-preview {
  width: 100%;
  height: auto;
  display: block;
  max-height: 180px;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.dialog-content {
  background-color: #323232;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
  border: 1px solid #464646;
  min-width: 240px;
  text-align: center;
  animation: dialog-pop 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.dialog-title {
  margin: 0 0 24px 0;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  display: block;
}

.dialog-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
}

@keyframes dialog-pop {
  0% { transform: scale(0.9); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.app-root {
  width: 100%;
  height: 100%;
}

.filename-row {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 8px;
  overflow: hidden;

  sp-textfield {
    flex: 1;
    min-width: 0;
  }

  .filename-tag {
    flex-shrink: 0;
    white-space: nowrap;
    font-size: 13px;
    color: #bbb;
    line-height: 1;
    padding: 0 2px;
    // 视觉上与输入框基线对齐
    align-self: center;
  }
}

.export-path-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
}

.export-path-btn {
  flex-shrink: 0;
}

.custom-path-badge {
  display: inline-block;
  margin-left: 6px;
  font-size: 11px;
  font-weight: 500;
  color: #4a9eff;
  background: rgba(74, 158, 255, 0.12);
  border: 1px solid rgba(74, 158, 255, 0.3);
  border-radius: 3px;
  padding: 1px 5px;
  vertical-align: middle;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;

  sp-heading {
    margin-bottom: 0;
    flex: 1;
  }

  .settings-btn {
    flex-shrink: 0;
    font-size: 22px;
    cursor: pointer;
    opacity: 1.7;
    transition: opacity 0.15s ease;

    &:hover {
      opacity: 1;
    }
  }
}

/* 成功弹窗中的归档结果 */
.archive-dialog-result {
  margin-top: 14px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  text-align: left;
  line-height: 1.6;
}

.archive-dialog-success {
  background-color: rgba(80, 200, 120, 0.1);
  border: 1px solid rgba(80, 200, 120, 0.4);
  color: #7cd69e;
}

.archive-dialog-error {
  background-color: rgba(220, 80, 80, 0.1);
  border: 1px solid rgba(220, 80, 80, 0.4);
  color: #e88080;
}

.archive-dialog-path {
  font-size: 11px;
  color: #a0cca0;
  word-break: break-all;
  opacity: 0.85;
}
</style>
