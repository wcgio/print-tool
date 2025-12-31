# 图片批量处理小工具

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/print-tool)

一个纯前端的图片批量转 PDF 工具，支持批量将图片转换为 A4、A3、A5 等标准纸张大小的 PDF 文件。所有处理在浏览器本地完成，保护您的隐私。

## 功能特性

- **多种上传方式**
  - 拖拽图片或文件夹到上传区域
  - 点击按钮选择单个或多个图片文件
  - 点击按钮选择整个文件夹，自动提取其中所有图片

- **灵活的纸张设置**
  - 支持 A3、A4、A5 三种常用纸张规格
  - 支持纵向和横向方向切换
  - 图片四周自动添加 16 毫米白边

- **批量处理**
  - 支持同时上传多张图片
  - 所有图片合并到一个 PDF 文件中
  - 每个图片占一张纸

- **隐私保护**
  - 纯前端处理，图片不上传到服务器
  - 所有操作在浏览器中完成

## 在线使用

点击下方按钮一键部署到 Vercel：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/wcgio/print-tool)

## 本地开发

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看效果。

### 构建生产版本

```bash
npm run build
```

构建完成后，`out` 目录包含静态文件，可直接部署到任何静态托管服务。

## 技术栈

- **Next.js 15** - React 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **jsPDF** - PDF 生成库

## 部署到 Vercel

1. 将代码推送到 GitHub
2. 访问 [vercel.com](https://vercel.com)
3. 点击 "Add New Project"
4. 导入你的 GitHub 仓库
5. Vercel 会自动检测 Next.js 并完成部署

## 使用说明

1. （可选）先裁剪掉图片的无关内容
2. 上传图片：拖拽、选择文件或选择文件夹
3. 选择纸张大小和方向
4. 预览确认后点击"导出PDF"

## 纸张尺寸参考

| 规格 | 尺寸 (毫米) | 常见用途 |
|------|------------|----------|
| A3 | 297 × 420 | 海报、图表、两页 A4 并排 |
| A4 | 210 × 297 | 标准文档、打印纸 |
| A5 | 148 × 210 | 笔记本、小册子 |

## 开源协议

MIT License
