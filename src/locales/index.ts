import { ref, computed } from 'vue';
import { detectLanguage } from '../modules/languageDetector';
import zhCN from './zh-CN.json';
import en from './en.json';

type Locale = 'zh-CN' | 'en';
type Messages = typeof zhCN;

const messages: Record<Locale, Messages> = {
  'zh-CN': zhCN,
  'en': en,
};

// 当前语言（默认英语，通过 initI18n() 自动检测）
export const currentLocale = ref<Locale>('en');

// 初始化：自动检测语言
export async function initI18n() {
  const result = await detectLanguage();
  if (result.success) {
    if (result.isChineseSimplified) {
      currentLocale.value = 'zh-CN';
    } else {
      currentLocale.value = 'en';
    }
  }
  console.log(`[i18n] Language initialized: ${currentLocale.value}`);
}

// 翻译函数
export function t(key: string): string {
  const keys = key.split('.');
  let value: any = messages[currentLocale.value];
  
  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      console.warn(`[i18n] Translation key not found: ${key}`);
      return key;
    }
  }
  
  return typeof value === 'string' ? value : key;
}

// Vue Composition API 辅助函数
export function useI18n() {
  return {
    t,
    locale: computed(() => currentLocale.value),
  };
}
