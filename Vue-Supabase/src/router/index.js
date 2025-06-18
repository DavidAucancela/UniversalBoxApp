import { createRouter, createWebHistory } from 'vue-router'

import Home from '../pages/HomePage.vue'
import Login from '../pages/LoginPage.vue'
import Register from '../pages/RegisterPage.vue'
import Test from '../pages/TestPage.vue'
import ResetPassword from '@/pages/ResetPassword.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {path: '/', name: 'home', component: Home},
    {path: '/login', name: 'login', component: Login},
    {path: '/register', name: 'register', component:Register},
    {path: '/test', name: 'test', component:Test},
    {path: '/reset-password', name: 'reset-password', component: ResetPassword}
  ]
})



export default router
