# 光影工坊 · 素材制作网站

一个可独立运行的全栈素材制作演示：浏览模板、按模板要求上传图片、提交异步制作任务，并在任务后台处理期间继续浏览网站，最后在个人创作记录中查看状态、失败原因或制作结果。

项目按要求实现了 **Next.js + Java/Spring Boot + MyBatis + MySQL** 的完整闭环；制作过程不调用真实 AI 服务，由可控耗时、可指定失败阶段的模拟执行器完成。

![光影工坊图标](frontend/public/app-icon.svg)

默认英文，可切换中文。模板库提供 20 个模板，包含单图与双图流程。制作历史保留在个人页面，也可在模板制作页查看。

快速启动使用 `docker compose up --build`，然后打开 [本地网站](http://127.0.0.1:3000/)。

## 目录

- [1. 功能概览](#1-功能概览)
- [2. 技术栈与版本](#2-技术栈与版本)
- [3. 快速开始](#3-快速开始)
- [4. 项目结构](#4-项目结构)
- [5. 配置项](#5-配置项)
- [6. 数据库与种子素材](#6-数据库与种子素材)
- [7. 主要接口](#7-主要接口)
- [8. 任务状态、阶段与异步执行](#8-任务状态阶段与异步执行)
- [9. 演示指南](#9-演示指南)
- [10. 测试与 CI](#10-测试与-ci)
- [11. 验收要求对照](#11-验收要求对照)
- [12. 已完成、未实现与已知限制](#12-已完成未实现与已知限制)
- [13. 部署与回滚](#13-部署与回滚)
- [14. AI 工作流](#14-ai-工作流)
- [15. 素材与代码来源](#15-素材与代码来源)
- [16. 验收版本](#16-验收版本)

## 1. 功能概览

- **模板库**：8 个本地种子模板，4 个分类；卡片展示封面、标题、所需素材数；支持服务端按分类筛选。
- **模板详情**：描述、示例效果、素材要求（数量 / 格式 / 单张大小）；按 `requiredImageCount` 动态生成上传位。
- **素材上传**：选择、即时预览、替换、移除；客户端校验格式与大小，服务端额外做 Magic Bytes 嗅探和 `ImageIO` 可解码校验；上传中 / 失败状态可见；替换时旧请求会被中止，旧响应不会覆盖新文件。
- **异步任务**：提交接口完成校验和任务落库后返回 `202` 与任务 ID，不等待制作完成；关闭页面不会中断后端任务。
- **三段式处理**：`素材检查 → 模拟生成 → 结果整理`，每个阶段在 MySQL 中有独立、可观察的持久化阶段标记。
- **确定性失败注入**：可将新任务固定在 `CHECK / GENERATE / FINALIZE` 任一阶段失败，保存失败阶段与可读原因；失败后停止后续阶段。
- **可调耗时**：三个阶段耗时分别可调（0–600000 ms），支持环境变量、全局开发接口、单任务提交覆盖三种方式。
- **前端状态管理**：区分上传中、提交中、排队中、处理中、成功、失败；查询异常只影响“查询”，不会把后端任务改成失败，并可手动恢复查询。
- **多任务隔离**：每个任务独立轮询、独立阶段与错误；终态任务立即停止轮询；切换页面或身份时清理旧请求。
- **刷新恢复**：任务与历史存储在 MySQL；刷新页面后重新拉取历史，只继续跟踪未结束的任务。
- **个人身份**：服务端演示会话 + HttpOnly Cookie；素材、任务、结果均按 owner 做访问控制。
- **响应式深色界面**：桌面端为主，小屏可操作；键盘焦点可见，上传位与图标按钮有可理解标签。
- **工程交付**：Vitest / JUnit 核心测试、GitHub Actions CI、Docker Compose、初始化 SQL、README。

## 2. 技术栈与版本

| 层 | 技术 | 版本 / 说明 |
| --- | --- | --- |
| 前端框架 | Next.js（App Router） | 14.2.35 |
| UI | React / React DOM | 18.3.1 |
| 语言 | TypeScript | 5.6.3（`strict: true`） |
| 前端测试 | Vitest | 2.1.9（纯 TS，无 jsdom） |
| 前端规范 | ESLint + eslint-config-next | 8.57.1 / 14.2.35 |
| 后端 | Spring Boot | 3.3.5 |
| 语言 | Java | 编译目标 17（本地验证使用 JDK 23 运行） |
| 持久层 | MyBatis Spring Boot Starter | 3.0.3（XML Mapper） |
| 数据库 | MySQL | 8.0（Compose 使用 `mysql:8.0`） |
| 构建 | Maven | 3.9.9（Docker 构建镜像） |
| 容器 | Docker / Docker Compose | Compose 文件见仓库根目录 |
| CI | GitHub Actions | `.github/workflows/ci.yml` |

样式为手写 CSS，未引入 UI 组件库；异步轮询为自研、可注入调度器的框架无关类（`frontend/lib/taskFeed.ts`）。

## 3. 快速开始

### 3.1 一键容器启动（推荐）

前置：Docker Engine 与 Docker Compose v2。

```bash
cp .env.example .env   # 可选：修改密码或模拟参数
docker compose up --build
```

启动完成后：

| 服务 | 地址 | 说明 |
| --- | --- | --- |
| 前端 | http://127.0.0.1:3000 | 浏览器入口 |
| 后端 | http://127.0.0.1:8080 | 可直接调用 API，也有健康检查 |
| MySQL | 127.0.0.1:3307 | 映射到容器 3306，便于本地排查 |

首次启动时 MySQL 会自动执行 `database/init/*.sql` 建表并写入演示用户与模板。初始化脚本只在数据卷为空时执行一次；需要重置演示数据时执行：

```bash
docker compose down -v   # 同时删除 mysql-data / media-data 数据卷
docker compose up --build
```

停止服务（保留数据）：`docker compose down`。

> 容器端口默认只绑定 `127.0.0.1`。如确需公网访问，应在前方增加反向代理与 HTTPS，并替换默认密码；本仓库不提供生产级暴露方案。

### 3.2 本地开发启动

前置：JDK 17+、Maven 3.9+、Node.js 22 + npm 10、MySQL 8.0。

**准备数据库**（本地 MySQL）：

```sql
CREATE DATABASE image_edit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'imageedit'@'%' IDENTIFIED BY 'imageedit_pass';
GRANT ALL PRIVILEGES ON image_edit.* TO 'imageedit'@'%';
FLUSH PRIVILEGES;
```

```bash
mysql -u imageedit -p image_edit < database/init/01-schema.sql
mysql -u imageedit -p image_edit < database/init/02-seed.sql
```

**启动后端**：

```bash
cd backend
mvn spring-boot:run
# 默认 DB_URL 为 jdbc:mysql://localhost:3306/image_edit，用户 imageedit / imageedit_pass
# 如与本机不同，按第 5 节设置 DB_URL / DB_USERNAME / DB_PASSWORD
```

健康检查：`curl http://localhost:8080/api/health`。

**启动前端**（另开终端）：

```bash
cd frontend
npm ci
npm run dev
# 打开 http://localhost:3000
```

前端通过 `next.config.mjs` 的 rewrite 将 `/api/:path*` 代理到 `BACKEND_URL`（默认 `http://localhost:8080`）。Next.js 会把 rewrite 目标写入构建产物，因此修改后端地址后需要重新构建前端；Compose 已在构建参数中传入 `http://backend:8080`。

**常用命令**：

```bash
# 前端
npm run dev        # 开发服务器
npm run build      # 生产构建
npm run start      # 启动生产构建
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm test           # Vitest

# 后端
mvn test           # 单元测试
mvn package        # 打可执行 jar（target/image-edit-backend-1.0.0.jar）
mvn spring-boot:run
```

## 4. 项目结构

```text
imageEdit/
├─ .github/workflows/ci.yml       # 前后端 CI
├─ .env.example                   # Compose 可选配置示例
├─ docker-compose.yml             # frontend + backend + mysql + 数据卷
├─ database/init/
│  ├─ 01-schema.sql               # 表结构
│  └─ 02-seed.sql                 # 2 个演示用户 + 8 个模板
├─ docs/screenshots/              # 本地运行截图
├─ backend/
│  ├─ Dockerfile
│  ├─ pom.xml
│  └─ src/
│     ├─ main/java/com/xiaoying/imageedit/
│     │  ├─ config/               # 异步线程池、Web/CORS、模拟参数
│     │  ├─ controller/           # session / templates / assets / tasks / dev / health
│     │  ├─ domain/               # User / Template / Asset / Task / 枚举
│     │  ├─ mapper/               # MyBatis Mapper 接口
│     │  ├─ service/              # 会话、上传、任务、模板、模拟设置
│     │  ├─ service/execution/    # 三段式执行、事件监听、启动恢复
│     │  ├─ storage/              # 本地原子写入与安全路径解析
│     │  └─ web/                  # 统一异常处理与 DTO
│     ├─ main/resources/
│     │  ├─ mapper/*.xml
│     │  ├─ static/demo/          # 本地 SVG 封面与示例结果
│     │  └─ application.yml
│     └─ test/java/...            # 执行器单元测试
└─ frontend/
   ├─ Dockerfile
   ├─ package.json / package-lock.json
   ├─ next.config.mjs
   ├─ app/                        # 首页、模板详情、全局样式
   ├─ components/                 # 模板卡片、上传工作区、任务卡片、弹窗
   └─ lib/                        # API、类型、身份、轮询引擎、测试
```

## 5. 配置项

后端读取 `application.yml`，均可用环境变量覆盖：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `DB_URL` | `jdbc:mysql://localhost:3306/image_edit?...` | JDBC 连接串 |
| `DB_USERNAME` | `imageedit` | 数据库用户 |
| `DB_PASSWORD` | `imageedit_pass` | 数据库密码 |
| `APP_STORAGE_ROOT` | `./data` | 上传素材与结果的本地存储根目录；Compose 挂载为 `/app/data` |
| `RECOVER_INTERRUPTED_TASKS` | `true` | 启动时是否把上次进程遗留的未完成任务标记为失败 |
| `SIM_CHECK_DELAY_MS` | `1200` | 素材检查默认耗时（ms） |
| `SIM_GENERATE_DELAY_MS` | `2000` | 模拟生成默认耗时（ms） |
| `SIM_FINALIZE_DELAY_MS` | `1200` | 结果整理默认耗时（ms） |
| `SIM_FAIL_STAGE` | 空 | 默认失败阶段：空 / `CHECK` / `GENERATE` / `FINALIZE` |
| `BACKEND_URL` | `http://localhost:8080` | 前端构建时使用的后端地址（Next rewrite 目标） |

Compose 额外读取根目录 `.env`：`MYSQL_PASSWORD`、`MYSQL_ROOT_PASSWORD`、`SIM_*`。所有变量均为演示用非敏感示例；仓库不包含任何真实凭据。

会话 Cookie 名 `IMAGEEDIT_SESSION` 固定配置在 `app.session-cookie-name`，属性为 `HttpOnly; Path=/; SameSite=Lax; Max-Age=30d`，演示环境未启用 `Secure`（因为默认走 HTTP）。

## 6. 数据库与种子素材

### 6.1 表结构

`database/init/01-schema.sql` 创建 6 张表：

- `app_user`：演示用户。
- `demo_session`：服务端随机 UUID 会话，关联用户；Cookie 只保存会话 ID。
- `template`：模板、分类、封面、说明、素材数量、允许 MIME、大小上限、示例结果、标题配色。
- `asset`：上传素材元数据（owner、模板、storage key、内容类型、大小）。
- `task`：任务状态、当前阶段、结果 key、失败原因、**受理时快照的三段耗时与失败阶段**。
- `task_asset`：任务与素材的槽位关系（`slot_index` 决定顺序）。

初始化脚本可重复执行（种子使用 `ON DUPLICATE KEY UPDATE`）。

### 6.2 种子数据

- 2 个演示身份：`user-a 林小满`、`user-b 周予安`。
- 8 个模板，每类 2 个：
  - 旅行纪念：旅行明信片（2 图）、城市天际线（1 图）
  - 萌宠日常：萌宠写真（1 图）、双宝合影（2 图）
  - 婚礼庆典：婚礼请柬（2 图）、周年纪念（1 图）
  - 创意海报：双人拼贴（2 图）、节日贺卡（1 图）
- 封面与示例结果为后端 classpath 下的本地 SVG（`/api/demo/covers/*.svg`、`/api/demo/results/*-sample.svg`），由后端静态资源直接提供，不依赖外部图片服务。
- 真实制作结果不是预置文件：任务成功后由 Java2D 将用户上传的图片合成为 1200×1500 PNG，写入 `APP_STORAGE_ROOT/results`，再通过鉴权接口返回。

## 7. 主要接口

所有 JSON 字段为 camelCase。除特别标注外都需要演示会话 Cookie。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/health` | 健康检查，包含数据库连通性；公开 |
| `GET` | `/api/session` | 当前会话用户；未登录返回 401 |
| `POST` | `/api/demo-session` | 创建演示会话；公开 |
| `GET` | `/api/categories` | 分类及模板数量；公开 |
| `GET` | `/api/templates?category=` | 模板列表；分类可选；公开 |
| `GET` | `/api/templates/{id}` | 模板详情；公开 |
| `POST` | `/api/assets` | `multipart/form-data`：`templateId` + `file` |
| `GET` | `/api/assets/{id}/file` | 素材预览；仅 owner |
| `POST` | `/api/tasks` | 创建任务，返回 `202` |
| `GET` | `/api/tasks` | 当前用户历史（按创建时间倒序，LIMIT 200） |
| `GET` | `/api/tasks/{id}` | 任务详情；仅 owner |
| `GET` | `/api/tasks/{id}/result-file` | 成功结果 PNG；仅 owner |
| `GET` | `/api/dev/simulation` | 读取当前全局模拟设置 |
| `PUT` | `/api/dev/simulation` | 更新模拟设置（仅影响新任务） |
| `GET` | `/api/demo/**` | 本地模板封面 / 示例结果静态资源；公开 |

### 7.1 创建演示会话

```http
POST /api/demo-session
Content-Type: application/json

{ "identity": "A" }
```

```json
{
  "user": {
    "id": "user-a",
    "displayName": "林小满",
    "email": "lin.xiaoman@imageedit.demo",
    "avatarColor": "#9BBF3E"
  }
}
```

响应同时写入 `Set-Cookie: IMAGEEDIT_SESSION=<uuid>; HttpOnly; Path=/; SameSite=Lax; Max-Age=2592000`。

### 7.2 上传素材

```http
POST /api/assets
Content-Type: multipart/form-data

templateId=travel-postcard
file=<binary>
```

```json
{
  "assetId": "54278e26-377f-4d84-a2d6-4e5eefb984e6",
  "previewUrl": "/api/assets/54278e26-377f-4d84-a2d6-4e5eefb984e6/file",
  "originalName": "photo.png",
  "contentType": "image/png",
  "sizeBytes": 68
}
```

校验顺序：模板存在 → 非空 → 大小（模板上限与 Multipart 8 MB）→ Magic Bytes 仅 PNG/JPEG → 模板允许 MIME → `ImageIO` 可解码。错误示例：

```json
{ "code": "INVALID_FILE_TYPE", "message": "仅支持 JPEG 或 PNG 图片文件" }
{ "code": "FILE_TOO_LARGE", "message": "文件超过模板限制（最大 5.0 MB）" }
```

### 7.3 创建任务

```http
POST /api/tasks
Content-Type: application/json

{
  "templateId": "travel-postcard",
  "assetIds": ["<id-1>", "<id-2>"],
  "simulation": {
    "checkDelayMs": 2500,
    "generateDelayMs": 3000,
    "finalizeDelayMs": 2000,
    "failStage": "GENERATE"
  }
}
```

`simulation` 可省略；字段也可省略，省略项继承当前全局设置。服务端会校验素材数量、重复、owner、模板归属、MIME 与大小，并快照耗时 / 失败阶段到任务记录。

成功响应 `202 Accepted`：

```json
{ "taskId": 1, "status": "QUEUED", "createdAt": "2026-11-06T01:16:00.617" }
```

### 7.4 查询任务

```json
{
  "id": 1,
  "templateId": "travel-postcard",
  "templateTitle": "旅行明信片",
  "createdAt": "2026-11-06T01:16:00.617",
  "updatedAt": "2026-11-06T01:16:04.139",
  "status": "SUCCEEDED",
  "stage": "FINALIZE",
  "resultUrl": "/api/tasks/1/result-file",
  "failureReason": null
}
```

失败时示例：

```json
{
  "status": "FAILED",
  "stage": "GENERATE",
  "resultUrl": null,
  "failureReason": "模拟生成失败：生成器返回错误（由失败注入触发）。"
}
```

跨用户访问任务或素材统一返回 404（不泄露资源是否存在）。查询接口为只读，不会驱动任务推进。

### 7.5 模拟设置

```http
PUT /api/dev/simulation
Content-Type: application/json

{ "checkDelayMs": 50, "generateDelayMs": 50, "finalizeDelayMs": 50, "failStage": "CHECK" }
```

- 延迟范围 0–600000 ms，非法值返回 `400 INVALID_SIMULATION`。
- `failStage` 传 `null` 或省略表示“不修改”；传空字符串 `""` 表示清除失败注入；也可传 `CHECK / GENERATE / FINALIZE`。
- 设置仅对之后受理的任务生效。

### 7.6 错误响应统一格式

```json
{ "code": "TASK_NOT_FOUND", "message": "任务不存在或无权访问" }
```

常见 HTTP 状态：`400` 参数/文件/素材校验失败，`401` 无有效会话，`404` 资源不存在或无权访问，`413` Multipart 超限，`500` 未预期异常（不暴露堆栈）。

## 8. 任务状态、阶段与异步执行

### 8.1 状态机

```text
QUEUED  (stage = null)
  │  AFTER_COMMIT 投递到线程池
  ▼
RUNNING / CHECK ──► RUNNING / GENERATE ──► RUNNING / FINALIZE
   │                     │                      │
   │ failStage=CHECK     │ failStage=GENERATE   │ failStage=FINALIZE
   ▼                     ▼                      ▼
FAILED (stage, reason)   FAILED                 FAILED
                                                │ 成功
                                                ▼
                                      SUCCEEDED + resultKey
```

- 终态：`SUCCEEDED` / `FAILED`；进入终态后不再轮询，也不会被后续查询改回处理中。
- `markSucceeded` / `markFailed` 使用带状态守卫的 SQL 更新；`markRunning` 仅允许从 `QUEUED/RUNNING` 推进。
- 每个阶段开始时用 `REQUIRES_NEW` 短事务写入阶段标记，再执行该阶段延迟与工作，因此中间状态可被查询观察到。

### 8.2 受理与执行边界

1. `POST /api/tasks` 在单个事务中完成参数校验、模拟设置快照、任务与素材槽位插入。
2. 发布 `TaskAcceptedEvent`，通过 `@TransactionalEventListener(AFTER_COMMIT)` 确保线程池不会读到未提交数据。
3. 固定大小线程池 `taskWorkerExecutor`（core/max = 4，队列 100）异步执行；浏览器关闭不影响后端。
4. 队列拒绝时任务会被标记失败并写入“任务队列繁忙”的可读原因。
5. 执行异常统一转换为失败状态；不会留下永久 `RUNNING`。

### 8.3 结果整理

`Java2dResultComposer` 读取按槽位排序的素材，生成 1200×1500 PNG 拼贴，包含模板配色、标题、任务编号与留白；图片按 cover 方式裁切。为保证容器内无中文字体时也能稳定输出，结果海报上的排版文字使用 ASCII 模板标题。结果文件写入本地存储，DB 只保存 `result_key`。

### 8.4 重启恢复的边界

任务执行器运行在进程内存中。服务重启后无法从阶段断点继续执行，因此启动时会把遗留的 `QUEUED/RUNNING` 任务标记为 `FAILED`，原因：**“服务重启导致任务中断，请重新提交。”** 这样前端不会永久轮询，也不会假装成功。可通过 `RECOVER_INTERRUPTED_TASKS=false` 关闭该行为。真正断点续跑不在本题范围内，未实现。

## 9. 演示指南

### 9.1 成功闭环

1. 打开 http://127.0.0.1:3000 ，选择任意模板，例如“旅行明信片”。
2. 点击两个上传位，选择本地 JPG/PNG（单张 ≤ 5 MB）；预览出现后显示“已上传”。
3. 点击“提交生成任务”，按钮进入提交中，成功后立即出现任务 #ID，并提示后台处理中。
4. 在当前页“制作历史”或导航栏“我的”中观察阶段依次变为 `素材检查 → 模拟生成 → 结果整理`，最终为“已完成”，可查看 / 下载 1200×1500 PNG 结果。
5. 刷新页面，历史从后端恢复；已完成任务不会再次轮询。

### 9.2 调整耗时

三种方式任选：

- 导航栏“设置”，填写三段毫秒数后保存；
- 环境变量 `SIM_CHECK_DELAY_MS / SIM_GENERATE_DELAY_MS / SIM_FINALIZE_DELAY_MS`；
- 单次提交时传入 `simulation` 覆盖（见 7.3）。

设置会在任务受理时快照，已有任务不受影响。将延迟设置为较大值（如 2500/3000/2000）即可清晰观察每个阶段的变化。

### 9.3 指定阶段失败

- 导航栏“设置” → “确定性失败注入”选择 `素材检查 / 模拟生成 / 结果整理` → 保存，然后提交新任务；
- 或设置 `SIM_FAIL_STAGE=GENERATE` 后重启后端；
- 或单次提交时传入 `"failStage": "GENERATE"`。

失败任务会展示失败阶段与后端原因，停止后续阶段，结果链接为空。清除全局失败注入：在“演示设置”里选择“不注入失败”；API 等价于 `{"failStage": ""}`。失败是确定性的，不随机。

### 9.4 curl 快速演示

```bash
# 创建会话并保存 Cookie
curl -c cookies.txt -H "Content-Type: application/json" \
  -d '{"identity":"A"}' http://localhost:8080/api/demo-session

# 查看分类与模板
curl -b cookies.txt http://localhost:8080/api/categories
curl -b cookies.txt http://localhost:8080/api/templates

# 上传两张图片（替换为本地文件）
curl -b cookies.txt -F "templateId=travel-postcard" -F "file=@a.png" \
  http://localhost:8080/api/assets
curl -b cookies.txt -F "templateId=travel-postcard" -F "file=@b.png" \
  http://localhost:8080/api/assets

# 用返回的两个 assetId 创建任务；可附加 simulation
curl -b cookies.txt -H "Content-Type: application/json" \
  -d '{"templateId":"travel-postcard","assetIds":["<id1>","<id2>"],
       "simulation":{"generateDelayMs":3000,"failStage":"GENERATE"}}' \
  http://localhost:8080/api/tasks

# 查询任务与结果
curl -b cookies.txt http://localhost:8080/api/tasks/1
curl -b cookies.txt -o result.png http://localhost:8080/api/tasks/1/result-file
```

### 9.5 多任务与查询异常

- 连续提交多个任务：每个任务在界面中独立展示状态、阶段与结果；同一任务同一时刻最多一个查询在途；某个任务进入终态后只停止该任务。
- **查询异常演示**：任务处理中时停止后端进程。前端会保留最后一次任务数据，在卡片上显示“状态查询失败 … 已暂停自动刷新”，且不会把任务标成失败。恢复后端后点击“重试查询”即可继续（若后端重启导致任务中断，启动恢复会将其标记为失败，这是后端业务状态，不是查询异常）。前端单元测试覆盖了这两种情况的区分。

### 9.6 刷新恢复

刷新“我的”页面会重新调用 `GET /api/tasks`，恢复历史与未完成任务；只有 `QUEUED/RUNNING` 的任务会重新进入轮询，已完成 / 失败任务保持终态。

### 9.7 身份与个人记录演示

1. 点击右上角头像，打开“演示身份”。
2. 在 `林小满 (A)` 与 `周予安 (B)` 之间切换；切换后前端轮询会停止并按新用户重新加载。
3. 在 A 下创建任务，切换到 B：B 的历史为空；直接访问 A 的任务或素材接口返回 404。
4. 再切回 A：历史与结果仍在。

实现方式：`POST /api/demo-session` 校验身份 A/B，在 `demo_session` 表插入随机 UUID 会话并写入 HttpOnly Cookie；所有任务/素材查询都附带 `owner_id` 条件，静态模板数据公开。没有密码、注册或第三方登录，身份仅用于演示隔离。

## 10. 测试与 CI

### 10.1 后端测试

```bash
cd backend
mvn test
```

`TaskExecutionServiceTest` 使用内存 fake 实现（无数据库、无 Mockito）覆盖 7 个执行场景：

- 阶段严格按 `CHECK → GENERATE → FINALIZE` 执行，且仅在整理完成后标记成功；
- 参数化验证在 `CHECK / GENERATE / FINALIZE` 注入失败时停止后续阶段、持久化失败阶段与原因；
- 结果生成失败被归入 `FINALIZE` 失败；
- 素材不可解码时在 `CHECK` 失败并跳过后续阶段；
- 终态任务不会再次执行。

### 10.2 前端测试

```bash
cd frontend
npm test
```

`lib/taskFeed.test.ts` 使用手写 fake API、延迟 Promise 与可控调度器覆盖 5 个核心场景：

1. 两个任务交错、乱序返回时互不串扰；两者进入终态后全部停止轮询；
2. 查询异常只设置 `queryError`，保留最后任务状态并暂停该任务轮询；重试成功后恢复，随后展示真实后端失败；
3. 真实后端失败不会被误呈现为查询异常；
4. `stop()` 后到达的迟到响应被丢弃，不能写入新身份；
5. 刷新列表后只恢复未完成任务的跟踪。

### 10.3 CI

`.github/workflows/ci.yml` 在 push 到 `main` 或 pull request 时执行：

- **backend**：Temurin JDK 17 + Maven 缓存，`mvn -B verify`（测试 + 打包）。
- **frontend**：Node 22 + npm 缓存，`npm ci` → `npm run lint` → `npm run typecheck` → `npm test` → `npm run build`。

CI 不需要 MySQL：后端测试为执行器单元测试，前端测试为纯 TS 测试，构建不连接数据库。

### 10.4 本地验证记录（2026-11-06）

在 Windows 11 + JDK 23（编译目标 17）+ Node 22 下完成：

- `mvn test`：7 个测试通过；
- `mvn package`：生成可执行 jar；
- `npm run lint` / `npm run typecheck` / `npm test` / `npm run build`：全部通过（5 个前端测试）；
- 使用隔离的临时 MySQL 8.0.41 实例（127.0.0.1:3307）启动后端，验证：健康检查、会话、模板、上传、任务受理 `202`、三阶段可观察推进、成功结果 1200×1500 PNG、指定阶段失败、失败结果 404、终态查询不变、身份 A/B 隔离（跨用户任务 / 素材 404）、全局模拟设置与非法值 400、错误文件内容被拒绝、素材数量校验、服务重启后将 `RUNNING` 任务标记失败；
- 使用生产构建的前端 + Next rewrite 代理再次验证 Cookie 会话、历史与结果；
- 使用 Headless Chrome 截图检查桌面与小屏布局，并通过 DevTools Protocol 实际切换身份、读取模拟设置，确认切换后历史清空、模拟设置显示正确。

**未由本人在本地验证的项目**：`docker compose up --build` 全链路（本机未安装 Docker）、GitHub Actions 实际运行（需推送到 GitHub 后触发）。Compose 构建参数、健康检查、初始化挂载已按官方镜像行为配置。

## 11. 验收要求对照

| 要求 | 实现情况 |
| --- | --- |
| R-01 技术栈与职责 | Next.js App Router + React + TS；Java + Spring Boot + MyBatis + MySQL；业务执行与持久化全部在 Java 后端 |
| R-02 列表与模拟数据 | 分类 / 模板封面 / 标题 / 数量；服务端分类筛选；点击进入详情；数据来自 MySQL 种子 |
| R-03 详情、上传与校验 | 动态上传位、预览、替换、移除、上传中/失败反馈；前后端校验；重复提交防护 |
| R-04 受理与异步执行 | `202` + 任务 ID；事务提交后投递固定线程池；关闭页面不影响执行 |
| R-05 多步骤状态与查询 | 三阶段逐步持久化；状态、阶段、结果、失败原因可查询；查询只读；终态守卫 |
| R-06 失败与模拟控制 | 可重复指定阶段失败；保存失败阶段与原因；三段耗时全局 / 单任务可调；README 说明 |
| R-07 状态表达与请求异常 | 完整状态区分；查询异常暂停刷新且不篡改任务；提供重试入口 |
| R-08 多任务与查询生命周期 | 每任务独立状态/阶段/错误/结果；终态停止、无任务不轮询；离开页面/切换身份 abort + epoch 丢弃迟到响应 |
| R-09 刷新恢复与结果记录 | 历史、创建时间、状态、失败原因、成功图片预览；刷新后恢复并继续跟踪未完成任务 |
| R-10 用户身份与个人记录 | A/B 演示身份、服务端会话 Cookie、owner 级访问控制、界面切换与隔离演示 |
| R-11 视觉与可用性 | 深色模板列表 / 详情 / 历史布局；响应式；语义化按钮/标签/对话框；焦点可见 |
| R-12 CI 与关键测试 | GitHub Actions 前后端任务；前后端核心单元测试覆盖要求场景 |
| R-13 提交材料与说明 | 完整源码、锁文件、SQL、CI、Compose、README（含限制、部署回滚、AI 工作流） |
| R-14 容器交付 | Docker Compose 一键启动前端、后端、MySQL；数据卷、初始化、健康检查、非敏感 `.env.example` |

## 12. 已完成、未实现与已知限制

### 已完成

- 前述全部功能与验收点；本地端到端手工验证（见 10.4）。
- 启动恢复不会让任务永久卡在处理中，但采取“标记失败”而非“继续执行”。

### 未实现 / 明确不在范围

- **服务重启后的断点续跑**：执行器为内存线程，重启后任务标记失败；题目明确不要求重启后自动恢复执行。
- 任务受理幂等、自动重试、失败任务重做、删除任务、分页 / 无限滚动（历史固定最多 200 条）。
- 真实 AI、支付、对象存储、消息队列、SSE/WebSocket、集群与多实例协调。
- 生产级鉴权、密码找回、CSRF Token、限流、审计日志、文件病毒扫描、定期清理孤儿文件。
- 视频结果、多语言。

### 已知限制与取舍

- **单实例**：线程池与启动恢复都假设单后端实例；多实例部署需要分布式队列 / 数据库抢占或把任务标记控制得更细。
- **模拟设置为全局共享**：`/api/dev/simulation` 影响所有新任务；单任务可通过请求覆盖。接口仅要求会话，不区分管理员，仅用于演示。
- **内存线程池有界**：core/max 4、队列 100；延迟通过线程 sleep 模拟，长延迟任务会占用工作线程。演示足够，生产应使用调度队列。
- **结果排版文字为 ASCII**：避免容器内缺少中文字体导致 Java2D 输出异常；中文标题仍保存在数据库与页面中。
- **本地文件存储**：依赖数据卷；容器重建需保留 `media-data`，数据库与媒体文件的一致性未做事后修复工具。
- **结果下载为浏览器内联打开**：接口返回 inline；前端提供 `download` 链接，实际行为受浏览器策略影响。
- **Next rewrite 目标在构建时固化**：Compose 通过 build arg 传入后端地址；若运行时改变后端域名需重新构建前端。生产更常见的做法是反向代理直接路由 `/api`。
- **无真实凭据**：示例密码仅用于本地 / 容器演示，必须在公开部署前替换。
- **实时性**：前端轮询间隔 1500 ms，因此阶段变化不是逐毫秒可见。

### 实际投入

开发与验证在一次集中的 AI 辅助迭代中完成，未单独记录精确工时。主要时间分配在：后端领域模型与执行状态机、任务轮询与异常语义、真实运行验证（临时 MySQL、curl、Headless Chrome）与交付文档。建议将本 README 中的“本地验证记录”视为实际完成度的依据，而不是用功能数量判断。

## 13. 部署与回滚

### 部署（单机 Compose）

```bash
git clone <repository-url> imageEdit
cd imageEdit
cp .env.example .env         # 修改密码 / 模拟参数
docker compose up -d --build
docker compose ps            # 等待 mysql/backend/frontend healthy
curl http://127.0.0.1:8080/api/health
```

查看日志：`docker compose logs -f backend frontend`。

### 数据备份

```bash
docker compose exec mysql sh -c \
  'mysqldump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' > backup.sql
docker run --rm -v image-edit_media-data:/data -v "$PWD":/backup alpine \
  tar czf /backup/media.tar.gz -C /data .
```

（数据卷名称以 `docker volume ls` 实际显示为准。）

### 回滚

```bash
git fetch --tags
git checkout acceptance-2026-11-07   # 或上一个稳定 commit / tag
docker compose up -d --build --force-recreate
```

- 回滚保留 `mysql-data` 与 `media-data`，不会自动回滚数据库结构或已写入数据；如本次变更包含不兼容 schema 改动，需要先备份并按变更脚本人工回退（当前初始版本无迁移工具）。
- 如需完全重置演示：`docker compose down -v` 后重新 `up --build`（会删除数据库与媒体文件，属于破坏性操作）。
- 对外暴露前应替换密码、绑定反向代理、启用 HTTPS 与 `Secure` Cookie，并将 `127.0.0.1` 端口绑定改为受控网络。

## 14. AI 工作流

本项目使用 **Claude Code（Claude）** 作为 AI 编程助手，配合人工审阅与验证。流程如下：

1. **拆解需求**：先将 R-01–R-14 拆成“数据模型 → 上传 → 异步执行 → 查询/历史 → 身份 → 前端状态 → 交付”任务清单，再按依赖顺序实现。
2. **提供上下文**：向 AI 提供需求文档、接口契约草案、版本约束、数据库结构和参考截图；明确不使用的技术（如不引入消息队列、SSE）。
3. **生成与修改**：后端先建领域模型 / Mapper / SQL 与执行器接口，再实现控制器与 DTO；前端采用框架无关的 `TaskFeed` 类承载轮询语义，UI 只做展示与交互。
4. **验证驱动修正**：通过 JUnit、Vitest、隔离 MySQL 的 curl 流程、Headless Chrome 截图和 DevTools Protocol 交互逐项验证，不把“代码写完”当作“功能完成”。
5. **具体案例**：
   - 前端轮询测试最初把 fake API 的“待处理请求数”当成“累计调用数”，导致 3 个用例误报；定位后改为独立累计计数器，测试通过并继续验证重试路径。
   - 身份弹窗在首轮截图里被顶部裁切。分析发现 `.modal-backdrop` 的 `position: fixed` 被带有 `backdrop-filter` 的 sticky header 当作包含块，于是改用 React Portal 把弹窗挂到 `document.body`，重新截图确认居中且可滚动。
   - 启动恢复、跨用户 404、无效图片内容、非法模拟参数等均通过真实 HTTP 请求验证，而不是只阅读代码。

未提交私人聊天记录、账号或完整提示词。

## 15. 素材与代码来源

- 业务代码为本项目原创，使用 Next.js、Spring Boot、MyBatis 官方脚手架与库。
- 模板封面使用本地保存的 Unsplash 摄影，来源列于文末。示例结果为项目自行绘制的 SVG。
- 任务结果：运行时由用户上传图片 + Java2D 动态生成，不使用外部 AI 或图库。
- 未复用第三方开源业务代码；依赖及版本见 `frontend/package-lock.json` 与 `backend/pom.xml`。

## 16. 验收版本

- 仓库根目录标签：**`acceptance-2026-11-07`**
- 该标签指向包含本 README、全部源码、测试、CI、Compose 与初始化数据的验收提交。
- 推送后可在 GitHub Releases / Tags 中查看；克隆后也可直接 `git checkout acceptance-2026-11-07`。

```bash
git push origin main --tags
```

### 模板封面摄影来源

封面使用 Unsplash 摄影，照片内嵌于原有 SVG 地址，运行时从本地读取。示例生成结果沿用项目插画。

- travel-postcard · https://images.unsplash.com/photo-1464822759023-fed622ff2c3b
- city-skyline · https://images.unsplash.com/photo-1519501025264-65ba15a82390
- pet-portrait · https://images.unsplash.com/photo-1517849845537-4d257902454a
- pet-duo · https://images.unsplash.com/photo-1548199973-03cce0bbc87b
- wedding-invite · https://images.unsplash.com/photo-1519741497674-611481863552
- anniversary · https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2
- duo-collage · https://images.unsplash.com/photo-1472396961693-142e6e269027
- holiday-card · https://images.unsplash.com/photo-1482517967863-00e15c9b44be

### 本地试用照片

以下本地 JPEG 用于主页轮播和模板素材。

- mountain-travel.jpg · https://images.unsplash.com/photo-1464822759023-fed622ff2c3b
- city-travel.jpg · https://images.unsplash.com/photo-1519501025264-65ba15a82390
- dogs-outdoors.jpg · https://images.unsplash.com/photo-1548199973-03cce0bbc87b
- pet-portrait.jpg · https://images.unsplash.com/photo-1517849845537-4d257902454a
- wedding-portrait.jpg · https://images.unsplash.com/photo-1519741497674-611481863552
- wedding-detail.jpg · https://images.unsplash.com/photo-1519225421980-715cb0215aed

- portrait-in-shadow.jpg · https://images.unsplash.com/photo-1500648767791-00dcc994a43e
- winter-lights.jpg · https://images.unsplash.com/photo-1482517967863-00e15c9b44be
- winter-evergreen.jpg · https://images.unsplash.com/photo-1512389142860-9c449e58a543

### 新增模板封面来源

- alpine-journal.jpg · https://images.unsplash.com/photo-1470770841072-f978cf4d019e
- city-weekend.jpg · https://images.unsplash.com/photo-1519608487953-e999c86e7455
- journey-pair.jpg · https://images.unsplash.com/photo-1501785888041-af3ef285b470
- pet-closeup.jpg · https://images.unsplash.com/photo-1587300003388-59208cc962cb
- park-pals.jpg · https://images.unsplash.com/photo-1552053831-71594a27632d
- wedding-moments.jpg · https://images.unsplash.com/photo-1511285560929-80b456fea0bc
- anniversary-print.jpg · https://images.unsplash.com/photo-1523438885200-e635ba2c371e
- portrait-pair.jpg · https://images.unsplash.com/photo-1524504388940-b1c1722653e1
- evergreen-card.jpg · https://images.unsplash.com/photo-1543589077-47d81606c1bf
