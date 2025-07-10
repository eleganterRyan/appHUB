import express from 'express';
import multer from 'multer';
import { processFullTimeWorkflow, downloadDegreeWorkflowFile, processCrucialWorkflow } from '../controllers/degreeWorkflowController';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// 校内博导（全职博导）数据处理
router.post('/fulltime', upload.single('file'), processFullTimeWorkflow);

// 下载处理结果
router.get('/download', downloadDegreeWorkflowFile);

// 新增对比接口，支持多文件上传
router.post('/compare', upload.fields([
  { name: 'currentFile', maxCount: 1 },
  { name: 'lastYearFile', maxCount: 1 }
]), require('../controllers/degreeWorkflowController').compareFullTimeWorkflow);

// 兼职博导对比接口
router.post('/compare-parttime', upload.fields([
  { name: 'currentFile', maxCount: 1 },
  { name: 'lastYearFile', maxCount: 1 }
]), require('../controllers/degreeWorkflowController').comparePartTimeWorkflow);

// 全职硕导（全职硕导）数据处理
router.post('/fulltime-master', upload.single('file'), require('../controllers/degreeWorkflowController').processFullTimeMasterWorkflow);

// 重点审议流程
router.post('/crucial', upload.fields([
  { name: 'zip', maxCount: 1 },
  { name: 'excel', maxCount: 1 }
]), processCrucialWorkflow);

export default router; 