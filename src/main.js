import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import {stringify} from 'csv-stringify/browser/esm/sync'
import App from './App.vue'

import './assets/main.css'

const app = createApp(App)

for (const name in ElementPlusIconsVue) {
    app.component(name, ElementPlusIconsVue[name])
}

app.use(ElementPlus)
app.mount('#app')
