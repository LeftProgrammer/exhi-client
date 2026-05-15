import { createApp } from 'vue'
import '@shared/styles/reset.scss'
import { router } from './router'
import App from './App.vue'

createApp(App).use(router).mount('#app')
