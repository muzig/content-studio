# Roadmap 文档站点 — 设计 Spec

- **日期**：2026-06-21
- **目的**：在项目内新增一个独立文档站点，给具备后端能力但不熟悉前端/部分工程化技术的开发者讲解本项目用到的所有技术栈

## 1. 目标与非目标

### 目标

- 提供一个本地可访问的 HTML 文档站点，覆盖本项目使用的全部主要技术
- 每项技术以「是什么 / 在项目哪里用 / 核心概念 / 示例代码 / 下一步」五段式讲解
- 结构支持后续无限扩展新知识点，零构建、零脚本成本
- 不污染主应用侧边栏（独立 URL 访问）

### 非目标（YAGNI）

- 不集成搜索 / 全文检索
- 不做主题切换按钮（跟系统 `prefers-color-scheme` 即可）
- 不做阅读进度 / 收藏 / 笔记 / 评论
- 不做构建脚本（纯静态 HTML + CSS）
- 不部署到线上（仅本地 `pnpm roadmap` 启动）
- 不做版本管理 / changelog
- 不做自动化测试（手动验证清单即可）

## 2. 目录结构

```
docs/roadmap/
├── index.html              # 路线图总览：技术卡片网格 + 状态徽章
├── topics/
│   ├── 00-template.html    # 新 topic 复制用的空白模板
│   ├── 01-nextjs.html      # Next.js 16 App Router（本项目骨架）
│   ├── 02-react.html       # React 19 基础（组件、JSX、Hook）
│   ├── 03-typescript.html  # TS 在 Next.js 里的用法
│   ├── 04-tailwind.html    # Tailwind CSS v4（重大变更）
│   ├── 05-shadcn.html      # shadcn/ui 组件体系
│   ├── 06-prisma.html      # Prisma 7 + better-sqlite3（本项目数据层）
│   ├── 07-anthropic.html   # Anthropic SDK（AI 调用方式）
│   └── 08-engineering.html # 工程化：pnpm、ESLint、tsx
└── assets/
    └── style.css           # 全局样式（深浅色、卡片、徽章、代码块）
```

**总文件数**：11 个（8 个 topic + 1 个 template + 1 个 index + 1 个 css）

## 3. 页面设计

### 3.1 index.html（路线图总览）

- 顶部：标题「Content Studio 技术路线图」+ 一句话简介
- 主体：响应式卡片网格（`grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`），每张卡片含：
  - 序号 + emoji
  - 技术名
  - 一句话定义（TL;DR）
  - 状态徽章：🟢 已知 / 🟡 重点学 / ⚪ 待学
  - 跳转链接（`topics/01-nextjs.html` 等）
- 底部：图例（颜色含义）+ 「如何扩展」说明

**初始状态分档**：

| 状态 | 技术 | 理由 |
|---|---|---|
| 🟢 已知 | Prisma、Node/npm/pnpm、SQL/SQLite、Anthropic SDK | 后端基础 |
| 🟡 重点学 | Next.js App Router、React、TypeScript、Tailwind v4、shadcn/ui | 前端栈 + 新版本 |
| ⚪ 待学 | （预留 1-2 张占位卡片，写"未来补充"） | 后续扩展位 |

### 3.2 每个 topic.html 统一五段式结构

```
┌─────────────────────────────────────────┐
│  📍 {emoji} {技术名}                     │
│  ───────────────────────────────────     │
│  ## 是什么                                │
│  一句话定义 + 一段通俗解释                   │
│                                          │
│  ## 为什么这个项目要用它                    │
│  角色 + 项目里的实际位置（文件路径）          │
│                                          │
│  ## 核心概念（3-5 个，带代码片段）            │
│  - 概念 1：解释 + 项目真实代码片段            │
│  - 概念 2：...                            │
│  - ...                                   │
│                                          │
│  ## 最小可运行示例                          │
│  可独立运行的最小代码演示                    │
│                                          │
│  ## 下一步学什么                            │
│  关联 topic 链接 + 推荐外部资源              │
│                                          │
│  [🔙 返回路线图]                            │
└─────────────────────────────────────────┘
```

### 3.3 内容来源约定

- **代码片段必须从本项目 `src/` 真实复制**，不杜撰
- 引用项目文件路径时使用相对路径（`src/app/page.tsx`），便于点击跳转 IDE
- 中文标点 + 中英文/数字之间加空格

## 4. 样式规范

### 4.1 assets/style.css 要求

- 单文件、无外部依赖、无构建步骤
- 使用 CSS 变量适配深浅色（`@media (prefers-color-scheme: dark)`）
- CSS 变量命名复用项目主应用的 Tailwind 主题变量名（`--background`、`--foreground`、`--primary`、`--card`、`--border`、`--muted-foreground`），保证视觉一致
- 字体栈：`system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif`
- 工具类：`.container`、`.card`、`.badge`、`.badge-green`、`.badge-yellow`、`.badge-gray`、`.code-block`、`.grid`
- 代码块三档语法高亮：关键字（`--primary`）/ 字符串（`--muted-foreground`）/ 注释（`--muted-foreground` + italic），不引第三方高亮库

### 4.2 响应式

- 桌面（≥768px）：卡片网格多列
- 移动端（<768px）：卡片单列、字号略大、padding 收紧
- 最大宽度 `max-width: 1100px` 居中

## 5. 扩展机制

**新增一个 topic 的标准流程**（人工，零脚本）：

1. 复制 `topics/00-template.html` → 重命名为 `09-xxx.html`
2. 按五段式填充内容
3. 在 `index.html` 卡片网格追加一张 `<a class="card">`，设置状态徽章

**预期扩展成本**：~10 分钟 / topic。规模再大时可考虑脚本生成，但当前 YAGNI。

## 6. 依赖与启动

### 6.1 新增依赖

在 `devDependencies` 中新增：

```json
"serve": "^14.2.4"
```

**选型理由**：与 JS 技术栈一致、单文件命令、零配置、~1MB。

### 6.2 package.json 脚本变更

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "db:seed": "tsx prisma/seed.ts",
  "roadmap": "serve docs/roadmap -l 3001"
}
```

### 6.3 启动方式

```bash
pnpm install      # 首次安装 serve
pnpm roadmap      # 启动 → http://localhost:3001
```

## 7. 验证策略

### 7.1 手动验证清单（实施完成后逐项打勾）

- [ ] `pnpm install` 无错误
- [ ] `pnpm roadmap` 启动，浏览器访问 `http://localhost:3001`
- [ ] index.html 渲染所有卡片，深/浅色切换正常
- [ ] 8 个 topic 页均能从卡片点入，代码块不溢出
- [ ] 浏览器后退按钮能正确返回 index
- [ ] 移动端宽度（375px）下卡片单列、文本可读
- [ ] DevTools Console 无错误、无 404 资源
- [ ] 每个 topic 至少 1 段真实代码（来自 `src/`）
- [ ] 所有外链使用 `target="_blank" rel="noopener noreferrer"`

### 7.2 错误处理

- **端口占用**：依赖 `serve` 自带错误提示，不额外处理
- **链接断裂**：靠手动验证清单兜底，规模小不做自动化
- **浏览器兼容**：目标 Chrome / Safari / Firefox 最近 2 版，不兼容 IE

## 8. 范围确认

**本次实施改动**：

- 新增：`docs/roadmap/` 全部 11 个文件
- 修改：`package.json`（加 1 个 dep + 1 个 script）

**后续修改**：仅当新增 topic 时追加 `docs/roadmap/topics/*.html` + 改 `docs/roadmap/index.html`，不涉及任何代码改动。

## 9. 实施顺序（高层）

1. 创建目录骨架 + style.css
2. 写 index.html + 00-template.html（先确立模式）
3. 按编号顺序写 8 个 topic.html（每完成 1 个核对一次）
4. 改 package.json
5. `pnpm install` + `pnpm roadmap`
6. 跑手动验证清单
7. git commit