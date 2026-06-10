import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'
import { logger } from './logger'
import {
  PACKAGE_DIR,
  PACKAGE_POINTER_FILE,
  PACKAGE_SLOT_A,
  PACKAGE_SLOT_B
} from '@shared/constants'
import type {
  BindingsConfig,
  DisplaysConfig,
  HubConfig,
  Manifest,
  ManifestFile,
  ScenesConfig
} from '@shared/types'
import { aggregateChecksum, sha256File } from './hash'

/**
 * 已加载的项目包视图。
 */
export interface LoadedPackage {
  rootPath: string
  /**
   * 协议服务根目录（exhi-pkg:// 文件查找用）。
   * Route B 结构：contents/ 在各自 deploy/<id>/contents/，与 rootPath 相同。
   * 生产槽位两者也相同。保留字段以便将来扩展。
   */
  contentRoot: string
  /** 当前激活的槽位名（如 "slot-a"），若是 dev fallback 则为 null */
  slot: string | null
  manifest: Manifest
  displays: DisplaysConfig
  scenes: ScenesConfig
  bindings: BindingsConfig
  /** 可选的项目级中控连接配置（hub.json）；不存在则为 null */
  hub: HubConfig | null
}

/**
 * 项目包加载器（M5 升级版）。
 *
 * 双槽：
 *   userData/packages/slot-a/
 *   userData/packages/slot-b/
 *   userData/packages/current.txt   ← "slot-a" or "slot-b"
 *
 * 启动流程：
 *   1. 读 current.txt 指向的槽 → 校验 → OK 加载
 *   2. 若失败，尝试另一个槽（自动回滚）
 *   3. 都不行，dev 用工程目录 fallback，prod 用 resources 种子包
 *
 * 切槽流程（content-sync 调用）：
 *   1. 写新包到非激活槽
 *   2. 校验新槽 (verifyPackage)
 *   3. 写 current.txt → 调用方负责重启
 *
 * 校验策略：
 *   - manifest.files 存在 → 逐文件 SHA256 校验
 *   - 否则只校验 manifest.json 能解析、defaultScene 存在
 *   - manifest.checksum 存在 → 额外校验聚合 hash
 */
export class PackageLoader {
  private packageRoot: string
  private defaultProject: string

  constructor() {
    this.packageRoot = path.join(app.getPath('userData'), PACKAGE_DIR)
    // 优先级：dev 环境变量 > resources/default-project.txt（打包时写入）
    this.defaultProject =
      process.env['EXHI_DEV_PACKAGE'] || PackageLoader.readDefaultProjectFile() || ''
  }

  private static readDefaultProjectFile(): string | null {
    try {
      const filePath = path.join(process.resourcesPath, 'default-project.txt')
      const val = fs.readFileSync(filePath, 'utf-8').trim()
      return val || null
    } catch {
      return null
    }
  }

  /** 启动期加载当前激活包 */
  load(): LoadedPackage {
    const { rootPath, contentRoot, slot } = this.resolveActivePackagePath()
    logger.info(`加载项目包: ${rootPath} (slot=${slot ?? 'dev-fallback'})`)

    const pkg = this.readPackage(rootPath)
    logger.info(`项目包: ${pkg.manifest.projectId} v${pkg.manifest.version}`)
    return { rootPath, contentRoot, slot, ...pkg }
  }

  /** 读取并解析一个项目包目录（不切换、不写 pointer） */
  readPackage(rootPath: string): {
    manifest: Manifest
    displays: DisplaysConfig
    scenes: ScenesConfig
    bindings: BindingsConfig
    hub: HubConfig | null
  } {
    const manifest = this.readJson<Manifest>(path.join(rootPath, 'manifest.json'))
    this.checkRuntimeCompatibility(manifest)
    const displays = this.readJson<DisplaysConfig>(path.join(rootPath, 'displays.json'))

    // 合并 displays/ 目录下独立的 display 配置文件（如 baima-research 的各屏分散配置）
    const displaysDir = path.join(rootPath, 'displays')
    if (fs.existsSync(displaysDir) && fs.statSync(displaysDir).isDirectory()) {
      for (const entry of fs.readdirSync(displaysDir)) {
        if (!entry.endsWith('.json')) continue
        try {
          const alt = JSON.parse(
            fs.readFileSync(path.join(displaysDir, entry), 'utf-8')
          ) as Partial<DisplaysConfig>
          if (alt.displays?.length) {
            for (const d of alt.displays) {
              if (!displays.displays.find((existing) => existing.id === d.id)) {
                displays.displays.push(d)
              }
            }
          }
        } catch {
          /* 文件不存在或解析失败，忽略 */
        }
      }
    }
    const scenes = this.readJson<ScenesConfig>(path.join(rootPath, 'scenes.json'))
    const bindings = this.readJson<BindingsConfig>(path.join(rootPath, 'bindings.json'))
    const hub = this.readOptionalJson<HubConfig>(path.join(rootPath, 'hub.json'))
    this.validateBasic(displays, scenes)
    return { manifest, displays, scenes, bindings, hub }
  }

  /** 取另一个槽位名（用于切换/回滚） */
  otherSlot(slot: string): string {
    return slot === PACKAGE_SLOT_A ? PACKAGE_SLOT_B : PACKAGE_SLOT_A
  }

  /** 槽位的绝对路径 */
  slotPath(slot: string): string {
    return path.join(this.packageRoot, slot)
  }

  /** 当前激活槽（读 current.txt，不存在则返回 null） */
  currentSlot(): string | null {
    const pointer = path.join(this.packageRoot, PACKAGE_POINTER_FILE)
    if (!fs.existsSync(pointer)) return null
    const slot = fs.readFileSync(pointer, 'utf-8').trim()
    return slot || null
  }

  /** 写指针（原子操作：先写 tmp 再 rename，避免半写） */
  writePointer(slot: string) {
    fs.mkdirSync(this.packageRoot, { recursive: true })
    const target = path.join(this.packageRoot, PACKAGE_POINTER_FILE)
    const tmp = target + '.tmp'
    fs.writeFileSync(tmp, slot, 'utf-8')
    fs.renameSync(tmp, target)
    logger.info(`指针已切换到 ${slot}`)
  }

  /**
   * 校验一个项目包目录的完整性。
   * 失败抛错；调用方应 try-catch 来决定回滚/上报。
   */
  async verifyPackage(rootPath: string): Promise<void> {
    if (!this.isValidPackage(rootPath)) {
      throw new Error(`不是有效的项目包: ${rootPath}`)
    }
    // 先校验四个核心 JSON 能解析
    this.readPackage(rootPath)

    // 文件级 SHA256（若 manifest 提供了 files）
    const manifest = this.readJson<Manifest>(path.join(rootPath, 'manifest.json'))
    if (manifest.files?.length) {
      logger.info(`校验项目包 ${manifest.files.length} 个文件...`)
      for (const f of manifest.files) {
        const full = path.join(rootPath, f.path)
        if (!fs.existsSync(full)) {
          throw new Error(`文件缺失: ${f.path}`)
        }
        const stat = fs.statSync(full)
        if (stat.size !== f.size) {
          throw new Error(`文件大小不符: ${f.path} expected=${f.size} got=${stat.size}`)
        }
        const got = await sha256File(full)
        if (got !== f.sha256) {
          throw new Error(`文件 sha256 不符: ${f.path}`)
        }
      }
      // 聚合 checksum（如果 manifest 提供）
      if (manifest.checksum) {
        const got = aggregateChecksum(manifest.files)
        if (got !== manifest.checksum) {
          throw new Error(`整包 checksum 不符: expected=${manifest.checksum} got=${got}`)
        }
      }
      logger.info('项目包校验通过')
    } else {
      logger.info('项目包 manifest 无 files 清单，跳过 SHA256 校验（仅做基础解析）')
    }
  }

  /** 删除指定槽（content-sync 在下载前清空目标槽用） */
  clearSlot(slot: string) {
    const p = this.slotPath(slot)
    if (fs.existsSync(p)) {
      fs.rmSync(p, { recursive: true, force: true })
      logger.info(`已清空槽 ${slot}`)
    }
  }

  /** 确保槽目录存在 */
  ensureSlotDir(slot: string): string {
    const p = this.slotPath(slot)
    fs.mkdirSync(p, { recursive: true })
    return p
  }

  // ============ 内部 ============

  /**
   * 解析当前激活包路径（含自动回滚）。
   * rootPath  —— JSON 配置读取根（manifest / scenes / displays / bindings）
   * contentRoot —— exhi-pkg:// 文件服务根（含 contents/；dev Vite 工程下与 rootPath 不同）
   */
  private resolveActivePackagePath(): {
    rootPath: string
    contentRoot: string
    slot: string | null
  } {
    // 0. dev 模式下若显式设置了 EXHI_DEV_PACKAGE，优先加载（跳过槽检查）
    if (!app.isPackaged && this.defaultProject) {
      const devPath = path.join(app.getAppPath(), 'packages', this.defaultProject)
      if (this.isValidPackage(devPath)) {
        logger.info('开发模式加载指定项目包:', devPath)
        // Route B 结构：contents/ 直接在 deploy/<id>/ 内部，contentRoot === rootPath
        return { rootPath: devPath, contentRoot: devPath, slot: null }
      }
    }

    // 0.5 生产模式：若 exe 内嵌种子版本 > 槽版本，强制用种子覆盖槽（安装新 exe 后生效）
    if (app.isPackaged && this.defaultProject) {
      const seedPath = path.join(process.resourcesPath, 'packages', this.defaultProject)
      if (this.isValidPackage(seedPath)) {
        try {
          const seedManifest = this.readJson<Manifest>(path.join(seedPath, 'manifest.json'))
          const current0 = this.currentSlot()
          const slotPath0 = current0 ? this.slotPath(current0) : this.slotPath(PACKAGE_SLOT_A)
          let slotVersion = ''
          if (this.isValidPackage(slotPath0)) {
            try {
              const slotManifest = this.readJson<Manifest>(path.join(slotPath0, 'manifest.json'))
              if (slotManifest.projectId === seedManifest.projectId) {
                slotVersion = slotManifest.version
              }
            } catch {}
          }
          if (slotVersion !== seedManifest.version) {
            logger.info(
              `种子版本 ${seedManifest.version} ≠ 槽版本 ${slotVersion || '(无)'}，覆盖 slot-a`
            )
            fs.rmSync(this.slotPath(PACKAGE_SLOT_A), { recursive: true, force: true })
            copyDir(seedPath, this.slotPath(PACKAGE_SLOT_A))
            this.writePointer(PACKAGE_SLOT_A)
            return {
              rootPath: this.slotPath(PACKAGE_SLOT_A),
              contentRoot: this.slotPath(PACKAGE_SLOT_A),
              slot: PACKAGE_SLOT_A
            }
          }
        } catch (e) {
          logger.warn('种子版本检查失败，跳过:', e)
        }
      }
    }

    // 1. 双槽 + 指针，失败自动回滚到另一个槽
    const current = this.currentSlot()
    const slots = current ? [current, this.otherSlot(current)] : [PACKAGE_SLOT_A, PACKAGE_SLOT_B]
    for (const slot of slots) {
      const p = this.slotPath(slot)
      if (this.isValidPackage(p)) {
        // projectId 不匹配 → 跳过（防止旧项目的槽被错误加载）
        try {
          const m = this.readJson<Manifest>(path.join(p, 'manifest.json'))
          if (this.defaultProject && m.projectId !== this.defaultProject) {
            logger.warn(
              `槽 ${slot} projectId=${m.projectId} 与期望 ${this.defaultProject} 不符，跳过`
            )
            continue
          }
        } catch {
          continue
        }
        // 与当前指针不一致 → 自动回滚指针
        if (current && slot !== current) {
          logger.warn(`指针 ${current} 的槽无效，回滚到 ${slot}`)
          this.writePointer(slot)
        }
        return { rootPath: p, contentRoot: p, slot }
      }
    }

    // 2. dev 模式无槽且无 EXHI_DEV_PACKAGE → 给出明确提示
    if (!app.isPackaged) {
      throw new Error('开发模式找不到项目包，请设置 EXHI_DEV_PACKAGE（如 npm run dev:yushui）')
    }

    // 3. 生产种子（首次安装，槽完全为空）
    if (app.isPackaged) {
      const seedPath = path.join(process.resourcesPath, 'packages', this.defaultProject)
      if (this.isValidPackage(seedPath)) {
        const target = this.slotPath(PACKAGE_SLOT_A)
        logger.info('首次启动，从种子包复制到 slot-a')
        copyDir(seedPath, target)
        this.writePointer(PACKAGE_SLOT_A)
        return { rootPath: target, contentRoot: target, slot: PACKAGE_SLOT_A }
      }
    }

    throw new Error(`找不到可用的项目包。已查找：${this.packageRoot}, 以及种子包目录。请检查部署。`)
  }

  private isValidPackage(p: string): boolean {
    return fs.existsSync(path.join(p, 'manifest.json'))
  }

  /** 读取可选 JSON 文件，不存在或解析失败返回 null（不抛错） */
  private readOptionalJson<T>(filePath: string): T | null {
    if (!fs.existsSync(filePath)) return null
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T
    } catch (e) {
      logger.warn(`可选配置解析失败，忽略 ${filePath}: ${(e as Error).message}`)
      return null
    }
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
    logger.info(
      `项目包: ${manifest.projectId} v${manifest.version}, 要求 Runtime ${manifest.runtimeRange}, 当前 ${app.getVersion()}`
    )
  }

  private validateBasic(displays: DisplaysConfig, scenes: ScenesConfig) {
    if (!displays.displays?.length) {
      throw new Error('displays.json 必须至少声明一个 display')
    }
    for (const d of displays.displays) {
      if (!scenes.scenes[d.defaultScene]) {
        throw new Error(
          `display "${d.id}" 的 defaultScene "${d.defaultScene}" 未在 scenes.json 中定义`
        )
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

/** 用于 ManifestFile[] 跟磁盘对比，返回缺失/需更新的文件清单（增量同步用） */
export async function diffManifestFiles(
  rootPath: string,
  files: ManifestFile[]
): Promise<{ missing: ManifestFile[]; valid: ManifestFile[] }> {
  const missing: ManifestFile[] = []
  const valid: ManifestFile[] = []
  for (const f of files) {
    const full = path.join(rootPath, f.path)
    if (!fs.existsSync(full)) {
      missing.push(f)
      continue
    }
    const stat = fs.statSync(full)
    if (stat.size !== f.size) {
      missing.push(f)
      continue
    }
    const got = await sha256File(full)
    if (got !== f.sha256) {
      missing.push(f)
      continue
    }
    valid.push(f)
  }
  return { missing, valid }
}
