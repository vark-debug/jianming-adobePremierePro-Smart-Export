/**
 * 文件版本号处理模块 - 智能检测和生成版本号
 * File Versioner Module - Intelligent version detection and generation
 */

import { uxp, premierepro } from "../globals";

const fs = uxp.storage.localFileSystem;

export interface VersionResult {
  success: boolean;
  latestFile: any | null;
  latestFilename: string;
  hasExistingVersion: boolean;
  detectedVersion: number;
  newVersion: number;
  newFilename: string;
  baseFilename: string;
  colorGrading: 'graded' | 'ungraded' | null;
  error: string | null;
}

interface VersionInfo {
  hasVersion: boolean;
  version: number;
  versionType: 'V' | '版' | null;
  pattern: string | null;
  originalFilename?: string;
}

/**
 * 从字符串中移除日期标记
 */
function removeDateMarkers(str: string): string {
  if (!str) return '';
  
  let cleaned = str;
  
  // 匹配各种日期格式并移除
  cleaned = cleaned.replace(/\b\d{1,2}_\d{1,2}\b/g, ''); // 1_11, 2_3, 12_25 等
  cleaned = cleaned.replace(/\b\d{4}[-_.]\d{1,2}[-_.]\d{1,2}\b/g, ''); // 2025-2-3, 2025.2.3 等
  cleaned = cleaned.replace(/\b\d{4}[-_.]\d{1,2}\b/g, ''); // 2025-9, 2025.9 等
  cleaned = cleaned.replace(/\b\d{1,4}年\d{1,2}月(\d{1,2}日)?\b/g, ''); // 2025年8月19日 等
  cleaned = cleaned.replace(/\b\d{1,2}月\d{1,2}日\b/g, ''); // 8月19日 等
  cleaned = cleaned.replace(/\b\d{4}年\b/g, ''); // 2025年
  
  console.log(`[removeDateMarkers] 原始: "${str}" -> 清理后: "${cleaned}"`);
  
  return cleaned;
}

/**
 * 清理字符串头尾的符号
 */
function trimSymbols(str: string): string {
  if (!str) return '';
  
  let cleaned = str.trim();
  
  // 移除头尾的常见分隔符号
  cleaned = cleaned.replace(/^[-_.,/\\()（）【】\[\]]+/, '');
  cleaned = cleaned.replace(/[-_.,/\\()（）【】\[\]]+$/, '');
  
  cleaned = cleaned.trim();
  
  console.log(`[trimSymbols] 原始: "${str}" -> 清理后: "${cleaned}"`);
  
  return cleaned;
}

/**
 * 获取并清理项目名称
 */
async function getCleanProjectName(): Promise<string> {
  try {
    const project = await premierepro.Project.getActiveProject();
    if (!project) {
      console.log('[getCleanProjectName] 没有活动项目');
      return '导出';
    }
    
    let projectName = project.name || '导出';
    console.log(`[getCleanProjectName] 原始项目名: "${projectName}"`);
    
    // 移除 .prproj 扩展名
    projectName = projectName.replace(/\.prproj$/i, '');
    console.log(`[getCleanProjectName] 步骤1 - 移除扩展名后: "${projectName}"`);
    
    // 移除日期标记
    projectName = removeDateMarkers(projectName);
    console.log(`[getCleanProjectName] 步骤2 - 移除日期标记后: "${projectName}"`);
    
    // 清理头尾符号
    projectName = trimSymbols(projectName);
    console.log(`[getCleanProjectName] 步骤3 - 清理头尾符号后: "${projectName}"`);
    
    // 如果清理后为空，使用默认名称
    if (!projectName || projectName === '') {
      projectName = '导出';
      console.log(`[getCleanProjectName] 步骤4 - 清理后为空，使用默认名称: "${projectName}"`);
    }
    
    console.log(`[getCleanProjectName] 最终项目名: "${projectName}"`);
    
    return projectName;
    
  } catch (error) {
    console.error('[getCleanProjectName] 错误:', error);
    return '导出';
  }
}

/**
 * 从文件名中检测调色标记
 */
function detectColorGradingMark(filename: string): { hasGradingMark: boolean; isGraded: boolean } {
  const result = {
    hasGradingMark: false,
    isGraded: false
  };
  
  const lowerFilename = filename.toLowerCase();
  
  // 检测"已调色"相关标记
  const gradedMarkers = ['已调色', '调色', 'graded', 'color graded', 'cc'];
  for (const marker of gradedMarkers) {
    if (lowerFilename.includes(marker.toLowerCase())) {
      result.hasGradingMark = true;
      result.isGraded = true;
      console.log(`[detectColorGradingMark] 检测到已调色标记: "${marker}" in "${filename}"`);
      return result;
    }
  }
  
  // 检测"未调色"相关标记
  const ungradedMarkers = ['未调色', '未调', 'ungraded', 'raw'];
  for (const marker of ungradedMarkers) {
    if (lowerFilename.includes(marker.toLowerCase())) {
      result.hasGradingMark = true;
      result.isGraded = false;
      console.log(`[detectColorGradingMark] 检测到未调色标记: "${marker}" in "${filename}"`);
      return result;
    }
  }
  
  return result;
}

/**
 * 从文件名中提取版本号
 */
export function extractVersionFromFilename(filename: string): VersionInfo {
  const result: VersionInfo = {
    hasVersion: false,
    version: 0,
    versionType: null,
    pattern: null,
    originalFilename: filename
  };
  
  // 移除文件扩展名
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
  
  // 匹配 V数字 格式 (V1, V2, V3, ...)
  const vPatternMatch = nameWithoutExt.match(/[Vv](\d+)/);
  if (vPatternMatch) {
    result.hasVersion = true;
    result.version = parseInt(vPatternMatch[1], 10);
    result.versionType = 'V';
    result.pattern = vPatternMatch[0];
    return result;
  }
  
  // 匹配中文版本格式 (第一版, 第二版, ..., 第二十版)
  const chineseNumbers: Record<string, number> = {
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15,
    '十六': 16, '十七': 17, '十八': 18, '十九': 19, '二十': 20
  };
  
  const chinesePatternMatch = nameWithoutExt.match(/第([一二三四五六七八九十]+)版/);
  if (chinesePatternMatch) {
    const chineseNum = chinesePatternMatch[1];
    const version = chineseNumbers[chineseNum] || 1;
    result.hasVersion = true;
    result.version = version;
    result.versionType = '版';
    result.pattern = chinesePatternMatch[0];
    return result;
  }
  
  return result;
}

/**
 * 生成新的版本号字符串
 */
export function generateVersionString(version: number, versionType: 'V' | '版' | null): string {
  if (versionType === 'V') {
    return `V${version}`;
  } else if (versionType === '版') {
    const chineseNumbers = [
      '', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
      '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十'
    ];
    if (version <= 20) {
      return `第${chineseNumbers[version]}版`;
    } else {
      return `第${version}版`;
    }
  }
  return `V${version}`;
}

/**
 * 根据用户设置生成版本号字符串
 * @param version - 版本数字
 * @param mode - 'numeric' 数字格式 | 'chinese' 中文格式
 * @param prefix - 数字格式时的前缀（例如 "V"，生成 V1, V2...）
 */
export function generateVersionStringWithSettings(
  version: number,
  mode: 'numeric' | 'chinese',
  prefix: string
): string {
  if (mode === 'chinese') {
    const chineseNumbers = [
      '', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
      '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十'
    ];
    if (version <= 20) {
      return `第${chineseNumbers[version]}版`;
    } else {
      return `第${version}版`;
    }
  }
  // numeric
  return `${prefix}${version}`;
}

/**
 * 递归遍历文件夹获取所有视频文件
 */
async function traverseFolder(folder: any, videoFiles: any[]): Promise<void> {
  try {
    console.log(`[traverseFolder] 遍历文件夹: ${folder.nativePath}`);
    
    const entries = await folder.getEntries();
    console.log(`[traverseFolder] 找到 ${entries.length} 个条目`);
    
    for (const entry of entries) {
      console.log(`[traverseFolder] 检查条目: ${entry.name}`);
      console.log(`  - isFolder: ${entry.isFolder}, isFile: ${entry.isFile}`);
      
      if (entry.isFolder) {
        // 递归遍历子文件夹
        console.log(`[traverseFolder] 递归进入子文件夹: ${entry.name}`);
        await traverseFolder(entry, videoFiles);
      } else if (entry.isFile) {
        // 检查是否为视频文件
        const lowerName = entry.name.toLowerCase();
        console.log(`[traverseFolder] 检查文件: ${entry.name}`);
        
        const ext = lowerName.match(/\.(mp4|mov|avi|mkv|mxf)$/);
        
        if (ext) {
          console.log(`[traverseFolder] ✓ 添加视频文件: ${entry.name}`);
          videoFiles.push(entry);
        } else {
          console.log(`[traverseFolder] ✗ 跳过非视频文件: ${entry.name}`);
        }
      }
    }
    
  } catch (error: any) {
    console.error(`[traverseFolder] 遍历文件夹出错:`, error);
    console.error(`[traverseFolder] 错误堆栈:`, error.stack);
  }
}

/**
 * 检测导出文件夹中的最新文件并生成新文件名
 * @param exportFolder - 导出文件夹对象
 * @param bitrate - 码率 (如 "10mbps" 或 "48mbps" 或 "prores422")
 * @param customProjectName - 用户自定义的项目名称（可选）
 * @param gradingMarker - 调色标记（如 "_已调色" 或 ""）
 * @returns 文件版本信息
 */
export async function detectLatestVersionAndGenerateFilename(
  exportFolder: any,
  bitrate: string = "10mbps",
  customProjectName: string | null = null,
  gradingMarker: string = "",
  versionMode: 'numeric' | 'chinese' = 'numeric',
  versionPrefix: string = 'V'
): Promise<VersionResult> {
  const result: VersionResult = {
    success: false,
    latestFile: null,
    latestFilename: '',
    hasExistingVersion: false,
    detectedVersion: 0,
    newVersion: 1,
    newFilename: '',
    baseFilename: '',
    colorGrading: null,
    error: null
  };
  
  try {
    console.log('=== 开始检测最新版本文件 ===');
    console.log(`码率: ${bitrate}`);
    console.log(`自定义项目名称: ${customProjectName || '无'}`);
    
    if (!exportFolder) {
      result.error = "导出文件夹对象为空";
      console.log(result.error);
      return result;
    }
    
    // 使用递归遍历获取所有视频文件
    console.log('开始递归遍历文件夹...');
    const videoFiles: any[] = [];
    await traverseFolder(exportFolder, videoFiles);
    
    console.log(`找到 ${videoFiles.length} 个视频文件`);
    
    if (videoFiles.length === 0) {
      // 没有现有文件，使用自定义项目名称或清理后的项目名称
      console.log('没有现有文件，使用项目名称');
      
      const projectName = customProjectName || await getCleanProjectName();
      console.log(`使用项目名称: ${projectName} (自定义: ${!!customProjectName})`);
      
      // 根据编码类型选择文件扩展名
      let fileExtension = '.mp4';
      if (bitrate === 'prores422' || bitrate === 'prores444') {
        fileExtension = '.mov';
      }
      
      result.success = true;
      result.baseFilename = projectName;
      result.newVersion = 1;
      const versionStr1 = generateVersionStringWithSettings(1, versionMode, versionPrefix);
      result.newFilename = `${projectName}_${bitrate}${gradingMarker}_${versionStr1}${fileExtension}`;
      
      console.log(`基础文件名: ${projectName}`);
      console.log(`新文件名: ${result.newFilename}`);
      return result;
    }
    
    // 提取所有文件的版本信息
    console.log('=== 开始提取版本信息 ===');
    const filesWithVersions: { file: any; versionInfo: VersionInfo }[] = [];
    
    for (const file of videoFiles) {
      const versionInfo = extractVersionFromFilename(file.name);
      console.log(`文件: ${file.name}`);
      console.log(`  版本信息: hasVersion=${versionInfo.hasVersion}, version=${versionInfo.version}, pattern=${versionInfo.pattern}`);
      
      if (versionInfo.hasVersion) {
        filesWithVersions.push({
          file: file,
          versionInfo: versionInfo
        });
        console.log(`  ✓ 有版本号，添加到版本列表`);
      } else {
        console.log(`  ✗ 无版本号，跳过`);
      }
    }
    
    console.log(`=== 版本信息提取完成，找到 ${filesWithVersions.length} 个有版本号的文件 ===`);
    
    if (filesWithVersions.length === 0) {
      // 所有文件都没有版本号，使用自定义项目名称或清理后的项目名称并添加 V1
      console.log('所有文件都没有版本号，使用项目名称并添加 V1');
      
      const projectName = customProjectName || await getCleanProjectName();
      console.log(`使用项目名称: ${projectName} (自定义: ${!!customProjectName})`);
      
      // 根据编码类型选择文件扩展名
      let fileExtension = '.mp4';
      if (bitrate === 'prores422' || bitrate === 'prores444') {
        fileExtension = '.mov';
      }
      
      result.success = true;
      result.baseFilename = projectName;
      result.newVersion = 1;
      const versionStr2 = generateVersionStringWithSettings(1, versionMode, versionPrefix);
      result.newFilename = `${projectName}_${bitrate}${gradingMarker}_${versionStr2}${fileExtension}`;
      
      console.log(`基础文件名（来自项目名）: ${projectName}`);
      console.log(`新文件名: ${result.newFilename}`);
      return result;
    }
    
    // 按版本号大小排序，找到最大版本号
    filesWithVersions.sort((a, b) => b.versionInfo.version - a.versionInfo.version);
    
    console.log('=== 按版本号排序后的文件列表 ===');
    for (let i = 0; i < filesWithVersions.length; i++) {
      const item = filesWithVersions[i];
      console.log(`${i + 1}. ${item.file.name} - 版本: ${item.versionInfo.version}`);
    }
    console.log('=== 排序列表结束 ===');
    
    // 获取版本号最大的文件
    const latestFileWithVersion = filesWithVersions[0];
    const latestFile = latestFileWithVersion.file;
    const versionInfo = latestFileWithVersion.versionInfo;
    
    result.latestFile = latestFile;
    result.latestFilename = latestFile.name;
    result.hasExistingVersion = true;
    result.detectedVersion = versionInfo.version;
    result.newVersion = versionInfo.version + 1;
    
    // 检测调色标记
    const gradingInfo = detectColorGradingMark(latestFile.name);
    if (gradingInfo.hasGradingMark) {
      result.colorGrading = gradingInfo.isGraded ? 'graded' : 'ungraded';
      console.log(`检测到调色状态: ${result.colorGrading}`);
    }
    
    console.log(`最新版本文件: ${result.latestFilename}`);
    console.log(`检测到版本: ${versionInfo.pattern} (${versionInfo.version})`);
    console.log(`新版本: ${result.newVersion}`);
    
    // 生成基础文件名（去除版本号和扩展名）
    let baseFilename = result.latestFilename.replace(/\.[^/.]+$/, ""); // 去除扩展名
    console.log(`[步骤1] 去除扩展名: "${baseFilename}"`);
    
    // 去除旧的版本号
    if (versionInfo.pattern) {
      baseFilename = baseFilename.replace(versionInfo.pattern, '').trim();
      console.log(`[步骤2] 去除版本号: "${baseFilename}"`);
    }
    
    // 去除可能存在的码率标记
    baseFilename = baseFilename.replace(/_\d+mbps/i, '').trim();
    console.log(`[步骤3] 去除码率标记: "${baseFilename}"`);
    
    // 去除 ProRes 标记
    baseFilename = baseFilename.replace(/_prores422/i, '').trim();
    baseFilename = baseFilename.replace(/_prores444/i, '').trim();
    console.log(`[步骤3.1] 去除 ProRes 标记: "${baseFilename}"`);
    
    // 去除调色标记
    baseFilename = baseFilename.replace(/_已调色/ig, '').trim();
    baseFilename = baseFilename.replace(/_未调色/ig, '').trim();
    baseFilename = baseFilename.replace(/_调色/ig, '').trim();
    baseFilename = baseFilename.replace(/_graded/ig, '').trim();
    baseFilename = baseFilename.replace(/_ungraded/ig, '').trim();
    baseFilename = baseFilename.replace(/_cc/ig, '').trim();
    console.log(`[步骤3.2] 去除调色标记: "${baseFilename}"`);
    
    // 清理日期标记
    baseFilename = removeDateMarkers(baseFilename);
    console.log(`[步骤4] 清理日期标记: "${baseFilename}"`);
    
    // 去除末尾的连字符或下划线
    baseFilename = trimSymbols(baseFilename);
    console.log(`[步骤5] 清理头尾符号: "${baseFilename}"`);
    
    // 如果有自定义项目名称，使用自定义名称；否则使用清理后的文件名
    if (customProjectName) {
      console.log(`[步骤5.5] 使用自定义项目名称: "${customProjectName}"`);
      baseFilename = customProjectName;
    } else if (!baseFilename || baseFilename === '') {
      // 如果清理后为空，使用项目名称
      console.log('[警告] 基础文件名清理后为空，使用项目名称');
      baseFilename = await getCleanProjectName();
    }
    
    result.baseFilename = baseFilename;
    
    // 根据编码类型选择文件扩展名
    let fileExtension = '.mp4';  // 默认 H.264 使用 .mp4
    if (bitrate === 'prores422' || bitrate === 'prores444') {
      fileExtension = '.mov';  // ProRes 使用 .mov
    }
    console.log(`[步骤6] 选择文件扩展名: ${fileExtension} (编码: ${bitrate})`);
    
    // 生成新文件名（格式：项目名_码率_调色标记_版本号.扩展名）
    const newVersionString = generateVersionStringWithSettings(result.newVersion, versionMode, versionPrefix);
    result.newFilename = `${baseFilename}_${bitrate}${gradingMarker}_${newVersionString}${fileExtension}`;
    
    console.log(`基础文件名（最终）: ${baseFilename}`);
    console.log(`新文件名: ${result.newFilename}`);
    
    result.success = true;
    console.log('=== 检测最新版本文件完成 ===');
    
  } catch (error: any) {
    console.error('Error detecting version:', error);
    console.error('Error stack:', error.stack);
    result.error = error.message || '检测版本时发生错误';
  }
  
  return result;
}
