import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PythonShell } from 'python-shell';

const uploadDir = path.join(__dirname, '../../uploads');
const tempDir = path.join(__dirname, '../../temp');
const pythonInterpreter = path.resolve(__dirname, '../../venv/bin/python');
const scriptPath = path.resolve(__dirname, '../../scripts/scripts_for_degree/fullTime/main.py');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

export const processFullTimeWorkflow = async (req: Request, res: Response) => {
  try {
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
    PythonShell.run(scriptPath, options)
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
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return res.status(400).json({ message: '无效的文件名' });
  }
  const filePath = path.join(uploadDir, fileName);
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: '文件不存在' });
  res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
  setTimeout(() => {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {}
  }, 3600000);
}; 