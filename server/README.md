# AppHUB 后端服务器

这是AppHUB应用的后端服务器，使用Node.js、Express和PostgreSQL构建。

## 功能

- RESTful API设计
- PostgreSQL数据库集成
- TypeORM实体关系映射
- TypeScript类型安全
- 支持待办事项和天气查询等功能

## 技术栈

- **Node.js**: JavaScript运行时环境
- **Express**: Web应用框架
- **PostgreSQL**: 关系型数据库
- **TypeORM**: 对象关系映射工具
- **TypeScript**: 类型安全的JavaScript超集
- **dotenv**: 环境变量管理

## 开发环境设置

### 前提条件

- Node.js 14.0.0或更高版本
- PostgreSQL数据库（本地或远程）

### 安装步骤

1. 安装依赖
   ```
   npm install
   ```

2. 配置环境变量
   创建一个`.env`文件，包含以下内容：
   ```
   PORT=5000
   NODE_ENV=development
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   POSTGRES_DB=apphub
   ```

3. 启动开发服务器
   ```
   npm run dev
   ```

## API端点

### 待办事项API

- `GET /api/todos` - 获取所有待办事项
- `POST /api/todos` - 创建新的待办事项
- `PUT /api/todos/:id` - 更新待办事项
- `DELETE /api/todos/:id` - 删除待办事项

### 天气API

- `GET /api/weather?city=城市名` - 获取指定城市的天气数据

## 构建生产版本

```
npm run build
```

## 部署

构建完成后，可以使用以下命令启动生产服务器：

```
npm start
```

## 项目结构

```
server/
├── src/                # 源代码
│   ├── config/         # 配置文件
│   ├── controllers/    # 控制器
│   ├── entities/       # 数据实体
│   ├── middleware/     # 中间件
│   ├── routes/         # 路由
│   └── index.ts        # 主入口文件
├── .env                # 环境变量
├── package.json        # 项目依赖
├── tsconfig.json       # TypeScript配置
└── README.md           # 项目说明
``` 