/**
 * 任务中心存储管理
 * 统一管理预约、报名、订单等任务数据，使用 localStorage 持久化
 *
 * 数据隔离说明：
 * - 任务数据按当前登录用户隔离存储（billiard_user_tasks:<userId>）
 * - 未登录（游客）使用独立的游客存储桶，且默认不产生任何任务
 * - 切换用户 / 退出登录后，绝不会读到上一个用户的任务数据
 * - 提供 subscribe 订阅机制，任务或登录身份变化时通知首页等使用方
 */

// 静态导入 authState：ESM 实时绑定可处理 auth -> api -> taskStore -> auth
// 的循环依赖（模块求值阶段不访问 authState，仅在函数调用时读取）
import { authState } from './auth'

const STORAGE_KEY_PREFIX = 'billiard_user_tasks'
const GUEST_SCOPE = 'guest'
const LEGACY_STORAGE_KEY = 'billiard_user_tasks'
const LEGACY_CLEANUP_FLAG = 'billiard_user_tasks_legacy_cleaned'

const logger = {
  info: (...args) => console.log('[taskStore]', ...args),
  warn: (...args) => console.warn('[taskStore]', ...args),
  error: (...args) => console.error('[taskStore]', ...args)
}

const taskTypeConfig = {
  booking: {
    name: '球桌预约',
    icon: '🎱',
    actions: {
      pending_payment: [
        { key: 'pay', label: '继续付款', type: 'primary', route: '/tables' },
        { key: 'cancel', label: '取消', type: 'danger' }
      ],
      upcoming: [
        { key: 'view', label: '查看详情', type: 'primary' },
        { key: 'rebook', label: '再次预约', type: 'default', route: '/tables' }
      ],
      ongoing: [
        { key: 'view', label: '查看详情', type: 'primary' }
      ],
      completed: [
        { key: 'view', label: '查看结果', type: 'default' },
        { key: 'rebook', label: '再次预约', type: 'primary', route: '/tables' }
      ]
    }
  },
  course: {
    name: '课程报名',
    icon: '📚',
    actions: {
      pending_payment: [
        { key: 'pay', label: '继续付款', type: 'primary', route: '/courses' },
        { key: 'cancel', label: '取消', type: 'danger' }
      ],
      upcoming: [
        { key: 'view', label: '查看详情', type: 'primary', route: '/courses' }
      ],
      ongoing: [
        { key: 'view', label: '继续学习', type: 'primary', route: '/courses' }
      ],
      completed: [
        { key: 'view', label: '查看结果', type: 'default' },
        { key: 'review', label: '评价', type: 'primary' }
      ]
    }
  },
  competition: {
    name: '赛事报名',
    icon: '🏆',
    actions: {
      pending_payment: [
        { key: 'pay', label: '继续付款', type: 'primary', route: '/competitions' },
        { key: 'cancel', label: '取消', type: 'danger' }
      ],
      upcoming: [
        { key: 'view', label: '查看赛程', type: 'primary', route: '/competitions' }
      ],
      ongoing: [
        { key: 'view', label: '观看直播', type: 'primary', route: '/competitions' }
      ],
      completed: [
        { key: 'view', label: '查看结果', type: 'default', route: '/competitions' }
      ]
    }
  },
  order: {
    name: '商城订单',
    icon: '🛒',
    actions: {
      pending_payment: [
        { key: 'pay', label: '继续付款', type: 'primary', route: '/shop' },
        { key: 'cancel', label: '取消', type: 'danger' }
      ],
      pending_shipment: [
        { key: 'view', label: '查看订单', type: 'primary', route: '/shop' },
        { key: 'remind', label: '提醒发货', type: 'default' }
      ],
      shipped: [
        { key: 'view', label: '查看物流', type: 'primary', route: '/shop' },
        { key: 'confirm', label: '确认收货', type: 'primary' }
      ],
      completed: [
        { key: 'view', label: '查看结果', type: 'default', route: '/shop' },
        { key: 'review', label: '评价', type: 'primary' },
        { key: 'rebuy', label: '再次购买', type: 'default', route: '/shop' }
      ]
    }
  }
}

const statusConfig = {
  pending_payment: { text: '待付款', type: 'warning' },
  upcoming: { text: '待开始', type: 'info' },
  ongoing: { text: '进行中', type: 'primary' },
  pending_shipment: { text: '待发货', type: 'warning' },
  shipped: { text: '已发货', type: 'info' },
  completed: { text: '已完成', type: 'success' },
  cancelled: { text: '已取消', type: 'success' }
}

// ==================== 订阅机制 ====================

/**
 * 任务变更订阅者集合
 * 任务增删改或登录身份变化时统一通知
 */
const listeners = new Set()

/**
 * 订阅任务数据变化
 * @param {Function} callback - 变化回调，接收 { reason, scope }
 * @returns {Function} 取消订阅函数
 */
function subscribe(callback) {
  if (typeof callback === 'function') {
    listeners.add(callback)
  }
  return () => listeners.delete(callback)
}

/**
 * 通知所有订阅者
 * @param {string} reason - 变更原因 task-change / identity-change
 */
function notify(reason = 'task-change') {
  const payload = { reason, scope: currentScope() }
  listeners.forEach(fn => {
    try {
      fn(payload)
    } catch (e) {
      logger.error('任务订阅回调执行失败', e)
    }
  })
}

// ==================== 按用户隔离的存储 ====================

/**
 * 清除旧版本未按用户隔离的任务数据（仅执行一次）
 * 防止升级后旧的全局任务被任意用户读到
 */
function cleanupLegacyStorage() {
  try {
    if (!localStorage.getItem(LEGACY_CLEANUP_FLAG)) {
      localStorage.removeItem(LEGACY_STORAGE_KEY)
      localStorage.setItem(LEGACY_CLEANUP_FLAG, '1')
      logger.info('已清理旧版本全局任务数据')
    }
  } catch (e) {
    logger.warn('清理旧任务数据失败', e)
  }
}

/**
 * 获取当前存储作用域（用户ID 或 guest）
 * 通过 ESM 实时绑定读取 authState，登录状态变化即时生效
 * @returns {string}
 */
function currentScope() {
  if (authState.isLoggedIn && authState.user?.id) {
    return `u:${authState.user.id}`
  }
  return GUEST_SCOPE
}

/**
 * 当前作用域对应的 localStorage 键名
 * @returns {string}
 */
function storageKey() {
  const scope = currentScope()
  return scope === GUEST_SCOPE
    ? `${STORAGE_KEY_PREFIX}:guest`
    : `${STORAGE_KEY_PREFIX}:${scope}`
}

/**
 * 从 localStorage 读取原始任务（不做 enrichtask）
 * @returns {Array}
 */
function loadTasks() {
  cleanupLegacyStorage()
  try {
    const stored = localStorage.getItem(storageKey())
    if (stored) {
      const parsed = JSON.parse(stored)
      return Array.isArray(parsed) ? parsed : []
    }
  } catch (e) {
    // 数据损坏：安全回退为空数组，不猜测/不生成默认任务，避免脏数据扩散
    logger.error('加载任务失败', e)
    return []
  }

  // 首次访问：登录用户生成演示任务，游客保持空列表
  const defaults = getDefaultTasks()
  saveTasks(defaults)
  return defaults
}

function saveTasks(tasks) {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(tasks))
    return true
  } catch (e) {
    logger.error('保存任务失败', e)
    return false
  }
}

/**
 * 默认任务：仅对登录用户生成；游客没有任务
 */
function getDefaultTasks() {
  if (currentScope() === GUEST_SCOPE) {
    return []
  }

  const now = Date.now()
  return [
    {
      id: 'T' + now + '001',
      type: 'booking',
      title: '3号球桌 - 美式九球',
      subtitle: '2026-02-15 14:00 - 16:00',
      amount: 120,
      status: 'pending_payment',
      createdAt: formatDate(new Date(now - 86400000)),
      extra: { tableId: 3, date: '2026-02-15', time: '14:00 - 16:00' }
    },
    {
      id: 'T' + now + '002',
      type: 'course',
      title: '台球入门基础课',
      subtitle: '报名成功，等待开课',
      amount: 599,
      status: 'upcoming',
      createdAt: formatDate(new Date(now - 259200000)),
      extra: { courseId: 1 }
    },
    {
      id: 'T' + now + '003',
      type: 'competition',
      title: '周末九球挑战赛',
      subtitle: '比赛进行中',
      amount: 100,
      status: 'ongoing',
      createdAt: formatDate(new Date(now - 432000000)),
      extra: { competitionId: 2 }
    },
    {
      id: 'T' + now + '004',
      type: 'order',
      title: 'LP专业斯诺克球杆',
      subtitle: '待发货',
      amount: 2999,
      status: 'pending_shipment',
      createdAt: formatDate(new Date(now - 172800000)),
      extra: { orderNo: 'SP' + now.toString().slice(-8), productId: 1 }
    }
  ]
}

function formatDate(date) {
  const d = new Date(date)
  const pad = n => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function generateTaskId() {
  return 'T' + Date.now().toString() + Math.floor(Math.random() * 1000).toString().padStart(3, '0')
}

function enrichTask(task) {
  const typeInfo = taskTypeConfig[task.type]
  const statusInfo = statusConfig[task.status]
  const actions = typeInfo?.actions?.[task.status] || []

  return {
    ...task,
    typeName: typeInfo?.name || task.type,
    typeIcon: typeInfo?.icon || '📋',
    statusText: statusInfo?.text || task.status,
    statusType: statusInfo?.type || 'info',
    actions: actions
  }
}

export const taskStore = {
  getAll() {
    const tasks = loadTasks()
    return tasks.map(enrichTask).sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    )
  },

  getByStatus(status) {
    const tasks = this.getAll()
    if (status === 'pending') {
      return tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled')
    }
    if (status === 'completed') {
      return tasks.filter(t => t.status === 'completed')
    }
    return tasks
  },

  getById(taskId) {
    const tasks = loadTasks()
    const task = tasks.find(t => t.id === taskId)
    return task ? enrichTask(task) : null
  },

  add(taskData) {
    const tasks = loadTasks()
    const newTask = {
      id: generateTaskId(),
      createdAt: formatDate(new Date()),
      ...taskData
    }
    tasks.unshift(newTask)
    saveTasks(tasks)
    logger.info('任务已添加', newTask)
    notify('task-change')
    return enrichTask(newTask)
  },

  update(taskId, updates) {
    const tasks = loadTasks()
    const index = tasks.findIndex(t => t.id === taskId)
    if (index === -1) {
      logger.warn('任务不存在', taskId)
      return null
    }
    tasks[index] = { ...tasks[index], ...updates }
    saveTasks(tasks)
    logger.info('任务已更新', taskId, updates)
    notify('task-change')
    return enrichTask(tasks[index])
  },

  updateStatus(taskId, newStatus) {
    const statusInfo = statusConfig[newStatus]
    if (!statusInfo) {
      logger.error('无效的状态', newStatus)
      return null
    }
    return this.update(taskId, { status: newStatus })
  },

  remove(taskId) {
    const tasks = loadTasks()
    const filtered = tasks.filter(t => t.id !== taskId)
    if (filtered.length === tasks.length) {
      logger.warn('任务不存在，无法删除', taskId)
      return false
    }
    saveTasks(filtered)
    logger.info('任务已删除', taskId)
    notify('task-change')
    return true
  },

  addBookingTask(table, bookingInfo) {
    return this.add({
      type: 'booking',
      title: `${table.name} - ${table.type}`,
      subtitle: `${bookingInfo.date} ${bookingInfo.time}`,
      amount: table.price * bookingInfo.duration,
      status: 'pending_payment',
      extra: {
        tableId: table.id,
        date: bookingInfo.date,
        time: bookingInfo.time,
        duration: bookingInfo.duration,
        orderNo: bookingInfo.orderNo
      }
    })
  },

  addCourseTask(course, enrollInfo) {
    return this.add({
      type: 'course',
      title: course.name,
      subtitle: '报名成功，等待开课',
      amount: course.price,
      status: 'upcoming',
      extra: {
        courseId: course.id,
        orderNo: enrollInfo.orderNo,
        coach: course.coach,
        lessons: course.lessons
      }
    })
  },

  addCompetitionTask(competition, regInfo) {
    return this.add({
      type: 'competition',
      title: competition.name,
      subtitle: competition.status === 'upcoming' ? '等待比赛开始' : '比赛进行中',
      amount: competition.fee,
      status: competition.status === 'upcoming' ? 'upcoming' : 'ongoing',
      extra: {
        competitionId: competition.id,
        regNo: regInfo.regNo,
        playerNo: regInfo.playerNo,
        date: competition.date
      }
    })
  },

  addOrderTask(order) {
    return this.add({
      type: 'order',
      title: order.items.map(i => i.name).join('、'),
      subtitle: '已下单，待发货',
      amount: order.amount,
      status: 'pending_shipment',
      extra: {
        orderNo: order.orderNo,
        items: order.items,
        createTime: order.createTime
      }
    })
  },

  markAsPaid(taskId) {
    const task = this.getById(taskId)
    if (!task) return null

    let newStatus = 'upcoming'
    let newSubtitle = '支付成功'

    if (task.type === 'order') {
      newStatus = 'pending_shipment'
      newSubtitle = '支付成功，待发货'
    } else if (task.type === 'course') {
      newSubtitle = '支付成功，等待开课'
    } else if (task.type === 'booking') {
      newSubtitle = '支付成功，等待使用'
    }

    return this.update(taskId, { status: newStatus, subtitle: newSubtitle })
  },

  getPendingCount() {
    return this.getByStatus('pending').length
  },

  getCompletedCount() {
    return this.getByStatus('completed').length
  },

  /**
   * 获取首页业务概览所需的任务统计
   * @returns {{total: number, pendingCount: number, completedCount: number, pendingPaymentCount: number, upcomingCount: number, ongoingCount: number, latest: Array}}
   */
  getOverview() {
    const all = this.getAll()
    const pending = all.filter(t => t.status !== 'completed' && t.status !== 'cancelled')
    return {
      total: all.length,
      pendingCount: pending.length,
      completedCount: all.filter(t => t.status === 'completed').length,
      pendingPaymentCount: all.filter(t => t.status === 'pending_payment').length,
      upcomingCount: all.filter(t => t.status === 'upcoming').length,
      ongoingCount: all.filter(t => t.status === 'ongoing').length,
      latest: pending.slice(0, 3)
    }
  },

  clearAll() {
    saveTasks([])
    logger.info('所有任务已清除')
    notify('task-change')
  },

  /**
   * 登录身份变化（登录 / 退出 / 登录过期）时调用
   * 通知所有使用方立即切换到新作用域的数据
   */
  handleIdentityChange() {
    logger.info('登录身份变化，切换任务作用域', { scope: currentScope() })
    notify('identity-change')
  },

  subscribe
}

export default taskStore
