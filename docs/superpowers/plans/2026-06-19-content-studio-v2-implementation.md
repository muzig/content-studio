# Content Studio V2 — 实施计划

基于已批准的设计 spec，本计划将项目分解为 5 个阶段，每个阶段可独立交付。

---

## Phase 1：数据模型 + 热点收集

### 1.1 扩展 Prisma Schema

**文件**: `prisma/schema.prisma`

新增模型：
- `HotTopic` — 热点实体
- `PlatformContent` — 替代现有 `PlatformPublish`
- `ScheduledPost` — 排期实体
- `PlatformRule` — 平台规则

修改模型：
- `ContentEntry` — 添加 `hot_topic_id` 外键（可选）

迁移步骤：
```bash
npx prisma migrate dev --name add-hot-topic-and-platform-content
```

### 1.2 预设平台规则数据

**文件**: `prisma/seed.ts`

创建 seed 脚本，预设三条平台规则：
- tweets: 简洁有力，280字限制
- xiaohongshu: 轻松亲切，emoji 丰富
- zhihu: 专业深度，长文论证

### 1.3 热点 CRUD API

**文件**: `src/app/api/hot-topics/route.ts`
- `GET` — 列表查询（支持搜索、标签筛选）
- `POST` — 创建热点

**文件**: `src/app/api/hot-topics/[id]/route.ts`
- `GET` — 详情
- `DELETE` — 删除

### 1.4 热点收集页面

**文件**: `src/app/hot-topics/page.tsx`

组件拆分：
- `src/components/hot-topic-card.tsx` — 热点卡片
- `src/components/hot-topic-form.tsx` — 快速添加表单
- `src/components/hot-topic-list.tsx` — 列表容器

功能：
- 卡片列表展示（标题、来源、标签、时间）
- 顶部快速添加表单
- 点击卡片 → 跳转到 `/create/[id]`
- 搜索和标签筛选

### 1.5 更新侧边栏导航

**文件**: `src/components/sidebar.tsx`

修改 `NAV_ITEMS`，添加热点收集入口。

---

## Phase 2：内容创作 + AI 集成

### 2.1 内容创作 API

**文件**: `src/app/api/entries/route.ts`
- `POST` — 创建条目（关联热点）

**文件**: `src/app/api/entries/[id]/route.ts`（改造）
- `GET` — 条目详情（含热点信息）
- `PATCH` — 更新评论

**文件**: `src/app/api/entries/[id]/generate/route.ts`（改造）
- 替换模板生成为 AI 生成
- 调用 Claude API，传入热点 + 评论 + 平台规则

### 2.2 Claude API 集成

**文件**: `src/lib/ai.ts`

核心函数：
```typescript
async function generateForPlatform(
  hotTopic: string,
  userComment: string,
  platformRule: PlatformRule
): Promise<string>
```

自适应逻辑：
- 评论 > 200字 → 润色模式
- 评论 50-200字 → 展开模式
- 评论 < 50字 → 创作模式
- 无评论 → 全新创作

### 2.3 内容创作页面

**文件**: `src/app/create/[hot-topic-id]/page.tsx`

组件拆分：
- `src/components/create/hot-topic-panel.tsx` — 左侧热点展示
- `src/components/create/comment-editor.tsx` — 评论编辑区
- `src/components/create/platform-tabs.tsx` — 平台内容 Tab
- `src/components/create/platform-content.tsx` — 单平台内容展示/编辑
- `src/components/create/generate-button.tsx` — 生成按钮

布局：
- 左侧面板：热点原文
- 右侧编辑区：标题 + 评论
- 下方平台区：Tab 切换 + 内容编辑

### 2.4 更新侧边栏导航

**文件**: `src/components/sidebar.tsx`

添加内容创作入口。

---

## Phase 3：发布日历

### 3.1 排期 API

**文件**: `src/app/api/schedule/route.ts`
- `GET` — 获取排期列表（支持日期范围筛选）
- `POST` — 创建排期

**文件**: `src/app/api/schedule/[id]/route.ts`
- `PATCH` — 更新排期（日期/时间/位置）
- `DELETE` — 删除排期

### 3.2 日历组件

**文件**: `src/components/calendar/calendar-view.tsx` — 日历主视图
**文件**: `src/components/calendar/calendar-cell.tsx` — 单日格子
**文件**: `src/components/calendar/calendar-header.tsx` — 月份导航
**文件**: `src/components/calendar/scheduled-item.tsx` — 已排期内容项

### 3.3 拖拽排期

**文件**: `src/components/calendar/drag-provider.tsx`

实现：
- 使用 HTML5 Drag and Drop API
- 待排期内容可拖拽到日历格子
- 同一天内可拖拽排序
- 拖拽时视觉反馈（阴影、占位符）

### 3.4 待排期内容侧边栏

**文件**: `src/components/calendar/pending-drawer.tsx`

功能：
- 按平台分组显示
- 标题预览 + 平台图标
- 可拖拽到日历

### 3.5 发布日历页面

**文件**: `src/app/calendar/page.tsx`

整合日历组件和待排期侧边栏。

---

## Phase 4：数据分析

### 4.1 分析 API

**文件**: `src/app/api/analytics/stats/route.ts`
- 返回关键指标：本周发布数、日均、最长连续天数

**文件**: `src/app/api/analytics/heatmap/route.ts`
- 返回热力图数据：每日发布数量

**文件**: `src/app/api/analytics/trend/route.ts`
- 返回趋势数据：按平台、按时间

### 4.2 图表组件

**文件**: `src/components/analytics/heatmap-chart.tsx` — 热力图
**文件**: `src/components/analytics/platform-bar-chart.tsx` — 平台对比柱状图
**文件**: `src/components/analytics/trend-line-chart.tsx` — 趋势折线图
**文件**: `src/components/analytics/stat-cards.tsx` — 指标卡片

图表库选择：使用 Recharts（React 生态，轻量，支持 SSR）

### 4.3 数据分析页面

**文件**: `src/app/analytics/page.tsx`

布局：
- 顶部筛选（时间范围、平台）
- 热力图
- 平台对比柱状图
- 趋势折线图
- 指标卡片

---

## Phase 5：设置页 + 发布管理改造

### 5.1 平台规则 API

**文件**: `src/app/api/platform-rules/route.ts`
- `GET` — 获取所有规则

**文件**: `src/app/api/platform-rules/[platform]/route.ts`
- `PATCH` — 更新规则

**文件**: `src/app/api/platform-rules/[platform]/reset/route.ts`
- `POST` — 重置为默认

### 5.2 设置页改造

**文件**: `src/app/settings/page.tsx`（改造）

功能：
- 平台规则列表
- 每个平台可展开编辑
- 风格、结构、约束分别可调
- 重置为默认按钮

### 5.3 发布管理页改造

**文件**: `src/app/publish/page.tsx`（改造）

增加：
- 排期信息显示
- 从日历排期过来的内容自动关联

---

## 依赖安装

### Phase 2
```bash
pnpm add @anthropic-ai/sdk
```

### Phase 4
```bash
pnpm add recharts
```

---

## 文件结构总览

```
src/
├── app/
│   ├── api/
│   │   ├── hot-topics/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── entries/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── generate/route.ts
│   │   ├── schedule/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── analytics/
│   │   │   ├── stats/route.ts
│   │   │   ├── heatmap/route.ts
│   │   │   └── trend/route.ts
│   │   └── platform-rules/
│   │       ├── route.ts
│   │       └── [platform]/
│   │           ├── route.ts
│   │           └── reset/route.ts
│   ├── hot-topics/page.tsx
│   ├── create/[hot-topic-id]/page.tsx
│   ├── calendar/page.tsx
│   ├── analytics/page.tsx
│   ├── publish/page.tsx (改造)
│   └── settings/page.tsx (改造)
├── components/
│   ├── hot-topic-card.tsx
│   ├── hot-topic-form.tsx
│   ├── hot-topic-list.tsx
│   ├── create/
│   │   ├── hot-topic-panel.tsx
│   │   ├── comment-editor.tsx
│   │   ├── platform-tabs.tsx
│   │   ├── platform-content.tsx
│   │   └── generate-button.tsx
│   ├── calendar/
│   │   ├── calendar-view.tsx
│   │   ├── calendar-cell.tsx
│   │   ├── calendar-header.tsx
│   │   ├── scheduled-item.tsx
│   │   ├── drag-provider.tsx
│   │   └── pending-drawer.tsx
│   ├── analytics/
│   │   ├── heatmap-chart.tsx
│   │   ├── platform-bar-chart.tsx
│   │   ├── trend-line-chart.tsx
│   │   └── stat-cards.tsx
│   └── sidebar.tsx (改造)
└── lib/
    ├── ai.ts (新增)
    ├── prisma.ts
    └── templates/ (保留兼容)
```
