import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// si ya configuraste Vuetify 3
// import vuetify from './plugins/vuetify'

const app = createApp(App)
app.use(router)
app.mount('#app')
// app.use(vuetify) // si ya configuraste Vuetify 3



