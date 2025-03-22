# AppHUB 服务器

## 服务器组件

AppHUB服务器由两个主要组件组成：

1. **API服务器** - 提供RESTful API接口（端口5000）
2. **WebSocket服务器** - 处理实时通信（端口3001）

## 启动说明

### 启动API服务器（端口5000）

```bash
# 在server目录下执行
npx ts-node src/index.ts
```

API服务器会在 http://localhost:5000 上运行，提供Todo、Weather和Excel等API接口。

### 启动WebSocket服务器（端口3001）

```bash
# 在server目录下执行
npx ts-node src/websocket.ts
```

WebSocket服务器会在 http://localhost:3001 上运行，处理会议调度器的实时通信功能。

## 跨设备访问

要允许其他设备访问这些服务，您需要：

1. 确保两个服务器都已启动
2. 确保您的防火墙允许端口5000和3001的访问
3. 使用您的本机IP地址（而不是localhost）来访问服务

例如，如果您的IP地址是192.168.1.99：
- API服务器：http://192.168.1.99:5000
- WebSocket服务器：http://192.168.1.99:3001
- 客户端应用：http://192.168.1.99:3000

## 注意事项

1. 必须同时运行两个服务器才能使应用正常工作
2. 如果遇到"端口已被占用"错误，请使用以下命令查找并终止占用端口的进程：
   ```
   netstat -ano | findstr :<端口号>
   taskkill /F /PID <进程ID>
   ```

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