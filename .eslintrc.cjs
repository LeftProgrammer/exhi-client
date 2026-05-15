/**
 * 工程根 ESLint 配置。
 *
 * 策略：
 *  - 整体宽松：展厅项目业务多变，不卡过严规则
 *  - 真正抓"会运行出 bug 的"问题（未声明变量、悬空 promise 等 recommended 严格项）
 *  - 风格性的（属性顺序、Hyphenated v-bind、缩进、引号）一律放宽
 *  - 业务代码里 any / unused-vars / non-null-assertion 等都允许
 *  - Prettier 接管所有格式问题，eslint 不管缩进/引号/分号
 */
module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2022: true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/vue3-recommended',
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-prettier'
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2022,
    sourceType: 'module',
    extraFileExtensions: ['.vue']
  },
  rules: {
    // ===== Vue 风格规则全部放宽 =====
    // 组件名 PascalCase / multi-word 不强制
    'vue/multi-word-component-names': 'off',
    // 允许 v-html（业务方自行注意 XSS）
    'vue/no-v-html': 'off',
    // 属性顺序不强制（多余的格式洁癖）
    'vue/attributes-order': 'off',
    // 单文件根元素数量、顺序不强制
    'vue/component-tags-order': 'off',
    'vue/block-order': 'off',
    // 模板内布尔属性允许显式 :show="true"
    'vue/no-boolean-default': 'off',
    // 自定义指令、事件命名不强制
    'vue/custom-event-name-casing': 'off',
    'vue/v-on-event-hyphenation': 'off',
    // 模板里允许 <div></div>（不强制 self-closing）
    'vue/html-self-closing': 'off',
    // ref 命名不强制 .value
    'vue/no-setup-props-destructure': 'off',
    // 允许 v-for 不带 key 在某些场景（虽然不推荐，但偶尔需要）
    // 'vue/require-v-for-key': 'off',  ← 保持，这个真有 bug 风险
    // props 默认值 / 类型校验放宽
    'vue/require-default-prop': 'off',
    'vue/require-prop-types': 'off',
    // 单行属性数量不强制
    'vue/max-attributes-per-line': 'off',
    'vue/first-attribute-linebreak': 'off',
    'vue/singleline-html-element-content-newline': 'off',
    'vue/multiline-html-element-content-newline': 'off',
    // template 里 {{ }} 周围空格不强制
    'vue/mustache-interpolation-spacing': 'off',
    // v-slot 写法不强制
    'vue/v-slot-style': 'off',

    // ===== TypeScript 规则放宽 =====
    // any 不再报（业务多变，强制全类型成本太高）
    '@typescript-eslint/no-explicit-any': 'off',
    // 未用变量改成 warn 且 _ 前缀豁免
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }
    ],
    'no-unused-vars': 'off',
    // 允许非空断言 ! （Electron 类型签名常需要）
    '@typescript-eslint/no-non-null-assertion': 'off',
    // 允许 ts-ignore / ts-expect-error（带 description 即可）
    '@typescript-eslint/ban-ts-comment': 'off',
    // 允许空接口（声明合并模式常需要）
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-empty-object-type': 'off',
    // 允许 require（部分 .cjs 配置文件需要）
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    // 允许 unused expression（?? 短路、|| 短路）
    '@typescript-eslint/no-unused-expressions': 'off',
    // 允许 interface + class 同名合并（EventEmitter 模式标准用法）
    '@typescript-eslint/no-unsafe-declaration-merging': 'off',
    // 函数返回类型不强制声明
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',

    // ===== 基础 JS 规则放宽 =====
    'no-console': 'off',
    'no-debugger': 'warn',
    // 允许 prototype 上的方法访问（hasOwnProperty 等）
    'no-prototype-builtins': 'off',
    // 允许空块（catch{} 等）
    'no-empty': ['warn', { allowEmptyCatch: true }],
    // 允许 case 内变量声明
    'no-case-declarations': 'off'
  },
  overrides: [
    {
      files: ['*.mjs', '*.cjs', 'tools/**/*.mjs', 'guardian/**/*.mjs', '*.config.{ts,js,cjs}'],
      env: { node: true },
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off'
      }
    },
    {
      // 项目包业务代码：再宽松一档，业务调试期允许各种"快脏"写法
      files: ['packages/*/src/**/*.{ts,vue}'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        'vue/no-unused-vars': 'off',
        'vue/no-mutating-props': 'warn'
      }
    }
  ],
  ignorePatterns: [
    'node_modules',
    'out',
    'build',
    'dist',
    '**/contents/**',
    'packages/demo-hall/**',
    '**/*.d.ts'
  ]
}
