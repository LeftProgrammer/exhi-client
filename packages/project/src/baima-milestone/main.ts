import { initDesignBase } from '@shared/utils/initDesignBase'

initDesignBase(2160, 3840)

import { createApp } from 'vue'
import '@shared/styles/reset.scss'
import App from './App.vue'

createApp(App).mount('#app')
