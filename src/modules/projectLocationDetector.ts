/**
 * 项目位置检测模块 - 获取当前项目文件的保存位置
 * Project Location Detector Module - Get current project file location
 */

import { premierepro } from "../globals";

export interface ProjectLocationResult {
  success: boolean;
  projectPath: string;
  projectName: string;
  projectDirectory: string;
  isProjectSaved: boolean;
  error: string | null;
}

/**
 * 获取当前项目文件的位置
 * @returns 项目位置信息
 */
export async function getProjectLocation(): Promise<ProjectLocationResult> {
  const result: ProjectLocationResult = {
    success: false,
    projectPath: '',
    projectName: '',
    projectDirectory: '',
    isProjectSaved: false,
    error: null
  };
  
  try {
    console.log('=== 开始获取项目位置 ===');
    
    // 获取活动项目
    const project = await premierepro.Project.getActiveProject();
    
    if (!project) {
      result.error = "没有打开的项目";
      console.log(result.error);
      return result;
    }
    
    console.log('Active project found');
    
    // 获取项目路径
    const projectPath = project.path;
    
    if (!projectPath || projectPath === '') {
      result.error = "项目尚未保存（无文件路径）";
      result.isProjectSaved = false;
      console.log(result.error);
      return result;
    }
    
    result.isProjectSaved = true;
    result.projectPath = projectPath;
    
    console.log(`Project path: ${projectPath}`);
    
    // 从路径中提取项目名称
    const lastSlash = Math.max(
      projectPath.lastIndexOf('/'),
      projectPath.lastIndexOf('\\')
    );
    
    if (lastSlash >= 0) {
      result.projectName = projectPath.substring(lastSlash + 1);
      result.projectDirectory = projectPath.substring(0, lastSlash);
    } else {
      result.projectName = projectPath;
      result.projectDirectory = '';
    }
    
    console.log(`Project name: ${result.projectName}`);
    console.log(`Project directory: ${result.projectDirectory}`);
    
    result.success = true;
    
    console.log('=== 获取项目位置完成 ===');
    
  } catch (error: any) {
    console.error('Error getting project location:', error);
    console.error('Error stack:', error.stack);
    result.error = error.message || '获取项目位置时发生错误';
  }
  
  return result;
}
