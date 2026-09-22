/**
 * 首页 Home.vue 组件测试
 *
 * 覆盖需求：
 * - 游客态显示登录引导，不出现任何用户数据
 * - 登录态显示对应用户的业务概览与任务徽标
 * - 退出登录后立即回到游客态，绝不残留上一个用户的数据
 * - 热门课程/球桌渲染加载成功内容；接口失败显示错误态且可重试
 * - 空数据时显示空态，布局容器仍存在
 * - 需登录的快捷入口对游客弹登录框而不是跳转
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Home from '../views/Home.vue'
import LoginModal from '../components/LoginModal.vue'
import { authState } from '../utils/auth'
import { api } from '../utils/api'
import { taskStore } from '../utils/taskStore'

const localStorageMock = {
  store: {},
  getItem: vi.fn(key => (key in localStorageMock.store ? localStorageMock.store[key] : null)),
  setItem: vi.fn((key, value) => { localStorageMock.store[key] = String(value) }),
  removeItem: vi.fn(key => { delete localStorageMock.store[key] }),
  clear: vi.fn(() => { localStorageMock.store = {} })
}
Object.defineProperty(global, 'localStorage', { value: localStorageMock, configurable: true })

function mountHome() {
  return mount(Home, {
    global: {
      config: {
        globalProperties: {
          $router: { push: vi.fn().mockResolvedValue(undefined) },
          $route: { path: '/' }
        }
      }
    }
  })
}

function setGuest() {
  authState.isLoggedIn = false
  authState.user = null
  authState.token = null
}

function setUser(id = 'U-HOME-1') {
  authState.isLoggedIn = true
  authState.token = 'token-' + id
  authState.user = {
    id,
    name: '首页用户' + id,
    level: '黄金',
    points: 1234,
    totalHours: 10,
    competitions: 1,
    wins: 1,
    courses: 1
  }
}

describe('Home 首页', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.restoreAllMocks()
    setGuest()
  })

  it('游客态：显示登录引导，不渲染任何会员概览与用户名', async () => {
    const wrapper = mountHome()
    await flushPromises()

    expect(wrapper.text()).toContain('登录后查看您的业务概览')
    expect(wrapper.text()).not.toContain('你好，')
    // 游客没有任务徽标
    expect(wrapper.find('.overview-card.member').exists()).toBe(false)
    expect(wrapper.find('.overview-card.guest').exists()).toBe(true)
    // 热门课程/球桌区域存在（加载完成后）
    expect(wrapper.text()).toContain('热门课程')
    expect(wrapper.text()).toContain('热门球桌')

    wrapper.unmount()
  })

  it('登录态：显示对应用户的业务概览，且只含该用户任务', async () => {
    setUser('U-A')
    taskStore.clearAll()
    taskStore.add({ type: 'booking', title: 'A用户的预约', amount: 80, status: 'pending_payment' })

    const wrapper = mountHome()
    await flushPromises()

    expect(wrapper.find('.overview-card.member').exists()).toBe(true)
    expect(wrapper.text()).toContain('首页用户U-A')
    expect(wrapper.text()).toContain('A用户的预约')
    // 待处理 = 1，任务中心入口出现徽标 1
    const badges = wrapper.findAll('.quick-badge').map(n => n.text())
    expect(badges).toContain('1')

    wrapper.unmount()
  })

  it('退出登录：立即清除上一个用户的概览、任务与徽标', async () => {
    setUser('U-B')
    taskStore.clearAll()
    taskStore.add({ type: 'order', title: 'B用户的订单', amount: 999, status: 'pending_shipment' })

    const wrapper = mountHome()
    await flushPromises()
    expect(wrapper.text()).toContain('B用户的订单')

    setGuest()
    await flushPromises()

    expect(wrapper.find('.overview-card.member').exists()).toBe(false)
    expect(wrapper.find('.overview-card.guest').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('B用户的订单')
    expect(wrapper.text()).not.toContain('首页用户U-B')
    expect(wrapper.findAll('.quick-badge').length).toBe(0)

    wrapper.unmount()
  })

  it('从用户A切到用户B：只显示B的数据，不串号', async () => {
    setUser('U-A2')
    taskStore.clearAll()
    taskStore.add({ type: 'booking', title: '只有A能看到', amount: 80, status: 'pending_payment' })

    const wrapper = mountHome()
    await flushPromises()
    expect(wrapper.text()).toContain('只有A能看到')

    setUser('U-B2')
    taskStore.clearAll()
    taskStore.add({ type: 'course', title: '只有B能看到', amount: 599, status: 'upcoming' })
    await flushPromises()

    expect(wrapper.text()).not.toContain('只有A能看到')
    expect(wrapper.text()).toContain('只有B能看到')
    expect(wrapper.text()).toContain('首页用户U-B2')

    wrapper.unmount()
  })

  it('任务变化（如支付/取消）后徽标与概览随之更新', async () => {
    setUser('U-C')
    taskStore.clearAll()
    const t = taskStore.add({ type: 'booking', title: '待付款预约', amount: 120, status: 'pending_payment' })

    const wrapper = mountHome()
    await flushPromises()
    expect(wrapper.findAll('.quick-badge').map(n => n.text())).toContain('1')

    taskStore.markAsPaid(t.id)
    await flushPromises()
    // 支付后不再是待付款：待付款入口徽标消失，任务中心（待处理）仍为 1
    const badgeByName = {}
    wrapper.findAll('.quick-item').forEach(item => {
      const name = item.find('.quick-name').text()
      const badge = item.find('.quick-badge')
      badgeByName[name] = badge.exists() ? badge.text() : null
    })
    expect(badgeByName['任务中心']).toBe('1')
    expect(badgeByName['待付款']).toBeNull()

    taskStore.remove(t.id)
    await flushPromises()
    expect(wrapper.findAll('.quick-badge').length).toBe(0)
    expect(wrapper.text()).toContain('暂无待办任务')

    wrapper.unmount()
  })

  it('热门课程加载失败：显示错误态与重新加载按钮，其它区块不受影响', async () => {
    vi.spyOn(api, 'getCourses').mockResolvedValue({ success: false, error: '课程服务开小差了' })

    const wrapper = mountHome()
    await flushPromises()

    expect(wrapper.text()).toContain('热门课程加载失败')
    expect(wrapper.text()).toContain('课程服务开小差了')
    // 球桌区块仍然正常渲染
    expect(wrapper.find('.hot-grid.tables').exists()).toBe(true)
    expect(wrapper.text()).toContain('热门球桌')

    // 点击重试后恢复
    api.getCourses.mockRestore()
    await wrapper.findAll('button.btn-retry')[0].trigger('click')
    await flushPromises()
    expect(wrapper.text()).not.toContain('热门课程加载失败')

    wrapper.unmount()
  })

  it('空数据：课程/球桌返回空数组时显示空态，快捷入口仍可操作', async () => {
    vi.spyOn(api, 'getCourses').mockResolvedValue({ success: true, data: [] })
    vi.spyOn(api, 'getTables').mockResolvedValue({ success: true, data: [] })

    const wrapper = mountHome()
    await flushPromises()

    expect(wrapper.text()).toContain('暂无热门课程')
    expect(wrapper.text()).toContain('暂无可预约球桌')
    // 快捷入口依旧渲染并可点击
    const quickItems = wrapper.findAll('.quick-item')
    expect(quickItems.length).toBe(7)

    wrapper.unmount()
  })

  it('游客点击需登录的"任务中心"入口：弹出登录框而不是跳转', async () => {
    const wrapper = mountHome()
    await flushPromises()

    const push = vi.fn()
    wrapper.vm.$router = { push }

    const taskEntry = wrapper.findAll('.quick-item').find(n => n.text().includes('任务中心'))
    await taskEntry.trigger('click')

    expect(wrapper.vm.showLoginModal).toBe(true)
    expect(push).not.toHaveBeenCalled()
    // LoginModal 组件确实存在于页面中
    expect(wrapper.findComponent(LoginModal).exists()).toBe(true)

    wrapper.unmount()
  })
})
