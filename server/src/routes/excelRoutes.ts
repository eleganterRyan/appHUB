import express from 'express';
import multer, { FileFilterCallback } from 'multer';
import { mergeExcelFiles, downloadMergedFile, splitExcelFile, previewExcelColumns } from '../controllers/excelController';
import { Request, Response, NextFunction } from 'express';

const router = express.Router();

// 配置multer用于处理文件上传
const storage = multer.memoryStorage(); // 使用内存存储，不写入磁盘
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 限制文件大小为100MB
    files: 100 // 最多处理100个文件
  },
  fileFilter: (req: Request, file: Express.Multer.File, callback: FileFilterCallback) => {
    // 只接受Excel文件
    if (
      file.mimetype === 'application/vnd.ms-excel' || 
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.originalname.endsWith('.xlsx') ||
      file.originalname.endsWith('.xls')
    ) {
      callback(null, true);
    } else {
      callback(new Error('只接受Excel文件'));
    }
  }
});

// 错误处理中间件
const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    // Multer错误
    console.error('Multer错误:', err);
    return res.status(400).json({ 
      message: `文件上传错误: ${err.message}`,
      code: err.code
    });
  } else if (err) {
    // 其他错误
    console.error('文件上传错误:', err);
    return res.status(500).json({ message: `文件上传错误: ${err.message}` });
  }
  next();
};

// 合并Excel文件
router.post('/merge', (req: Request, res: Response, next: NextFunction) => {
  console.log('收到合并Excel文件请求');
  console.log('Content-Type:', req.headers['content-type']);
  
  upload.array('files')(req, res, (err) => {
    if (err) {
      console.error('文件上传错误:', err);
      return res.status(400).json({ message: `文件上传错误: ${err.message}` });
    }
    
    console.log('文件上传成功，文件数量:', (req.files as Express.Multer.File[])?.length || 0);
    
    // 继续处理
    mergeExcelFiles(req as any, res);
  });
});

// 拆分Excel文件
router.post('/split', (req: Request, res: Response, next: NextFunction) => {
  console.log('收到拆分Excel文件请求');
  console.log('Content-Type:', req.headers['content-type']);
  
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('文件上传错误:', err);
      return res.status(400).json({ message: `文件上传错误: ${err.message}` });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: '没有上传文件' });
    }
    
    console.log('文件上传成功:', req.file.originalname);
    
    // 继续处理
    splitExcelFile(req as any, res);
  });
});

// 预览Excel文件列
router.post('/preview-columns', (req: Request, res: Response, next: NextFunction) => {
  console.log('收到预览Excel列请求');
  
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('文件上传错误:', err);
      return res.status(400).json({ message: `文件上传错误: ${err.message}` });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: '没有上传文件' });
    }
    
    console.log('文件上传成功:', req.file.originalname);
    
    // 继续处理
    previewExcelColumns(req as any, res);
  });
});

// 下载合并或拆分后的文件
router.get('/download/:fileName', downloadMergedFile);

export default router;