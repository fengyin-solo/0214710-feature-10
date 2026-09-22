/**
 * taskStore 会话隔离单元测试
 *
 * 测试范围：
 * - 游客任务只存内存，不写入 localStorage
 * - 任务数据按用户ID隔离，切换账号看不到上一个用户的数据
 * - 切回游客/重新进入同账号时的数据表现
 * - 增删改触发订阅通知
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { taskStore } from '../utils/taskStore'

const KEY_PREFIX = 'billiard_user_tasks_'

function clearStorage() {
  Object.keys(localStorage)
    .filter(k => k.startsWith(KEY_PREFIX) || k === 'billiard_user_tasks')
    .forEach(k => localStorage.removeItem(k))
}

describe('taskStore 会话隔离', () => {
  beforeEach(() => {
    clearStorage()
    // 每个用例都从游客会话开始
    taskStore.switchUser(null)
    taskStore.clearAll()
  })

  afterEach(() => {
    clearStorage()
  })

  it('游客会话的任务不写入 localStorage', () => {
    taskStore.switchUser(null)
    taskStore.clearAll()
    taskStore.add({
      type: 'booking',
      title: '游客预约',
      subtitle: '仅本会话可见',
      amount: 100,
      status: 'pending_payment'
    })

    expect(taskStore.getAll()).toHaveLength(1)
    expect(localStorage.getItem(KEY_PREFIX + '__guest__')).toBeNull()
    expect(localStorage.getItem('billiard_user_tasks')).toBeNull()
  })

  it('不同用户的任务存储在独立的 localStorage 命名空间', () => {
    // 用户 A
    taskStore.switchUser('U-A')
    taskStore.clearAll()
    taskStore.add({
      type: 'booking',
      title: 'A的预约',
      subtitle: '',
      amount: 100,
      status: 'pending_payment'
    })
    expect(localStorage.getItem(KEY_PREFIX + 'U-A')).toContain('A的预约')

    // 切到用户 B：看不到 A 的数据
    taskStore.switchUser('U-B')
    const bTasks = taskStore.getAll()
    expect(bTasks.some(t => t.title === 'A的预约')).toBe(false)

    // B 自己添加任务
    taskStore.add({
      type: 'order',
      title: 'B的订单',
      subtitle: '',
      amount: 200,
      status: 'pending_shipment'
    })

    // A 的数据仍然完好
    taskStore.switchUser('U-A')
    const aTasks = taskStore.getAll()
    expect(aTasks.some(t => t.title === 'A的预约')).toBe(true)
    expect(aTasks.some(t => t.title === 'B的订单')).toBe(false)
  })

  it('切回游客会话时不展示任何登录用户的数据', () => {
    taskStore.switchUser('U-A')
    taskStore.clearAll()
    taskStore.add({
      type: 'booking',
      title: 'A的私密预约',
      subtitle: '',
      amount: 100,
      status: 'pending_payment'
    })

    taskStore.switchUser(null)
    const guestTasks = taskStore.getAll()
    expect(guestTasks.some(t => t.title === 'A的私密预约')).toBe(false)
  })

  it('新用户首次进入时使用默认数据初始化', () => {
    taskStore.switchUser('U-NEW')
    const tasks = taskStore.getAll()
    expect(tasks.length).toBeGreaterThan(0)
    // 默认数据已持久化到该用户命名空间
    expect(localStorage.getItem(KEY_PREFIX + 'U-NEW')).not.toBeNull()
  })

  it('增删改操作会通知订阅者', () => {
    taskStore.switchUser('U-A')
    taskStore.clearAll()
    const listener = vi.fn()
    const unsubscribe = taskStore.subscribe(listener)

    const added = taskStore.add({
      type: 'course',
      title: '课程任务',
      subtitle: '',
      amount: 599,
      status: 'upcoming'
    })
    taskStore.updateStatus(added.id, 'completed')
    taskStore.remove(added.id)

    expect(listener).toHaveBeenCalledTimes(3)
    unsubscribe()
  })

  it('切换用户时也会通知订阅者，页面可据此刷新', () => {
    const listener = vi.fn()
    taskStore.subscribe(listener)
    taskStore.switchUser('U-X')
    expect(listener).toHaveBeenCalled()
  })

  it('getByStatus 统计与当前命名空间一致', () => {
    taskStore.switchUser('U-C')
    taskStore.clearAll()
    taskStore.add({ type: 'booking', title: '待付款项', subtitle: '', amount: 1, status: 'pending_payment' })
    taskStore.add({ type: 'order', title: '已完成项', subtitle: '', amount: 1, status: 'completed' })

    expect(taskStore.getPendingCount()).toBe(1)
    expect(taskStore.getCompletedCount()).toBe(1)
  })

  it('localStorage 中损坏的数据不会让页面崩溃', () => {
    localStorage.setItem(KEY_PREFIX + 'U-BROKEN', '{not-json')
    taskStore.switchUser('U-BROKEN')
    expect(() => taskStore.getAll()).not.toThrow()
    expect(Array.isArray(taskStore.getAll())).toBe(true)
  })
})
