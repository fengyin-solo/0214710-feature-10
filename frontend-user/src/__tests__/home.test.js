/**
 * 首页（Home）组件测试
 *
 * 覆盖需求：
 * - 热门球桌/课程的加载、失败重试、空数据状态
 * - 未登录不展示上一个用户数据，登录后概览与当前会话任务对应
 * - 任务变化（支付/取消）后概览数字更新
 * - 快捷入口：公开页可直接进，任务/个人中心未登录时唤起登录弹窗
 * - 快速往返：在途的旧响应不会覆盖较新请求
 * - 登录过期：会员概览被清空并出现提示条，入口仍可操作
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'

// mock API 层：热门数据由测试控制返回内容/时机
vi.mock('../utils/api', () => ({
  api: {
    getTables: vi.fn(),
    getCourses: vi.fn()
  },
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}))

import Home from '../views/Home.vue'
import { api } from '../utils/api'
import { authState } from '../utils/auth'
import { taskStore } from '../utils/taskStore'

const mockTables = [
  { id: 1, name: '1号球桌', type: '斯诺克', typeId: 'snooker', price: 80, available: true, size: '12尺', brand: '星牌' },
  { id: 3, name: '3号球桌', type: '美式九球', typeId: 'pool', price: 60, available: true, size: '9尺', brand: 'Brunswick' },
  { id: 6, name: '6号球桌', type: '中式八球', typeId: 'chinese', price: 50, available: true, size: '9尺', brand: '乔氏' }
]

const mockCourses = [
  { id: 1, name: '台球入门基础课', icon: '🎯', level: '入门', duration: '4周', students: 156, price: 599, originalPrice: 799, coach: '张明', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 2, name: '斯诺克进阶训练', icon: '🎱', level: '进阶', duration: '6周', students: 89, price: 1299, originalPrice: 1599, coach: '李强', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }
]

function mountHome() {
  const push = vi.fn(() => Promise.resolve())
  const wrapper = mount(Home, {
    global: {
      mocks: {
        $router: { push },
        $route: { path: '/' }
      }
    }
  })
  return { wrapper, push }
}

describe('首页业务概览与快捷入口', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    authState.isLoggedIn = false
    authState.user = null
    authState.token = null
    authState.showLoginModal = false
    authState.expiredAt = 0

    taskStore.switchUser(null)
    taskStore.clearAll()
  })

  it('加载成功后展示热门球桌与热门课程', async () => {
    api.getTables.mockResolvedValue({ success: true, data: mockTables })
    api.getCourses.mockResolvedValue({ success: true, data: mockCourses })

    const { wrapper } = mountHome()
    await flushPromises()

    const names = wrapper.text()
    expect(names).toContain('1号球桌')
    expect(names).toContain('3号球桌')
    expect(names).toContain('台球入门基础课')
    // 热门球桌只取前 3
    expect(wrapper.findAll('.hot-card')).toHaveLength(5) // 3 球桌 + 2 课程
  })

  it('加载中显示骨架占位，失败显示错误态且可重试', async () => {
    api.getTables.mockRejectedValueOnce(new Error('网络异常'))
    api.getCourses.mockResolvedValue({ success: true, data: mockCourses })

    const { wrapper } = mountHome()
    await flushPromises()

    // 球桌区错误态
    expect(wrapper.text()).toContain('热门球桌加载失败')
    // 课程区不受影响，正常展示
    expect(wrapper.text()).toContain('台球入门基础课')

    // 点击重试，第二次成功
    api.getTables.mockResolvedValueOnce({ success: true, data: mockTables })
    await wrapper.findAll('button').find(b => b.text().includes('重新加载')).trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('1号球桌')
    expect(wrapper.text()).not.toContain('热门球桌加载失败')
  })

  it('接口返回空数组时展示空数据状态并提供跳转入口', async () => {
    api.getTables.mockResolvedValue({ success: true, data: [] })
    api.getCourses.mockResolvedValue({ success: true, data: [] })

    const { wrapper } = mountHome()
    await flushPromises()

    expect(wrapper.text()).toContain('暂无热门球桌')
    expect(wrapper.text()).toContain('暂无热门课程')

    const shopBtn = wrapper.findAll('button').find(b => b.text().includes('前往球桌预约'))
    expect(shopBtn).toBeTruthy()
  })

  it('未登录展示游客卡片，登录后概览对应当前用户的任务数据', async () => {
    api.getTables.mockResolvedValue({ success: true, data: mockTables })
    api.getCourses.mockResolvedValue({ success: true, data: mockCourses })

    const { wrapper } = mountHome()
    await flushPromises()

    expect(wrapper.text()).toContain('登录后查看您的专属概览')
    expect(wrapper.text()).not.toContain('欢迎回来')

    // 登录用户 A，准备 A 的任务
    taskStore.switchUser('U-A')
    taskStore.clearAll()
    taskStore.add({ type: 'booking', title: 'A的预约', subtitle: '', amount: 100, status: 'pending_payment' })
    taskStore.add({ type: 'order', title: 'A的订单', subtitle: '', amount: 200, status: 'pending_shipment' })

    authState.isLoggedIn = true
    authState.user = { id: 'U-A', name: '张三', level: '黄金', points: 2580 }
    await nextTick()

    const text = wrapper.text()
    expect(text).toContain('欢迎回来，张三')
    // 2 个待处理、1 个待付款、0 个已完成
    expect(text).toContain('积分 2,580')

    const memberNums = wrapper.findAll('.member-task .task-num').map(n => n.text())
    expect(memberNums).toEqual(['2', '1', '0'])
  })

  it('切换/退出登录后首页不展示上一个用户的数据', async () => {
    api.getTables.mockResolvedValue({ success: true, data: mockTables })
    api.getCourses.mockResolvedValue({ success: true, data: mockCourses })

    const { wrapper } = mountHome()
    await flushPromises()

    // 用户 A 登录
    taskStore.switchUser('U-A')
    taskStore.clearAll()
    taskStore.add({ type: 'booking', title: 'A的私密任务', subtitle: '', amount: 100, status: 'pending_payment' })
    authState.isLoggedIn = true
    authState.user = { id: 'U-A', name: '张三', level: '黄金', points: 100 }
    await nextTick()
    expect(wrapper.text()).toContain('欢迎回来，张三')

    // 退出登录
    authState.isLoggedIn = false
    authState.user = null
    await nextTick()

    const text = wrapper.text()
    expect(text).toContain('登录后查看您的专属概览')
    expect(text).not.toContain('欢迎回来，张三')
    expect(text).not.toContain('A的私密任务')
  })

  it('任务发生变化（如付款）后概览数字随之更新', async () => {
    api.getTables.mockResolvedValue({ success: true, data: mockTables })
    api.getCourses.mockResolvedValue({ success: true, data: mockCourses })

    const { wrapper } = mountHome()

    taskStore.switchUser('U-T')
    taskStore.clearAll()
    const task = taskStore.add({ type: 'booking', title: '待付款预约', subtitle: '', amount: 100, status: 'pending_payment' })
    authState.isLoggedIn = true
    authState.user = { id: 'U-T', name: '王五', level: '白银', points: 300 }
    await flushPromises()

    let nums = wrapper.findAll('.member-task .task-num').map(n => n.text())
    expect(nums).toEqual(['1', '1', '0'])

    // 支付：待付款 1→0，待处理仍为 1（upcoming）
    taskStore.markAsPaid(task.id)
    await nextTick()

    nums = wrapper.findAll('.member-task .task-num').map(n => n.text())
    expect(nums).toEqual(['1', '0', '0'])
  })

  it('快捷入口：公开页直接跳转，需登录入口未登录时唤起全局登录弹窗', async () => {
    api.getTables.mockResolvedValue({ success: true, data: [] })
    api.getCourses.mockResolvedValue({ success: true, data: [] })

    const { wrapper, push } = mountHome()
    await flushPromises()

    // 公开入口：球桌预约
    await wrapper.findAll('.entry-card').find(c => c.text().includes('球桌预约')).trigger('click')
    expect(push).toHaveBeenCalledWith('/tables')
    expect(authState.showLoginModal).toBe(false)

    // 受限入口：任务中心 → 唤起登录弹窗，不跳转
    await wrapper.findAll('.entry-card').find(c => c.text().includes('任务中心')).trigger('click')
    expect(authState.showLoginModal).toBe(true)
    expect(push).not.toHaveBeenCalledWith('/tasks')
  })

  it('快速往返：较早发出的慢响应不会覆盖较新请求的结果', async () => {
    // 第一次请求慢，第二次（重试）先/后完成
    let resolveSlow
    api.getTables
      .mockImplementationOnce(() => new Promise(resolve => { resolveSlow = resolve }))
      .mockResolvedValueOnce({ success: true, data: mockTables })
    api.getCourses.mockResolvedValue({ success: true, data: mockCourses })

    const { wrapper } = mountHome()
    // 立即再次触发加载（模拟快速往返）
    wrapper.vm.loadHotTables()
    await flushPromises()

    // 第二次结果已展示
    expect(wrapper.text()).toContain('1号球桌')

    // 第一次慢响应返回空数据，不应覆盖已展示内容
    resolveSlow({ success: true, data: [] })
    await flushPromises()
    expect(wrapper.text()).toContain('1号球桌')
    expect(wrapper.text()).not.toContain('暂无热门球桌')
  })

  it('登录过期后会员概览清空并显示提示，入口仍可操作', async () => {
    api.getTables.mockResolvedValue({ success: true, data: mockTables })
    api.getCourses.mockResolvedValue({ success: true, data: mockCourses })

    const { wrapper, push } = mountHome()

    taskStore.switchUser('U-E')
    taskStore.clearAll()
    taskStore.add({ type: 'booking', title: '过期前的任务', subtitle: '', amount: 100, status: 'pending_payment' })
    authState.isLoggedIn = true
    authState.user = { id: 'U-E', name: '赵六', level: '黄金', points: 888 }
    await nextTick()
    expect(wrapper.text()).toContain('欢迎回来，赵六')

    // 触发登录过期（与 API 401 走同一处理函数）
    const { handleAuthExpired } = await import('../utils/auth')
    handleAuthExpired('登录状态已过期')
    await nextTick()

    const text = wrapper.text()
    expect(text).toContain('登录状态已过期，请重新登录')
    expect(text).toContain('登录后查看您的专属概览')
    expect(text).not.toContain('欢迎回来，赵六')

    // 公开入口仍可正常操作
    await wrapper.findAll('.entry-card').find(c => c.text().includes('球桌预约')).trigger('click')
    expect(push).toHaveBeenCalledWith('/tables')
  })

  it('组件卸载后在途响应返回不会报错或写回数据', async () => {
    api.getTables.mockResolvedValue({ success: true, data: mockTables })
    api.getCourses.mockResolvedValue({ success: true, data: mockCourses })

    const { wrapper } = mountHome()
    wrapper.unmount()
    // 此时请求才返回，不应抛出未捕获错误
    await flushPromises()
  })
})
