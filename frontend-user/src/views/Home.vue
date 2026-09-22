<template>
  <div class="home">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-bg">
        <div class="gradient-orb orb-1"></div>
        <div class="gradient-orb orb-2"></div>
        <div class="grid-overlay"></div>
      </div>
      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-dot"></span>
          <span>专业台球俱乐部</span>
        </div>
        <h1 class="hero-title">
          <span class="line">体验极致</span>
          <span class="line highlight">台球艺术</span>
        </h1>
        <p class="hero-desc">
          顶级球桌设备 · 专业教练团队 · 精彩赛事活动<br>
          开启您的台球之旅
        </p>

        <!-- 登录结果 / 会话概览：始终与当前会话对应 -->
        <div v-if="isLoggedIn" :key="sessionKey" class="member-card">          <div class="member-main">
            <div class="member-avatar">{{ userInitial }}</div>
            <div class="member-info">
              <p class="member-greeting">欢迎回来，{{ memberName }}</p>
              <div class="member-tags">
                <span class="member-tag level">{{ memberLevel }}会员</span>
                <span class="member-tag points">积分 {{ memberPoints.toLocaleString() }}</span>
              </div>
            </div>
          </div>
          <div class="member-tasks">
            <div class="member-task" @click="goPath('/tasks')">
              <span class="task-num">{{ taskSummary.pending }}</span>
              <span class="task-label">待处理</span>
            </div>
            <div class="member-task" @click="goPath('/tasks')">
              <span class="task-num">{{ taskSummary.unpaid }}</span>
              <span class="task-label">待付款</span>
            </div>
            <div class="member-task" @click="goPath('/tasks')">
              <span class="task-num">{{ taskSummary.completed }}</span>
              <span class="task-label">已完成</span>
            </div>
          </div>
        </div>
        <div v-else :key="sessionKey" class="member-card guest">
          <div class="member-main">
            <div class="member-avatar guest-avatar">👤</div>
            <div class="member-info">
              <p class="member-greeting">登录后查看您的专属概览</p>
              <div class="member-tags">
                <span class="member-tag">预约 · 课程 · 赛事任务一目了然</span>
              </div>
            </div>
          </div>
          <button class="member-login-btn" @click="requireAuth()">立即登录</button>
        </div>

        <div class="hero-actions">
          <button class="btn-primary" @click="goPath('/tables')">
            <span>立即预约</span>
            <svg class="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
          <button class="btn-secondary" @click="goPath('/courses')">
            <span>探索课程</span>
          </button>
        </div>
        <div class="hero-stats">
          <div class="stat-item">
            <span class="stat-number">50<span class="plus">+</span></span>
            <span class="stat-label">专业球桌</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-number">10K<span class="plus">+</span></span>
            <span class="stat-label">注册会员</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-number">200<span class="plus">+</span></span>
            <span class="stat-label">赛事举办</span>
          </div>
        </div>
      </div>
      <div class="hero-visual">
        <div class="visual-card">
          <div class="card-glow"></div>
          <div class="billiard-animation">
            <div class="table-surface">
              <div class="ball ball-cue"></div>
              <div class="ball ball-1"></div>
              <div class="ball ball-2"></div>
              <div class="ball ball-3"></div>
              <div class="ball ball-8"></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Quick Entries Section（快捷入口：任何状态下均可操作） -->
    <section class="quick-entries">
      <div class="section-header-row">
        <div>
          <span class="section-tag">快捷入口</span>
          <h2 class="row-title">常用服务一键直达</h2>
        </div>
        <button v-if="isLoggedIn" class="text-btn" @click="goPath('/tasks')">
          任务中心
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
      <div class="entries-grid">
        <button
          v-for="entry in quickEntries"
          :key="entry.link"
          type="button"
          class="entry-card"
          @click="handleEntry(entry)"
        >
          <div class="entry-icon"><span>{{ entry.icon }}</span></div>
          <div class="entry-text">
            <span class="entry-name">{{ entry.name }}</span>
            <span class="entry-desc">{{ entry.desc }}</span>
          </div>
          <span v-if="entry.authRequired && !isLoggedIn" class="entry-lock">登录可用</span>
          <svg class="entry-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
    </section>

    <!-- Hot Tables Section（热门球桌） -->
    <section class="hot-section">
      <div class="section-header-row">
        <div>
          <span class="section-tag">热门球桌</span>
          <h2 class="row-title">本馆热门预约</h2>
        </div>
        <button class="text-btn" @click="goPath('/tables')">
          查看全部
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>

      <!-- 加载态：骨架占位，固定高度，不引起首屏跳动 -->
      <div v-if="tablesState.status === 'loading'" class="hot-grid">
        <div v-for="n in 3" :key="n" class="hot-skeleton">
          <div class="skeleton-line w-60"></div>
          <div class="skeleton-line w-40"></div>
          <div class="skeleton-line w-80"></div>
        </div>
      </div>

      <!-- 加载失败：保留重试入口，不影响其它区域 -->
      <div v-else-if="tablesState.status === 'error'" class="state-panel">
        <span class="state-icon">⚠️</span>
        <p class="state-title">热门球桌加载失败</p>
        <p class="state-desc">{{ tablesState.error || '网络开小差了，请稍后重试' }}</p>
        <button class="state-btn" :disabled="tablesState.reloading" @click="loadHotTables(true)">
          {{ tablesState.reloading ? '重试中...' : '重新加载' }}
        </button>
      </div>

      <!-- 空数据 -->
      <div v-else-if="hotTables.length === 0" class="state-panel">
        <span class="state-icon">🎱</span>
        <p class="state-title">暂无热门球桌</p>
        <p class="state-desc">新球桌正在上架中，可先查看全部球桌</p>
        <button class="state-btn" @click="goPath('/tables')">前往球桌预约</button>
      </div>

      <!-- 正常数据 -->
      <div v-else class="hot-grid">
        <button
          v-for="(table, index) in hotTables"
          :key="'table-' + table.id"
          type="button"
          class="hot-card"
          @click="goPath('/tables')"
        >
          <span class="hot-rank" :class="'rank-' + (index + 1)">{{ index + 1 }}</span>
          <span class="hot-badge">{{ table.type }}</span>
          <h3 class="hot-name">{{ table.name }}</h3>
          <p class="hot-meta">{{ table.brand }} · {{ table.size }}</p>
          <div class="hot-footer">
            <span class="hot-price">¥{{ table.price }}<em>/小时</em></span>
            <span class="hot-cta">去预约
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </span>
          </div>
        </button>
      </div>
    </section>

    <!-- Hot Courses Section（热门课程） -->
    <section class="hot-section">
      <div class="section-header-row">
        <div>
          <span class="section-tag">热门课程</span>
          <h2 class="row-title">大家都在学</h2>
        </div>
        <button class="text-btn" @click="goPath('/courses')">
          查看全部
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>

      <div v-if="coursesState.status === 'loading'" class="hot-grid">
        <div v-for="n in 2" :key="n" class="hot-skeleton">
          <div class="skeleton-line w-60"></div>
          <div class="skeleton-line w-40"></div>
          <div class="skeleton-line w-80"></div>
        </div>
      </div>

      <div v-else-if="coursesState.status === 'error'" class="state-panel">
        <span class="state-icon">⚠️</span>
        <p class="state-title">热门课程加载失败</p>
        <p class="state-desc">{{ coursesState.error || '网络开小差了，请稍后重试' }}</p>
        <button class="state-btn" :disabled="coursesState.reloading" @click="loadHotCourses(true)">
          {{ coursesState.reloading ? '重试中...' : '重新加载' }}
        </button>
      </div>

      <div v-else-if="hotCourses.length === 0" class="state-panel">
        <span class="state-icon">📚</span>
        <p class="state-title">暂无热门课程</p>
        <p class="state-desc">课程正在筹备中，可先浏览课程页面</p>
        <button class="state-btn" @click="goPath('/courses')">前往课程中心</button>
      </div>

      <div v-else class="hot-grid hot-grid-courses">
        <button
          v-for="(course, index) in hotCourses"
          :key="'course-' + course.id"
          type="button"
          class="hot-card course-card"
          @click="goPath('/courses')"
        >
          <span class="hot-rank" :class="'rank-' + (index + 1)">{{ index + 1 }}</span>
          <span class="course-visual" :style="{ background: course.gradient }">{{ course.icon }}</span>
          <span class="hot-badge">{{ course.level }} · {{ course.duration }}</span>
          <h3 class="hot-name">{{ course.name }}</h3>
          <p class="hot-meta">{{ course.coach }} · {{ course.students }}人已报名</p>
          <div class="hot-footer">
            <span class="hot-price">¥{{ course.price }}<em> 原价¥{{ course.originalPrice }}</em></span>
            <span class="hot-cta">去报名
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </span>
          </div>
        </button>
      </div>
    </section>

    <!-- Session Expired Hint（登录过期轻提示条，不遮挡入口） -->
    <Transition name="bar">
      <div v-if="expiredNotice" class="expired-bar">
        <span>🔒 {{ expiredNotice }}</span>
        <button @click="requireAuth()">重新登录</button>
      </div>
    </Transition>

    <!-- Features Section -->
    <section class="features">
      <div class="section-header">
        <span class="section-tag center">我们的服务</span>
        <h2 class="section-title">为什么选择我们</h2>
      </div>
      <div class="features-grid">
        <div v-for="(feature, index) in features" :key="index" class="feature-card" @click="goToFeature(feature)">
          <div class="feature-icon">
            <div class="icon-bg"></div>
            <span>{{ feature.icon }}</span>
          </div>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.desc }}</p>
          <div class="feature-link">
            <span>了解更多</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta">
      <div class="cta-content">
        <div class="cta-bg">
          <div class="cta-orb"></div>
        </div>
        <h2>准备好开始了吗？</h2>
        <p>加入我们，体验专业台球的魅力</p>
        <button class="btn-cta" @click="goPath('/tables')">
          <span>开始预约</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </section>
  </div>
</template>

<script>
import { api, logger } from '../utils/api'
import { authState, openLoginModal, onAuthExpired } from '../utils/auth'
import { taskStore } from '../utils/taskStore'

/** 热门区域展示数量 */
const HOT_TABLES_LIMIT = 3
const HOT_COURSES_LIMIT = 2

/**
 * 创建资源区独立状态
 * status: idle / loading / success / error
 */
function createResourceState() {
  return {
    status: 'idle',
    error: '',
    reloading: false,
    /** 数据快照，只存当前会话确认可用的数据 */
    items: []
  }
}

export default {
  name: 'Home',
  data() {
    return {
      // 热门球桌/课程各自独立状态，单区失败不影响另一区
      tablesState: createResourceState(),
      coursesState: createResourceState(),
      // 当前会话的任务概览快照
      taskSummary: { pending: 0, unpaid: 0, completed: 0 },
      // 登录过期提示文案（空串表示不显示）
      expiredNotice: '',
      // 会话标识：登录用户用 user.id，游客用递增序号；
      // 登录/退出/过期都会变化，强制按会话重建概览
      sessionKey: 'guest-0',
      guestSeq: 0,
      // 请求序号：每个资源独立计数，快速往返/重复触发时只接受最新一次响应
      tablesSeq: 0,
      coursesSeq: 0,
      // 组件是否已卸载：卸载后在途响应一律丢弃，避免写回已销毁实例
      isUnmounted: false,
      // 任务变更取消订阅句柄
      unsubscribeTasks: null,
      // 登录过期取消订阅句柄
      unsubscribeExpired: null,
      features: [
        { icon: '🎱', title: '顶级球桌', desc: '进口星牌、乔氏球桌，国际比赛标准配置，为您提供最佳击球体验', link: '/tables' },
        { icon: '👨‍🏫', title: '专业教练', desc: '国家级认证教练团队，一对一定制教学，快速提升您的球技水平', link: '/courses' },
        { icon: '🏆', title: '精彩赛事', desc: '定期举办各类台球比赛，从业余到专业，让您在竞技中成长', link: '/competitions' },
        { icon: '🛒', title: '装备商城', desc: '正品台球装备一站式购买，从球杆到配件，品质保证', link: '/shop' }
      ],
      quickEntries: [
        { icon: '🎱', name: '球桌预约', desc: '实时空桌 · 在线选时', link: '/tables', authRequired: false },
        { icon: '📚', name: '教学课程', desc: '入门到进阶 · 名师带练', link: '/courses', authRequired: false },
        { icon: '🏆', name: '赛事活动', desc: '赛程报名 · 成绩查询', link: '/competitions', authRequired: false },
        { icon: '🛒', name: '装备商城', desc: '正品装备 · 快捷下单', link: '/shop', authRequired: false },
        { icon: '📋', name: '任务中心', desc: '预约/报名/订单一站管理', link: '/tasks', authRequired: true },
        { icon: '👤', name: '个人中心', desc: '积分资料 · 会员权益', link: '/profile', authRequired: true }
      ]
    }
  },
  computed: {
    isLoggedIn() {
      return authState.isLoggedIn
    },
    memberName() {
      return authState.user?.name || '会员'
    },
    memberLevel() {
      return authState.user?.level || '普通'
    },
    memberPoints() {
      return authState.user?.points || 0
    },
    userInitial() {
      return this.memberName.charAt(0)
    },
    hotTables() {
      return this.tablesState.items
    },
    hotCourses() {
      return this.coursesState.items
    },
    /**
     * 会话标识：登录用户为 user-<id>，游客为 guest
     * 登录、退出、过期、切换账号都会使其变化
     * @returns {string}
     */
    sessionIdentifier() {
      return authState.isLoggedIn && authState.user ? 'user-' + authState.user.id : 'guest'
    }
  },
  watch: {
    /**
     * 会话变化（登录成功 / 退出 / 过期 / 切换账号）时：
     * 立即按新会话重建概览，绝不让上一个用户的数据留在界面上
     */
    sessionIdentifier() {
      this.enterSession(authState.isLoggedIn)
    }
  },
  mounted() {
    // 以当前会话初始化（从 localStorage 恢复登录态时同样适用）
    this.enterSession(this.isLoggedIn)

    // 公共热门内容：与账号无关，仅加载一次，失败可单区重试
    this.loadHotTables()
    this.loadHotCourses()

    // 任务数据（含会话切换、支付/取消等）变化时刷新概览
    this.unsubscribeTasks = taskStore.subscribe(() => {
      this.refreshTaskSummary()
    })

    // 登录过期：重置会员数据视图并给出轻提示
    this.unsubscribeExpired = onAuthExpired(() => {
      this.resetMemberData()
      this.expiredNotice = '登录状态已过期，请重新登录'
    })
  },
  beforeUnmount() {
    if (this.unsubscribeTasks) this.unsubscribeTasks()
    if (this.unsubscribeExpired) this.unsubscribeExpired()
    // 标记卸载，在途响应回来时不再写回本组件
    this.isUnmounted = true
  },
  methods: {
    /**
     * 进入/切换当前会话
     * 登录用户绑定 user.id；游客使用一次性会话序号
     * @param {boolean} loggedIn - 当前是否已登录
     */
    enterSession(loggedIn) {
      // 进入有效的新登录会话时清掉过期提示；
      // 退出/过期切到游客时保留过期提示（由过期回调设置）
      if (loggedIn) {
        this.expiredNotice = ''
      }

      if (loggedIn && authState.user) {
        this.sessionKey = 'user-' + authState.user.id
      } else {
        this.guestSeq += 1
        this.sessionKey = 'guest-' + this.guestSeq
      }

      // 先清空再按当前会话重算任务概览，避免闪现上一个用户的数据
      this.resetMemberData()
      if (loggedIn) {
        this.refreshTaskSummary()
      }
    },

    /**
     * 清空所有与会话/用户相关的数据
     */
    resetMemberData() {
      this.taskSummary = { pending: 0, unpaid: 0, completed: 0 }
    },

    /**
     * 从 taskStore 读取当前会话的任务概览
     * taskStore 已按用户ID隔离命名空间，这里只做统计
     */
    refreshTaskSummary() {
      if (!authState.isLoggedIn) {
        this.resetMemberData()
        return
      }
      try {
        const tasks = taskStore.getAll()
        this.taskSummary = {
          pending: tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length,
          unpaid: tasks.filter(t => t.status === 'pending_payment').length,
          completed: tasks.filter(t => t.status === 'completed').length
        }
      } catch (e) {
        logger.error('Refresh task summary failed', e)
        this.taskSummary = { pending: 0, unpaid: 0, completed: 0 }
      }
    },

    /**
     * 加载热门球桌
     * 可预约球桌优先，按价格排序作为热门依据，取前 N 个
     * @param {boolean} isRetry - 是否为手动重试
     */
    async loadHotTables(isRetry = false) {
      const seq = ++this.tablesSeq
      this.tablesState.status = 'loading'
      this.tablesState.error = ''
      this.tablesState.reloading = !!isRetry

      try {
        const result = await api.getTables()
        // 已卸载或已被更新的请求取代时，丢弃本次过期响应
        if (this.isUnmounted || seq !== this.tablesSeq) return

        if (result.success && Array.isArray(result.data)) {
          const sorted = [...result.data].sort((a, b) => {
            if (a.available !== b.available) return a.available ? -1 : 1
            return (b.bookings || 0) - (a.bookings || 0) || a.price - b.price
          })
          this.tablesState.items = sorted.slice(0, HOT_TABLES_LIMIT)
          this.tablesState.status = 'success'
        } else {
          // 登录过期（401）由全局事件处理；热门球桌是公开内容，
          // 这里展示错误态并允许重试/走其它入口
          this.tablesState.status = 'error'
          this.tablesState.error = result.error || '数据加载失败'
        }
      } catch (e) {
        if (this.isUnmounted || seq !== this.tablesSeq) return
        this.tablesState.status = 'error'
        this.tablesState.error = e.message || '网络异常'
      } finally {
        if (!this.isUnmounted && seq === this.tablesSeq) {
          this.tablesState.reloading = false
        }
      }
    },

    /**
     * 加载热门课程：按报名人数倒序，取前 N 个
     * @param {boolean} isRetry - 是否为手动重试
     */
    async loadHotCourses(isRetry = false) {
      const seq = ++this.coursesSeq
      this.coursesState.status = 'loading'
      this.coursesState.error = ''
      this.coursesState.reloading = !!isRetry

      try {
        const result = await api.getCourses()
        if (this.isUnmounted || seq !== this.coursesSeq) return

        if (result.success && Array.isArray(result.data)) {
          const sorted = [...result.data].sort((a, b) => (b.students || 0) - (a.students || 0))
          this.coursesState.items = sorted.slice(0, HOT_COURSES_LIMIT)
          this.coursesState.status = 'success'
        } else {
          this.coursesState.status = 'error'
          this.coursesState.error = result.error || '数据加载失败'
        }
      } catch (e) {
        if (this.isUnmounted || seq !== this.coursesSeq) return
        this.coursesState.status = 'error'
        this.coursesState.error = e.message || '网络异常'
      } finally {
        if (!this.isUnmounted && seq === this.coursesSeq) {
          this.coursesState.reloading = false
        }
      }
    },

    /**
     * 处理快捷入口点击：需登录且未登录时唤起全局登录弹窗，
     * 弹窗关闭后页面状态保持，入口仍然可继续操作
     * @param {Object} entry - 入口配置
     */
    handleEntry(entry) {
      if (entry.authRequired && !authState.isLoggedIn) {
        this.requireAuth()
        return
      }
      this.goPath(entry.link)
    },

    /**
     * 唤起全局登录弹窗（不离开首页，不破坏当前布局）
     */
    requireAuth() {
      this.expiredNotice = ''
      openLoginModal()
    },

    /**
     * 路由跳转；重复点击同一路由时吞掉 NavigationDuplicated 类异常
     * @param {string} path - 目标路径
     */
    goPath(path) {
      if (this.$route.path === path) return
      this.$router.push(path).catch(err => {
        if (err && err.name !== 'NavigationDuplicated') {
          logger.error('Navigation failed', { path, error: err.message })
        }
      })
    },

    /**
     * 跳转到功能页面
     * @param {Object} feature - 功能对象，包含 link 属性
     */
    goToFeature(feature) {
      this.goPath(feature.link)
    }
  }
}
</script>

<style scoped>
.home {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 3rem;
}

/* Hero Section */
.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  min-height: calc(100vh - 200px);
  align-items: center;
  position: relative;
  padding: 2rem 0;
}

.hero-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
}

.orb-1 {
  width: 600px;
  height: 600px;
  background: var(--primary);
  top: -200px;
  right: -100px;
  opacity: 0.15;
}

.orb-2 {
  width: 400px;
  height: 400px;
  background: #667eea;
  bottom: -100px;
  left: -100px;
  opacity: 0.1;
}

.grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 60px 60px;
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(0, 217, 165, 0.1);
  border: 1px solid rgba(0, 217, 165, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.85rem;
  color: var(--primary);
  margin-bottom: 1.5rem;
}

.badge-dot {
  width: 8px;
  height: 8px;
  background: var(--primary);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}

.hero-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 4.5rem;
  font-weight: 700;
  line-height: 1.1;
  margin-bottom: 1.5rem;
}

.hero-title .line {
  display: block;
}

.hero-title .highlight {
  background: var(--gradient-1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-desc {
  font-size: 1.1rem;
  color: var(--text-secondary);
  line-height: 1.8;
  margin-bottom: 1.5rem;
}

/* 会员概览卡片 */
.member-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
  background: var(--bg-card);
  border: 1px solid rgba(0, 217, 165, 0.25);
  border-radius: 16px;
  padding: 1rem 1.25rem;
  margin-bottom: 2rem;
  box-shadow: 0 0 40px rgba(0, 217, 165, 0.08);
}

.member-card.guest {
  border-color: var(--border);
  box-shadow: none;
}

.member-main {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
}

.member-avatar {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 14px;
  background: var(--gradient-1);
  color: var(--bg-dark);
  font-size: 1.35rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.guest-avatar {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-secondary);
  font-size: 1.2rem;
}

.member-info {
  min-width: 0;
}

.member-greeting {
  font-size: 1.05rem;
  font-weight: 600;
  margin-bottom: 0.35rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.member-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.member-tag {
  font-size: 0.75rem;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 0.2rem 0.7rem;
}

.member-tag.level {
  color: #ffc107;
  background: rgba(255, 193, 7, 0.1);
}

.member-tag.points {
  color: var(--primary);
  background: rgba(0, 217, 165, 0.1);
}

.member-tasks {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.member-task {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 64px;
  padding: 0.4rem 0.75rem;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.member-task:hover {
  background: rgba(255, 255, 255, 0.05);
}

.task-num {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--primary);
  line-height: 1.2;
}

.task-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.member-login-btn {
  flex-shrink: 0;
  background: var(--gradient-1);
  color: var(--bg-dark);
  border: none;
  padding: 0.7rem 1.5rem;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.member-login-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px var(--primary-glow);
}

.hero-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 3rem;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--gradient-1);
  color: var(--bg-dark);
  border: none;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 40px var(--primary-glow);
}

.btn-arrow {
  width: 20px;
  height: 20px;
  transition: transform 0.3s;
}

.btn-primary:hover .btn-arrow {
  transform: translateX(4px);
}

.btn-secondary {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border);
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-secondary:hover {
  background: var(--bg-card);
  border-color: var(--text-muted);
}

.hero-stats {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.stat-item {
  text-align: left;
}

.stat-number {
  display: block;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-number .plus {
  color: var(--primary);
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.stat-divider {
  width: 1px;
  height: 50px;
  background: var(--border);
}

/* Hero Visual */
.hero-visual {
  position: relative;
  z-index: 1;
}

.visual-card {
  position: relative;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 3rem;
  overflow: hidden;
}

.card-glow {
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, var(--primary-glow) 0%, transparent 70%);
  pointer-events: none;
}

.billiard-animation {
  position: relative;
  aspect-ratio: 16/10;
}

.table-surface {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%);
  border-radius: 12px;
  border: 8px solid #5D4037;
  position: relative;
  box-shadow: inset 0 0 30px rgba(0,0,0,0.3);
}

.ball {
  position: absolute;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  box-shadow:
    inset -3px -3px 8px rgba(0,0,0,0.3),
    2px 2px 4px rgba(0,0,0,0.2);
}

.ball-cue {
  background: linear-gradient(135deg, #fff 0%, #e0e0e0 100%);
  bottom: 30%;
  left: 20%;
  animation: moveCue 4s ease-in-out infinite;
}

.ball-1 {
  background: linear-gradient(135deg, #FDD835 0%, #F9A825 100%);
  top: 40%;
  right: 35%;
}

.ball-2 {
  background: linear-gradient(135deg, #1E88E5 0%, #1565C0 100%);
  top: 30%;
  right: 25%;
}

.ball-3 {
  background: linear-gradient(135deg, #E53935 0%, #C62828 100%);
  top: 50%;
  right: 30%;
}

.ball-8 {
  background: linear-gradient(135deg, #212121 0%, #000 100%);
  top: 40%;
  right: 40%;
}

.ball-8::after {
  content: '8';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fff;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  font-size: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000;
  font-weight: bold;
}

@keyframes moveCue {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(20px, -10px); }
}

/* ========== 快捷入口 ========== */
.quick-entries {
  padding: 2rem 0 1rem;
}

.section-header-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.section-tag {
  display: inline-block;
  background: rgba(0, 217, 165, 0.1);
  color: var(--primary);
  padding: 0.4rem 0.9rem;
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: 500;
  margin-bottom: 0.6rem;
}

.section-tag.center {
  display: inline-block;
}

.row-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.6rem;
  font-weight: 700;
}

.text-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 0.88rem;
  cursor: pointer;
  padding: 0.4rem 0.6rem;
  border-radius: 8px;
  transition: color 0.2s, background 0.2s;
}

.text-btn svg {
  width: 15px;
  height: 15px;
}

.text-btn:hover {
  color: var(--primary);
  background: rgba(0, 217, 165, 0.08);
}

.entries-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 1rem;
}

.entry-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  text-align: left;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 1.1rem 1rem;
  cursor: pointer;
  transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s;
}

.entry-card:hover {
  transform: translateY(-4px);
  border-color: var(--primary);
  box-shadow: var(--shadow-glow);
}

.entry-icon {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(0, 217, 165, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.entry-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.entry-name {
  font-size: 0.95rem;
  font-weight: 600;
  white-space: nowrap;
}

.entry-desc {
  font-size: 0.72rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.entry-lock {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 0.62rem;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 0.1rem 0.45rem;
}

.entry-arrow {
  position: absolute;
  right: 0.9rem;
  bottom: 0.7rem;
  width: 14px;
  height: 14px;
  color: var(--text-muted);
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity 0.25s, transform 0.25s, color 0.25s;
}

.entry-card:hover .entry-arrow {
  opacity: 1;
  transform: translateX(0);
  color: var(--primary);
}

/* ========== 热门区域通用 ========== */
.hot-section {
  padding: 2.5rem 0 1rem;
}

.hot-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
  min-height: 190px;
}

.hot-grid-courses {
  grid-template-columns: repeat(2, 1fr);
}

.hot-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 1.5rem;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s;
}

.hot-card:hover {
  transform: translateY(-4px);
  border-color: var(--primary);
  box-shadow: var(--shadow-glow);
}

.hot-rank {
  position: absolute;
  top: 0;
  right: 1.1rem;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 2.6rem;
  font-weight: 800;
  line-height: 1;
  color: rgba(255, 255, 255, 0.06);
}

.hot-rank.rank-1 {
  color: rgba(255, 193, 7, 0.28);
}

.hot-rank.rank-2 {
  color: rgba(180, 190, 205, 0.3);
}

.hot-rank.rank-3 {
  color: rgba(205, 127, 50, 0.3);
}

.hot-badge {
  font-size: 0.72rem;
  color: var(--primary);
  background: rgba(0, 217, 165, 0.1);
  border-radius: 20px;
  padding: 0.25rem 0.7rem;
  margin-bottom: 0.85rem;
}

.hot-name {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.35rem;
}

.hot-meta {
  font-size: 0.82rem;
  color: var(--text-secondary);
  margin-bottom: 1.1rem;
}

.course-visual {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  margin-bottom: 0.85rem;
}

.hot-footer {
  margin-top: auto;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hot-price {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary);
}

.hot-price em {
  font-style: normal;
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-left: 0.35rem;
  font-weight: 400;
}

.hot-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
  transition: color 0.2s;
}

.hot-cta svg {
  width: 15px;
  height: 15px;
  transition: transform 0.2s;
}

.hot-card:hover .hot-cta {
  color: var(--primary);
}

.hot-card:hover .hot-cta svg {
  transform: translateX(3px);
}

/* 骨架屏：与卡片同尺寸占位，避免布局跳动 */
.hot-skeleton {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.skeleton-line {
  height: 14px;
  border-radius: 7px;
  background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 37%, rgba(255,255,255,0.05) 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
}

.w-40 { width: 40%; }
.w-60 { width: 60%; height: 20px; }
.w-80 { width: 80%; }

@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}

/* 错误/空状态面板：与网格同高，保证首屏布局稳定 */
.state-panel {
  min-height: 190px;
  background: var(--bg-card);
  border: 1px dashed var(--border);
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem;
  text-align: center;
}

.state-icon {
  font-size: 2rem;
}

.state-title {
  font-size: 1rem;
  font-weight: 600;
}

.state-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.state-btn {
  margin-top: 0.5rem;
  background: rgba(0, 217, 165, 0.12);
  border: 1px solid rgba(0, 217, 165, 0.3);
  color: var(--primary);
  padding: 0.55rem 1.4rem;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.state-btn:hover:not(:disabled) {
  background: rgba(0, 217, 165, 0.2);
}

.state-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 登录过期提示条 */
.expired-bar {
  margin-top: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: rgba(255, 193, 7, 0.08);
  border: 1px solid rgba(255, 193, 7, 0.25);
  border-radius: 12px;
  padding: 0.8rem 1.2rem;
  font-size: 0.88rem;
  color: #ffc107;
}

.expired-bar button {
  background: rgba(255, 193, 7, 0.15);
  border: none;
  color: #ffc107;
  padding: 0.4rem 1rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.expired-bar button:hover {
  background: rgba(255, 193, 7, 0.25);
}

.bar-enter-active,
.bar-leave-active {
  transition: all 0.3s ease;
}

.bar-enter-from,
.bar-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* Features Section */
.features {
  padding: 5rem 0;
}

.section-header {
  text-align: center;
  margin-bottom: 4rem;
}

.section-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 3rem;
  font-weight: 700;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.feature-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 2rem;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.feature-card:hover {
  transform: translateY(-8px);
  border-color: var(--primary);
  box-shadow: var(--shadow-glow);
}

.feature-icon {
  position: relative;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.icon-bg {
  position: absolute;
  inset: 0;
  background: var(--gradient-1);
  border-radius: 16px;
  opacity: 0.1;
  transition: opacity 0.3s;
}

.feature-card:hover .icon-bg {
  opacity: 0.2;
}

.feature-icon span {
  font-size: 1.75rem;
  position: relative;
  z-index: 1;
}

.feature-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.feature-card p {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.feature-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--primary);
  font-size: 0.9rem;
  font-weight: 500;
}

.feature-link svg {
  width: 16px;
  height: 16px;
  transition: transform 0.3s;
}

.feature-card:hover .feature-link svg {
  transform: translateX(4px);
}

/* CTA Section */
.cta {
  padding: 2rem 0 4rem;
}

.cta-content {
  position: relative;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 32px;
  padding: 5rem;
  text-align: center;
  overflow: hidden;
}

.cta-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.cta-orb {
  position: absolute;
  width: 500px;
  height: 500px;
  background: var(--primary);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  filter: blur(150px);
  opacity: 0.15;
}

.cta-content h2 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  position: relative;
}

.cta-content p {
  color: var(--text-secondary);
  font-size: 1.1rem;
  margin-bottom: 2rem;
  position: relative;
}

.btn-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--gradient-1);
  color: var(--bg-dark);
  border: none;
  padding: 1.25rem 2.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.btn-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 50px var(--primary-glow);
}

.btn-cta svg {
  width: 20px;
  height: 20px;
  transition: transform 0.3s;
}

.btn-cta:hover svg {
  transform: translateX(4px);
}

@media (max-width: 1200px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .entries-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 900px) {
  .hero {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .member-card {
    justify-content: center;
    text-align: left;
  }

  .hero-title {
    font-size: 3rem;
  }

  .hero-actions {
    justify-content: center;
  }

  .hero-stats {
    justify-content: center;
  }

  .hero-visual {
    display: none;
  }

  .hot-grid,
  .hot-grid-courses {
    grid-template-columns: 1fr;
    min-height: auto;
  }
}

@media (max-width: 600px) {
  .home {
    padding: 0 1.5rem;
  }

  .features-grid,
  .entries-grid {
    grid-template-columns: 1fr;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .member-card {
    padding: 1rem;
  }

  .member-tasks {
    width: 100%;
    justify-content: space-around;
  }

  .cta-content {
    padding: 3rem 1.5rem;
  }
}
</style>
