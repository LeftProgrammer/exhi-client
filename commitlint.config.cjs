/**
 * commitlint：约定式 commit message 检查。
 *
 * 允许的 type：
 *  feat / fix / docs / style / refactor / perf / test / build / ci / chore / revert
 *
 * 示例：
 *  feat: M11 加白马互动屏
 *  feat(baima): 加领导关怀照片墙
 *  fix(runtime): 修复 dev proxy 在 Windows 下 EINVAL
 *
 * subject 不强制大小写、不强制结尾、不强制英文——展厅项目中文 message 常见
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [0],
    'subject-empty': [2, 'never'],
    'type-empty': [2, 'never'],
    'header-max-length': [2, 'always', 120]
  }
}
