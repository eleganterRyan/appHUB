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
│   ├── uploads/      # 上传的文件（临时存储）
│   ├── temp/         # 临时文件
│   └── ...           # 其他配置文件
│
└── package.json      # 根项目配置
```

## 功能特点

- 现代化的用户界面，基于Next.js和Tailwind CSS构建
- 响应式设计，适配各种设备屏幕
- RESTful API后端，使用Express和PostgreSQL
- 多种实用小工具集成在一个平台
- 支持局域网内多设备访问
- 集成大语言模型(LLM)支持，基于Dify平台

## 当前包含的应用

1. **待办事项** - 简单的任务管理工具
2. **计算器** - 基础计算功能
3. **天气查询** - 查看全球各地天气情况
4. **Excel处理工具** - 合并或拆分Excel文件，支持xls转xlsx
5. **会议调度器** - 管理会议和与会者
6. **考试监考系统** - 辅助监考管理
7. **人类玩具** - 基于Dify平台部署的AI大语言模型，支持智能对话和创意生成

## AI集成

AppHUB平台集成了强大的AI功能：

1. **主页AI助手** - 在主页嵌入了基于Dify开发的AI大模型，用户可直接与AI进行对话
2. **人类玩具应用** - 专门定制的AI应用，基于Dify平台部署，提供更丰富的交互体验
3. **智能推荐** - 基于用户行为提供个性化工具推荐

Dify是一个强大的LLM应用开发平台，通过其API和嵌入功能，AppHUB可以轻松构建AI增强型应用。

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
- **Socket.IO**: 用于实时通信

### AI和集成
- **Dify**: AI应用开发平台
- **大语言模型API**: 支持多种AI模型集成
- **嵌入式iframe**: 用于集成第三方应用

## 开发环境设置

### 前提条件

- Node.js 14.0.0或更高版本
- PostgreSQL数据库
- Python 3.8或更高版本
- Dify平台账号（用于AI功能）

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
   在`server/.env`文件中设置数据库连接信息和其他配置：
   ```
   PORT=5001
   NODE_ENV=development
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   POSTGRES_DB=apphub
   ```

5. 配置AI集成（可选）
   如需使用AI功能，请在Dify平台创建应用并获取API密钥，然后添加到环境变量中。

6. 启动开发服务器
   ```
   npm run dev
   ```

7. 在浏览器中访问
   - 前端: `http://localhost:3000`
   - 后端API: `http://localhost:5001`
   - WebSocket服务: `http://localhost:3001`

## 局域网内访问

要让局域网内其他设备访问AppHUB，请按以下步骤操作：

1. 确保所有服务器正常运行
2. 找出运行服务器电脑的IP地址
   - Windows: 打开命令提示符，输入`ipconfig`
   - Mac/Linux: 打开终端，输入`ifconfig`或`ip addr`
3. 确保防火墙允许端口3000、5001和3001的访问
4. 在其他设备上使用服务器电脑的IP地址访问：
   - 前端界面: `http://<服务器IP>:3000`
   - 直接API访问: `http://<服务器IP>:5001`

注意：如果使用Excel处理工具或其他需要后端服务的功能，务必确保后端服务器已启动。

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