/**
 * 任务存储按用户隔离 & 订阅机制 单元测试
 *
 * 测试范围：
 * - 游客默认无任务
 * - 登录用户的任务与游客/其他用户隔离（不串数据）
 * - 退出登录后看不到上一个用户的任务
 * - 任务增删改触发订阅
 * - 身份变化通知
 * - 概览统计正确性
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { taskStore } from '../utils/taskStore'
import { authState, login, logout } from '../utils/auth'

// ==================== localStorage Mock ====================

const localStorageMock = {
  store: {},
  getItem: vi.fn(key => (key in localStorageMock.store ? localStorageMock.store[key] : null)),
  setItem: vi.fn((key, value) => { localStorageMock.store[key] = String(value) }),
  removeItem: vi.fn(key => { delete localStorageMock.store[key] }),
  clear: vi.fn(() => { localStorageMock.store = {} })
}
Object.defineProperty(global, 'localStorage', { value: localStorageMock, configurable: true })

function setGuest() {
  authState.isLoggedIn = false
  authState.user = null
  authState.token = null
}

function setUser(id) {
  authState.isLoggedIn = true
  authState.token = 'token_' + id
  authState.user = { id, name: '用户' + id }
}

describe('TaskStore 会话隔离', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
    setGuest()
  })

  it('游客默认没有任何任务', () => {
    expect(taskStore.getAll()).toEqual([])
    expect(taskStore.getPendingCount()).toBe(0)
  })

  it('同一用户在自己的存储桶内读写任务', () => {
    setUser('U001')
    taskStore.clearAll()
    taskStore.add({ type: 'booking', title: '1号球桌', amount: 80, status: 'pending_payment' })

    const tasks = taskStore.getAll()
    expect(tasks.length).toBe(1)
    expect(tasks[0].title).toBe('1号球桌')
    expect(localStorageMock.getItem('billiard_user_tasks:u:U001')).not.toBeNull()
  })

  it('不同用户之间任务数据完全隔离', () => {
    setUser('U001')
    taskStore.clearAll()
    taskStore.add({ type: 'booking', title: '用户1的预约', amount: 80, status: 'pending_payment' })

    setUser('U002')
    taskStore.clearAll()
    const user2Tasks = taskStore.getAll()
    // 用户2 看不到用户1 的任务
    expect(user2Tasks.some(t => t.title === '用户1的预约')).toBe(false)

    taskStore.add({ type: 'order', title: '用户2的订单', amount: 999, status: 'pending_shipment' })

    // 切回用户1：只看到自己的 1 条任务
    setUser('U001')
    const user1Tasks = taskStore.getAll()
    expect(user1Tasks.length).toBe(1)
    expect(user1Tasks[0].title).toBe('用户1的预约')
  })

  it('退出登录后游客看不到上一个用户的任何任务', async () => {
    await login('user', '123456')
    const uid = authState.user.id
    taskStore.clearAll()
    taskStore.add({ type: 'course', title: '私密课程', amount: 599, status: 'upcoming' })
    expect(taskStore.getAll().some(t => t.title === '私密课程')).toBe(true)

    await logout()
    expect(authState.isLoggedIn).toBe(false)

    // 游客桶为空
    expect(taskStore.getAll()).toEqual([])
    // 用户数据仍保存在自己的桶里，但首页游客态读不到
    const raw = localStorageMock.getItem(`billiard_user_tasks:u:${uid}`)
    expect(raw).not.toBeNull()
    expect(raw).toContain('私密课程')
  })

  it('快速在两个身份间往返时读到的始终是当前身份的数据', () => {
    setUser('U001')
    taskStore.clearAll()
    taskStore.add({ type: 'booking', title: 'A-预约', amount: 100, status: 'pending_payment' })

    setGuest()
    expect(taskStore.getAll()).toEqual([])

    setUser('U001')
    expect(taskStore.getAll().map(t => t.title)).toEqual(['A-预约'])

    setGuest()
    expect(taskStore.getAll()).toEqual([])
  })

  it('add/update/remove 会通知订阅者', () => {
    setUser('U001')
    taskStore.clearAll()
    const listener = vi.fn()
    const off = taskStore.subscribe(listener)

    const created = taskStore.add({ type: 'booking', title: '通知测试', amount: 10, status: 'pending_payment' })
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ reason: 'task-change' }))

    taskStore.update(created.id, { status: 'upcoming' })
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ reason: 'task-change' }))

    taskStore.remove(created.id)
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ reason: 'task-change' }))

    expect(listener).toHaveBeenCalledTimes(3)
    off()

    taskStore.add({ type: 'order', title: '已取消订阅', amount: 1, status: 'pending_shipment' })
    expect(listener).toHaveBeenCalledTimes(3)
  })

  it('handleIdentityChange 触发 identity-change 事件', () => {
    const listener = vi.fn()
    taskStore.subscribe(listener)

    taskStore.handleIdentityChange()

    expect(listener).toHaveBeenCalledWith({
      reason: 'identity-change',
      scope: expect.any(String)
    })
  })

  it('getOverview 返回当前用户的概览统计', () => {
    setUser('U001')
    taskStore.clearAll()
    taskStore.add({ type: 'booking', title: '待付款项', amount: 50, status: 'pending_payment' })
    taskStore.add({ type: 'course', title: '待开始课', amount: 599, status: 'upcoming' })
    taskStore.add({ type: 'competition', title: '进行中赛', amount: 100, status: 'ongoing' })
    taskStore.add({ type: 'order', title: '已完成单', amount: 200, status: 'completed' })

    const ov = taskStore.getOverview()
    expect(ov.total).toBe(4)
    expect(ov.pendingCount).toBe(3)
    expect(ov.completedCount).toBe(1)
    expect(ov.pendingPaymentCount).toBe(1)
    expect(ov.upcomingCount).toBe(1)
    expect(ov.ongoingCount).toBe(1)
    expect(ov.latest.length).toBe(3)
  })

  it('本地存储数据损坏时安全回退为空数组，不抛错', () => {
    setUser('U001')
    localStorageMock.store['billiard_user_tasks:u:U001'] = 'not-json{'
    let result
    expect(() => { result = taskStore.getAll() }).not.toThrow()
    expect(result).toEqual([])
  })
})
