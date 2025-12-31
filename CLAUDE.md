# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个图片转 PDF 的静态网站工具，允许用户上传图片并将其转换为指定纸张尺寸（A3/A4/A5）的 PDF 文件。

## 技术栈

- **Next.js 15** - React 框架，使用 App Router
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式
- **jsPDF** - PDF 生成库

## 开发命令

```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint
```

## 项目结构

```
app/
├── layout.tsx       # 根布局，设置元数据和全局样式
├── page.tsx         # 主页面，包含所有核心功能
└── globals.css      # 全局样式（Tailwind 指令）
```

## 核心功能实现位置

所有功能都在 `app/page.tsx` 中实现：

- **图片上传**：支持拖拽和点击上传，多图选择
- **纸张设置**：A3/A4/A5 选择，纵向/横向切换
- **图片处理**：自动适应纸张，四周添加 16mm 白边
- **PDF 导出**：使用 jsPDF 将所有图片合并到一个 PDF

## 纸张尺寸配置

```typescript
const PAPER_SIZES = {
  A3: { width: 297, height: 420 },  // 毫米
  A4: { width: 210, height: 297 },  // 毫米
  A5: { width: 148, height: 210 },  // 毫米
};
const WHITE_BORDER_MM = 16;  // 白边宽度
```

## 部署

项目使用标准 Next.js 部署，可直接部署到 Vercel：

1. 在 Vercel 中导入此仓库
2. Vercel 会自动检测 Next.js 并部署
3. 推送到 main 分支会自动触发重新部署
