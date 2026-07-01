import '@shared/styles/reset.scss'
import { createProjectApp } from '@shared/utils/createProjectApp'
import { router } from './router'
import App from './App.vue'

createProjectApp({ designWidth: 3840, designHeight: 2160, rootComponent: App, router })
