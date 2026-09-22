/**
 * 认证会话管理单元测试
 *
 * 测试范围：
 * - 全局登录弹窗开关（登录后不再弹出）
 * - 登录过期处理：清除登录态、通知订阅者、唤起登录弹窗、任务数据切回游客
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  authState,
  initAuth,
  openLoginModal,
  closeLoginModal,
  onAuthExpired,
  handleAuthExpired
} from '../utils/auth'
import { taskStore } from '../utils/taskStore'

describe('认证会话管理', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()

    authState.isLoggedIn = false
    authState.user = null
    authState.token = null
    authState.error = null
    authState.loading = false
    authState.showLoginModal = false
    authState.expiredAt = 0

    taskStore.switchUser(null)
    taskStore.clearAll()
  })

  it('未登录时 openLoginModal 会打开全局登录弹窗', () => {
    openLoginModal()
    expect(authState.showLoginModal).toBe(true)
    closeLoginModal()
    expect(authState.showLoginModal).toBe(false)
  })

  it('已登录时 openLoginModal 不再弹出登录框', () => {
    authState.isLoggedIn = true
    authState.user = { id: 'U1', name: '张三' }
    openLoginModal()
    expect(authState.showLoginModal).toBe(false)
  })

  it('登录过期时清除会话、通知订阅者并唤起登录弹窗', () => {
    // 模拟已登录状态
    authState.isLoggedIn = true
    authState.token = 'expired-token'
    authState.user = { id: 'U-EXPIRED', name: '张三' }
    taskStore.switchUser('U-EXPIRED')

    const listener = vi.fn()
    const unsubscribe = onAuthExpired(listener)

    handleAuthExpired('token invalid')

    // 登录态已清除
    expect(authState.isLoggedIn).toBe(false)
    expect(authState.token).toBeNull()
    expect(authState.user).toBeNull()
    expect(authState.expiredAt).toBeGreaterThan(0)

    // 订阅者收到通知
    expect(listener).toHaveBeenCalledWith('token invalid')

    // 自动唤起登录弹窗
    expect(authState.showLoginModal).toBe(true)

    // 本地存储已清除
    expect(localStorage.getItem('billiard_token')).toBeNull()
    expect(localStorage.getItem('billiard_user')).toBeNull()

    // 任务数据已切回游客命名空间，不再暴露该用户数据
    expect(taskStore.currentUser()).toBe('__guest__')

    unsubscribe()
  })

  it('未登录状态下重复触发过期处理不会误打开弹窗', () => {
    handleAuthExpired()
    expect(authState.showLoginModal).toBe(false)
  })

  it('从 localStorage 恢复登录态时任务命名空间绑定到该用户', () => {
    localStorage.setItem('billiard_token', 'saved-token')
    localStorage.setItem('billiard_user', JSON.stringify({ id: 'U-SAVED', name: '李四' }))

    initAuth()

    expect(authState.isLoggedIn).toBe(true)
    expect(authState.user.id).toBe('U-SAVED')
    expect(taskStore.currentUser()).toBe('U-SAVED')
  })
})
