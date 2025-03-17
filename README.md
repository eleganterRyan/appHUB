# AppHUB - 一站式应用中心

AppHUB是一个集成多种实用小工具的Web应用平台。用户可以在一个统一的界面中访问和使用各种实用工具。

## 项目结构

项目采用前后端分离的架构：

```
apphub/
├── client/           # 前端代码 (Next.js)
│   ├── src/          # 源代码
│   │   ├── app/      # 应用路由和页面
│   │   ├── components/ # 可复用组件
│   │   ├── styles/   # 样式文件
│   │   └── lib/      # 工具函数
│   ├── public/       # 静态资源
│   └── ...           # 其他配置文件
│
├── server/           # 后端代码 (Node.js/Express)
│   ├── src/          # 源代码
│   │   ├── config/   # 配置文件
│   │   ├── controllers/ # 控制器
│   │   ├── entities/ # 数据实体
│   │   ├── middleware/ # 中间件
│   │   ├── routes/   # 路由
│   │   └── index.ts  # 主入口文件
│   ├── scripts/      # Python脚本
│   └── ...           # 其他配置文件
│
└── package.json      # 根项目配置
```

## 功能特点

- 现代化的用户界面，基于Next.js和Tailwind CSS构建
- 响应式设计，适配各种设备屏幕
- RESTful API后端，使用Express和PostgreSQL
- 多种实用小工具集成在一个平台

## 当前包含的应用

1. **待办事项** - 简单的任务管理工具
2. **计算器** - 基础计算功能
3. **天气查询** - 查看全球各地天气情况
4. **Excel处理工具** - 合并或拆分Excel文件，支持xls转xlsx

## 技术栈

### 前端
- **Next.js**: React框架
- **React**: UI库
- **TypeScript**: 类型安全
- **Tailwind CSS**: 样式框架

### 后端
- **Node.js**: JavaScript运行时
- **Express**: Web框架
- **TypeORM**: ORM工具
- **PostgreSQL**: 关系型数据库
- **Python**: 用于处理Excel文件
- **Pandas**: Python数据分析库，用于Excel处理

## 开发环境设置

### 前提条件

- Node.js 14.0.0或更高版本
- PostgreSQL数据库
- Python 3.8或更高版本

### 安装步骤

1. 克隆仓库
   ```
   git clone https://github.com/yourusername/apphub.git
   cd apphub
   ```

2. 安装所有依赖
   ```
   npm run install:all
   ```

3. 安装Python依赖
   ```
   pip install -r server/scripts/requirements.txt
   ```

4. 配置后端环境变量
   在`server/.env`文件中设置数据库连接信息

5. 启动开发服务器
   ```
   npm run dev
   ```

6. 在浏览器中访问
   - 前端: `http://localhost:3000`
   - 后端: `http://localhost:5000`

## 构建生产版本

```
npm run build
```

## 部署

构建完成后，可以使用以下命令启动生产服务器：

```
npm start
```

## 许可证

MIT 