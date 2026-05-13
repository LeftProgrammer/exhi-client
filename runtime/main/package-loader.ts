import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'
import { logger } from './logger'
import {
  PACKAGE_DIR,
  PACKAGE_POINTER_FILE,
  PACKAGE_SLOT_A,
  PACKAGE_SLOT_B,
  RUNTIME_VERSION
} from '@shared/constants'
import type {
  BindingsConfig,
  DisplaysConfig,
  Manifest,
  ScenesConfig
} from '@shared/types'

/**
 * 已加载的项目包视图。
 */
export interface LoadedPackage {
  rootPath: string
  manifest: Manifest
  displays: DisplaysConfig
  scenes: ScenesConfig
  bindings: BindingsConfig
}

/**
 * 项目包加载器。
 *
 * 目录结构（开发期 / 生产期略有差异）：
 *   userData/packages/slot-a/<project package files>
 *   userData/packages/slot-b/...
 *   userData/packages/current.txt   ← 指向 slot-a 或 slot-b
 *
 * 开发期若 userData 下无项目包，会自动 fallback 到工程内的 packages/<defaultProject>。
 * 生产期若 userData 下无项目包，会从 resources/packages 拷贝种子包。
 */
export class PackageLoader {
  private packageRoot: string
  /** 默认项目包名（开发期 fallback / 种子包目录名） */
  private defaultProject = 'demo-hall'

  constructor() {
    this.packageRoot = path.join(app.getPath('userData'), PACKAGE_DIR)
  }

  load(): LoadedPackage {
    const targetPath = this.resolveActivePackagePath()
    logger.info('加载项目包:', targetPath)

    const manifest = this.readJson<Manifest>(path.join(targetPath, 'manifest.json'))
    this.checkRuntimeCompatibility(manifest)

    const displays = this.readJson<DisplaysConfig>(path.join(targetPath, 'displays.json'))
    const scenes = this.readJson<ScenesConfig>(path.join(targetPath, 'scenes.json'))
    const bindings = this.readJson<BindingsConfig>(path.join(targetPath, 'bindings.json'))

    this.validateBasic(displays, scenes)

    return { rootPath: targetPath, manifest, displays, scenes, bindings }
  }

  /**
   * 解析当前激活包路径。
   * 优先：userData/packages/<slot> → 否则 fallback。
   */
  private resolveActivePackagePath(): string {
    // 1. 检查 userData 下的双槽指针
    const pointer = path.join(this.packageRoot, PACKAGE_POINTER_FILE)
    if (fs.existsSync(pointer)) {
      const slotName = fs.readFileSync(pointer, 'utf-8').trim()
      const slotPath = path.join(this.packageRoot, slotName)
      if (this.isValidPackage(slotPath)) {
        return slotPath
      }
      logger.warn('指针指向的槽位无效，尝试回退')
    }

    // 2. 尝试两个槽
    for (const slot of [PACKAGE_SLOT_A, PACKAGE_SLOT_B]) {
      const slotPath = path.join(this.packageRoot, slot)
      if (this.isValidPackage(slotPath)) return slotPath
    }

    // 3. 开发期 fallback：工程目录下的 packages/<default>
    if (!app.isPackaged) {
      const devPath = path.join(app.getAppPath(), 'packages', this.defaultProject)
      if (this.isValidPackage(devPath)) {
        logger.info('开发模式 fallback 到工程内项目包:', devPath)
        return devPath
      }
    }

    // 4. 生产期：从 resources 拷贝种子包到 slot-a
    if (app.isPackaged) {
      const seedPath = path.join(process.resourcesPath, 'packages', this.defaultProject)
      if (this.isValidPackage(seedPath)) {
        const target = path.join(this.packageRoot, PACKAGE_SLOT_A)
        logger.info('首次启动，从种子包复制到 slot-a')
        copyDir(seedPath, target)
        this.writePointer(PACKAGE_SLOT_A)
        return target
      }
    }

    throw new Error(
      `找不到可用的项目包。已查找：${this.packageRoot}, 以及种子包目录。请检查部署。`
    )
  }

  private isValidPackage(p: string): boolean {
    return fs.existsSync(path.join(p, 'manifest.json'))
  }

  private writePointer(slot: string) {
    fs.mkdirSync(this.packageRoot, { recursive: true })
    fs.writeFileSync(path.join(this.packageRoot, PACKAGE_POINTER_FILE), slot, 'utf-8')
  }

  private readJson<T>(filePath: string): T {
    if (!fs.existsSync(filePath)) {
      throw new Error(`项目包缺少文件: ${filePath}`)
    }
    const raw = fs.readFileSync(filePath, 'utf-8')
    try {
      return JSON.parse(raw) as T
    } catch (e) {
      throw new Error(`项目包文件解析失败 ${filePath}: ${(e as Error).message}`)
    }
  }

  private checkRuntimeCompatibility(manifest: Manifest) {
    // 简单版本检查：仅做记录提示，正式版用 semver 库
    logger.info(
      `项目包: ${manifest.projectId} v${manifest.version}, 要求 Runtime ${manifest.runtimeRange}, 当前 ${RUNTIME_VERSION}`
    )
  }

  private validateBasic(displays: DisplaysConfig, scenes: ScenesConfig) {
    if (!displays.displays?.length) {
      throw new Error('displays.json 必须至少声明一个 display')
    }
    for (const d of displays.displays) {
      if (!scenes.scenes[d.defaultScene]) {
        throw new Error(`display "${d.id}" 的 defaultScene "${d.defaultScene}" 未在 scenes.json 中定义`)
      }
    }
  }
}

function copyDir(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name)
    const d = path.join(dest, entry.name)
    if (entry.isDirectory()) copyDir(s, d)
    else fs.copyFileSync(s, d)
  }
}
