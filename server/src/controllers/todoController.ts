import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Todo } from '../entities/Todo';

const todoRepository = AppDataSource.getRepository(Todo);

// 获取所有待办事项
export const getTodos = async (req: Request, res: Response) => {
  try {
    const todos = await todoRepository.find({
      order: {
        createdAt: 'DESC'
      }
    });
    res.status(200).json(todos);
  } catch (error) {
    console.error('获取待办事项失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 创建新的待办事项
export const createTodo = async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: '请提供待办事项内容' });
    }

    const todo = new Todo();
    todo.text = text;
    todo.completed = false;

    const newTodo = await todoRepository.save(todo);
    res.status(201).json(newTodo);
  } catch (error) {
    console.error('创建待办事项失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 更新待办事项
export const updateTodo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { text, completed } = req.body;

    const todo = await todoRepository.findOneBy({ id: parseInt(id) });

    if (!todo) {
      return res.status(404).json({ message: '未找到该待办事项' });
    }

    if (text !== undefined) {
      todo.text = text;
    }
    
    if (completed !== undefined) {
      todo.completed = completed;
    }

    const updatedTodo = await todoRepository.save(todo);
    res.status(200).json(updatedTodo);
  } catch (error) {
    console.error('更新待办事项失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 删除待办事项
export const deleteTodo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const todo = await todoRepository.findOneBy({ id: parseInt(id) });

    if (!todo) {
      return res.status(404).json({ message: '未找到该待办事项' });
    }

    await todoRepository.remove(todo);
    res.status(200).json({ message: '待办事项已删除' });
  } catch (error) {
    console.error('删除待办事项失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
}; 