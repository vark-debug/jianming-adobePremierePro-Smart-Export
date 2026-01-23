/**
 * 语言检测模块 - 检测 Premiere Pro 的默认语言
 * Language Detector Module - Detect Premiere Pro's default language
 */

import { uxp } from "../globals";

export interface LanguageResult {
  success: boolean;
  language: string;
  locale: string;
  isChineseSimplified: boolean;
  isChineseTraditional: boolean;
  isEnglish: boolean;
  error: string | null;
}

/**
 * 检测 Premiere Pro 的默认语言
 * @returns 语言检测结果
 */
export async function detectLanguage(): Promise<LanguageResult> {
  const result: LanguageResult = {
    success: false,
    language: '',
    locale: '',
    isChineseSimplified: false,
    isChineseTraditional: false,
    isEnglish: false,
    error: null
  };
  
  try {
    console.log('=== 开始检测语言 ===');
    
    // 尝试从 UXP host 获取 UI locale
    let detectedLocale = '';
    
    if (uxp?.host?.uiLocale) {
      detectedLocale = uxp.host.uiLocale;
      console.log(`从 uxp.host.uiLocale 获取: ${detectedLocale}`);
    } else if (typeof navigator !== 'undefined' && navigator.language) {
      // 后备方案：使用浏览器的 navigator.language
      detectedLocale = navigator.language;
      console.log(`从 navigator.language 获取: ${detectedLocale}`);
    } else {
      result.error = "无法检测语言环境";
      console.log(result.error);
      return result;
    }
    
    result.locale = detectedLocale;
    
    // 标准化语言代码（转为小写）
    const normalizedLocale = detectedLocale.toLowerCase();
    
    // 提取主要语言代码（例如 zh-CN -> zh）
    const primaryLanguage = normalizedLocale.split('-')[0];
    result.language = primaryLanguage;
    
    // 判断具体语言类型
    result.isChineseSimplified = normalizedLocale.includes('zh-cn') || normalizedLocale.includes('zh_cn');
    result.isChineseTraditional = normalizedLocale.includes('zh-tw') || normalizedLocale.includes('zh-hk') || 
                                   normalizedLocale.includes('zh_tw') || normalizedLocale.includes('zh_hk');
    result.isEnglish = primaryLanguage === 'en';
    
    console.log(`检测到的语言: ${result.language}`);
    console.log(`完整 Locale: ${result.locale}`);
    console.log(`是否简体中文: ${result.isChineseSimplified}`);
    console.log(`是否繁体中文: ${result.isChineseTraditional}`);
    console.log(`是否英语: ${result.isEnglish}`);
    
    result.success = true;
    console.log('=== 语言检测完成 ===');
    
  } catch (error: any) {
    console.error('Error detecting language:', error);
    console.error('Error stack:', error.stack);
    result.error = error.message || '检测语言时发生错误';
  }
  
  return result;
}

/**
 * 根据检测到的语言返回推荐的 UI 语言
 * @returns 推荐的 UI 语言代码 ('zh-CN' | 'en' | 'zh-TW')
 */
export async function getRecommendedUILanguage(): Promise<string> {
  const langResult = await detectLanguage();
  
  if (!langResult.success) {
    // 默认返回英语
    return 'en';
  }
  
  if (langResult.isChineseSimplified) {
    return 'zh-CN';
  } else if (langResult.isChineseTraditional) {
    return 'zh-TW';
  } else if (langResult.isEnglish) {
    return 'en';
  } else {
    // 其他语言默认使用英语
    return 'en';
  }
}
