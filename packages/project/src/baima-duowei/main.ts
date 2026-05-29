import { initDesignBase } from '@shared/utils/initDesignBase'

initDesignBase(3840, 2160)

import { createApp } from 'vue'
import '@shared/styles/reset.scss'
import { router } from './router'
import App from './App.vue'

createApp(App).use(router).mount('#app')
