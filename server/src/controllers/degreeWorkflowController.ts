import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PythonShell } from 'python-shell';
import AdmZip from 'adm-zip';

const uploadDir = path.join(__dirname, '../../uploads');
const tempDir = path.join(__dirname, '../../temp');
const pythonInterpreter = path.resolve(__dirname, '../../venv/bin/python');
const scriptPath = path.resolve(__dirname, '../../scripts/scripts_for_degree/fullTime/main.py');
const parttimeScriptPath = path.resolve(__dirname, '../../scripts/scripts_for_degree/partTime/compare_parttime.py');
const masterScriptPath = path.resolve(__dirname, '../../scripts/scripts_for_degree/fullTime/fulltime_master.py');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

export const processFullTimeWorkflow = async (req: Request, res: Response) => {
  try {
    console.log('收到文件:', req.file);
    if (!req.file) {
      return res.status(400).json({ message: '没有上传文件' });
    }
    // 保存上传文件到临时目录
    const ext = path.extname(req.file.originalname) || '.xlsx';
    const tempFilePath = path.join(tempDir, `${uuidv4()}${ext}`);
    fs.writeFileSync(tempFilePath, req.file.buffer);
    const outputFileName = `degree_fulltime_${uuidv4()}.xlsx`;
    const outputFilePath = path.join(uploadDir, outputFileName);

    // 调用python脚本，传递输入和输出路径
    const options = {
      mode: 'text' as const,
      pythonOptions: ['-u'],
      pythonPath: pythonInterpreter,
      args: [tempFilePath, outputFilePath],
    };
    console.log('准备调用Python脚本:', options);
    PythonShell.run(scriptPath, options)
      .then((results: string[]) => {
        console.log('PythonShell 返回结果:', results);
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        let stats = null;
        for (const line of results) {
          try {
            const obj = JSON.parse(line);
            if (typeof obj === 'object' && obj.raw_count !== undefined && obj.normalized_count !== undefined) {
              stats = obj;
              break;
            }
          } catch (e) {
            console.error('解析Python输出JSON失败:', e, '内容:', line);
          }
        }
        if (fs.existsSync(outputFilePath)) {
          res.status(200).json({ fileName: outputFileName, ...stats });
        } else {
          console.error('处理失败，未生成结果文件:', outputFilePath);
          res.status(500).json({ message: '处理失败，未生成结果文件' });
        }
      })
      .catch((err) => {
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        console.error('PythonShell error:', err);
        res.status(500).json({ message: 'Python脚本执行失败', error: err.message });
      });
  } catch (error: any) {
    console.error('Server error:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

export const processFullTimeMasterWorkflow = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '没有上传文件' });
    }
    const ext = path.extname(req.file.originalname) || '.xlsx';
    const tempFilePath = path.join(tempDir, `${uuidv4()}${ext}`);
    fs.writeFileSync(tempFilePath, req.file.buffer);
    const outputFileName = `degree_fulltime_master_${uuidv4()}.xlsx`;
    const outputFilePath = path.join(uploadDir, outputFileName);
    const options = {
      mode: 'text' as const,
      pythonOptions: ['-u'],
      pythonPath: pythonInterpreter,
      args: [tempFilePath, outputFilePath],
    };
    PythonShell.run(masterScriptPath, options)
      .then((results: string[]) => {
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        let stats = null;
        for (const line of results) {
          try {
            const obj = JSON.parse(line);
            if (typeof obj === 'object' && obj.raw_count !== undefined && obj.normalized_count !== undefined) {
              stats = obj;
              break;
            }
          } catch {}
        }
        if (fs.existsSync(outputFilePath)) {
          res.status(200).json({ fileName: outputFileName, ...stats });
        } else {
          res.status(500).json({ message: '处理失败，未生成结果文件' });
        }
      })
      .catch((err) => {
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        res.status(500).json({ message: 'Python脚本执行失败', error: err.message });
      });
  } catch (error: any) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

export const downloadDegreeWorkflowFile = (req: Request, res: Response) => {
  const fileName = req.query.file as string;
  if (!fileName) return res.status(400).json({ message: '缺少文件名参数' });
  if (fileName.includes('..') || fileName.includes('\\')) {
    return res.status(400).json({ message: '无效的文件名' });
  }
  const filePath = path.join(uploadDir, fileName);
  // 确保 filePath 在 uploads 目录下，防止目录穿越
  if (!filePath.startsWith(uploadDir)) {
    return res.status(400).json({ message: '无效的文件名' });
  }
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: '文件不存在' });
  res.setHeader('Content-Disposition', `attachment; filename=${path.basename(fileName)}`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
  setTimeout(() => {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {}
  }, 3600000);
};

export const compareFullTimeWorkflow = async (req: Request, res: Response) => {
  try {
    const { currentFileName, lastYearFileName } = req.body;
    console.log('收到 compare 请求，文件名:', currentFileName, lastYearFileName);
    if (!currentFileName || !lastYearFileName) {
      console.error('缺少文件名参数:', currentFileName, lastYearFileName);
      return res.status(400).json({ message: '请传递本年度和去年年度的分析结果文件名' });
    }
    // 校验文件名安全
    if ([currentFileName, lastYearFileName].some(f => f.includes('..') || f.includes('/') || f.includes('\\'))) {
      return res.status(400).json({ message: '无效的文件名' });
    }
    const tempCurrent = path.join(uploadDir, currentFileName);
    const tempLast = path.join(uploadDir, lastYearFileName);
    if (!fs.existsSync(tempCurrent) || !fs.existsSync(tempLast)) {
      console.error('分析结果文件不存在:', tempCurrent, tempLast);
      return res.status(400).json({ message: '分析结果文件不存在' });
    }
    const outputDir = path.join(uploadDir, `compare_${uuidv4()}`);
    fs.mkdirSync(outputDir, { recursive: true });
    const scriptPath = path.resolve(__dirname, '../../scripts/scripts_for_degree/fullTime/compare.py');
    const options = {
      mode: 'text' as const,
      pythonOptions: ['-u'],
      pythonPath: pythonInterpreter,
      args: [tempCurrent, tempLast, outputDir],
    };
    console.log('准备调用 compare.py:', options);
    PythonShell.run(scriptPath, options)
      .then((results: string[]) => {
        console.log('compare.py 返回结果:', results);
        // 返回三个文件名
        const inDb = path.join(outputDir, 'in_db.xlsx');
        const curOnly = path.join(outputDir, 'current_only.xlsx');
        const exitFile = path.join(outputDir, 'exit.xlsx');
        if (fs.existsSync(inDb) && fs.existsSync(curOnly) && fs.existsSync(exitFile)) {
          res.status(200).json({
            inDb: path.relative(uploadDir, inDb),
            curOnly: path.relative(uploadDir, curOnly),
            exitFile: path.relative(uploadDir, exitFile)
          });
        } else {
          console.error('对比失败，结果文件不存在:', { inDb, curOnly, exitFile });
          res.status(500).json({ message: '对比失败，结果文件不存在' });
        }
      })
      .catch((err) => {
        console.error('compare.py 脚本执行失败:', err);
        res.status(500).json({ message: 'Python脚本执行失败', error: err.message });
      });
  } catch (error: any) {
    console.error('compareFullTimeWorkflow 服务器错误:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

export const comparePartTimeWorkflow = async (req: Request, res: Response) => {
  try {
    if (!req.files || !(req.files as any)["currentFile"] || !(req.files as any)["lastYearFile"]) {
      return res.status(400).json({ message: '请上传本年度和去年年度两个文件' });
    }
    const currentFile = (req.files as any)["currentFile"][0];
    const lastYearFile = (req.files as any)["lastYearFile"][0];
    const ext1 = path.extname(currentFile.originalname) || '.xlsx';
    const ext2 = path.extname(lastYearFile.originalname) || '.xlsx';
    const tempCurrent = path.join(tempDir, `${uuidv4()}${ext1}`);
    const tempLast = path.join(tempDir, `${uuidv4()}${ext2}`);
    fs.writeFileSync(tempCurrent, currentFile.buffer);
    fs.writeFileSync(tempLast, lastYearFile.buffer);
    const outputDir = path.join(uploadDir, `compare_parttime_${uuidv4()}`);
    fs.mkdirSync(outputDir, { recursive: true });

    const options = {
      mode: 'text' as const,
      pythonOptions: ['-u'],
      pythonPath: pythonInterpreter,
      args: [tempCurrent, tempLast, outputDir],
    };
    PythonShell.run(parttimeScriptPath, options)
      .then((results: string[]) => {
        if (fs.existsSync(tempCurrent)) fs.unlinkSync(tempCurrent);
        if (fs.existsSync(tempLast)) fs.unlinkSync(tempLast);
        let stats = null;
        // 检查是否有重复数据错误或统计信息
        for (const line of results) {
          try {
            const obj = JSON.parse(line);
            if (obj.repeatInfo) {
              return res.status(400).json(obj);
            }
            if (obj.stats) {
              stats = obj.stats;
            }
          } catch {}
        }
        // 返回三个文件名
        const inDb = path.join(outputDir, 'in_db.xlsx');
        const curOnly = path.join(outputDir, 'current_only.xlsx');
        const exitFile = path.join(outputDir, 'exit.xlsx');
        if (fs.existsSync(inDb) && fs.existsSync(curOnly) && fs.existsSync(exitFile)) {
          res.status(200).json({
            inDb: path.relative(uploadDir, inDb),
            curOnly: path.relative(uploadDir, curOnly),
            exitFile: path.relative(uploadDir, exitFile),
            stats
          });
        } else {
          res.status(500).json({ message: '对比失败，结果文件不存在' });
        }
      })
      .catch((err) => {
        if (fs.existsSync(tempCurrent)) fs.unlinkSync(tempCurrent);
        if (fs.existsSync(tempLast)) fs.unlinkSync(tempLast);
        res.status(500).json({ message: 'Python脚本执行失败', error: err.message });
      });
  } catch (error: any) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

// 文件名清理函数
const sanitizeFileName = (filename: string): string => {
  return filename
    .replace(/[<>:"|?*\\]/g, '_')  // 替换Windows不允许的字符
    .replace(/[\x00-\x1f]/g, '_')  // 替换控制字符
    .replace(/\s+/g, '_')          // 替换空格
    .replace(/[^\x20-\x7E\u4e00-\u9fff]/g, '_') // 只保留ASCII和中文
    .replace(/_+/g, '_')           // 合并多个下划线
    .replace(/^_|_$/g, '')         // 移除开头和结尾的下划线
    || 'unnamed_file';             // 如果文件名为空，使用默认名称
};

export const processCrucialWorkflow = async (req: Request, res: Response) => {
  try {
    // 检查zip和excel文件
    if (!req.files || !(req.files as any)["zip"] || !(req.files as any)["excel"]) {
      return res.status(400).json({ message: '请同时上传学生材料zip和Excel文件' });
    }
    const zipFile = (req.files as any)["zip"][0];
    const excelFile = (req.files as any)["excel"][0];
    // 1. 保存zip和excel到临时目录
    const tempRoot = path.join(tempDir, `crucial_${uuidv4()}`);
    fs.mkdirSync(tempRoot, { recursive: true });
    const zipPath = path.join(tempRoot, zipFile.originalname);
    fs.writeFileSync(zipPath, zipFile.buffer);
    const excelPath = path.join(tempRoot, excelFile.originalname);
    fs.writeFileSync(excelPath, excelFile.buffer);
    // 2. 解压zip - 使用简单但有效的方法
    try {
      // 设置进程编码环境
      process.env.LANG = 'zh_CN.UTF-8';
      process.env.LC_ALL = 'zh_CN.UTF-8';
      process.env.PYTHONIOENCODING = 'utf-8';
      
      console.log('开始解压ZIP文件...');
      const zip = new AdmZip(zipPath);
      
      // 手动解压每个文件，确保中文文件名正确处理
      const entries = zip.getEntries();
      console.log(`ZIP文件包含 ${entries.length} 个条目`);
      
      // 创建文件夹映射，避免重复创建
      const createdDirs = new Set<string>();
      
      for (const entry of entries) {
        if (!entry.isDirectory) {
          try {
            // 确保文件名使用正确的编码
            let fileName = entry.entryName;
            
            // 使用新的编码修复函数
            const originalFileName = fileName;
            fileName = fixChineseEncoding(entry.entryName);
            
            // 如果修复失败，尝试其他方法
            if (fileName === originalFileName && /[\x80-\xFF]/.test(fileName)) {
              console.log(`尝试其他方法修复: ${fileName}`);
              
              // 方法1：尝试从字节数组重新构建
              const bytes = [];
              for (let i = 0; i < fileName.length; i++) {
                const charCode = fileName.charCodeAt(i);
                if (charCode > 127) {
                  bytes.push(charCode & 0xFF);
                } else {
                  bytes.push(charCode);
                }
              }
              
              if (bytes.length > 0) {
                try {
                  const buffer = Buffer.from(bytes);
                  const testStr = buffer.toString('utf8');
                  if (/[\u4e00-\u9fff]/.test(testStr)) {
                    fileName = testStr;
                    console.log(`字节重建成功: ${originalFileName} -> ${fileName}`);
                  }
                } catch (e) {
                  // 忽略错误
                }
              }
            }
            
            const filePath = path.join(tempRoot, fileName);
            const dirPath = path.dirname(filePath);
            
            // 确保目录存在（避免重复创建）
            if (!createdDirs.has(dirPath)) {
              if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                createdDirs.add(dirPath);
              }
            }
            
            // 写入文件
            fs.writeFileSync(filePath, entry.getData());
            console.log(`解压文件: ${fileName}`);
          } catch (fileError: any) {
            console.error(`解压文件失败 ${entry.entryName}:`, fileError);
          }
        }
      }
      
      console.log('ZIP解压完成');
      
    } catch (error: any) {
      console.error('AdmZip解压失败，尝试备用方法:', error);
      
      // 备用方法：使用系统unzip命令
      try {
        const { execSync } = require('child_process');
        console.log('尝试使用系统unzip命令解压...');
        
        // 使用unzip命令解压，指定UTF-8编码
        execSync(`unzip -o "${zipPath}" -d "${tempRoot}"`, { 
          encoding: 'utf8',
          stdio: 'pipe'
        });
        
        console.log('使用系统unzip命令解压成功');
      } catch (unzipError: any) {
        console.error('系统unzip命令也失败:', unzipError);
        
        // 最后备用方法：手动解压
        try {
          console.log('尝试手动解压...');
          const zip = new AdmZip(zipPath);
          const entries = zip.getEntries();
          
          for (const entry of entries) {
            if (!entry.isDirectory) {
              try {
                const data = entry.getData();
                const cleanName = sanitizeFileName(entry.entryName);
                const targetPath = path.join(tempRoot, cleanName);
                const targetDir = path.dirname(targetPath);
                
                if (!fs.existsSync(targetDir)) {
                  fs.mkdirSync(targetDir, { recursive: true });
                }
                
                fs.writeFileSync(targetPath, data);
                console.log(`手动解压成功: ${cleanName}`);
              } catch (entryError: any) {
                console.error(`手动解压条目失败: ${entry.entryName}`, entryError);
              }
            }
          }
          console.log('手动解压完成');
        } catch (manualError: any) {
          console.error('所有解压方法都失败:', manualError);
          return res.status(500).json({ 
            message: 'ZIP文件解压失败', 
            error: `所有解压方法都失败: ${error.message}` 
          });
        }
      }
    }
    // 3. 获取所有一级子目录（学生文件夹）
    let studentFolders: string[] = [];
    try {
      const entries = fs.readdirSync(tempRoot, { withFileTypes: true, encoding: 'utf8' });
      console.log('解压后的目录内容:', entries.map(e => e.name));
      
      studentFolders = entries
        .filter(d => d.isDirectory() && d.name !== '__MACOSX')
        .map(d => {
          // 确保路径正确编码，处理中文名称
          let folderName = d.name;
          
          // 使用新的编码修复函数
          folderName = fixChineseEncoding(d.name);
          
          const folderPath = path.join(tempRoot, folderName);
          console.log(`发现学生文件夹: ${folderName} -> ${folderPath}`);
          
          // 验证文件夹是否可访问
          try {
            const stats = fs.statSync(folderPath);
            if (stats.isDirectory()) {
              console.log(`文件夹验证成功: ${folderPath}`);
              return folderPath;
            } else {
              console.log(`跳过非目录项: ${folderPath}`);
              return null;
            }
          } catch (error) {
            console.error(`无法访问文件夹 ${folderPath}:`, error);
            return null;
          }
        })
        .filter(folder => folder !== null) as string[];
        
      console.log(`有效学生文件夹数量: ${studentFolders.length}`);
    } catch (error: any) {
      console.error('读取解压目录失败:', error);
      return res.status(500).json({ message: '读取解压目录失败', error: error.message });
    }
    if (studentFolders.length === 0) {
      return res.status(400).json({ message: '压缩包内未检测到学生文件夹' });
    }
    // 4. 调用merge_student_documents.py，传递excel_file参数
    const outputDir = path.join(tempRoot, '合并后的PDF文件');
    const script = path.resolve(__dirname, '../../scripts/curcial/merge_student_documents.py');
    const pythonArgs = JSON.stringify({
      student_folders: studentFolders,
      output_dir: outputDir,
      excel_file: excelPath
    });
    const options = {
      mode: 'text' as const,
      pythonOptions: ['-u'],
      pythonPath: pythonInterpreter,
      args: [pythonArgs],
      stderrParser: (line: string) => {
        console.error(`[Python] ${line}`);
        return line;
      },
      encoding: 'utf8' as BufferEncoding
    };
    
    console.log('开始调用Python脚本处理重点审议材料...');
    console.log('学生文件夹数量:', studentFolders.length);
    console.log('输出目录:', outputDir);
    
    const results = await PythonShell.run(script, options);
    console.log('Python脚本执行完成，输出:', results);
    
    // 检查输出目录是否存在以及是否有PDF文件
    if (!fs.existsSync(outputDir)) {
      console.error('输出目录不存在:', outputDir);
      return res.status(500).json({ message: 'PDF合并失败，输出目录不存在' });
    }
    
    const pdfFiles = fs.readdirSync(outputDir).filter(file => file.endsWith('.pdf'));
    console.log('生成的PDF文件数量:', pdfFiles.length);
    console.log('PDF文件列表:', pdfFiles);
    
    if (pdfFiles.length === 0) {
      console.error('没有生成任何PDF文件');
      return res.status(500).json({ message: 'PDF合并失败，没有生成PDF文件' });
    }
    
    // 5. 打包合并后的PDF为zip
    const archiver = require('archiver');
    const zipFileName = `crucial_result_${uuidv4()}.zip`;
    const zipFilePath = path.join(uploadDir, zipFileName);
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    archive.on('error', (err: any) => {
      console.error('打包ZIP文件失败:', err);
      throw err;
    });
    
    archive.pipe(output);
    archive.directory(outputDir, false);
    await archive.finalize();
    
    console.log('ZIP文件创建成功:', zipFileName);
    res.status(200).json({ 
      zipFileName,
      message: `成功处理 ${pdfFiles.length} 个学生的材料`,
      pdfCount: pdfFiles.length
    });
    
    setTimeout(() => {
      try { fs.rmSync(tempRoot, { recursive: true, force: true }); } catch {}
    }, 3600000);
  } catch (error: any) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

// 辅助函数：修复中文编码
function fixChineseEncoding(text: string): string {
  if (!text || !/[\x80-\xFF]/.test(text)) {
    return text; // 没有非ASCII字符，直接返回
  }
  
  // 首先尝试直接UTF-8解码（适用于Mac创建的ZIP）
  try {
    const utf8Buffer = Buffer.from(text, 'utf8');
    const utf8Str = utf8Buffer.toString('utf8');
    if (/[\u4e00-\u9fff]/.test(utf8Str) && !/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(utf8Str)) {
      console.log(`UTF-8直接解码成功: ${text} -> ${utf8Str}`);
      return utf8Str;
    }
  } catch (e) {
    // 忽略错误，继续尝试其他编码
  }
  
  // 尝试从latin1重新编码（适用于Windows创建的ZIP）
  const encodings = ['latin1', 'gbk', 'gb2312', 'big5', 'cp936'];
  
  for (const encoding of encodings) {
    try {
      let testStr: string;
      
      if (encoding === 'latin1') {
        // 先转换为latin1，再转换为UTF-8
        const buffer = Buffer.from(text, 'latin1' as BufferEncoding);
        testStr = buffer.toString('utf8');
      } else {
        // 尝试其他编码
        const buffer = Buffer.from(text, encoding as BufferEncoding);
        testStr = buffer.toString('utf8');
      }
      
      // 检查是否包含中文字符且没有乱码
      if (/[\u4e00-\u9fff]/.test(testStr) && !/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(testStr)) {
        console.log(`成功修复编码 (${encoding}): ${text} -> ${testStr}`);
        console.log(`修复后的字符码: ${testStr.split('').map(c => c.charCodeAt(0)).join(',')}`);
        return testStr;
      }
    } catch (e) {
      continue;
    }
  }
  
  // 尝试字节级修复（针对特定乱码模式）
  try {
    const bytes = [];
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      if (charCode > 127) {
        bytes.push(charCode);
      }
    }
    
    if (bytes.length > 0) {
      const buffer = Buffer.from(bytes);
      const testStr = buffer.toString('utf8');
      if (/[\u4e00-\u9fff]/.test(testStr)) {
        console.log(`字节级修复成功: ${text} -> ${testStr}`);
        return testStr;
      }
    }
  } catch (e) {
    // 忽略错误
  }
  
  console.warn(`无法修复编码: ${text}`);
  return text.replace(/[^\w\u4e00-\u9fff\s.-]/g, '_');
} 