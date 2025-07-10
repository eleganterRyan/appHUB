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
    // 2. 解压zip
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(tempRoot, true);
    // 3. 获取所有一级子目录（学生文件夹）
    const studentFolders = fs.readdirSync(tempRoot, { withFileTypes: true })
      .filter(d => d.isDirectory() && d.name !== '__MACOSX')
      .map(d => path.join(tempRoot, d.name));
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
    };
    await PythonShell.run(script, options);
    // 5. 打包合并后的PDF为zip
    const archiver = require('archiver');
    const zipFileName = `crucial_result_${uuidv4()}.zip`;
    const zipFilePath = path.join(uploadDir, zipFileName);
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(output);
    archive.directory(outputDir, false);
    await archive.finalize();
    res.status(200).json({ zipFileName });
    setTimeout(() => {
      try { fs.rmSync(tempRoot, { recursive: true, force: true }); } catch {}
    }, 3600000);
  } catch (error: any) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
}; 