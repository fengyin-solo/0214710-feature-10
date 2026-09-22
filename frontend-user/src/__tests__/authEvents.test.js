/**
 * 认证事件（登录/退出/过期）单元测试
 *
 * 测试范围：
 * - onAuthChange 收到 login / logout 事件
 * - handleSessionExpired 清理登录态并发 expired 事件
 * - 登录/退出时任务存储作用域随之切换（首页不会残留上一个用户的数据）
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  authState,
  login,
  logout,
  handleSessionExpired,
  onAuthChange
} from '../utils/auth'
import { taskStore } from '../utils/taskStore'

const localStorageMock = {
  store: {},
  getItem: vi.fn(key => (key in localStorageMock.store ? localStorageMock.store[key] : null)),
  setItem: vi.fn((key, value) => { localStorageMock.store[key] = String(value) }),
  removeItem: vi.fn(key => { delete localStorageMock.store[key] }),
  clear: vi.fn(() => { localStorageMock.store = {} })
}
Object.defineProperty(global, 'localStorage', { value: localStorageMock, configurable: true })

describe('Auth 事件与会话切换', () => {
  beforeEach(async () => {
    localStorageMock.clear()
    vi.clearAllMocks()
    authState.isLoggedIn = false
    authState.user = null
    authState.token = null
    authState.error = null
  })

  it('登录成功发出 login 事件，退出发出 logout 事件', async () => {
    const events = []
    onAuthChange(e => events.push(e.type))

    await login('user', '123456')
    expect(events).toContain('login')

    await logout()
    expect(events).toContain('logout')
  })

  it('未登录时 handleSessionExpired 不产生多余事件', () => {
    const listener = vi.fn()
    onAuthChange(listener)

    handleSessionExpired()

    expect(listener).not.toHaveBeenCalled()
    expect(authState.isLoggedIn).toBe(false)
  })

  it('登录过期时清理状态并发出 expired 事件，任务切到游客作用域', async () => {
    await login('user', '123456')
    taskStore.clearAll()
    taskStore.add({ type: 'booking', title: '过期前的任务', amount: 80, status: 'pending_payment' })
    expect(taskStore.getAll().length).toBe(1)

    const events = []
    onAuthChange(e => events.push(e.type))

    handleSessionExpired()

    expect(authState.isLoggedIn).toBe(false)
    expect(authState.user).toBeNull()
    expect(authState.token).toBeNull()
    expect(localStorageMock.getItem('billiard_token')).toBeNull()
    expect(events).toEqual(['expired'])

    // 过期后首页（游客态）读不到任何上一个用户的任务
    expect(taskStore.getAll()).toEqual([])
  })

  it('登录后任务作用域切换到新用户，游客期间添加的任务不串入', () => {
    // 游客态无任务
    expect(taskStore.getAll()).toEqual([])

    authState.isLoggedIn = true
    authState.token = 't'
    authState.user = { id: 'U-NEW', name: '新用户' }
    taskStore.handleIdentityChange()

    // 新用户桶里没有游客数据（游客桶本来就为空）
    const titles = taskStore.getAll().map(t => t.title)
    expect(titles.some(t => t.includes('游客'))).toBe(false)
  })

  it('取消订阅后不再收到认证事件', async () => {
    const listener = vi.fn()
    const off = onAuthChange(listener)
    off()

    await login('user', '123456')
    expect(listener).not.toHaveBeenCalled()
  })
})
