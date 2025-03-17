import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PythonShell, PythonShellError } from 'python-shell';
import multer from 'multer';
import * as XLSX from 'xlsx';
import archiver from 'archiver';

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

interface RequestWithFile extends Request {
  file: Express.Multer.File;
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

// 预览Excel文件列
export const previewExcelColumns = async (req: RequestWithFile, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '没有上传文件' });
    }

    const file = req.file;
    console.log(`预览Excel列名: ${file.originalname}`);
    
    // 使用xlsx库读取Excel文件
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    
    // 获取第一个工作表
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // 使用header=1方式读取，确保获取所有列名
    const headerData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
    
    let columns: string[] = [];
    
    if (headerData.length > 0) {
      // 从第一行获取列名
      columns = headerData[0].map(h => h ? h.toString() : '');
      console.log('使用header=1方式提取的列名:', columns);
    } else {
      // 如果没有列名，使用默认列名
      columns = Array.from({ length: 10 }, (_, i) => String.fromCharCode(65 + i)); // A-J
      console.log('使用默认列名 A-J');
    }
    
    // 返回列名
    console.log('返回给前端的列名:', columns);
    res.status(200).json({
      columns: columns
    });
  } catch (error) {
    console.error('预览Excel列失败:', error);
    res.status(500).json({ message: '服务器错误，无法预览Excel列' });
  }
};

// 拆分Excel文件
export const splitExcelFile = async (req: RequestWithFile, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '没有上传文件' });
    }

    const file = req.file;
    const columnIndex = parseInt(req.body.columnIndex || '0');
    
    console.log('接收到的columnIndex参数:', columnIndex);
    
    // 使用xlsx库读取Excel文件
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    
    // 获取第一个工作表
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // 先读取表头
    const headerData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
    if (headerData.length === 0) {
      return res.status(400).json({ message: 'Excel文件没有数据' });
    }
    
    const headers = headerData[0].map(h => h ? h.toString() : '');
    console.log('表头列名:', headers);
    
    // 确保列索引有效
    if (columnIndex < 0 || columnIndex >= headers.length) {
      return res.status(400).json({ 
        message: `列索引无效: ${columnIndex}，有效范围: 0-${headers.length - 1}` 
      });
    }
    
    const columnName = headers[columnIndex];
    console.log(`将根据列 "${columnName}" (索引: ${columnIndex}) 拆分数据`);
    
    // 读取所有数据（包括表头）
    const allData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { 
      header: headers,
      defval: '' // 设置空单元格的默认值
    });
    
    // 移除第一行（表头）
    const jsonData = allData.slice(1);
    
    if (jsonData.length === 0) {
      return res.status(400).json({ message: 'Excel文件没有数据行' });
    }
    
    // 按列值分组数据
    const groupedData: { [key: string]: any[] } = {};
    
    // 用于跟踪已使用的文件名，避免重复
    const usedFileNames = new Set<string>();
    
    jsonData.forEach(row => {
      const value = row[columnName];
      // 更好地处理空值和非字符串值
      const key = value !== null && value !== undefined ? value.toString().trim() : '空值';
      
      if (!groupedData[key]) {
        groupedData[key] = [];
      }
      
      groupedData[key].push(row);
    });
    
    // 检查分组数量
    const groupCount = Object.keys(groupedData).length;
    if (groupCount === 0) {
      return res.status(400).json({ message: '无法根据选定列拆分数据' });
    }
    
    if (groupCount > 100) {
      return res.status(400).json({ 
        message: `拆分后的文件数量过多 (${groupCount})，请选择另一列进行拆分` 
      });
    }
    
    // 为每个分组创建新的Excel文件
    const outputFileNames: string[] = [];
    const originalFileName = file.originalname.replace(/\.[^/.]+$/, ""); // 移除扩展名
    
    // 打印第一个分组的数据结构以便调试
    const firstGroupKey = Object.keys(groupedData)[0];
    if (firstGroupKey && groupedData[firstGroupKey].length > 0) {
      console.log(`第一个分组 "${firstGroupKey}" 的第一行数据:`, JSON.stringify(groupedData[firstGroupKey][0], null, 2));
    }
    
    for (const [key, rows] of Object.entries(groupedData)) {
      // 创建一个安全的文件名
      // 更严格地处理文件名，确保符合Excel文件命名规范
      let safeKey = key
        .replace(/[\\/:*?"<>|]/g, '_') // 替换Windows文件系统不允许的字符
        .replace(/[\x00-\x1F\x7F]/g, '_') // 替换控制字符
        .replace(/^[0-9]/, 'col_$&') // 如果以数字开头，添加前缀
        .replace(/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, 'file_$&') // 替换Windows保留文件名
        .replace(/\s+/g, '_') // 将空格替换为下划线
        .trim();
      
      // 限制长度，避免文件名过长
      safeKey = safeKey.substring(0, 30);
      
      // 如果处理后为空，使用默认名称
      if (!safeKey || safeKey === '_' || safeKey === '') {
        safeKey = '未命名';
      }
      
      // 确保文件名唯一
      let uniqueSafeKey = safeKey;
      let counter = 1;
      while (usedFileNames.has(uniqueSafeKey)) {
        uniqueSafeKey = `${safeKey}_${counter}`;
        counter++;
      }
      usedFileNames.add(uniqueSafeKey);
      
      const outputFileName = `split_${uniqueSafeKey}_${uuidv4().substring(0, 8)}.xlsx`;
      const outputFilePath = path.join(uploadDir, outputFileName);
      
      // 创建新的工作簿和工作表
      const newWorkbook = XLSX.utils.book_new();
      
      // 不再添加额外的表头行，直接使用原始数据
      // 使用原始列名创建工作表
      const newWorksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
      
      console.log(`分组 "${key}" 的行数: ${rows.length}`);
      
      // 将工作表添加到工作簿
      XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Sheet1');
      
      // 写入文件
      XLSX.writeFile(newWorkbook, outputFilePath);
      
      outputFileNames.push(outputFileName);
      console.log(`创建拆分文件: ${outputFileName}`);
    }
    
    // 创建ZIP文件
    const zipFileName = `${originalFileName}_split_${uuidv4().substring(0, 8)}.zip`;
    const zipFilePath = path.join(uploadDir, zipFileName);
    
    // 创建一个文件流来写入ZIP文件
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // 设置压缩级别
    });
    
    // 监听所有存档数据都已被写入
    output.on('close', function() {
      console.log(`ZIP文件创建成功: ${zipFilePath}, 大小: ${archive.pointer()} 字节`);
      
      // 返回成功响应
      res.status(200).json({
        message: `文件拆分成功，共 ${outputFileNames.length} 个文件`,
        fileCount: outputFileNames.length,
        fileNames: outputFileNames,
        zipFileName: zipFileName
      });
    });
    
    // 监听警告
    archive.on('warning', function(err: archiver.ArchiverError) {
      if (err.code === 'ENOENT') {
        console.warn('ZIP警告:', err);
      } else {
        console.error('ZIP错误:', err);
        throw err;
      }
    });
    
    // 监听错误
    archive.on('error', function(err: Error) {
      console.error('创建ZIP文件失败:', err);
      throw err;
    });
    
    // 将输出流管道连接到归档对象
    archive.pipe(output);
    
    // 将所有拆分的Excel文件添加到ZIP文件中
    for (const fileName of outputFileNames) {
      const filePath = path.join(uploadDir, fileName);
      
      // 从文件名中提取有意义的部分作为ZIP中的条目名
      // 移除split_前缀和UUID部分，保留中间的有意义部分
      let zipEntryName = fileName.replace(/^split_/, '');
      
      // 保留原始扩展名
      const extension = path.extname(zipEntryName);
      const nameWithoutExt = zipEntryName.slice(0, -extension.length);
      
      // 移除UUID部分
      const cleanName = nameWithoutExt.replace(/_[0-9a-f]{8}$/, '');
      
      // 重新组合文件名
      zipEntryName = cleanName + extension;
      
      // 确保ZIP中的条目名称是唯一的
      let counter = 1;
      let uniqueZipEntryName = zipEntryName;
      while (outputFileNames.some(f => 
        f !== fileName && 
        f.replace(/^split_/, '').replace(/_[0-9a-f]{8}\.xlsx$/, '.xlsx') === uniqueZipEntryName
      )) {
        const extIndex = zipEntryName.lastIndexOf('.');
        if (extIndex === -1) {
          uniqueZipEntryName = `${zipEntryName}_${counter}`;
        } else {
          uniqueZipEntryName = `${zipEntryName.substring(0, extIndex)}_${counter}${zipEntryName.substring(extIndex)}`;
        }
        counter++;
      }
      
      archive.file(filePath, { name: uniqueZipEntryName });
    }
    
    // 完成归档
    await archive.finalize();
    
  } catch (error) {
    console.error('拆分Excel文件失败:', error);
    res.status(500).json({ message: '服务器错误，无法拆分文件' });
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
    const contentType = fileName.endsWith('.zip') 
      ? 'application/zip' 
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.setHeader('Content-Type', contentType);
    
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