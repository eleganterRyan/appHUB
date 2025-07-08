import express from 'express';
import multer from 'multer';
import { processFullTimeWorkflow, downloadDegreeWorkflowFile } from '../controllers/degreeWorkflowController';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// 校内博导（全职博导）数据处理
router.post('/fulltime', upload.single('file'), processFullTimeWorkflow);

// 下载处理结果
router.get('/download', downloadDegreeWorkflowFile);

export default router; 