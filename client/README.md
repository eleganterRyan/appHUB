# AppHUB - 应用中心

AppHUB是一个集成多种实用小工具的Web应用平台。用户可以在一个统一的界面中访问和使用各种实用工具。

## 功能特点

- 现代化的用户界面，基于Next.js和Tailwind CSS构建
- 响应式设计，适配各种设备屏幕
- 多种实用小工具集成在一个平台

## 当前包含的应用

1. **待办事项** - 简单的任务管理工具
2. **计算器** - 基础计算功能
3. **天气查询** - 查看全球各地天气情况（模拟数据）

## 技术栈

- **前端框架**: Next.js 14
- **UI库**: Tailwind CSS
- **编程语言**: TypeScript
- **状态管理**: React Hooks

## 开发环境设置

### 前提条件

- Node.js 18.0.0或更高版本
- npm 9.0.0或更高版本

### 安装步骤

1. 克隆仓库
   ```
   git clone https://github.com/yourusername/apphub.git
   cd apphub
   ```

2. 安装依赖
   ```
   npm install
   ```

3. 启动开发服务器
   ```
   npm run dev
   ```

4. 在浏览器中访问 `http://localhost:3000`

## 构建生产版本

```
npm run build
```

## 部署

构建完成后，可以使用以下命令启动生产服务器：

```
npm run start
```

## 项目结构

```
apphub/
├── public/           # 静态资源
├── src/              # 源代码
│   ├── app/          # 应用路由和页面
│   │   ├── apps/     # 各个小应用
│   │   │   ├── calculator/  # 计算器应用
│   │   │   ├── todo/        # 待办事项应用
│   │   │   └── weather/     # 天气应用
│   ├── components/   # 可复用组件
│   ├── lib/          # 工具函数和库
│   └── styles/       # 全局样式
├── .gitignore        # Git忽略文件
├── next.config.js    # Next.js配置
├── package.json      # 项目依赖
├── postcss.config.js # PostCSS配置
├── tailwind.config.js # Tailwind CSS配置
└── tsconfig.json     # TypeScript配置
```

## 未来计划

- 添加更多实用工具
- 实现用户认证系统
- 添加数据持久化功能
- 支持自定义主题

## 贡献指南

欢迎贡献代码、报告问题或提出新功能建议。请遵循以下步骤：

1. Fork仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

## 许可证

MIT 