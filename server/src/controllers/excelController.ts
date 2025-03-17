import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PythonShell, PythonShellError } from 'python-shell';
import multer from 'multer';

// 确保上传目录和临时目录存在
const uploadDir = path.join(__dirname, '../../uploads');
const tempDir = path.join(__dirname, '../../temp');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// 扩展Request类型
interface RequestWithFiles extends Request {
  files: Express.Multer.File[];
}

// 定义Python脚本返回结果类型
interface PythonScriptResult {
  success: boolean;
  output?: string;
}

// 合并Excel文件
export const mergeExcelFiles = async (req: RequestWithFiles, res: Response) => {
  try {
    if (!req.files || !Array.isArray(req.files)) {
      return res.status(400).json({ message: '没有上传文件' });
    }

    const files = req.files;
    const includeHeaders = req.body.includeHeaders === 'true';
    
    console.log('接收到的includeHeaders参数类型:', typeof req.body.includeHeaders);
    console.log('接收到的includeHeaders参数值:', req.body.includeHeaders);
    console.log('处理后的includeHeaders值:', includeHeaders);
    
    if (files.length === 0) {
      return res.status(400).json({ message: '没有上传文件' });
    }

    // 将上传的文件保存到临时目录
    const tempFilePaths: string[] = [];
    for (const file of files) {
      const fileExt = path.extname(file.originalname).toLowerCase();
      if (fileExt !== '.xls' && fileExt !== '.xlsx') {
        continue;
      }

      const tempFilePath = path.join(tempDir, `${uuidv4()}${fileExt}`);
      fs.writeFileSync(tempFilePath, file.buffer);
      tempFilePaths.push(tempFilePath);
    }

    if (tempFilePaths.length === 0) {
      return res.status(400).json({ message: '没有有效的Excel文件' });
    }

    // 生成输出文件路径
    const outputFileName = `merged_excel_${uuidv4()}.xlsx`;
    const outputFilePath = path.join(uploadDir, outputFileName);

    // 准备Python脚本参数
    const scriptPath = path.resolve(__dirname, '../../scripts/merge_excel.py');
    
    // 检查脚本是否存在
    if (!fs.existsSync(scriptPath)) {
      console.error(`Python脚本不存在: ${scriptPath}`);
      return res.status(500).json({ message: '服务器配置错误，找不到处理脚本' });
    }
    
    console.log(`使用Python脚本: ${scriptPath}`);
    
    const jsonArgs = {
      files: tempFilePaths,
      output: outputFilePath,
      includeHeaders: includeHeaders.toString()
    };
    
    console.log('传递给Python脚本的参数:', JSON.stringify(jsonArgs));
    
    const options = {
      mode: 'text' as const, // 使用文本模式而不是JSON模式
      pythonOptions: ['-u'], // 不缓冲输出
      pythonPath: 'python', // 使用系统默认的Python解释器
      args: [JSON.stringify(jsonArgs)],
      stderrParser: (line: string) => {
        // 使用简洁的日志格式
        console.error(`[Python] ${line}`);
        return line;
      },
      encoding: 'utf8' as BufferEncoding // 明确指定编码为UTF-8
    };

    // 执行Python脚本
    PythonShell.run(scriptPath, options).then((results: string[]) => {
      // 清理临时文件
      tempFilePaths.forEach(filePath => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          console.error(`删除临时文件失败: ${filePath}`, err);
        }
      });

      // 解析Python脚本的输出
      let success = false;
      try {
        // 查找包含JSON的行
        let jsonResult = null;
        for (const line of results) {
          if (line.trim().startsWith('{') && line.trim().endsWith('}')) {
            try {
              jsonResult = JSON.parse(line);
              break;
            } catch (e) {
              // 不是有效的JSON，继续查找
            }
          }
        }
        
        if (jsonResult && typeof jsonResult === 'object') {
          success = jsonResult.success === true;
        } else {
          console.error('未找到有效的JSON结果');
        }
      } catch (err) {
        console.error('解析Python脚本输出失败:', err);
        console.error('原始输出:', results);
      }

      if (success) {
        // 检查输出文件是否存在
        if (fs.existsSync(outputFilePath)) {
          // 返回成功响应
          res.status(200).json({
            message: '文件合并成功',
            fileName: outputFileName
          });
        } else {
          res.status(500).json({ message: '合并Excel文件失败，输出文件不存在' });
        }
      } else {
        res.status(500).json({ message: '合并Excel文件失败' });
      }
    }).catch((err: PythonShellError) => {
      console.error('执行Python脚本失败:', err);
      res.status(500).json({ message: '服务器错误，无法合并文件' });
    });
  } catch (error) {
    console.error('合并Excel文件失败:', error);
    res.status(500).json({ message: '服务器错误，无法合并文件' });
  }
};

// 下载合并后的文件
export const downloadMergedFile = (req: Request, res: Response) => {
  try {
    const { fileName } = req.params;
    
    // 安全检查：确保文件名不包含路径遍历
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return res.status(400).json({ message: '无效的文件名' });
    }
    
    const filePath = path.join(uploadDir, fileName);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: '文件不存在' });
    }
    
    // 设置响应头
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    // 发送文件
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    // 设置定时器，在一段时间后删除文件（例如1小时）
    setTimeout(() => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`临时文件已删除: ${filePath}`);
        }
      } catch (err) {
        console.error(`删除临时文件失败: ${filePath}`, err);
      }
    }, 3600000); // 1小时 = 3600000毫秒
    
  } catch (error) {
    console.error('下载文件失败:', error);
    res.status(500).json({ message: '服务器错误，无法下载文件' });
  }
}; 