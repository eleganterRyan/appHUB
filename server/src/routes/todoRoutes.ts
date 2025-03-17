import express from 'express';
import { getTodos, createTodo, updateTodo, deleteTodo } from '../controllers/todoController';

const router = express.Router();

// 获取所有待办事项
router.get('/', getTodos);

// 创建新的待办事项
router.post('/', createTodo);

// 更新待办事项
router.put('/:id', updateTodo);

// 删除待办事项
router.delete('/:id', deleteTodo);

export default router; 