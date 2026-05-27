# packages/project · 白马项目工程源码

白马展厅客户端的 Vue 3 内容工程。包含多个展区的展示页面，通过 Vite 多页面构建，最终由 `dist-cli` 组装成可部署包交付给 Runtime 加载。

---

## 展区清单

| 展区 ID                | 源码目录                    | 说明                          |
| ---------------------- | --------------------------- | ----------------------------- |
| `baima-yushui-leaders` | `src/baima-yushui-leaders/` | 渝水新景 + 领导关怀（触摸屏） |
| `baima-milestone`      | `src/baima-milestone/`      | 白马里程碑滑轨屏              |
| `baima-duowei`         | `src/baima-duowei/`         | 多维筑安（智慧技术/标准化/安全活动） |

每个展区在 `deploy/` 下有对应的部署配置（manifest / scenes / displays / bindings）。

---

## 目录结构

```
packages/project/
├── src/
│   ├── shared/                    # 各展区共享组件、动效、工具
│   ├── baima-<展区ID>/            # 各展区 Vue 应用（每个含 index.html + main.ts + App.vue）
│   └── ...
├── deploy/
│   ├── <展区ID>/                  # 各展区部署配置
│   │   ├── manifest.json          # projectId、版本、runtimeRange
│   │   ├── scenes.json            # 场景定义
│   │   ├── displays.json          # 屏幕 / 分辨率 / fitPolicy
│   │   └── bindings.json          # 指令绑定 + macro
│   └── ...
├── contents/                      # 静态素材（图片 / 视频 / 字体等，按展区分目录）
│   ├── home/
│   ├── yushui/
│   ├── yushui-slices/
│   ├── leader-slices/
│   └── ...
├── dist/                          # Vite 构建产物（gitignore）
├── vite.config.ts                 # 多页面 Vite 配置
├── tsconfig.json
└── package.json
```

---

## 路径别名

| 别名                 | 指向                         |
| -------------------- | ---------------------------- |
| `@shared/*`            | `src/shared/*`             |
| `@baima-<展区ID>/*`   | `src/baima-<展区ID>/*`     |
| `@assets/*`            | `contents/*`               |

具体别名参见 `vite.config.ts` 和 `tsconfig.json` 中的 paths 配置。

---

## 本地开发

需要两个终端：

**终端 1** — 启动 Vite dev server（5174 端口，同时服务所有展区）：

```bash
cd packages/project
npm run dev              # 浏览器打开默认展区
npm run dev:<展区>       # 浏览器打开指定展区
```

**终端 2** — 从根目录启动 Electron，加载对应展区：

```bash
# 在项目根目录
npm run dev:<展区>      # 如 dev:yushui / dev:milestone / dev:duowei
```

Electron 通过 `exhi-pkg://` 协议将内容请求代理到终端 1 的 5174 server，修改 Vue 组件后 Electron 窗口自动热更新。

> 如果还需要联调 hub 指令，在第三个终端运行 `npm run hub`（已内置于 dev:yushui / dev:milestone 脚本的 `EXHI_HUB_URL`）。

---

## 构建 & 打包

### 仅构建（Vite）

```bash
cd packages/project
npm run build
# 产物：dist/<展区ID>/  dist/assets/
```

### 打包成可部署 exe（从根目录）

```bash
npm run dist:<展区>      # 如 dist:yushui / dist:milestone / dist:duowei
```

打包流程：

1. `pkg-assemble`：Vite build → 合并 `dist/` + `deploy/<id>/` + `contents/` → `build/<id>/packages/<id>/`
2. `electron-vite build`：编译 Runtime
3. `electron-builder`：打包 NSIS 安装包 → `build/<id>/exhi-<id>-x.x.x-x64.exe`

### 加速重打（已有 dist/）

```bash
npm run dist:yushui -- --skip-assemble   # 跳过 Vite build
npm run dist:yushui -- --dir             # 只打免安装目录，不生成 NSIS
```

### 类型检查

```bash
cd packages/project
npm run typecheck
```

---

## 新增展区

1. **源码**：在 `src/` 下新建展区目录（如 `src/baima-newarea/`），入口为 `index.html` + `main.ts`。

2. **Vite 配置**：`vite.config.ts` 的 `rollupOptions.input` 和 `resolve.alias` 加入新展区。

3. **tsconfig**：`paths` 加入新别名。

4. **部署配置**：在 `deploy/` 下新建对应目录，编写 `manifest.json`、`scenes.json`、`displays.json`、`bindings.json`。

5. **素材**：静态素材放 `contents/<展区目录>/`。

6. **根目录脚本**：`package.json` 加 `dist:<新展区>` 脚本（参考现有条目）。
