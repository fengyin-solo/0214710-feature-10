import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initAuth, handleSessionExpired } from './utils/auth'
import { onSessionExpired, logger } from './utils/api'

// 初始化认证状态
initAuth()

// 接口返回登录过期（401/403）时，全局清理登录态
// authState 的变化会自动驱动首页等页面切换为游客内容，杜绝残留上一个用户的数据
onSessionExpired(() => {
  handleSessionExpired()
})

// 全局错误处理
window.addEventListener('error', (event) => {
  logger.error('Global error', { message: event.message, filename: event.filename, lineno: event.lineno })
})

window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', { reason: event.reason })
})

logger.info('Application starting')

const app = createApp(App)
app.use(router)
app.mount('#app')

logger.info('Application mounted')
