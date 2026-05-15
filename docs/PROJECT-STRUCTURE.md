# 项目包结构约定

> 给工程师看：怎么在 `packages/<your-project>/` 下组织代码、配置和素材。
> 这份文档是未来"模板项目"的雏形——白马项目稳定后会基于实际经验抽出 `__template__/` + `create-exhi-project` 脚手架。

---

## 整体目录

```
packages/<project-id>/
├── package.json                  ← workspace 子包，内部 npm scripts: dev / build
├── vite.config.ts                ← 多页面入口，每块屏一个
├── tsconfig.json
│
├── manifest.json                 ⭐ 项目元信息（projectId / version / runtimeRange）
├── displays.json                 ⭐ 屏幕清单（每块屏 match + designBase）
├── scenes.json                   ⭐ 场景定义（每个场景 type + src + 配置）
├── bindings.json                 ⭐ 中控指令绑定 + macros + standalone
├── actions.js                    （可选）项目专属自定义 Action
│
├── src/                          ⭐⭐ 业务代码主战场（Vite root）
│   ├── <screen-id>/              每块屏一个子目录 = 一个 Vite 入口
│   │   ├── index.html
│   │   ├── main.ts
│   │   ├── App.vue
│   │   ├── components/           本屏专用组件
│   │   ├── data.ts / data.json   本屏数据
│   │   └── ...
│   ├── <another-screen>/
│   └── shared/                   项目内多屏共享
│       ├── styles/               theme.scss / reset.scss
│       ├── fonts/
│       ├── components/           跨屏共享业务组件
│       └── utils/
│
├── contents/                     ⭐ 视频/图片/字体素材（不经 Vite 处理）
│   ├── <screen-id>/              通常和 src/<screen-id> 对应
│   ├── shared/                   跨屏素材（logo / 通用 UI 资源）
│   └── ...
│
├── public/                       Vite 静态资源（极少用，contents/ 优先）
│
├── dist/                         ← Vite build 输出（git 忽略）
│
└── README.md                     项目自身说明（甲方/硬件清单/上线节奏）
```

### 关键约束

- **配置文件**（manifest / displays / scenes / bindings）在项目包**根目录**
- **业务代码**写在 `src/<screen-id>/`，每屏一个子目录 = 一个 Vite multi-page 入口
- **媒体素材**（视频/大图/字体）放 `contents/`——**不经过 Vite 打包**
- **vite build 产物**会被 `pkg:build` 自动合并到 `contents/<screen-id>/` 下，覆盖编译产物
- `scenes.json` 的 `src` 字段一律指 `contents/<screen-id>/...` —— **dev 和 prod 一致**

---

## 双轨：Vite 工程 vs 纯 HTML 项目包

Runtime 同时支持两种形态：

### 形态 A：Vite 工程（推荐，新项目用）

特征：项目包里有 `vite.config.ts` + `src/`。

- 业务代码用 Vue / TS 写
- 开发期 HMR：`npm run dev:content <pkg>` 启 dev server，Runtime 协议代理
- 打包：`npm run pkg:build packages/<pkg>` 自动跑 `vite build` 合并到 contents/

### 形态 B：纯 HTML 项目包（旧式，简单内容用）

特征：没有 `vite.config.ts`，只有静态 HTML/CSS/JS 直接放在 `contents/` 下。

- 适合"纯播视频 / 简单展示"的展项
- 不需要构建步骤
- `pkg:build` 跳过 vite，直接扫描 + 计算 SHA256

`packages/demo-hall/` 就是形态 B 的示范。

---

## 加一块屏的完整步骤（形态 A）

假设要加"渝水新景"触摸屏：

### 1. 加屏配置

`displays.json`：

```json
{
  "id": "touch-yushui",
  "match": { "size": "1080x1920" },
  "designBase": { "width": 1080, "height": 1920 },
  "defaultScene": "yushui-home"
}
```

### 2. 加场景

`scenes.json`：

```json
"yushui-home": {
  "type": "web",
  "src": "contents/touch-yushui/index.html",
  "allowInteraction": true,
  "injectBridge": true
}
```

### 3. 写代码

```
src/touch-yushui/
├── index.html
├── main.ts
├── App.vue
└── components/
```

### 4. 注册 Vite 入口

`vite.config.ts` 的 `rollupOptions.input` 加一行：

```ts
input: {
  hello: resolve(__dirname, 'src/hello/index.html'),
  'touch-yushui': resolve(__dirname, 'src/touch-yushui/index.html')
}
```

### 5. 跑起来

```bash
# 终端 1
npm run hub

# 终端 2
npm run dev:content baima-exhibition

# 终端 3
npm run dev:online

# 终端 4
npm run hub:goto -- --sceneId=yushui-home --display=touch-yushui
```

---

## 业务代码该写哪里？

### 触摸交互、相册、地图、时间轴 → `src/<screen>/`

每块屏的业务代码就在这里。第 1 个项目**不要试图抽到公共目录**——重复也无所谓，等多个项目都用上同一段代码再考虑沉淀。

### 多屏共用的（项目内）→ `src/shared/`

- 项目色调 / 字体 / 排版基线 → `src/shared/styles/theme.scss`
- 跨屏共用业务组件（如"白马 logo 头部"）→ `src/shared/components/`
- 工具函数 → `src/shared/utils/`

### 跨项目共用的 → 暂时不抽，记录下来

到第 2 个项目时再判断哪些是真通用、抽到 `packages/content-lib/`（M11+ 计划）。

### 项目专属系统级动作 → `actions.js`

需要从 bindings.json 调出来的项目专属能力（如"白马闭馆动画"），写在根目录 `actions.js`：

```js
// actions.js
export default function register(exhi) {
  exhi.registerAction('baima.closing-curtain', async () => {
    // 实现
    return { ok: true }
  })
}
```

`bindings.json` 里就能用：

```json
{ "on": "cmd.scenario.closing", "do": "baima.closing-curtain" }
```

---

## 数据怎么写

简单数据：直接 `import data from './data.json'` 或 ts 常量。

复杂的（如多语言、CMS 拉取）：

- 静态拉取：`fetch('./data.json')` （Vite 会把 json 复制到 dist）
- 后台数据：项目自己实现，**不要让 Runtime 直接拉数据**——Runtime 只管展示

---

## 命名规范

- 屏幕 id：`kebab-case`，如 `touch-yushui`、`wall-opening`、`slide-rail-milestones`
- 场景 id：`kebab-case`，建议带屏前缀：`wall-opening` / `yushui-home`
- 文件命名：英文/拼音，**禁中文路径**
- 项目 id：`<region>-<theme>`，如 `baima-exhibition`、`chongqing-port`

---

## 与 Runtime 的耦合点

项目包**只有 4 处**和 Runtime 耦合：

1. **manifest.json 的 runtimeRange**：声明兼容的 Runtime 版本
2. **scenes.json 的 type 字段**：`video / image / web / composite`（Runtime 内置）
3. **`exhi-pkg://pkg/__exhi__/bridge.js`** 引入：让 HTML 内容能调 exhibitBridge
4. **bindings.json 的 do 字段**：`scene.* / renderer.* / system.*`（Runtime 内置 Actions）

只要这 4 处不变，Runtime 升级（Electron / Vue 升级、bug 修复）**不影响项目包**。

---

## 多项目时的目录布局

```
exhi-client/
├── runtime/                       ← Runtime（只升级一次，全项目受益）
├── packages/
│   ├── demo-hall/                 ← 演示包（纯 HTML，参考用）
│   ├── baima-exhibition/          ← 真实项目 1（Vite 工程）
│   ├── chongqing-port/            ← 真实项目 2
│   └── ...
└── tools/
```

每个项目包独立。每台展厅设备的 Runtime 启动时通过 `current.txt` 指针选择激活哪个项目包。

---

## 快速 checklist

新建项目时：

- [ ] `packages/<id>/package.json` 写好（name = `@exhi-pkg/<id>`）
- [ ] `vite.config.ts` 写好（port 5174、base './' 不变；input 改成本项目入口）
- [ ] `manifest.json`：projectId 唯一、version semver
- [ ] `displays.json`：每块屏的 match + designBase 与硬件一致
- [ ] `scenes.json`：每个 display.defaultScene 都有定义
- [ ] `bindings.json`：至少有 `cmd.gotoScene` 绑定
- [ ] `src/<screen>/index.html` 引入 `<script src="exhi-pkg://pkg/__exhi__/bridge.js"></script>`
- [ ] 触摸屏内容禁右键、user-select: none、按钮 ≥ 88px

详细规范见 [CONTENT-GUIDE.md](./CONTENT-GUIDE.md)。

---

## 沉淀路径（M11+）

第 1 个项目（白马）跑稳后，会复盘并沉淀：

- 通用组件 → `packages/content-lib/`（npm 包）
- 项目模板 → `packages/__template__/`
- 脚手架命令 → `npm run new-project <id>`

但这些**不在 M10 Mini 范围**——先做完白马，看实际经验再抽。
