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
        <div class="hero-actions">
          <button class="btn-primary" @click="goTo('/tables')">
            <span>立即预约</span>
            <svg class="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
          <button class="btn-secondary" @click="goTo('/courses')">
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

    <!-- 业务概览：登录结果 + 当前会话任务数据 -->
    <section class="overview">
      <!-- 登录过期提示 -->
      <Transition name="banner">
        <div v-if="showExpiredBanner" class="expired-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span class="banner-text">登录状态已过期，请重新登录</span>
          <button class="banner-action" @click="openLogin">重新登录</button>
          <button class="banner-close" @click="showExpiredBanner = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </Transition>

      <!-- 已登录：会员业务概览（仅展示当前用户数据） -->
      <div v-if="isLoggedIn" class="overview-card member">
        <div class="overview-greeting">
          <div class="greeting-avatar">{{ userName.charAt(0) }}</div>
          <div class="greeting-text">
            <h3>你好，{{ userName }}</h3>
            <p>{{ userLevel }}会员 · ID {{ userId }} · 积分 {{ userPoints.toLocaleString() }}</p>
          </div>
          <button class="greeting-link" @click="goTo('/profile')">
            个人中心
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>

        <!-- 任务概览：占位骨架保证首屏不跳动 -->
        <div class="overview-stats" :class="{ loading: overviewLoading }">
          <template v-if="!overviewLoading">
            <div class="ov-stat" @click="goTo('/tasks')">
              <span class="ov-value">{{ displayOverview.pendingCount }}</span>
              <span class="ov-label">待处理</span>
            </div>
            <div class="ov-stat" @click="goTo('/tasks')">
              <span class="ov-value warn">{{ displayOverview.pendingPaymentCount }}</span>
              <span class="ov-label">待付款</span>
            </div>
            <div class="ov-stat" @click="goTo('/tasks')">
              <span class="ov-value info">{{ displayOverview.ongoingCount + displayOverview.upcomingCount }}</span>
              <span class="ov-label">进行/待开始</span>
            </div>
            <div class="ov-stat" @click="goTo('/tasks')">
              <span class="ov-value muted">{{ displayOverview.completedCount }}</span>
              <span class="ov-label">已完成</span>
            </div>
          </template>
          <template v-else>
            <div v-for="n in 4" :key="n" class="ov-stat skeleton">
              <span class="ov-value skel-line"></span>
              <span class="ov-label skel-line short"></span>
            </div>
          </template>
        </div>

        <!-- 最新待办 -->
        <div class="overview-latest">
          <div class="latest-header">
            <span>最新待办</span>
            <button class="latest-more" @click="goTo('/tasks')">全部任务 ›</button>
          </div>
          <div v-if="overviewLoading" class="latest-list">
            <div v-for="n in 2" :key="n" class="latest-item skel-line"></div>
          </div>
          <div v-else-if="displayOverview.latest.length" class="latest-list">
            <div
              v-for="task in displayOverview.latest"
              :key="task.id"
              class="latest-item"
              @click="goTo('/tasks')"
            >
              <span class="latest-icon">{{ task.typeIcon }}</span>
              <div class="latest-info">
                <span class="latest-title">{{ task.title }}</span>
                <span class="latest-sub">{{ task.subtitle }}</span>
              </div>
              <span class="latest-status" :class="task.statusType">{{ task.statusText }}</span>
            </div>
          </div>
          <div v-else class="latest-empty">
            <span>暂无待办任务，去预约一张球桌吧</span>
            <button @click="goTo('/tables')">立即预约</button>
          </div>
        </div>
      </div>

      <!-- 游客：登录引导（任何情况下都不展示上一个用户的数据） -->
      <div v-else class="overview-card guest">
        <div class="guest-main">
          <div class="guest-icon">🎱</div>
          <div class="guest-text">
            <h3>登录后查看您的业务概览</h3>
            <p>待处理任务、待付款订单、课程与赛事安排一目了然</p>
          </div>
          <div class="guest-actions">
            <button class="btn-login-entry" @click="openLogin">
              立即登录
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="guest-stats">
          <div class="ov-stat">
            <span class="ov-value">50<span class="plus">+</span></span>
            <span class="ov-label">专业球桌</span>
          </div>
          <div class="ov-stat">
            <span class="ov-value">200<span class="plus">+</span></span>
            <span class="ov-label">精彩赛事</span>
          </div>
          <div class="ov-stat">
            <span class="ov-value">10K<span class="plus">+</span></span>
            <span class="ov-label">注册会员</span>
          </div>
          <div class="ov-stat">
            <span class="ov-value">30<span class="plus">+</span></span>
            <span class="ov-label">认证教练</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 快捷入口：任意状态下都可点击，需登录的操作弹登录框 -->
    <section class="quick-entry">
      <div class="section-header-inline">
        <div>
          <span class="section-tag">快捷入口</span>
          <h2 class="section-heading">常用服务</h2>
        </div>
      </div>
      <div class="quick-grid">
        <button
          v-for="entry in quickEntries"
          :key="entry.path"
          class="quick-item"
          @click="handleQuickEntry(entry)"
        >
          <span class="quick-icon">{{ entry.icon }}</span>
          <span class="quick-name">{{ entry.name }}</span>
          <span v-if="isLoggedIn && entry.badge > 0" class="quick-badge">{{ entry.badge }}</span>
          <svg class="quick-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
    </section>

    <!-- 热门课程 -->
    <section class="hot-section">
      <div class="section-header-inline">
        <div>
          <span class="section-tag">热门课程</span>
          <h2 class="section-heading">学员都在学</h2>
        </div>
        <button class="btn-view-all" @click="goTo('/courses')">查看全部</button>
      </div>

      <div class="hot-grid" aria-live="polite">
        <template v-if="coursesLoading">
          <div v-for="n in 4" :key="'sk-c' + n" class="hot-card skeleton-card">
            <div class="skel-block visual"></div>
            <div class="skel-block line w80"></div>
            <div class="skel-block line w60"></div>
            <div class="skel-block line w40"></div>
          </div>
        </template>

        <div v-else-if="coursesError" class="state-block error">
          <span class="state-icon">⚠️</span>
          <h4>热门课程加载失败</h4>
          <p>{{ coursesError }}</p>
          <button class="btn-retry" @click="loadCourses">重新加载</button>
        </div>

        <div v-else-if="hotCourses.length === 0" class="state-block empty">
          <span class="state-icon">📚</span>
          <h4>暂无热门课程</h4>
          <p>新课程正在筹备中，敬请期待</p>
          <button class="btn-retry ghost" @click="goTo('/courses')">浏览全部课程</button>
        </div>

        <template v-else>
          <div
            v-for="course in hotCourses"
            :key="course.id"
            class="hot-card course"
            @click="goTo('/courses')"
          >
            <div class="hot-visual" :style="{ background: course.gradient }">
              <span class="hot-emoji">{{ course.icon }}</span>
              <span v-if="course.__rank <= 3" class="hot-rank">TOP{{ course.__rank }}</span>
            </div>
            <div class="hot-body">
              <h4>{{ course.name }}</h4>
              <p class="hot-desc">{{ course.description }}</p>
              <div class="hot-meta">
                <span class="meta-students">👥 {{ course.students }}人已学</span>
                <span class="meta-level">{{ course.level }}</span>
              </div>
              <div class="hot-footer">
                <span class="hot-price">¥{{ course.price }}</span>
                <span class="hot-coach">{{ course.coach }} · {{course.coachTitle}}</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </section>

    <!-- 热门球桌 -->
    <section class="hot-section">
      <div class="section-header-inline">
        <div>
          <span class="section-tag">热门球桌</span>
          <h2 class="section-heading">抢手球桌抢先约</h2>
        </div>
        <button class="btn-view-all" @click="goTo('/tables')">查看全部</button>
      </div>

      <div class="hot-grid tables" aria-live="polite">
        <template v-if="tablesLoading">
          <div v-for="n in 4" :key="'sk-t' + n" class="hot-card skeleton-card">
            <div class="skel-block visual"></div>
            <div class="skel-block line w80"></div>
            <div class="skel-block line w50"></div>
          </div>
        </template>

        <div v-else-if="tablesError" class="state-block error">
          <span class="state-icon">⚠️</span>
          <h4>热门球桌加载失败</h4>
          <p>{{ tablesError }}</p>
          <button class="btn-retry" @click="loadTables">重新加载</button>
        </div>

        <div v-else-if="hotTables.length === 0" class="state-block empty">
          <span class="state-icon">🎱</span>
          <h4>暂无可预约球桌</h4>
          <p>当前时段球桌均已占用，换个时间看看吧</p>
          <button class="btn-retry ghost" @click="loadTables">刷新试试</button>
        </div>

        <template v-else>
          <div
            v-for="table in hotTables"
            :key="table.id"
            class="hot-card table"
            @click="goTo('/tables')"
          >
            <div class="table-visual-mini">
              <div class="mini-surface">
                <span v-for="p in 6" :key="p" class="mini-pocket" :class="'p' + p"></span>
              </div>
              <span class="table-badge" :class="{ off: !table.available }">
                {{ table.available ? '可预约' : '已占用' }}
              </span>
            </div>
            <div class="hot-body">
              <h4>{{ table.name }}</h4>
              <div class="hot-meta">
                <span class="meta-students">{{ table.type }}</span>
                <span class="meta-level">{{ table.brand }} · {{ table.size }}</span>
              </div>
              <div class="hot-footer">
                <span class="hot-price">¥{{ table.price }}<i>/小时</i></span>
                <span
                  class="table-book-btn"
                  :class="{ disabled: !table.available }"
                  @click.stop="handleBookTable(table)"
                >{{ table.available ? '立即预约' : '暂不可用' }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features">
      <div class="section-header">
        <span class="section-tag">我们的服务</span>
        <h2 class="section-title">为什么选择我们</h2>
      </div>
      <div class="features-grid">
        <div v-for="(feature, index) in features" :key="index" class="feature-card" @click="goTo(feature.link)">
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
        <button class="btn-cta" @click="goTo('/tables')">
          <span>开始预约</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </section>

    <!-- 登录弹窗（游客点击需登录入口时使用） -->
    <LoginModal v-model="showLoginModal" @success="onLoginSuccess" />
  </div>
</template>

<script>
import LoginModal from '../components/LoginModal.vue'
import { api, logger } from '../utils/api'
import { authState, isAuthenticated, onAuthChange } from '../utils/auth'
import { taskStore } from '../utils/taskStore'

// 热门数据取前 N 条，空数组时 UI 走空态
const HOT_COURSE_LIMIT = 4
const HOT_TABLE_LIMIT = 4

export default {
  name: 'Home',
  components: { LoginModal },
  data() {
    return {
      // 登录弹窗
      showLoginModal: false,
      showExpiredBanner: false,

      // 业务概览（登录用户）：骨架占位，加载完再填充
      overviewLoading: false,
      overviewLoaded: false,
      // 最近一次成功加载的概览快照（仅当前登录用户），加载期间保留旧结构避免闪烁
      overview: this.emptyOverview(),

      // 热门课程状态机：loading / error / data
      coursesLoading: true,
      coursesError: '',
      courses: [],

      // 热门球桌状态机
      tablesLoading: true,
      tablesError: '',
      tables: [],

      // 快捷入口（徽标由任务数据实时计算）
      taskVersion: 0,

      // 请求序号：身份切换/组件销毁时自增，使在途旧响应失效（快速往返防护）
      requestSeq: 0,

      features: [
        { icon: '🎱', title: '顶级球桌', desc: '进口星牌、乔氏球桌，国际比赛标准配置，为您提供最佳击球体验', link: '/tables' },
        { icon: '👨‍🏫', title: '专业教练', desc: '国家级认证教练团队，一对一定制教学，快速提升您的球技水平', link: '/courses' },
        { icon: '🏆', title: '精彩赛事', desc: '定期举办各类台球比赛，从业余到专业，让您在竞技中成长', link: '/competitions' },
        { icon: '🛒', title: '装备商城', desc: '正品台球装备一站式购买，从球杆到配件，品质保证', link: '/shop' }
      ]
    }
  },
  computed: {
    isLoggedIn() {
      return authState.isLoggedIn
    },
    userName() {
      return authState.user?.name || '游客'
    },
    userLevel() {
      return authState.user?.level || '普通'
    },
    userId() {
      return authState.user?.id || '--'
    },
    userPoints() {
      return authState.user?.points || 0
    },
    /** 当前会话身份键：游客固定为 guest，登录用户为其用户ID */
    identityKey() {
      return this.isLoggedIn && authState.user?.id ? `u:${authState.user.id}` : 'guest'
    },
    /** 当前用户的任务统计（taskVersion/身份变化驱动重算） */
    taskSummary() {
      // 依赖收集：登录身份与任务版本
      this.taskVersion
      const loggedId = authState.isLoggedIn ? authState.user?.id : null
      if (!loggedId) return this.emptyOverview()
      try {
        return taskStore.getOverview()
      } catch (e) {
        logger.error('读取任务概览失败', e)
        return this.emptyOverview()
      }
    },
    /**
     * 模板展示用概览：
     * - 未加载完成（骨架）时给空结构占位，保证布局不跳动
     * - 加载完成后直接使用实时统计，任务支付/取消后即时更新
     */
    displayOverview() {
      if (!this.isLoggedIn) return this.emptyOverview()
      return this.overviewLoaded ? this.taskSummary : this.overview
    },
    /** 快捷入口：徽标始终对应当前会话用户的任务 */
    quickEntries() {
      const s = this.taskSummary
      return [
        { icon: '🎱', name: '球桌预约', path: '/tables', requireAuth: false, badge: 0 },
        { icon: '📚', name: '教学课程', path: '/courses', requireAuth: false, badge: 0 },
        { icon: '🏆', name: '赛事活动', path: '/competitions', requireAuth: false, badge: 0 },
        { icon: '🛒', name: '装备商城', path: '/shop', requireAuth: false, badge: 0 },
        { icon: '📋', name: '任务中心', path: '/tasks', requireAuth: true, badge: s.pendingCount },
        { icon: '💳', name: '待付款', path: '/tasks', requireAuth: true, badge: s.pendingPaymentCount },
        { icon: '👤', name: '个人中心', path: '/profile', requireAuth: true, badge: 0 }
      ]
    },
    hotCourses() {
      return [...this.courses]
        .sort((a, b) => (b.students || 0) - (a.students || 0))
        .slice(0, HOT_COURSE_LIMIT)
        .map((c, i) => ({ ...c, __rank: i + 1 }))
    },
    hotTables() {
      // 可预约优先，其余按 id 稳定排序
      return [...this.tables]
        .sort((a, b) => Number(b.available) - Number(a.available) || a.id - b.id)
        .slice(0, HOT_TABLE_LIMIT)
    }
  },
  watch: {
    /**
     * 登录身份变化（登录成功 / 退出 / 过期 / 快速切换账号）：
     * 立即清空旧身份的页面数据并按新身份重新加载，
     * 保证首页绝不会残留上一个用户的概览、徽标和待办。
     * 用组合键同时覆盖 isLoggedIn 与 userId 两类变化，只触发一次刷新。
     */
    identityKey(newKey, oldKey) {
      if (newKey !== oldKey) {
        this.resetSessionData()
        this.bootstrap()
      }
    }
  },
  created() {
    // 任务增删改 / 身份切换订阅（组件销毁时统一解绑）
    this._unsubscribeTasks = taskStore.subscribe(() => {
      this.taskVersion++
    })
    // 认证事件：登录过期时展示提示条；登录成功后关闭
    this._unsubscribeAuth = onAuthChange((event) => {
      if (event.type === 'expired') {
        this.showExpiredBanner = true
      } else if (event.type === 'login') {
        this.showExpiredBanner = false
      }
    })
  },
  mounted() {
    this.bootstrap()
  },
  /**
   * 使用 keep-alive 或路由缓存再次进入时刷新，
   * 确保任务变化后首页数据为最新
   */
  activated() {
    this.bootstrap()
  },
  beforeUnmount() {
    this._unsubscribeTasks?.()
    this._unsubscribeAuth?.()
    // 使所有在途请求失效，快速往返离开页面时不再写状态
    this.requestSeq++
  },
  methods: {
    emptyOverview() {
      return {
        total: 0,
        pendingCount: 0,
        completedCount: 0,
        pendingPaymentCount: 0,
        upcomingCount: 0,
        ongoingCount: 0,
        latest: []
      }
    },

    /** 清空所有会话相关数据（切换身份时先清后拉，杜绝闪烁旧数据） */
    resetSessionData() {
      this.requestSeq++
      this.overview = this.emptyOverview()
      this.overviewLoaded = false
      this.overviewLoading = false
      this.courses = []
      this.tables = []
      this.coursesError = ''
      this.tablesError = ''
      this.coursesLoading = true
      this.tablesLoading = true
      this.taskVersion++
    },

    /** 按当前身份加载首页全部数据 */
    bootstrap() {
      if (this.isLoggedIn) {
        this.loadOverview()
      } else {
        this.overview = this.emptyOverview()
        this.overviewLoaded = false
        this.overviewLoading = false
      }
      // 热门内容与登录无关，但身份切换时也重新拉取，保证在途旧请求不污染
      this.loadCourses()
      this.loadTables()
    },

    /** 加载当前登录用户的任务概览（本地读取，走短暂加载态以稳定布局） */
    loadOverview() {
      const seq = this.requestSeq
      this.overviewLoading = true
      this.overviewLoaded = false
      // 与真实接口一致的异步节奏；失败/空数据均有兜底，不影响其他区块
      Promise.resolve().then(() => {
        if (seq !== this.requestSeq) return
        this.overview = this.taskSummary
        this.overviewLoaded = true
        this.overviewLoading = false
      })
    },

    /** 拉取热门课程；失败显示错误态并可重试 */
    async loadCourses() {
      const seq = this.requestSeq
      this.coursesLoading = true
      this.coursesError = ''
      const result = await api.getCourses()
      // 快速往返 / 切换身份后，过期响应直接丢弃
      if (seq !== this.requestSeq) return
      if (result.success && Array.isArray(result.data)) {
        this.courses = result.data
      } else {
        this.courses = []
        this.coursesError = result.error || '网络异常，请稍后重试'
      }
      this.coursesLoading = false
    },

    /** 拉取热门球桌 */
    async loadTables() {
      const seq = this.requestSeq
      this.tablesLoading = true
      this.tablesError = ''
      const result = await api.getTables()
      if (seq !== this.requestSeq) return
      if (result.success && Array.isArray(result.data)) {
        this.tables = result.data
      } else {
        this.tables = []
        this.tablesError = result.error || '网络异常，请稍后重试'
      }
      this.tablesLoading = false
    },

    /** 快捷入口点击：需登录而未登录时弹登录框，不跳转不破坏布局 */
    handleQuickEntry(entry) {
      if (entry.requireAuth && !isAuthenticated()) {
        this.openLogin()
        return
      }
      this.goTo(entry.path)
    },

    /** 热门球桌"立即预约"：未登录弹登录框，已登录直接进入预约页 */
    handleBookTable(table) {
      if (!table.available) return
      if (!isAuthenticated()) {
        this.openLogin()
        return
      }
      this.$router.push({ path: '/tables', query: { tableId: table.id } })
    },

    openLogin() {
      this.showLoginModal = true
    },

    /** 登录成功：概览与入口由 watcher 自动按新用户刷新 */
    onLoginSuccess() {
      this.showLoginModal = false
      logger.info('Home refreshed after login', { userId: authState.user?.id })
    },

    /** 统一路由跳转，跳转后回到顶部 */
    goTo(path) {
      if (this.$route.path === path) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      this.$router.push(path).then(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }).catch(() => {})
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
  margin-bottom: 2.5rem;
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

/* ========== 业务概览 ========== */
.overview {
  padding: 1rem 0 3rem;
}

.overview-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 1.75rem 2rem;
}

.overview-card.member {
  display: grid;
  grid-template-columns: minmax(260px, 1.2fr) minmax(320px, 1fr);
  gap: 2rem;
  align-items: stretch;
}

.overview-greeting {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-bottom: 0;
}

.greeting-avatar {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: var(--gradient-1);
  color: var(--bg-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  flex-shrink: 0;
}

.greeting-text {
  flex: 1;
  min-width: 0;
}

.greeting-text h3 {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.greeting-text p {
  font-size: 0.85rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.greeting-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(0, 217, 165, 0.1);
  border: 1px solid rgba(0, 217, 165, 0.25);
  color: var(--primary);
  padding: 0.5rem 0.9rem;
  border-radius: 10px;
  font-size: 0.8rem;
  cursor: pointer;
  flex-shrink: 0;
}

.greeting-link svg {
  width: 14px;
  height: 14px;
}

.greeting-link:hover {
  background: rgba(0, 217, 165, 0.2);
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  align-content: center;
}

.ov-stat {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1rem 0.75rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.25s;
}

.overview-stats .ov-stat:hover {
  border-color: rgba(0, 217, 165, 0.4);
  transform: translateY(-2px);
}

.ov-value {
  display: block;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.1;
  color: var(--primary);
}

.ov-value.warn { color: #ffc107; }
.ov-value.info { color: #4facfe; }
.ov-value.muted { color: var(--text-secondary); }
.ov-value .plus { color: var(--primary); font-size: 1rem; }

.ov-label {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.ov-stat.skeleton {
  cursor: default;
  pointer-events: none;
}

.overview-latest {
  grid-column: 1 / -1;
  border-top: 1px solid var(--border);
  padding-top: 1.25rem;
  /* 固定高度区间，有/无待办时不推挤下方区块 */
  min-height: 120px;
}

.latest-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}

.latest-more {
  background: none;
  border: none;
  color: var(--primary);
  font-size: 0.8rem;
  cursor: pointer;
}

.latest-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.latest-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.latest-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.latest-icon {
  font-size: 1.25rem;
}

.latest-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.latest-title {
  font-size: 0.88rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.latest-sub {
  font-size: 0.75rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.latest-status {
  flex-shrink: 0;
  padding: 0.25rem 0.6rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  background: rgba(0, 217, 165, 0.15);
  color: var(--primary);
}

.latest-status.warning { background: rgba(255, 193, 7, 0.15); color: #ffc107; }
.latest-status.info { background: rgba(79, 172, 254, 0.15); color: #4facfe; }
.latest-status.success { background: rgba(108, 117, 125, 0.15); color: #6c757d; }

.latest-empty {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed var(--border);
  border-radius: 12px;
  color: var(--text-secondary);
  font-size: 0.88rem;
}

.latest-empty button {
  background: var(--gradient-1);
  color: var(--bg-dark);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
}

/* 游客概览 */
.overview-card.guest {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.guest-main {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.guest-icon {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  background: rgba(0, 217, 165, 0.1);
  border: 1px solid rgba(0, 217, 165, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  flex-shrink: 0;
}

.guest-text {
  flex: 1;
}

.guest-text h3 {
  font-size: 1.15rem;
  font-weight: 600;
  margin-bottom: 0.3rem;
}

.guest-text p {
  font-size: 0.88rem;
  color: var(--text-secondary);
}

.btn-login-entry {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--gradient-1);
  color: var(--bg-dark);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.25s;
}

.btn-login-entry:hover {
  box-shadow: 0 8px 24px var(--primary-glow);
  transform: translateY(-2px);
}

.btn-login-entry svg {
  width: 16px;
  height: 16px;
}

.guest-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}

/* 登录过期横幅 */
.expired-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 14px;
  padding: 0.85rem 1.25rem;
  margin-bottom: 1rem;
  color: #ffc107;
  font-size: 0.88rem;
}

.expired-banner svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.banner-text {
  flex: 1;
}

.banner-action {
  background: #ffc107;
  color: var(--bg-dark);
  border: none;
  padding: 0.4rem 1rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.banner-close {
  background: none;
  border: none;
  color: #ffc107;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
}

.banner-close svg {
  width: 16px;
  height: 16px;
}

.banner-enter-active, .banner-leave-active {
  transition: all 0.3s ease;
}
.banner-enter-from, .banner-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ========== 快捷入口 ========== */
.quick-entry {
  padding: 1rem 0 3rem;
}

.section-header-inline {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
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

.section-heading {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.75rem;
  font-weight: 700;
}

.btn-view-all {
  background: none;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  padding: 0.5rem 1rem;
  border-radius: 10px;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.25s;
}

.btn-view-all:hover {
  color: var(--primary);
  border-color: rgba(0, 217, 165, 0.4);
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.75rem;
}

.quick-item {
  position: relative;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 1.25rem 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
  transition: all 0.25s;
  color: var(--text-primary);
}

.quick-item:hover {
  transform: translateY(-4px);
  border-color: var(--primary);
  box-shadow: var(--shadow-glow);
}

.quick-icon {
  font-size: 1.6rem;
}

.quick-name {
  font-size: 0.82rem;
  color: var(--text-secondary);
}

.quick-item:hover .quick-name {
  color: var(--text-primary);
}

.quick-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: #ff5c5c;
  color: #fff;
  border-radius: 9px;
  font-size: 0.68rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quick-arrow {
  width: 14px;
  height: 14px;
  color: var(--text-muted);
  opacity: 0;
  transform: translateX(-4px);
  transition: all 0.25s;
}

.quick-item:hover .quick-arrow {
  opacity: 1;
  transform: translateX(0);
}

/* ========== 热门区块（课程 / 球桌） ========== */
.hot-section {
  padding: 2rem 0;
}

.hot-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
  min-height: 300px;
  align-items: stretch;
}

.hot-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
}

.hot-card:hover {
  transform: translateY(-6px);
  border-color: rgba(0, 217, 165, 0.5);
  box-shadow: var(--shadow-glow);
}

.hot-visual {
  position: relative;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hot-emoji {
  font-size: 3rem;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.3));
}

.hot-rank {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  color: #ffd54a;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.25rem 0.55rem;
  border-radius: 8px;
  letter-spacing: 0.5px;
}

.hot-body {
  padding: 1.1rem 1.25rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.hot-body h4 {
  font-size: 1rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hot-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.4em;
}

.hot-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.meta-level {
  background: rgba(255, 255, 255, 0.06);
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
}

.hot-footer {
  margin-top: auto;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hot-price {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary);
}

.hot-price i {
  font-style: normal;
  font-size: 0.7rem;
  color: var(--text-muted);
  font-weight: 400;
}

.hot-coach {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.table-book-btn {
  background: var(--gradient-1);
  color: var(--bg-dark);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.4rem 0.85rem;
  border-radius: 8px;
}

.table-book-btn.disabled {
  background: var(--bg-card-hover);
  color: var(--text-muted);
}

/* 球桌迷你可视化 */
.table-visual-mini {
  position: relative;
  height: 120px;
  padding: 1rem 1.25rem 0;
}

.mini-surface {
  position: relative;
  height: 100%;
  background: linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%);
  border-radius: 10px;
  border: 6px solid #5D4037;
  box-shadow: inset 0 0 18px rgba(0, 0, 0, 0.3);
}

.mini-pocket {
  position: absolute;
  width: 10px;
  height: 10px;
  background: #111;
  border-radius: 50%;
}

.mini-pocket.p1 { top: 3px; left: 3px; }
.mini-pocket.p2 { top: 3px; right: 3px; }
.mini-pocket.p3 { top: 50%; left: 1px; transform: translateY(-50%); }
.mini-pocket.p4 { top: 50%; right: 1px; transform: translateY(-50%); }
.mini-pocket.p5 { bottom: 3px; left: 3px; }
.mini-pocket.p6 { bottom: 3px; right: 3px; }

.table-badge {
  position: absolute;
  top: 0.4rem;
  right: 0.9rem;
  background: rgba(0, 217, 165, 0.9);
  color: var(--bg-dark);
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
}

.table-badge.off {
  background: rgba(255, 107, 107, 0.85);
  color: #fff;
}

/* 加载 / 空 / 错误 状态 */
.state-block {
  grid-column: 1 / -1;
  min-height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  background: var(--bg-card);
  border: 1px dashed var(--border);
  border-radius: 20px;
  text-align: center;
  padding: 2rem;
}

.state-icon {
  font-size: 2.5rem;
  opacity: 0.8;
}

.state-block h4 {
  font-size: 1.05rem;
  font-weight: 600;
}

.state-block p {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.btn-retry {
  margin-top: 0.5rem;
  background: var(--gradient-1);
  color: var(--bg-dark);
  border: none;
  padding: 0.6rem 1.4rem;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s;
}

.btn-retry:hover {
  box-shadow: 0 6px 20px var(--primary-glow);
}

.btn-retry.ghost {
  background: transparent;
  color: var(--primary);
  border: 1px solid rgba(0, 217, 165, 0.4);
}

.skeleton-card {
  cursor: default;
  padding: 0;
}

.skel-block {
  background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 37%, rgba(255,255,255,0.04) 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
  border-radius: 8px;
}

.skel-block.visual {
  height: 120px;
  border-radius: 0;
  margin: 0;
}

.skeleton-card .skel-block.line {
  height: 14px;
  margin: 0 1.25rem;
}

.skeleton-card .skel-block.line:first-of-type {
  margin-top: 1.1rem;
}

.skeleton-card .skel-block.line:last-child {
  margin-bottom: 1.25rem;
}

.w80 { width: 80%; }
.w60 { width: 60%; }
.w50 { width: 50%; }
.w40 { width: 40%; }

.skel-line {
  background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 37%, rgba(255,255,255,0.04) 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
  border-radius: 6px;
}

.ov-stat .skel-line.ov-value {
  height: 28px;
  width: 60%;
  margin: 0 auto;
}

.ov-stat .skel-line.short {
  height: 10px;
  width: 50%;
  margin: 0.5rem auto 0;
}

.latest-item.skel-line {
  height: 56px;
  border-radius: 12px;
}

@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}

/* Features Section */
.features {
  padding: 6rem 0;
}

.section-header {
  text-align: center;
  margin-bottom: 4rem;
}

.section-header .section-tag {
  margin-bottom: 1rem;
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
  padding: 4rem 0;
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
  .hot-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .quick-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  .overview-card.member {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .hero {
    grid-template-columns: 1fr;
    text-align: center;
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

  .guest-main {
    flex-direction: column;
    text-align: center;
  }

  .guest-stats,
  .overview-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .latest-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .home {
    padding: 0 1.5rem;
  }

  .features-grid,
  .hot-grid {
    grid-template-columns: 1fr;
  }

  .quick-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .section-title {
    font-size: 2rem;
  }

  .overview-card {
    padding: 1.25rem;
  }

  .cta-content {
    padding: 3rem 1.5rem;
  }
}
</style>
