export default function register(exhi) {
  // 测试：自定义 action，验证 actions.js 注册机制
  exhi.registerAction('test.hello', async ({ params }) => {
    console.log('[test.hello] called', params)
    return { ok: true, data: { greeted: params.name ?? 'world' } }
  })

  // 测试：抛错路径
  exhi.registerAction('test.fail', async () => {
    throw new Error('intentional error for testing')
  })
}
