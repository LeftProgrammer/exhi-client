export default function register(exhi) {
  exhi.registerAction('demo.hello', async ({ params }) => {
    console.log('demo.hello called', params)
    return { ok: true, data: { greeted: params.name } }
  })
}
