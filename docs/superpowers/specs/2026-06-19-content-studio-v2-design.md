# Content Studio V2 — 热点驱动内容创作平台

## 概述

Content Studio 从"每日笔记 + 模板格式化"工具升级为**热点驱动的内容创作与发布管理平台**。核心流程：热点收集 → 个人评论 → AI 生成多平台内容 → 日历排期发布。

## 核心需求

1. **热点收集** — 知道有哪些热点信息（MVP: 手动输入，预留 RSS/API 扩展）
2. **评论与二次处理** — 用户提供评论，AI 自适应介入（输入多则润色，输入少则展开）
3. **平台定制输出** — 每个平台独立的风格、结构、格式规则（预设 + 可调整）
4. **日历排期** — 拖拽式日历管理发布计划
5. **频率分析** — 各平台发布统计、热力图、趋势分析

## 架构方案

采用**流水线架构**，数据流：

```
HotTopic → ContentEntry → PlatformContent → ScheduledPost
```

每一步产出下一步的输入，线性流程为主，架构支持后续扩展非线性模式。

---

## 数据模型

### HotTopic（热点）

```prisma
model HotTopic {
  id         String   @id @default(cuid())
  title      String
  source     String   @default("manual")  // manual / rss / api
  content    String   @default("")
  url        String?
  tags       String?  // JSON array
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  entries    ContentEntry[]
}
```

### ContentEntry（内容条目 — 扩展现有模型）

```prisma
model ContentEntry {
  id            String             @id @default(cuid())
  hot_topic_id  String?
  hot_topic     HotTopic?          @relation(fields: [hot_topic_id], references: [id])
  daily_note_id String?            // 保留兼容旧模型
  daily_note    DailyNote?         @relation(fields: [daily_note_id], references: [id])
  sequence      Int                @default(0)
  title         String?
  body          String             @default("")  // 用户评论/想法
  created_at    DateTime           @default(now())
  updated_at    DateTime           @updatedAt
  platforms     PlatformContent[]

  @@index([daily_note_id])
}
```

### PlatformContent（平台内容 — 替代 PlatformPublish）

```prisma
model PlatformContent {
  id                   String        @id @default(cuid())
  content_entry_id     String
  content_entry        ContentEntry  @relation(fields: [content_entry_id], references: [id], onDelete: Cascade)
  platform             String        // tweets / xiaohongshu / zhihu
  formatted            String        @default("")
  style_rules_snapshot String?       // 生成时的规则快照 (JSON)
  status               String        @default("draft")  // draft / ready / published
  published_at         DateTime?
  created_at           DateTime      @default(now())
  updated_at           DateTime      @updatedAt
  scheduled_post       ScheduledPost?

  @@unique([content_entry_id, platform])
}
```

### ScheduledPost（排期）

```prisma
model ScheduledPost {
  id                  String         @id @default(cuid())
  platform_content_id String         @unique
  platform_content    PlatformContent @relation(fields: [platform_content_id], references: [id], onDelete: Cascade)
  scheduled_date      String         // YYYY-MM-DD
  scheduled_time      String?        // HH:mm
  position            Int            @default(0)  // 同一天内的排序
  created_at          DateTime       @default(now())
  updated_at          DateTime       @updatedAt
}
```

### PlatformRule（平台规则）

```prisma
model PlatformRule {
  id        String   @id @default(cuid())
  platform  String   @unique
  label     String
  style     String   // 风格描述
  structure String   // 结构模板
  constraints String // 长度、格式等限制 (JSON)
  is_preset Boolean  @default(true)
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
}
```

---

## 导航与页面结构

侧边栏导航：

```
🔥 热点收集    — 热点列表 + 快速添加
📝 内容创作    — 热点详情 → 写评论 → 生成各平台内容
📅 发布日历    — 日历视图，拖拽排期
📊 数据分析    — 发帖频率统计 + 趋势
📋 发布管理    — 管理各平台内容状态（现有页面改造）
⚙️ 设置        — 平台规则自定义
```

---

## 页面设计

### 1. 热点收集页 (`/hot-topics`)

- 卡片列表展示热点（标题、来源、标签、时间）
- 顶部快速添加表单（标题 + 内容/链接 + 标签）
- 点击卡片 → 跳转到内容创作页
- 支持搜索和标签筛选

### 2. 内容创作页 (`/create/[hot-topic-id]`)

- 左侧面板：热点原文展示
- 右侧编辑区：
  - 标题输入
  - 评论/想法输入（多行文本框）
  - 底部提示："写多少都行，AI 会自动适配"
- 下方平台内容区：
  - Tab 切换各平台（推文 / 小红书 / 知乎）
  - 每个 tab 显示 AI 生成的内容
  - 可手动编辑生成结果
  - "重新生成"按钮
- 顶部操作：保存草稿 / 生成全部平台内容

### 3. 发布日历页 (`/calendar`)

布局：
```
┌─────────────────────────────────────────┐
│  ◀ 2026年6月 ▶          [待排期内容 ▼]  │
├─────┬─────┬─────┬─────┬─────┬─────┬─────┤
│ 一  │ 二  │ 三  │ 四  │ 五  │ 六  │ 日  │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│     │  1  │  2  │  3  │  4  │  5  │  6  │
│     │     │🐦×2 │📝×1 │     │     │     │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  7  │  8  │ ... │     │     │     │     │
│     │🔴   │     │     │     │     │     │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘

右侧抽屉：待排期内容列表
  - 按平台分组（🐦推文 / 📕小红书 / 📝知乎）
  - 每条显示标题预览 + 平台图标
  - 拖拽到日历格子完成排期
```

交互：
- 拖拽到日历格子 → 默认排在当天
- 点击格子里的帖子 → 可调整具体时间
- 同一天内可拖拽排序（决定发布顺序）
- 日历格子角标显示当天待发数量
- 不同平台用不同颜色区分

### 4. 数据分析页 (`/analytics`)

```
顶部筛选：[近7天] [近30天] [近90天]  [全部平台 ▼]

┌─────────────────────────────────────────┐
│  发布热力图（日历格式）                    │
│  颜色深浅 = 发布数量                      │
│  悬停显示：当日发布详情                    │
├─────────────────────────────────────────┤
│  平台对比柱状图                           │
│  🐦 推文 ████████ 12条                   │
│  📕 小红书 █████ 8条                     │
│  📝 知乎 ███ 5条                         │
├─────────────────────────────────────────┤
│  趋势折线图                               │
│  - 近期发帖频率走势                       │
│  - 各平台分别显示                         │
│  - 标注高峰和低谷                         │
├─────────────────────────────────────────┤
│  关键指标卡片                             │
│  [本周发布: 5] [日均: 0.7] [最长连续: 3天] │
└─────────────────────────────────────────┘
```

### 5. 发布管理页 (`/publish` — 改造)

- 保留现有看板视图（草稿 / 就绪 / 已发布）
- 增加排期信息显示
- 从日历排期过来的内容自动关联

### 6. 设置页 (`/settings` — 改造)

- 平台规则管理
- 每个平台可查看/编辑预设规则
- 风格、结构、约束分别可调
- 重置为默认按钮

---

## AI 集成

### 自适应处理逻辑

```
输入：热点内容 + 用户评论
      ↓
判断输入量：
  - 评论 > 200字 → 侧重润色 + 平台适配
  - 评论 50-200字 → 补充论点 + 平台适配
  - 评论 < 50字 → 基于热点展开 + 保留核心观点
  - 无评论 → 基于热点全新创作
      ↓
对每个平台分别生成：
  - 平台规则 + 热点 + 评论 → Claude API → 平台专属内容
```

### Prompt 结构

```
系统提示：
  你是一个专业的内容创作者。
  当前平台：{platform_label}
  平台规则：
    风格：{style}
    结构：{structure}
    约束：{constraints}

用户输入：
  热点：{hot_topic_content}
  评论：{user_comment}
  适配模式：{adaptive_mode}（润色/展开/创作）
```

### 技术选型

- 使用 Claude API（通过 Anthropic SDK）
- 每个平台独立一次 API 调用（可并行）
- 生成结果存入 PlatformContent.formatted
- 保存生成时的规则快照，便于追溯

---

## API 设计

### 热点相关

```
GET    /api/hot-topics              — 列表
POST   /api/hot-topics              — 创建
GET    /api/hot-topics/[id]         — 详情
DELETE /api/hot-topics/[id]         — 删除
```

### 内容创作相关

```
GET    /api/entries/[id]            — 条目详情
PATCH  /api/entries/[id]            — 更新评论
POST   /api/entries/[id]/generate   — 生成各平台内容
```

### 排期相关

```
GET    /api/schedule                — 获取排期列表
POST   /api/schedule                — 创建排期
PATCH  /api/schedule/[id]           — 更新排期（日期/时间）
DELETE /api/schedule/[id]           — 删除排期
```

### 分析相关

```
GET    /api/analytics/stats         — 统计数据
GET    /api/analytics/heatmap       — 热力图数据
```

### 平台规则相关

```
GET    /api/platform-rules          — 获取所有规则
PATCH  /api/platform-rules/[platform] — 更新规则
POST   /api/platform-rules/[platform]/reset — 重置为默认
```

---

## 实施计划

### Phase 1：数据模型 + 热点收集
- 扩展 Prisma schema
- 实现热点 CRUD API
- 实现热点收集页面

### Phase 2：内容创作 + AI 集成
- 实现内容创作页面
- 集成 Claude API
- 实现自适应生成逻辑
- 预设平台规则

### Phase 3：发布日历
- 实现日历组件
- 实现拖拽排期
- 排期 CRUD API

### Phase 4：数据分析
- 实现统计 API
- 实现热力图、柱状图、趋势图

### Phase 5：设置页 + 发布管理改造
- 平台规则编辑 UI
- 发布管理页增加排期信息
