# 项目包结构约定

给工程师看：如何在 `packages/<your-project>/` 下组织代码、配置和素材。

---

## 整体目录

```
packages/<project-id>/
├── package.json                  ← workspace 子包（name = @exhi-pkg/<id>）
├── vite.config.ts                ← 多页面入口，每块屏一个
├── tsconfig.json
│
├── deploy/                       ⭐ 部署配置目录（每个可部署展区一个子目录）
│   └── <screen-id>/
│       ├── manifest.json         ← projectId / version / runtimeRange
│       ├── displays.json         ← 屏幕清单（每块屏 match + designBase）
│       ├── scenes.json           ← 场景定义（type + src + 配置）
│       └── bindings.json         ← 中控指令绑定 + macros + standalone
│
├── actions.js                    （可选）项目专属自定义 Action
│
├── src/                          ⭐⭐ 业务代码（Vite root）
│   ├── <screen-id>/              每块屏一个子目录 = 一个 Vite 入口
│   │   ├── index.html
│   │   ├── main.ts
│   │   ├── App.vue
│   │   ├── components/
│   │   └── ...
│   └── shared/                   项目内多屏共享
│       ├── styles/               tokens.scss / mixins.scss / reset.scss
│       ├── composables/          useBridge.ts 等
│       ├── components/
│       └── utils/
│
├── contents/                     ⭐ 视频/图片/字体素材（不经 Vite 处理）
│   └── <screen-id>/
│
├── dist/                         ← Vite build 输出（gitignore）
└── README.md                     项目说明（甲方/硬件清单/上线节奏）
```

### 关键约束

- **部署配置**（manifest / displays / scenes / bindings）在 `deploy/<screen-id>/` 子目录，一个展区一套
- **业务代码**写在 `src/<screen-id>/`，每屏一个子目录 = 一个 Vite multi-page 入口
- **媒体素材**（视频/大图/字体）放 `contents/`，**不经过 Vite 打包**
- `scenes.json` 的 `src` 字段一律指 `contents/<screen-id>/...`，dev 和 prod 一致

---

## 双轨：Vite 工程 vs 纯 HTML 项目包

### 形态 A：Vite 工程（推荐，新项目用）

业务代码用 Vue / TS 写，开发期 HMR + Electron 联调，打包出可部署 exe。

开发工作流（两个终端）：

```bash
# 终端 1（内容页 Vite dev server，5174 端口）
cd packages/<project>
npm run dev

# 终端 2（Electron，加载指定展区）
npm run dev:<screen>     # 如 dev:yushui、dev:milestone
```

打包：

```bash
npm run dist:<screen>    # 如 dist:yushui（pkg-assemble + 编译 + electron-builder）
```

### 形态 B：纯 HTML 项目包

没有 `vite.config.ts`，只有静态 HTML/CSS/JS 直接放在 `contents/` 下。适合纯播视频 / 简单展示，无需构建步骤。`pkg-assemble` 直接扫描 + 计算 SHA256。

`packages/test-pkg/` 就是形态 B 的示例。

---

## 加一块屏的完整步骤（形态 A）

以加"新展区"触摸屏为例：

### 1. 写部署配置

`deploy/new-area/displays.json`：

```json
{
  "displays": [
    {
      "id": "touch-new",
      "match": { "size": "1080x1920" },
      "designBase": { "width": 1080, "height": 1920 },
      "defaultScene": "new-home",
      "fitPolicy": "scale"
    }
  ]
}
```

`deploy/new-area/scenes.json`：

```json
{
  "scenes": {
    "new-home": {
      "type": "web",
      "src": "contents/new-area/index.html",
      "allowInteraction": true,
      "injectBridge": true
    }
  }
}
```

### 2. 写业务代码

```
src/new-area/
├── index.html
├── main.ts
├── App.vue
└── components/
```

### 3. 注册 Vite 入口

`vite.config.ts` 的 `rollupOptions.input` 加一行：

```ts
input: {
  'existing-screen': resolve(__dirname, 'src/existing-screen/index.html'),
  'new-area':        resolve(__dirname, 'src/new-area/index.html')
}
```

`tsconfig.json` 的 `paths` 加对应别名：

```json
"@new-area/*": ["src/new-area/*"]
```

### 4. 加 dev 脚本

根目录 `package.json` 加：

```json
"dev:new": "chcp 65001 >nul && set EXHI_HUB_URL=ws://localhost:18080&& set EXHI_DEV_PACKAGE=project/deploy/new-area&& electron-vite dev",
"dist:new": "chcp 65001 >nul && node tools/dist-cli/bin.mjs new-area"
```

### 5. 跑起来

```bash
# 终端 1：内容页 dev server
cd packages/project && npm run dev

# 终端 2：Electron（联调 hub）
npm run dev:new

# 终端 3：Mock Hub
npm run hub

# 切场景
npm run hub:goto -- --sceneId=new-home --display=touch-new
```

---

## 业务代码该写哪里

- **触摸交互 / 相册 / 时间轴**→ `src/<screen>/`，本屏业务就在这里
- **项目内多屏共享** → `src/shared/`（样式 token、共用组件、useBridge 封装）
- **媒体素材** → `contents/<screen>/`（图片/视频/字体，不走 Vite）
- **项目专属系统动作** → 根目录 `actions.js`

---

## actions.js

在项目包根目录放 `actions.js` 可以注册项目专属 Action，无需修改 Runtime：

```js
export default function register(exhi) {
  exhi.registerAction('project.closing-curtain', async ({ params }) => {
    // 实现逻辑
    return { ok: true }
  })
}
```

`bindings.json` 里直接引用：

```json
{ "on": "cmd.scenario.closing", "do": "project.closing-curtain" }
```

约束：命名空间必须含 `.`，且不能覆盖 `scene.* / renderer.* / system.* / macro`。

---

## 路径别名

`tsconfig.json` + `vite.config.ts` 统一配置：

| 别名          | 指向                                   |
| ------------- | -------------------------------------- |
| `@shared/*`   | `src/shared/*`                         |
| `@<screen>/*` | `src/<screen>/*`（每个展区各自的别名） |
| `@assets/*`   | `contents/*`                           |

---

## 与 Runtime 的耦合点

项目包只有 4 处和 Runtime 耦合，其余全部独立：

1. **manifest.json 的 `runtimeRange`**：声明兼容的 Runtime 版本
2. **scenes.json 的 `type` 字段**：`video / image / web / composite`（Runtime 内置）
3. **`exhi-pkg://pkg/__exhi__/bridge.js`**：bridge 脚本（仅 `type: "web"` 的 iframe 场景需要引入；Vue SPA 展区不需要）
4. **bindings.json 的 `do` 字段**：`scene.* / renderer.* / system.*`（Runtime 内置 Action）

只要这 4 处不变，Runtime 升级不影响项目包。

---

## 命名规范

- **展区 id / 屏幕 id**：`kebab-case`，如 `baima-yushui-leaders`、`wall-opening`
- **场景 id**：`kebab-case`，如 `yushui-home`、`milestone-slide`
- **文件命名**：英文 / 拼音，**禁中文路径**
- **项目 id**：`<地区>-<主题>`，如 `baima-yushui-leaders`、`chongqing-port`

---

## 快速 checklist

新建展区时：

- [ ] `deploy/<id>/manifest.json`：projectId 唯一、version 为 semver
- [ ] `deploy/<id>/displays.json`：match + designBase 与硬件分辨率一致
- [ ] `deploy/<id>/scenes.json`：每个 display.defaultScene 都有定义
- [ ] `deploy/<id>/bindings.json`：至少有 `cmd.gotoScene` 绑定
- [ ] Vite 入口已注册（`vite.config.ts` + `tsconfig.json`）
- [ ] 若含 `type: "web"` 的 iframe 场景，其 HTML 需引入 `<script src="exhi-pkg://pkg/__exhi__/bridge.js"></script>`（Vue SPA 展区不需要）
- [ ] 触摸屏内容：禁右键、`user-select: none`、按钮 ≥ 88px
- [ ] 根目录加 `dev:<id>` 和 `dist:<id>` 脚本

详细素材规范见 [CONTENT-GUIDE.md](./CONTENT-GUIDE.md)。

---

## 工程化保障

| 工具            | 作用                                |
| --------------- | ----------------------------------- |
| **ESLint**      | 静态检查；`npm run lint / lint:fix` |
| **Prettier**    | 格式化；`npm run format`            |
| **Husky**       | pre-commit + commit-msg hook        |
| **lint-staged** | 只检查暂存区文件                    |
| **commitlint**  | 约定式 commit message               |
| **vue-tsc**     | 全量类型检查；`npm run typecheck`   |

**commit message 约定**：

```
feat(project): 加领导关怀照片墙
fix(runtime): 修复 dev proxy EINVAL
docs: 更新 PROJECT-STRUCTURE
chore: 升级 Electron 33.x
```

**辅助命令**：

```bash
npm run dev:status   # 查当前槽状态 / device-id / 心跳
npm run dev:reset    # 清空运行时残留（槽/指针/心跳/队列）
```

---

## 第三方库（根目录已收录）

- **GSAP** — 动画引擎（时间轴 / 缓动 / 序列）
- **@vueuse/core** — Vue 工具集合

子包通过 npm workspaces 自动共享，直接 `import` 即可。
