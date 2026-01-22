/**
 * 序列导出模块 - 自动导出当前序列
 * Sequence Exporter Module - Automatically export current sequence
 */

import { premierepro, uxp } from "../globals";

const fs = uxp.storage.localFileSystem;

export interface ExportResult {
  success: boolean;
  exportPath: string;
  presetUsed: string;
  error: string | null;
}

/**
 * 导出当前序列
 * @param exportFolder - 导出文件夹对象
 * @param filename - 导出文件名（包含扩展名）
 * @param presetType - 预设类型 ("10mbps", "48mbps", "prores422", "prores444")
 * @returns 导出结果
 */
export async function exportCurrentSequence(
  exportFolder: any,
  filename: string,
  presetType: string = "10mbps"
): Promise<ExportResult> {
  const result: ExportResult = {
    success: false,
    exportPath: '',
    presetUsed: '',
    error: null
  };
  
  try {
    console.log('=== 开始导出序列 ===');
    console.log(`导出文件夹: ${exportFolder.nativePath}`);
    console.log(`文件名: ${filename}`);
    console.log(`预设类型: ${presetType}`);
    
    // 1. 获取当前活动项目和序列
    const project = await premierepro.Project.getActiveProject();
    if (!project) {
      result.error = "没有打开的项目";
      console.log(result.error);
      return result;
    }
    
    const sequence = await project.getActiveSequence();
    if (!sequence) {
      result.error = "没有活动的序列";
      console.log(result.error);
      return result;
    }
    
    console.log(`活动序列: ${sequence.name}`);
    
    // 2. 确定预设文件路径
    const presetMap: Record<string, string> = {
      "10mbps": "h264匹配帧10mbps.epr",
      "48mbps": "h264匹配帧48mbps.epr",
      "prores422": "ProRes 422.epr",
      "prores444": "ProRes 444.epr"
    };
    
    const presetFilename = presetMap[presetType] || presetMap["10mbps"];
    console.log(`[步骤2] 预设映射完成`);
    console.log(`  请求的预设类型: ${presetType}`);
    console.log(`  选择的预设文件名: ${presetFilename}`);
    
    // 获取插件根目录（构建后的 dist 目录）
    console.log(`[步骤2.1] 获取插件根目录...`);
    const pluginFolder = await fs.getPluginFolder();
    console.log(`  插件根目录: ${pluginFolder.nativePath}`);
    
    // Bolt UXP 构建后，epr 文件夹直接在 dist 根目录下
    console.log(`[步骤2.2] 查找 epr 文件夹...`);
    const eprFolder = await pluginFolder.getEntry("epr");
    console.log(`  epr 文件夹路径: ${eprFolder.nativePath}`);
    console.log(`  epr 是否为文件夹: ${eprFolder.isFolder}`);
    
    console.log(`[步骤2.3] 查找预设文件: ${presetFilename}...`);
    const presetFile = await eprFolder.getEntry(presetFilename);
    console.log(`  预设文件对象:`, presetFile);
    console.log(`  预设文件是否为文件: ${presetFile ? presetFile.isFile : 'null'}`);
    
    if (!presetFile || !presetFile.isFile) {
      result.error = `预设文件不存在: ${presetFilename}`;
      console.log(result.error);
      return result;
    }
    
    const presetPath = presetFile.nativePath;
    console.log(`[步骤2.4] 预设文件路径获取成功`);
    console.log(`  完整路径: ${presetPath}`);
    
    result.presetUsed = presetFilename;
    
    // 3. 构建完整的导出路径
    console.log(`[步骤3] 构建导出路径`);
    console.log(`  导出文件夹: ${exportFolder.nativePath}`);
    console.log(`  文件名: ${filename}`);
    
    // 跨平台路径分隔符：Mac 使用 / ，Windows 使用 \
    const separator = exportFolder.nativePath.includes('\\') ? '\\' : '/';
    const exportPath = exportFolder.nativePath + separator + filename;
    console.log(`  路径分隔符: ${separator}`);
    console.log(`  完整导出路径: ${exportPath}`);
    
    result.exportPath = exportPath;
    
    // 4. 执行导出
    console.log('[步骤4] 准备执行导出');
    console.log(`  序列名称: ${sequence.name}`);
    console.log(`  导出路径: ${exportPath}`);
    console.log(`  预设路径: ${presetPath}`);
    
    console.log('[步骤4.1] 获取编码器管理器...');
    const encoder = await premierepro.EncoderManager.getManager();
    console.log('  编码器管理器获取成功');
    
    console.log('[步骤4.2] 准备调用 encoder.exportSequence');
    
    try {
      const exportType = premierepro.Constants.ExportType.IMMEDIATELY;
      console.log('[步骤4.3] 调用 encoder.exportSequence()...');
      
      const timeBefore = new Date().toISOString();
      console.log(`[步骤4.3] Time before call: ${timeBefore}`);
      
      const exportSuccess = await encoder.exportSequence(
        sequence,
        exportType,  // 立即导出
        exportPath,  // 导出文件路径
        presetPath   // 预设文件路径
      );
      
      const timeAfter = new Date().toISOString();
      console.log(`[步骤4.3] Time after call: ${timeAfter}`);
      console.log(`[步骤4.4] exportSequence() returned: ${exportSuccess}`);
      
      if (exportSuccess) {
        result.success = true;
        console.log('✓ 导出成功！');
      } else {
        result.error = "导出失败（encoder.exportSequence 返回 false）";
        console.log(`✗ ${result.error}`);
      }
    } catch (exportError: any) {
      console.error('[步骤4.3] exportSequence 抛出异常:');
      console.error('  错误消息:', exportError.message);
      console.error('  错误堆栈:', exportError.stack);
      throw exportError;
    }
    
    console.log('=== 导出序列完成 ===');
    
  } catch (error: any) {
    console.error('=== 导出过程发生错误 ===');
    console.error('错误类型:', error.constructor.name);
    console.error('错误消息:', error.message);
    console.error('错误堆栈:', error.stack);
    result.error = error.message || '导出序列时发生错误';
  }
  
  return result;
}
