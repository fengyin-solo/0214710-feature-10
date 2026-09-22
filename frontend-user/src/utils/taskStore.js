/**
 * 任务中心存储管理
 * 统一管理预约、报名、订单等任务数据
 *
 * 会话隔离说明：
 * - 任务数据按用户ID分别存储（localStorage key 带用户ID后缀），
 *   切换账号后只会看到当前用户的任务，不会出现上一个用户的数据
 * - 未登录（游客）会话使用内存存储，不写入 localStorage，
 *   登录/退出/过期时立即丢弃，避免跨会话污染
 * - 首次进入的新用户使用默认示例数据初始化自己的命名空间
 */

const STORAGE_KEY_PREFIX = 'billiard_user_tasks'
/** 未登录会话的命名空间标识 */
const GUEST_NAMESPACE = '__guest__'

const logger = {
  info: (...args) => console.log('[taskStore]', ...args),
  warn: (...args) => console.warn('[taskStore]', ...args),
  error: (...args) => console.error('[taskStore]', ...args)
}

/**
 * 生成指定命名空间的 localStorage 键名
 * @param {string} namespace - 用户ID
 * @returns {string} localStorage 键名
 */
function storageKeyFor(namespace) {
  return `${STORAGE_KEY_PREFIX}_${namespace}`
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

// ==================== 会话（命名空间）管理 ====================

/**
 * 当前命名空间：登录用户为其用户ID，未登录为游客命名空间
 * @type {string}
 */
let currentNamespace = GUEST_NAMESPACE

/**
 * 游客会话的内存数据（不持久化，刷新或登录后即失效）
 * 首次访问时用默认数据初始化
 * @type {Object<string, Array>|null}
 */
let guestMemory = null

/** 任务变更订阅者集合 */
const listeners = new Set()

/**
 * 切换任务数据所属的会话
 *
 * - 传入用户ID：切换到该用户的 localStorage 命名空间，
 *   若是该用户首次访问则用默认示例数据初始化
 * - 不传/传 null：切换到游客的内存会话
 *
 * 切换命名空间会通知所有订阅者，保证页面不会展示上一个会话的数据
 *
 * @param {string|null} userId - 用户ID，null/undefined 表示游客
 */
function switchNamespace(userId) {
  const nextNamespace = userId ? String(userId) : GUEST_NAMESPACE
  // 已处于该命名空间（游客内存数据已就绪）时无需重复切换
  if (nextNamespace === currentNamespace && (nextNamespace !== GUEST_NAMESPACE || guestMemory)) {
    return
  }

  currentNamespace = nextNamespace

  if (currentNamespace === GUEST_NAMESPACE) {
    // 游客会话：独立的内存数据，绝不落盘
    guestMemory = getDefaultTasks()
  } else {
    // 登录用户：首次进入时初始化个人数据
    const stored = localStorage.getItem(storageKeyFor(currentNamespace))
    if (stored === null) {
      saveTasks(getDefaultTasks())
    }
    guestMemory = null
  }

  logger.info('任务数据命名空间已切换', { namespace: currentNamespace })
  emitChange()
}

/**
 * 订阅任务数据变更
 * @param {Function} callback - 变更回调
 * @returns {Function} 取消订阅函数
 */
function subscribe(callback) {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

/**
 * 通知所有订阅者任务数据已变更
 */
function emitChange() {
  listeners.forEach(callback => {
    try {
      callback()
    } catch (e) {
      logger.error('任务变更订阅回调执行失败', e)
    }
  })
}

// ==================== 数据读写 ====================

/**
 * 读取当前命名空间的任务列表
 * 解析失败时回退到默认数据，避免单个坏数据导致页面不可用
 * @returns {Array} 任务列表
 */
function loadTasks() {
  // 游客会话：直接使用内存数据
  if (currentNamespace === GUEST_NAMESPACE) {
    if (!guestMemory) {
      guestMemory = getDefaultTasks()
    }
    return guestMemory
  }

  const key = storageKeyFor(currentNamespace)
  try {
    const stored = localStorage.getItem(key)
    if (stored === null) {
      const defaults = getDefaultTasks()
      saveTasks(defaults)
      return defaults
    }
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    logger.error('加载任务失败', e)
    return []
  }
}

/**
 * 保存任务列表到当前命名空间
 * 游客会话仅写内存；登录用户写入对应 localStorage
 * @param {Array} tasks - 任务列表
 * @returns {boolean} 是否保存成功
 */
function saveTasks(tasks) {
  if (currentNamespace === GUEST_NAMESPACE) {
    guestMemory = tasks
    return true
  }

  try {
    localStorage.setItem(storageKeyFor(currentNamespace), JSON.stringify(tasks))
    return true
  } catch (e) {
    logger.error('保存任务失败', e)
    return false
  }
}

function getDefaultTasks() {
  return [
    {
      id: 'T' + Date.now().toString() + '001',
      type: 'booking',
      title: '3号球桌 - 美式九球',
      subtitle: '2026-02-15 14:00 - 16:00',
      amount: 120,
      status: 'pending_payment',
      createdAt: formatDate(new Date(Date.now() - 86400000)),
      extra: { tableId: 3, date: '2026-02-15', time: '14:00 - 16:00' }
    },
    {
      id: 'T' + Date.now().toString() + '002',
      type: 'course',
      title: '台球入门基础课',
      subtitle: '报名成功，等待开课',
      amount: 599,
      status: 'upcoming',
      createdAt: formatDate(new Date(Date.now() - 259200000)),
      extra: { courseId: 1 }
    },
    {
      id: 'T' + Date.now().toString() + '003',
      type: 'competition',
      title: '周末九球挑战赛',
      subtitle: '比赛进行中',
      amount: 100,
      status: 'ongoing',
      createdAt: formatDate(new Date(Date.now() - 432000000)),
      extra: { competitionId: 2 }
    },
    {
      id: 'T' + Date.now().toString() + '004',
      type: 'order',
      title: 'LP专业斯诺克球杆',
      subtitle: '待发货',
      amount: 2999,
      status: 'pending_shipment',
      createdAt: formatDate(new Date(Date.now() - 172800000)),
      extra: { orderNo: 'SP' + Date.now().toString().slice(-8), productId: 1 }
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
  /**
   * 切换任务数据所属会话（登录/退出/登录过期时调用）
   * @param {string|null} userId - 用户ID，null 表示游客会话
   */
  switchUser(userId) {
    switchNamespace(userId)
  },

  /**
   * 当前命名空间标识（用户ID 或游客标识），主要用于调试/测试
   * @returns {string}
   */
  currentUser() {
    return currentNamespace
  },

  /**
   * 订阅任务数据变更（含会话切换）
   * @param {Function} callback - 变更回调
   * @returns {Function} 取消订阅函数
   */
  subscribe(callback) {
    return subscribe(callback)
  },

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
    emitChange()
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
    emitChange()
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
    emitChange()
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

  clearAll() {
    saveTasks([])
    emitChange()
    logger.info('所有任务已清除')
  }
}

export default taskStore
