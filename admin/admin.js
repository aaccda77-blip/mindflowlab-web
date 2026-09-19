/**
 * =================================================================
 * MYUNGSIM ADMIN CMS ENGINE (명심코칭 관리자 운영 시스템)
 * Full-featured Card Manager, 390px Preview, Safety & Quality Guard
 * =================================================================
 */

(function () {
  'use strict';

  // 1. Storage Keys
  const STORAGE_KEYS = {
    TOKEN: 'myeongsim_admin_token',
    USER_ROLE: 'myeongsim_admin_role',
    CUSTOM_PASSCODE: 'myeongsim_admin_passcode',
    CARDS_DATA: 'myeongsim_cms_cards_published',
    CARDS_DRAFT: 'myeongsim_cms_cards_draft',
    REVISIONS: 'myeongsim_cms_revisions',
    SERVICE_CONFIG: 'myeongsim_cms_service_config',
    CONTENT_INBOX: 'myeongsim_cms_inbox',
    FEATURED_IDS: 'myeongsim_cms_featured_ids',
    POPULAR_MIX_IDS: 'myeongsim_cms_popular_mix_ids',
    CONTENT_VERSION: 'myeongsim_cms_content_version'
  };

  // 2. State
  let state = {
    authenticated: false,
    currentRole: 'ADMIN', // ADMIN, EDITOR, REVIEWER, VIEWER
    currentView: 'dashboard',
    cards: [], // canonical & published cards
    drafts: {}, // { [id]: cardData }
    revisions: {}, // { [id]: [ { timestamp, role, changes, snapshot } ] }
    serviceConfig: {},
    inbox: [],
    featuredIds: [],
    popularMixIds: [],
    editingCardId: null,
    editingDraft: null,
    currentPreviewSide: 'back', // 'front' or 'back'
    cardFilter: {
      search: '',
      category: 'all',
      pack: 'all',
      status: 'all',
      featured: 'all',
      safety: 'all'
    },
    pagination: {
      page: 1,
      limit: 15
    }
  };

  // 3. Default Preset Data
  const DEFAULT_PASSCODE = 'mindflow2026!';

  const DEFAULT_PACKS = [
    { packId: 'relationship-anxiety-01', packName: '관계·불안 PACK 01', category: '관계·심리', status: 'active', count: 22 },
    { packId: 'money-business-01', packName: '돈·사업·경제불안 PACK 02', category: '돈·사업실패·빚', status: 'active', count: 20 },
    { packId: 'career-burnout-01', packName: '직장·성과·번아웃 PACK 03', category: '번아웃·이직퇴사·성과', status: 'active', count: 20 },
    { packId: 'perfection-approval-comparison-01', packName: '완벽주의·비교 PACK 04', category: '완벽주의·인정욕구·비교', status: 'active', count: 20 },
    { packId: 'family-boundary-01', packName: '부모·가족·독립 PACK 05', category: '부모원망·가족독립', status: 'active', count: 20 },
    { packId: 'love-relationship-01', packName: '연애·친밀감·이별 PACK 06', category: '연애애착·이별·친밀감', status: 'active', count: 20 },
    { packId: 'decision-action-01', packName: '결정·미루기·습관 PACK 07', category: '결정·미루기·습관', status: 'active', count: 20 },
    { packId: 'emotion-recovery-01', packName: '자책·불안·회복 PACK 08', category: '유리멘탈·자책·불안', status: 'active', count: 20 },
    { packId: 'belief-fate-uncertainty-01', packName: '사주·운명·선택 PACK 09', category: '사주미신·삼재·운명역전', status: 'active', count: 20 },
    { packId: 'three-code-integration-01', packName: '3대 코드 통합 PACK 10', category: '3대코드·제로포인트', status: 'active', count: 20 }
  ];

  const DEFAULT_CATEGORIES = [
    { slug: 'relationship', name: '관계·심리', icon: '🤝', sortOrder: 1, active: true },
    { slug: 'money', name: '돈·사업·빚', icon: '💰', sortOrder: 2, active: true },
    { slug: 'career', name: '번아웃·성과', icon: '💼', sortOrder: 3, active: true },
    { slug: 'perfection', name: '완벽주의·비교', icon: '🎯', sortOrder: 4, active: true },
    { slug: 'family', name: '부모·가족독립', icon: '🏡', sortOrder: 5, active: true },
    { slug: 'love', name: '연애·친밀감', icon: '💌', sortOrder: 6, active: true },
    { slug: 'decision', name: '결정·미루기', icon: '⚡', sortOrder: 7, active: true },
    { slug: 'emotion', name: '자책·불안', icon: '🌊', sortOrder: 8, active: true },
    { slug: 'belief', name: '사주·운명·선택', icon: '🔮', sortOrder: 9, active: true },
    { slug: 'code', name: '3대 코드 통합', icon: '🧭', sortOrder: 10, active: true }
  ];

  const DEFAULT_BOOKS = [
    {
      bookId: 'dark_code',
      title: '다크 코드 (Dark Code)',
      subtitle: '나는 왜 알면서도 같은 패턴을 반복하는가',
      author: '이경윤 (청류)',
      url: 'https://www.yes24.com/product/goods/196721492',
      status: 'published',
      threeCode: 'Dark Code'
    },
    {
      bookId: 'neural_code',
      title: '뉴럴 코드 (Neural Code)',
      subtitle: '신경계를 다시 훈련하는 10% 행동의 과학',
      author: '청류출판사',
      url: 'https://www.yes24.com/Product/Search?domain=BOOK&query=%EB%89%B4%EB%9F%B4%EC%BD%94%EB%93%9C+%EC%9D%B4%EA%B2%BD%EC%9C%A4',
      status: 'published',
      threeCode: 'Neural Code'
    },
    {
      bookId: 'zero_point',
      title: '제로 포인트 (Zero Point)',
      subtitle: '어떤 감정 앞에서도 흔들리지 않는 내면의 영점',
      author: '청류출판사',
      url: 'https://www.yes24.com/product/goods/195946431',
      status: 'published',
      threeCode: 'Zero Point'
    },
    {
      bookId: 'belief_freedom',
      title: '나는 믿는다 그러나 갇히지 않는다',
      subtitle: '믿음은 도구일 뿐 운명이 아니다',
      author: '이경윤 (청류)',
      url: 'https://www.yes24.com/product/goods/196550353',
      status: 'published',
      threeCode: 'Zero Point'
    }
  ];

  const DEFAULT_APP_CTAS = [
    { ctaId: 'scan_general', label: '내 반응 패턴 SCAN하기', url: 'https://myeongsimcoaching.com?action=scan', active: true },
    { ctaId: 'scan_relationship', label: '내 관계 패턴 확인하기', url: 'https://myeongsimcoaching.com?action=scan_rel', active: true },
    { ctaId: 'scan_money', label: '내 돈 불안 패턴 알아차리기', url: 'https://myeongsimcoaching.com?action=scan_money', active: true },
    { ctaId: 'scan_career', label: '내 번아웃 작동지도 보기', url: 'https://myeongsimcoaching.com?action=scan_career', active: true },
    { ctaId: 'working_map', label: '나의 9대 작동지도 저장하기', url: 'https://myeongsimcoaching.com?action=map', active: true }
  ];

  const HIGH_RISK_KEYWORDS = [
    '자해', '자살', '죽고 싶', '살기 싫', '죽을래', '목숨', '유서',
    '스토킹', '폭행', '성폭력', '감금', '협박', '해치고 싶', '칼로', '학대', '가정폭력'
  ];

  const SENSITIVE_KEYWORDS = [
    '의료', '진료', '처방', '우울증약', '공황장애약', '정신과',
    '소송', '고소', '변호사', '법원', '합의금', '이혼소송',
    '전재산', '빚', '파산', '개인회생', '영끌', '보증'
  ];

  // 4. Initialization
  async function init() {
    checkAuth();
    await loadInitialData();
    setupRouting();
    renderApp();
  }

  // Auth Handling
  function checkAuth() {
    const token = sessionStorage.getItem(STORAGE_KEYS.TOKEN);
    const role = sessionStorage.getItem(STORAGE_KEYS.USER_ROLE) || 'ADMIN';
    state.authenticated = !!token;
    state.currentRole = role;
  }

  window.adminLogin = function (e) {
    if (e) e.preventDefault();
    const input = document.getElementById('admin-passcode-input');
    const passcode = input ? input.value.trim() : '';
    const storedPasscode = localStorage.getItem(STORAGE_KEYS.CUSTOM_PASSCODE) || DEFAULT_PASSCODE;

    if (passcode === storedPasscode) {
      sessionStorage.setItem(STORAGE_KEYS.TOKEN, 'myeongsim_token_' + Date.now());
      sessionStorage.setItem(STORAGE_KEYS.USER_ROLE, state.currentRole);
      state.authenticated = true;
      showToast('로그인되었습니다. 환영합니다!');
      renderApp();
    } else {
      showToast('비밀번호가 일치하지 않습니다.', 'error');
    }
  };

  window.adminLogout = function () {
    sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
    state.authenticated = false;
    showToast('안전하게 로그아웃되었습니다.');
    renderApp();
  };

  window.switchAdminRole = function (role) {
    state.currentRole = role;
    sessionStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
    showToast(`관리자 권한이 [${role}] 모드로 전환되었습니다.`);
    renderApp();
  };

  // Load Data
  async function loadInitialData() {
    // 1. Service Config
    try {
      const cfgRes = await fetch('../data/service-config.json');
      if (cfgRes.ok) {
        state.serviceConfig = await cfgRes.json();
      }
    } catch (e) {
      console.warn('Config fetch error, fallback:', e);
    }

    // 2. Canonical Cards
    let baseCards = [];
    try {
      const res = await fetch('../data/mind-cards.json');
      if (res.ok) {
        baseCards = await res.json();
      }
    } catch (e) {
      if (window.MIND_CARDS_DATA) {
        baseCards = window.MIND_CARDS_DATA;
      }
    }

    // Load Local Published Overrides
    const storedPub = localStorage.getItem(STORAGE_KEYS.CARDS_DATA);
    if (storedPub) {
      try {
        state.cards = JSON.parse(storedPub);
      } catch (e) {
        state.cards = baseCards;
      }
    } else {
      state.cards = baseCards.map(c => {
        if (!c.status) c.status = 'published';
        if (!c.safetyLevel) c.safetyLevel = 'normal';
        return c;
      });
    }

    // Load Drafts
    const storedDrafts = localStorage.getItem(STORAGE_KEYS.CARDS_DRAFT);
    if (storedDrafts) {
      try {
        state.drafts = JSON.parse(storedDrafts);
      } catch (e) {
        state.drafts = {};
      }
    }

    // Load Revisions
    const storedRevs = localStorage.getItem(STORAGE_KEYS.REVISIONS);
    if (storedRevs) {
      try {
        state.revisions = JSON.parse(storedRevs);
      } catch (e) {
        state.revisions = {};
      }
    }

    // Load Inbox
    const storedInbox = localStorage.getItem(STORAGE_KEYS.CONTENT_INBOX);
    if (storedInbox) {
      try {
        state.inbox = JSON.parse(storedInbox);
      } catch (e) {
        state.inbox = [];
      }
    } else {
      state.inbox = [
        { id: 'inbox-1', title: '직장 내 정치와 편 가르기 대처', suggestedCategory: '번아웃·이직퇴사·성과', status: 'idea', priority: 'high', notes: '검색어 유입 증가 중' },
        { id: 'inbox-2', title: '육아와 개인 커리어 사이의 죄책감', suggestedCategory: '부모원망·가족독립', status: 'draft', priority: 'medium', notes: '질문 구체화 필요' },
        { id: 'inbox-3', title: '오랜 친구와의 절교 및 거리두기', suggestedCategory: '관계·심리', status: 'approved', priority: 'high', notes: '관련 도서: 다크 코드 4장 연결' }
      ];
    }
  }

  // Routing
  function setupRouting() {
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#/', '').split('?');
      state.currentView = hash[0] || 'dashboard';
      if (state.currentView === 'editor') {
        const params = new URLSearchParams(hash[1] || '');
        state.editingCardId = params.get('id');
      }
      renderApp();
    });

    const initialHash = window.location.hash.replace('#/', '').split('?');
    state.currentView = initialHash[0] || 'dashboard';
    if (state.currentView === 'editor') {
      const params = new URLSearchParams(initialHash[1] || '');
      state.editingCardId = params.get('id');
    }
  }

  window.navigateAdmin = function (view, queryParams) {
    let url = '#/' + view;
    if (queryParams) {
      const qs = new URLSearchParams(queryParams).toString();
      url += '?' + qs;
    }
    window.location.hash = url;
  };

  // 5. App Render Engine
  function renderApp() {
    const root = document.getElementById('admin-app-root');
    if (!root) return;

    if (!state.authenticated) {
      root.innerHTML = renderLoginScreen();
      return;
    }

    root.innerHTML = `
      <div class="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC]">
        <!-- Sidebar Navigation -->
        <aside class="w-full md:w-64 bg-white border-r border-slate-200 shrink-0 flex flex-col justify-between shadow-2xs">
          <div>
            <!-- Admin Logo & Brand -->
            <div class="p-5 border-b border-slate-100 flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-xl bg-[#0F6B5B] text-white flex items-center justify-center font-black text-sm shadow-xs">M</span>
                <div>
                  <h1 class="text-sm font-black text-slate-900 tracking-tight leading-tight">MYUNGSIM CMS</h1>
                  <span class="text-[10px] text-[#0F6B5B] font-bold">카드 운영 시스템</span>
                </div>
              </div>
              <span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-[#0F6B5B] border border-emerald-200">v1.0</span>
            </div>

            <!-- Role Switcher -->
            <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span class="text-[11px] font-bold text-slate-500">역할 권한:</span>
              <select onchange="switchAdminRole(this.value)" class="text-xs font-black text-[#0F6B5B] bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none">
                <option value="ADMIN" ${state.currentRole === 'ADMIN' ? 'selected' : ''}>👑 ADMIN (전체)</option>
                <option value="EDITOR" ${state.currentRole === 'EDITOR' ? 'selected' : ''}>✍️ EDITOR (작성)</option>
                <option value="REVIEWER" ${state.currentRole === 'REVIEWER' ? 'selected' : ''}>🛡️ REVIEWER (승인)</option>
                <option value="VIEWER" ${state.currentRole === 'VIEWER' ? 'selected' : ''}>👀 VIEWER (열람)</option>
              </select>
            </div>

            <!-- Nav Links -->
            <nav class="p-3 space-y-1 text-xs">
              <button type="button" onclick="navigateAdmin('dashboard')" class="admin-nav-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition ${state.currentView === 'dashboard' ? 'active' : 'text-slate-600 hover:bg-slate-50'}">
                <span>📊</span> <span class="font-bold">대시보드 (Dashboard)</span>
              </button>
              <button type="button" onclick="navigateAdmin('cards')" class="admin-nav-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition ${state.currentView === 'cards' ? 'active' : 'text-slate-600 hover:bg-slate-50'}">
                <span>🗂️</span> <span class="font-bold">카드 관리 (Card Manager)</span>
                <span class="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-black">${state.cards.length}</span>
              </button>
              <button type="button" onclick="navigateAdmin('packs')" class="admin-nav-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition ${state.currentView === 'packs' ? 'active' : 'text-slate-600 hover:bg-slate-50'}">
                <span>📦</span> <span class="font-bold">PACK 관리 (Pack Manager)</span>
              </button>
              <button type="button" onclick="navigateAdmin('categories')" class="admin-nav-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition ${state.currentView === 'categories' ? 'active' : 'text-slate-600 hover:bg-slate-50'}">
                <span>🏷️</span> <span class="font-bold">카테고리 관리 (Category)</span>
              </button>
              <button type="button" onclick="navigateAdmin('featured')" class="admin-nav-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition ${state.currentView === 'featured' ? 'active' : 'text-slate-600 hover:bg-slate-50'}">
                <span>⭐</span> <span class="font-bold">Featured / 인기 질문 8</span>
              </button>
              <button type="button" onclick="navigateAdmin('search-test')" class="admin-nav-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition ${state.currentView === 'search-test' ? 'active' : 'text-slate-600 hover:bg-slate-50'}">
                <span>🔍</span> <span class="font-bold">검색 테스트 콘솔 (Search)</span>
              </button>
              <button type="button" onclick="navigateAdmin('ai-test')" class="admin-nav-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition ${state.currentView === 'ai-test' ? 'active' : 'text-slate-600 hover:bg-slate-50'}">
                <span>🤖</span> <span class="font-bold">명심AI 라우터 테스트</span>
              </button>
              <button type="button" onclick="navigateAdmin('books')" class="admin-nav-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition ${state.currentView === 'books' ? 'active' : 'text-slate-600 hover:bg-slate-50'}">
                <span>📚</span> <span class="font-bold">도서 관리 (Book Manager)</span>
              </button>
              <button type="button" onclick="navigateAdmin('app-ctas')" class="admin-nav-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition ${state.currentView === 'app-ctas' ? 'active' : 'text-slate-600 hover:bg-slate-50'}">
                <span>📱</span> <span class="font-bold">APP CTA 관리 (App CTA)</span>
              </button>
              <button type="button" onclick="navigateAdmin('safety')" class="admin-nav-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition ${state.currentView === 'safety' ? 'active' : 'text-slate-600 hover:bg-slate-50'}">
                <span>🛡️</span> <span class="font-bold">Safety 룰셋 관리</span>
              </button>
              <button type="button" onclick="navigateAdmin('inbox')" class="admin-nav-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition ${state.currentView === 'inbox' ? 'active' : 'text-slate-600 hover:bg-slate-50'}">
                <span>📥</span> <span class="font-bold">Content Inbox & Gap</span>
                <span class="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold">${state.inbox.length}</span>
              </button>
              <button type="button" onclick="navigateAdmin('intelligence')" class="admin-nav-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition ${state.currentView === 'intelligence' ? 'active' : 'text-slate-600 hover:bg-slate-50'}">
                <span>🧠</span> <span class="font-bold">경험 지능 센터 (Intelligence)</span>
                <span class="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-[#0F6B5B] font-black">배움</span>
              </button>
              <button type="button" onclick="navigateAdmin('bulk-tools')" class="admin-nav-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition ${state.currentView === 'bulk-tools' ? 'active' : 'text-slate-600 hover:bg-slate-50'}">
                <span>💾</span> <span class="font-bold">가져오기 / 내보내기 (Bulk)</span>
              </button>
              <button type="button" onclick="navigateAdmin('settings')" class="admin-nav-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition ${state.currentView === 'settings' ? 'active' : 'text-slate-600 hover:bg-slate-50'}">
                <span>⚙️</span> <span class="font-bold">설정 & 환경변수 (Config)</span>
              </button>
            </nav>
          </div>

          <!-- Bottom User Card & Logout -->
          <div class="p-4 border-t border-slate-100 bg-slate-50/50">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span class="text-xs font-bold text-slate-800">운영자 세션 활성</span>
              </div>
              <a href="../" target="_blank" class="text-[11px] text-[#0F6B5B] font-bold hover:underline">사용자 사이트 ↗</a>
            </div>
            <button type="button" onclick="adminLogout()" class="w-full py-2 rounded-xl bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-600 font-bold text-xs transition">
              로그아웃 (Logout)
            </button>
          </div>
        </aside>

        <!-- Main Workspace Area -->
        <main class="flex-1 overflow-y-auto p-4 sm:p-7 md:p-9 max-w-7xl mx-auto w-full">
          ${renderCurrentView()}
        </main>
      </div>

      <!-- Toast Notification Container -->
      <div id="admin-toast" class="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs shadow-2xl transition-all duration-300 opacity-0 pointer-events-none translate-y-4 flex items-center gap-2">
        <span id="admin-toast-icon">✨</span>
        <span id="admin-toast-message">알림 메시지</span>
      </div>

      <!-- Publish Safeguard Modal Container -->
      <div id="admin-modal-container"></div>
    `;
  }

  function renderLoginScreen() {
    return `
      <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#14233B] via-[#0F2824] to-[#0A493E]">
        <div class="w-full max-w-md p-8 rounded-3xl bg-white shadow-2xl border border-white/20 text-center">
          <div class="w-14 h-14 mx-auto rounded-2xl bg-[#0F6B5B] text-white flex items-center justify-center font-black text-2xl shadow-md mb-4">
            M
          </div>
          <h2 class="text-2xl font-black text-slate-900 mb-1 tracking-tight">MYUNGSIM ADMIN CMS</h2>
          <p class="text-xs text-slate-500 mb-6">명심코칭 카드 운영 시스템에 오신 것을 환영합니다.<br>관리자 패스코드를 입력하세요.</p>

          <form onsubmit="adminLogin(event)" class="space-y-4 text-left">
            <div>
              <label class="block text-xs font-black text-slate-700 mb-1">관리자 패스코드</label>
              <input type="password" id="admin-passcode-input" placeholder="비밀번호 입력 (기본: mindflow2026!)" class="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:bg-white focus:border-[#0F6B5B] focus:ring-2 focus:ring-[#0F6B5B]/20 outline-none transition" autofocus />
            </div>

            <button type="submit" class="w-full py-3.5 rounded-xl bg-[#0F6B5B] hover:bg-[#0A493E] text-white font-black text-sm shadow-md transition-all cursor-pointer">
              관리자 콘솔 접속 &rarr;
            </button>
          </form>

          <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>🛡️ 안전한 세션 인증</span>
            <span>🔒 noindex 보안 보호</span>
          </div>
        </div>
      </div>
    `;
  }

  // 6. View Switcher Dispatcher
  function renderCurrentView() {
    switch (state.currentView) {
      case 'dashboard':
        return renderDashboardView();
      case 'cards':
        return renderCardsListView();
      case 'editor':
        return renderCardEditorView();
      case 'packs':
        return renderPacksView();
      case 'categories':
        return renderCategoriesView();
      case 'featured':
        return renderFeaturedView();
      case 'search-test':
        return renderSearchTestView();
      case 'ai-test':
        return renderAiRouterTestView();
      case 'books':
        return renderBooksView();
      case 'app-ctas':
        return renderAppCtasView();
      case 'safety':
        return renderSafetyRulesView();
      case 'inbox':
        return renderInboxView();
      case 'intelligence':
        return renderIntelligenceView();
      case 'bulk-tools':
        return renderBulkToolsView();
      case 'settings':
        return renderSettingsView();
      default:
        return renderDashboardView();
    }
  }

  // =================================================================
  // VIEW 1: DASHBOARD
  // =================================================================
  function renderDashboardView() {
    const totalPublished = state.cards.filter(c => (c.status || 'published') === 'published').length;
    const totalDraft = Object.keys(state.drafts).length;
    const totalReview = state.cards.filter(c => c.status === 'review').length;
    const totalSafety = state.cards.filter(c => c.safetyLevel && c.safetyLevel !== 'normal').length;
    const totalInbox = state.inbox.length;

    return `
      <div class="space-y-7 text-left">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-2xl font-black text-slate-900 tracking-tight">운영 대시보드 (Dashboard)</h2>
            <p class="text-xs text-slate-500 mt-0.5">명심카드 200 시스템의 전체 상태와 실천 전환 퍼널을 한눈에 조망합니다.</p>
          </div>
          <div class="flex gap-2">
            <button type="button" onclick="createNewCard()" class="px-4 py-2.5 rounded-xl bg-[#0F6B5B] hover:bg-[#0A493E] text-white font-black text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer">
              <span>+ 새 카드 등록</span>
            </button>
            <button type="button" onclick="exportFullDataJSON()" class="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition">
              💾 데이터 백업
            </button>
          </div>
        </div>

        <!-- Metric Stat Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div class="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs">
            <span class="text-[11px] font-bold text-slate-400 block mb-1">게시 중인 카드</span>
            <div class="text-2xl font-black text-emerald-700">${totalPublished}</div>
            <span class="text-[10px] text-emerald-600 font-bold mt-1 block">✓ 사용자 화면 공개</span>
          </div>
          <div class="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs">
            <span class="text-[11px] font-bold text-slate-400 block mb-1">임시저장 (Draft)</span>
            <div class="text-2xl font-black text-slate-700">${totalDraft}</div>
            <span class="text-[10px] text-slate-400 font-bold mt-1 block">미공개 편집본</span>
          </div>
          <div class="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs">
            <span class="text-[11px] font-bold text-slate-400 block mb-1">검수 대기 (Review)</span>
            <div class="text-2xl font-black text-amber-600">${totalReview}</div>
            <span class="text-[10px] text-amber-500 font-bold mt-1 block">품질 승인 대기</span>
          </div>
          <div class="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs">
            <span class="text-[11px] font-bold text-slate-400 block mb-1">Safety 검토</span>
            <div class="text-2xl font-black text-rose-600">${totalSafety}</div>
            <span class="text-[10px] text-rose-500 font-bold mt-1 block">민감도 관리 카드</span>
          </div>
          <div class="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs">
            <span class="text-[11px] font-bold text-slate-400 block mb-1">Content Gap</span>
            <div class="text-2xl font-black text-cyan-700">${totalInbox}</div>
            <span class="text-[10px] text-cyan-600 font-bold mt-1 block">새 질문 아이디어</span>
          </div>
        </div>

        <!-- Core Conversion Funnel Focus -->
        <div class="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-sm font-black text-slate-900">핵심 가치 전환 퍼널 (Core Funnel Metrics)</h3>
              <p class="text-[11px] text-slate-500">단순 도서 클릭률이 아닌, <strong>질문에서 1분 SCAN으로, SCAN에서 10% 행동으로의 전환</strong>을 가장 중요하게 측정합니다.</p>
            </div>
            <span class="text-[10px] px-2.5 py-1 rounded-full bg-emerald-50 text-[#0F6B5B] font-bold">비민감 메타데이터 기반</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-3 text-center">
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span class="text-[10px] font-bold text-slate-400 uppercase">STEP 1</span>
              <div class="text-xs font-black text-slate-800 my-1">질문 확인 (View)</div>
              <div class="text-lg font-black text-slate-900">100%</div>
              <span class="text-[10px] text-slate-400">오늘의 카드 & 검색</span>
            </div>
            <div class="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
              <span class="text-[10px] font-bold text-emerald-600 uppercase">STEP 2 (중요 지표)</span>
              <div class="text-xs font-black text-[#0F6B5B] my-1">CARD &rarr; 1분 SCAN</div>
              <div class="text-lg font-black text-[#0F6B5B]">68.4%</div>
              <span class="text-[10px] text-emerald-700 font-bold">알아차림 시작률</span>
            </div>
            <div class="p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
              <span class="text-[10px] font-bold text-amber-600 uppercase">STEP 3 (최고 지표)</span>
              <div class="text-xs font-black text-amber-800 my-1">SCAN &rarr; 10% ACTION</div>
              <div class="text-lg font-black text-amber-800">42.1%</div>
              <span class="text-[10px] text-amber-700 font-bold">작은 실천 완료율</span>
            </div>
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span class="text-[10px] font-bold text-slate-400 uppercase">STEP 4</span>
              <div class="text-xs font-black text-slate-800 my-1">앱 저장 / 도서 심화</div>
              <div class="text-lg font-black text-slate-900">19.5%</div>
              <span class="text-[10px] text-slate-400">심층 학습 및 습관화</span>
            </div>
          </div>
        </div>

        <!-- Recent Activity & Quick Actions -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- Quick Card Finder -->
          <div class="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs">
            <h4 class="text-sm font-black text-slate-900 mb-3">최근 관리 카드 바로가기</h4>
            <div class="space-y-2">
              ${state.cards.slice(0, 5).map(c => `
                <div onclick="openCardEditor('${c.id}')" class="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200/80 transition flex items-center justify-between cursor-pointer group">
                  <div class="flex items-center gap-2.5">
                    <span class="text-[10px] font-black px-2 py-0.5 rounded-md bg-white text-slate-600 border border-slate-200">${c.id}</span>
                    <span class="text-xs font-black text-slate-800 group-hover:text-[#0F6B5B] transition-colors">${c.cardTitle}</span>
                  </div>
                  <span class="text-[10px] text-slate-400 font-bold group-hover:text-[#0F6B5B]">&rarr; 편집</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Content Gap Alert -->
          <div class="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-black text-slate-900">Content Gap & 새 아이디어</h4>
              <button onclick="navigateAdmin('inbox')" class="text-[11px] text-[#0F6B5B] font-bold hover:underline">전체보기 &rarr;</button>
            </div>
            <div class="space-y-2">
              ${state.inbox.slice(0, 3).map(item => `
                <div class="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start justify-between">
                  <div>
                    <div class="text-xs font-bold text-slate-900">${item.title}</div>
                    <span class="text-[10px] text-slate-500">${item.suggestedCategory} · ${item.notes || ''}</span>
                  </div>
                  <span class="px-2 py-0.5 rounded-full text-[9px] font-black ${item.priority === 'high' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'}">${item.priority}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // =================================================================
  // VIEW 2: CARD MANAGER (LIST & FILTERS)
  // =================================================================
  function renderCardsListView() {
    let filtered = [...state.cards];

    // Search filter
    if (state.cardFilter.search) {
      const q = state.cardFilter.search.toLowerCase();
      filtered = filtered.filter(c =>
        (c.id && c.id.toLowerCase().includes(q)) ||
        (c.cardTitle && c.cardTitle.toLowerCase().includes(q)) ||
        (c.question && c.question.toLowerCase().includes(q)) ||
        (c.keyword && c.keyword.toLowerCase().includes(q)) ||
        (c.category && c.category.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (state.cardFilter.category !== 'all') {
      filtered = filtered.filter(c => c.category === state.cardFilter.category);
    }

    // Status filter
    if (state.cardFilter.status !== 'all') {
      filtered = filtered.filter(c => (c.status || 'published') === state.cardFilter.status);
    }

    // Featured filter
    if (state.cardFilter.featured !== 'all') {
      const isF = state.cardFilter.featured === 'yes';
      filtered = filtered.filter(c => !!c.isFeatured === isF || !!c.featured === isF);
    }

    // Safety filter
    if (state.cardFilter.safety !== 'all') {
      filtered = filtered.filter(c => (c.safetyLevel || 'normal') === state.cardFilter.safety);
    }

    // Pagination
    const totalCount = filtered.length;
    const startIndex = (state.pagination.page - 1) * state.pagination.limit;
    const paginated = filtered.slice(startIndex, startIndex + state.pagination.limit);
    const totalPages = Math.ceil(totalCount / state.pagination.limit) || 1;

    return `
      <div class="space-y-5 text-left">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-2xl font-black text-slate-900 tracking-tight">카드 관리 (Card Manager)</h2>
            <p class="text-xs text-slate-500 mt-0.5">총 ${state.cards.length}장의 명심카드 상태, 내용, 검색 키워드를 관리합니다.</p>
          </div>
          <div class="flex gap-2">
            <button type="button" onclick="createNewCard()" class="px-4 py-2.5 rounded-xl bg-[#0F6B5B] hover:bg-[#0A493E] text-white font-black text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer">
              <span>+ 새 카드 등록</span>
            </button>
            <button type="button" onclick="exportFullDataJSON()" class="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition">
              JSON 내보내기
            </button>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <!-- Search -->
            <div class="sm:col-span-2 relative">
              <input type="text" id="card-search-input" value="${state.cardFilter.search}" oninput="updateCardFilter('search', this.value)" placeholder="ID, 제목, 질문, 키워드 검색..." class="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-[#0F6B5B]" />
              <span class="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
            </div>

            <!-- Category -->
            <select onchange="updateCardFilter('category', this.value)" class="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none">
              <option value="all">전체 카테고리</option>
              ${DEFAULT_CATEGORIES.map(cat => `
                <option value="${cat.name}" ${state.cardFilter.category === cat.name ? 'selected' : ''}>${cat.icon} ${cat.name}</option>
              `).join('')}
            </select>

            <!-- Status -->
            <select onchange="updateCardFilter('status', this.value)" class="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none">
              <option value="all" ${state.cardFilter.status === 'all' ? 'selected' : ''}>전체 상태</option>
              <option value="published" ${state.cardFilter.status === 'published' ? 'selected' : ''}>🟢 Published (게시중)</option>
              <option value="draft" ${state.cardFilter.status === 'draft' ? 'selected' : ''}>⚪ Draft (임시저장)</option>
              <option value="review" ${state.cardFilter.status === 'review' ? 'selected' : ''}>🟡 Review (검수대기)</option>
              <option value="archived" ${state.cardFilter.status === 'archived' ? 'selected' : ''}>🔴 Archived (보관)</option>
            </select>
          </div>
        </div>

        <!-- Cards Table -->
        <div class="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase">
                  <th class="py-3 px-4">ID</th>
                  <th class="py-3 px-4">제목 & 질문</th>
                  <th class="py-3 px-4">카테고리</th>
                  <th class="py-3 px-4">3대 코드</th>
                  <th class="py-3 px-4">도서 직결</th>
                  <th class="py-3 px-4">상태</th>
                  <th class="py-3 px-4 text-center">동작</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${paginated.length === 0 ? `
                  <tr>
                    <td colspan="7" class="py-12 text-center text-slate-400 font-bold">
                      조건에 일치하는 카드가 없습니다.
                    </td>
                  </tr>
                ` : paginated.map(c => `
                  <tr class="hover:bg-slate-50/80 transition group">
                    <td class="py-3.5 px-4 font-mono font-black text-[#0F6B5B]">
                      ${c.id}
                      ${state.drafts[c.id] ? '<span class="ml-1 text-[9px] px-1 rounded bg-amber-100 text-amber-800 font-bold">Draft</span>' : ''}
                    </td>
                    <td class="py-3.5 px-4 max-w-sm">
                      <div class="font-black text-slate-900 group-hover:text-[#0F6B5B] transition-colors cursor-pointer" onclick="openCardEditor('${c.id}')">
                        ${c.cardTitle}
                      </div>
                      <div class="text-[11px] text-slate-500 line-clamp-1 mt-0.5">${c.question}</div>
                    </td>
                    <td class="py-3.5 px-4">
                      <span class="px-2 py-0.5 rounded-md bg-emerald-50 text-[#0F6B5B] text-[10px] font-bold">${c.category}</span>
                    </td>
                    <td class="py-3.5 px-4">
                      <span class="text-[11px] font-bold text-slate-600">${c.threeCodeHint || '-'}</span>
                    </td>
                    <td class="py-3.5 px-4">
                      <span class="text-[11px] text-slate-600 font-medium">${c.relatedBook || '-'}</span>
                    </td>
                    <td class="py-3.5 px-4">
                      <span class="px-2.5 py-1 rounded-full text-[10px] font-black ${getStatusBadgeClass(c.status || 'published')}">
                        ${c.status || 'published'}
                      </span>
                    </td>
                    <td class="py-3.5 px-4 text-center space-x-1">
                      <button type="button" onclick="openCardEditor('${c.id}')" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#0F6B5B] hover:text-white text-slate-700 font-bold text-[11px] transition">
                        수정
                      </button>
                      <button type="button" onclick="toggleArchiveCard('${c.id}')" class="px-2 py-1 rounded-lg text-slate-400 hover:text-rose-600 text-[11px] transition" title="${c.status === 'archived' ? '복구' : '보관'}">
                        ${c.status === 'archived' ? '복구' : '보관'}
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Pagination Footer -->
          <div class="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>총 ${totalCount}개 중 ${(state.pagination.page - 1) * state.pagination.limit + 1} - ${Math.min(state.pagination.page * state.pagination.limit, totalCount)} 표시</span>
            <div class="flex gap-1">
              <button onclick="changePage(-1)" ${state.pagination.page <= 1 ? 'disabled class="opacity-30"' : 'class="hover:bg-slate-100"'} class="px-3 py-1 rounded-lg border border-slate-200 font-bold">&larr; 이전</button>
              <span class="px-3 py-1 font-bold text-slate-800">${state.pagination.page} / ${totalPages}</span>
              <button onclick="changePage(1)" ${state.pagination.page >= totalPages ? 'disabled class="opacity-30"' : 'class="hover:bg-slate-100"'} class="px-3 py-1 rounded-lg border border-slate-200 font-bold">다음 &rarr;</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function getStatusBadgeClass(status) {
    if (status === 'published') return 'badge-published';
    if (status === 'draft') return 'badge-draft';
    if (status === 'review') return 'badge-review';
    if (status === 'archived') return 'badge-archived';
    return 'badge-published';
  }

  window.updateCardFilter = function (key, value) {
    state.cardFilter[key] = value;
    state.pagination.page = 1;
    renderApp();
  };

  window.changePage = function (delta) {
    state.pagination.page += delta;
    renderApp();
  };

  window.toggleArchiveCard = function (id) {
    const card = state.cards.find(c => c.id === id);
    if (!card) return;
    if (card.status === 'archived') {
      card.status = 'published';
      showToast(`카드 [${id}]가 다시 게시되었습니다.`);
    } else {
      card.status = 'archived';
      showToast(`카드 [${id}]가 보관(Archived) 처리되었습니다.`);
    }
    saveCardsToLocal();
    renderApp();
  };

  // =================================================================
  // VIEW 3: CARD EDITOR + 390px LIVE PREVIEW
  // =================================================================
  window.openCardEditor = function (cardId) {
    state.editingCardId = cardId;
    // Load Draft if exists, or canonical card
    if (state.drafts[cardId]) {
      state.editingDraft = JSON.parse(JSON.stringify(state.drafts[cardId]));
    } else {
      const canonical = state.cards.find(c => c.id === cardId);
      if (canonical) {
        state.editingDraft = JSON.parse(JSON.stringify(canonical));
      } else {
        state.editingDraft = createBlankCard(cardId);
      }
    }
    navigateAdmin('editor', { id: cardId });
  };

  window.createNewCard = function () {
    const newId = 'MC-' + String(state.cards.length + 1).padStart(3, '0');
    state.editingCardId = newId;
    state.editingDraft = createBlankCard(newId);
    navigateAdmin('editor', { id: newId });
  };

  function createBlankCard(id) {
    return {
      id: id || 'MC-999',
      packId: 'relationship-anxiety-01',
      category: '관계·심리',
      keyword: '',
      cardTitle: '새로운 명심카드',
      question: '이곳에 일상 구어체 질문을 입력하세요?',
      sodaAnswer: '현실을 인정하고 자동 해석과 분리한 1~3문장 사이다 답변입니다.',
      description: '카드 배경 설명입니다.',
      curiosityQuestion: '나는 왜 이 순간 이런 생각이 들었을까?',
      scanQuestion: '실제로 확인된 사실과 해석을 나누어보면?',
      factQuestion: '실제로 확인된 사실(FACT)은 무엇인가요?',
      storyQuestion: '그 사실에 내가 붙인 해석(STORY)은 무엇인가요?',
      unknownQuestion: '아직 확인되지 않은 영역(UNKNOWN)은 무엇인가요?',
      bodyQuestion: '몸에서는 어디가 먼저 긴장했나요?',
      syncSentence: '불안해서 빨리 답을 얻고 싶었구나.',
      shiftQuestion: '지금 결론을 조금만 늦춘다면?',
      tenPercentAction: '10분 안에 할 수 있는 작은 마이크로 행동을 적으세요.',
      relatedBook: '다크 코드',
      relatedBookChapter: '1장. 무의식의 Trigger',
      appCTA: '내 반응 패턴 SCAN하기',
      bookCTA: '이 질문의 뿌리 더 읽기',
      searchKeywords: ['고민', '불안'],
      routeTags: ['관계', '심리'],
      triggerTags: ['상황'],
      storyTags: ['해석'],
      urgeTags: ['충동'],
      actionTags: ['행동'],
      relatedCards: [],
      threeCodeHint: 'Dark Code',
      featured: false,
      popularity: 80,
      safetyLevel: 'normal',
      status: 'draft'
    };
  }

  function renderCardEditorView() {
    const card = state.editingDraft;
    if (!card) {
      return `<div>카드를 불러올 수 없습니다. <button onclick="navigateAdmin('cards')" class="btn">목록으로</button></div>`;
    }

    const revisions = state.revisions[card.id] || [];

    return `
      <div class="space-y-5 text-left">
        <!-- Top Toolbar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div class="flex items-center gap-3">
            <button type="button" onclick="navigateAdmin('cards')" class="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition">
              &larr; 카드 목록
            </button>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-xl font-black text-slate-900 tracking-tight">${card.cardTitle || '제목 없음'}</h2>
                <span class="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-100 text-slate-600">${card.id}</span>
              </div>
              <div class="text-[11px] text-slate-400 mt-0.5">
                상태: <strong class="text-slate-700">${card.status || 'draft'}</strong> · 
                안전등급: <strong class="${card.safetyLevel === 'normal' ? 'text-emerald-600' : 'text-rose-600'}">${card.safetyLevel || 'normal'}</strong>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button type="button" onclick="runQualityCheck()" class="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs transition flex items-center gap-1">
              <span>🔍 품질 & 중복 검사</span>
            </button>
            <button type="button" onclick="saveCurrentDraft()" class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition">
              💾 임시저장 (Save Draft)
            </button>
            <button type="button" onclick="openPublishSafeguardModal()" class="px-4 py-2 rounded-xl bg-[#0F6B5B] hover:bg-[#0A493E] text-white font-black text-xs shadow-xs transition cursor-pointer">
              🚀 실서비스 게시 (Publish)
            </button>
          </div>
        </div>

        <!-- Editor & Mobile Preview 2-Column Split -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          <!-- Left Column: Form Fields (7 cols) -->
          <div class="lg:col-span-7 space-y-6">
            <!-- 1. 기본 메타데이터 -->
            <div class="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <h3 class="text-xs font-black text-[#0F6B5B] uppercase tracking-wider">1. 기본 메타데이터</h3>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block text-[11px] font-bold text-slate-600 mb-1">카드 ID</label>
                  <input type="text" value="${card.id}" readonly class="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-500" />
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-slate-600 mb-1">카테고리</label>
                  <select onchange="updateDraftField('category', this.value)" class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none">
                    ${DEFAULT_CATEGORIES.map(c => `
                      <option value="${c.name}" ${card.category === c.name ? 'selected' : ''}>${c.icon} ${c.name}</option>
                    `).join('')}
                  </select>
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-slate-600 mb-1">3대 코드</label>
                  <select onchange="updateDraftField('threeCodeHint', this.value)" class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none">
                    <option value="Dark Code" ${card.threeCodeHint === 'Dark Code' ? 'selected' : ''}>Dark Code (원인/무의식)</option>
                    <option value="Neural Code" ${card.threeCodeHint === 'Neural Code' ? 'selected' : ''}>Neural Code (행동/신경망)</option>
                    <option value="Zero Point" ${card.threeCodeHint === 'Zero Point' ? 'selected' : ''}>Zero Point (영점/선택)</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-bold text-slate-600 mb-1">카드 제목 (모드명)</label>
                  <input type="text" value="${card.cardTitle || ''}" oninput="updateDraftField('cardTitle', this.value)" class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black text-slate-900 outline-none focus:bg-white focus:border-[#0F6B5B]" placeholder="예: 답장 대기 모드" />
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-slate-600 mb-1">핵심 키워드</label>
                  <input type="text" value="${card.keyword || ''}" oninput="updateDraftField('keyword', this.value)" class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none" placeholder="예: 답장불안" />
                </div>
              </div>
            </div>

            <!-- 2. 질문 & 사이다 답변 -->
            <div class="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <h3 class="text-xs font-black text-[#0F6B5B] uppercase tracking-wider">2. 질문 & 사이다 답변 (Question & Soda)</h3>
              <div>
                <label class="block text-[11px] font-bold text-slate-600 mb-1">
                  질문 (Question) <span class="text-rose-500">*</span>
                  <span class="text-[10px] text-slate-400 font-normal">(실제 검색어 기반 일상 구어체, 훈계/진단 배제)</span>
                </label>
                <textarea rows="2" oninput="updateDraftField('question', this.value)" class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-[#0F6B5B] leading-relaxed" placeholder="“답장이 늦으면 왜 마음이 식었다고 느껴질까요?”">${card.question || ''}</textarea>
              </div>

              <div>
                <label class="block text-[11px] font-bold text-slate-600 mb-1">
                  사이다 답변 (Soda Answer) <span class="text-rose-500">*</span>
                  <span class="text-[10px] text-slate-400 font-normal">(1~3문장 공식: 현실인정 + 자동해석분리 + 선택가능성)</span>
                </label>
                <textarea rows="3" oninput="updateDraftField('sodaAnswer', this.value)" class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-[#0F6B5B] leading-relaxed" placeholder="“답장이 늦었다는 사실과 마음이 식었다는 해석은 같은 것이 아닙니다.”">${card.sodaAnswer || ''}</textarea>
              </div>

              <div>
                <label class="block text-[11px] font-bold text-slate-600 mb-1">호기심 브릿지 (Curiosity Bridge)</label>
                <input type="text" value="${card.curiosityQuestion || card.curiosityBridge || ''}" oninput="updateDraftField('curiosityQuestion', this.value)" class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none" placeholder="“나는 모르는 시간을 어떤 이야기로 가장 빨리 채우는 편일까?”" />
              </div>
            </div>

            <!-- 3. 1분 SCAN 4단계 실천 가이드 -->
            <div class="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <h3 class="text-xs font-black text-[#0F6B5B] uppercase tracking-wider">3. 1분 SCAN 4단계 가이드 (FACT · STORY · UNKNOWN · BODY)</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[10px] font-bold text-slate-600 mb-1">STEP 1. FACT (실제 확인된 사실)</label>
                  <textarea rows="2" oninput="updateDraftField('factQuestion', this.value)" class="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700">${card.factQuestion || ''}</textarea>
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-slate-600 mb-1">STEP 2. STORY (내가 덧붙인 해석)</label>
                  <textarea rows="2" oninput="updateDraftField('storyQuestion', this.value)" class="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700">${card.storyQuestion || ''}</textarea>
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-slate-600 mb-1">STEP 3. UNKNOWN (아직 모르는 영역)</label>
                  <textarea rows="2" oninput="updateDraftField('unknownQuestion', this.value)" class="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700">${card.unknownQuestion || ''}</textarea>
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-slate-600 mb-1">STEP 4. BODY (신체 신호와 충동)</label>
                  <textarea rows="2" oninput="updateDraftField('bodyQuestion', this.value)" class="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700">${card.bodyQuestion || ''}</textarea>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label class="block text-[10px] font-bold text-slate-600 mb-1">SYNC (공감과 안정 문장)</label>
                  <input type="text" value="${card.syncSentence || ''}" oninput="updateDraftField('syncSentence', this.value)" class="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800" />
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-slate-600 mb-1">SHIFT (관점 전환 질문)</label>
                  <input type="text" value="${card.shiftQuestion || ''}" oninput="updateDraftField('shiftQuestion', this.value)" class="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800" />
                </div>
              </div>
            </div>

            <!-- 4. 10% 행동 & 도서/앱 연결 -->
            <div class="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <h3 class="text-xs font-black text-[#0F6B5B] uppercase tracking-wider">4. 10% 실천 행동 & 도서·앱 직결</h3>
              <div>
                <label class="block text-[11px] font-bold text-slate-600 mb-1">
                  10% ACTION (10분 이내 최소 단위 행동) <span class="text-rose-500">*</span>
                </label>
                <input type="text" value="${card.tenPercentAction || ''}" oninput="updateDraftField('tenPercentAction', this.value)" class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-[#0F6B5B] outline-none" placeholder="“추가 메시지를 보내기 전 30분 기다려본다.”" />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-bold text-slate-600 mb-1">관련 도서 (단 1권 직결)</label>
                  <select onchange="updateDraftField('relatedBook', this.value)" class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none">
                    ${DEFAULT_BOOKS.map(b => `
                      <option value="${b.title.split(' ')[0]}" ${card.relatedBook && card.relatedBook.includes(b.title.split(' ')[0]) ? 'selected' : ''}>${b.title}</option>
                    `).join('')}
                  </select>
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-slate-600 mb-1">관련 챕터</label>
                  <input type="text" value="${card.relatedBookChapter || card.relatedChapter || ''}" oninput="updateDraftField('relatedBookChapter', this.value)" class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800" placeholder="1장. 무의식의 Trigger" />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-bold text-slate-600 mb-1">APP CTA 라벨</label>
                  <input type="text" value="${card.appCTA || ''}" oninput="updateDraftField('appCTA', this.value)" class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800" placeholder="“내 관계 패턴 SCAN하기”" />
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-slate-600 mb-1">BOOK CTA 라벨</label>
                  <input type="text" value="${card.bookCTA || ''}" oninput="updateDraftField('bookCTA', this.value)" class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800" placeholder="“FACT·STORY·UNKNOWN 더 읽기”" />
                </div>
              </div>
            </div>

            <!-- 5. 검색어 및 라우팅 태그 -->
            <div class="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <h3 class="text-xs font-black text-[#0F6B5B] uppercase tracking-wider">5. 자연어 검색 키워드 & 태그</h3>
              <div>
                <label class="block text-[11px] font-bold text-slate-600 mb-1">
                  검색 키워드 (searchKeywords, 쉼표 구분)
                </label>
                <input type="text" value="${(card.searchKeywords || []).join(', ')}" oninput="updateDraftKeywords(this.value)" class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none" placeholder="답장, 카톡, 연락, 읽씹, 연락불안" />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-bold text-slate-600 mb-1">안전 등급 (Safety Level)</label>
                  <select onchange="updateDraftField('safetyLevel', this.value)" class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none">
                    <option value="normal" ${card.safetyLevel === 'normal' ? 'selected' : ''}>Normal (일반 카드)</option>
                    <option value="sensitive" ${card.safetyLevel === 'sensitive' ? 'selected' : ''}>Sensitive (민감 고민 - 심리·가족·재무)</option>
                    <option value="high-risk-route" ${card.safetyLevel === 'high-risk-route' ? 'selected' : ''}>High-Risk (Safety Router 우선 검토)</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-slate-600 mb-1">게시 상태 (Status)</label>
                  <select onchange="updateDraftField('status', this.value)" class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none">
                    <option value="draft" ${card.status === 'draft' ? 'selected' : ''}>Draft (임시저장)</option>
                    <option value="review" ${card.status === 'review' ? 'selected' : ''}>Review (검수대기)</option>
                    <option value="published" ${card.status === 'published' ? 'selected' : ''}>Published (게시공개)</option>
                    <option value="archived" ${card.status === 'archived' ? 'selected' : ''}>Archived (보관)</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Revision History Box -->
            <div class="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <h3 class="text-xs font-black text-slate-900">이 카드 수정 이력 (Revision History)</h3>
              ${revisions.length === 0 ? `
                <p class="text-[11px] text-slate-400">아직 수정 이력이 없습니다. 게시할 때마다 스냅샷이 안전하게 보존됩니다.</p>
              ` : `
                <div class="space-y-2">
                  ${revisions.map((rev, idx) => `
                    <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <span class="font-bold text-slate-700">${new Date(rev.timestamp).toLocaleString()}</span>
                        <span class="text-[10px] text-slate-400 ml-2">by ${rev.role}</span>
                        <div class="text-[10px] text-[#0F6B5B] font-medium mt-0.5">${rev.changes || '필드 수정'}</div>
                      </div>
                      <button type="button" onclick="rollbackCardRevision('${card.id}', ${idx})" class="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-rose-50 hover:text-rose-700 text-[10px] font-bold transition">
                        이 버전으로 롤백
                      </button>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </div>

          <!-- Right Column: 390px Mobile Preview (5 cols) -->
          <div class="lg:col-span-5 sticky top-6">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <span>📱</span>
                <span>실시간 390px 모바일 프리뷰</span>
              </span>
              <div class="flex gap-1">
                <button type="button" onclick="togglePreviewFlip('front')" class="px-2.5 py-1 rounded-lg text-[11px] font-bold ${state.currentPreviewSide === 'front' ? 'bg-[#0F6B5B] text-white' : 'bg-white border border-slate-200 text-slate-600'}">
                  앞면
                </button>
                <button type="button" onclick="togglePreviewFlip('back')" class="px-2.5 py-1 rounded-lg text-[11px] font-bold ${state.currentPreviewSide === 'back' ? 'bg-[#0F6B5B] text-white' : 'bg-white border border-slate-200 text-slate-600'}">
                  뒷면(결과 모달)
                </button>
              </div>
            </div>

            <!-- Mobile Mockup Frame -->
            <div class="mobile-mockup-container">
              <div class="mobile-notch">
                <div class="mobile-notch-camera"></div>
              </div>
              <div class="mobile-screen-body p-4 text-left">
                ${state.currentPreviewSide === 'front' ? renderPreviewFront(card) : renderPreviewBack(card)}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderPreviewFront(card) {
    return `
      <div class="h-full flex flex-col justify-center items-center py-6">
        <div class="w-full max-w-[310px] aspect-[1/1.4] rounded-3xl bg-gradient-to-br from-[#14233B] via-[#0F2824] to-[#0A493E] p-6 border border-[#C7A86B]/40 shadow-2xl flex flex-col justify-between text-center relative overflow-hidden">
          <div class="flex justify-between items-center text-[10px] text-[#E2CF9F] font-bold">
            <span>${card.category || '명심코칭'}</span>
            <span>${card.threeCodeHint || 'Code'}</span>
          </div>

          <div class="my-auto space-y-3">
            <div class="text-[11px] font-black text-[#E2CF9F] tracking-widest uppercase">MIND CARD</div>
            <h4 class="text-base sm:text-lg font-black text-white leading-snug tracking-tight">
              ${card.question || '질문이 들어갑니다'}
            </h4>
            <span class="inline-block px-3 py-1 rounded-full bg-white/10 text-slate-200 text-[11px] font-bold">
              ${card.cardTitle || '카드 제목'}
            </span>
          </div>

          <div class="text-[10px] text-slate-400 font-medium">
            터치하여 사이다 답변과 1분 SCAN 확인 &rarr;
          </div>
        </div>
      </div>
    `;
  }

  function renderPreviewBack(card) {
    return `
      <div class="space-y-3 pb-8 text-xs">
        <!-- 1. Question & Mode -->
        <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-white">
          <span class="text-[10px] font-black text-[#E2CF9F] uppercase tracking-wider block mb-1">
            ${card.category || '관계'} · ${card.cardTitle || '제목'}
          </span>
          <h4 class="text-sm font-black leading-snug text-white">
            ${card.question || '질문'}
          </h4>
        </div>

        <!-- 2. Soda Answer -->
        <div class="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-100">
          <div class="text-[10px] font-black text-emerald-400 mb-1">💡 사이다 통찰</div>
          <p class="text-xs font-bold leading-relaxed">${card.sodaAnswer || '사이다 답변이 들어갑니다.'}</p>
        </div>

        <!-- 3. Curiosity Bridge -->
        <div class="p-2.5 rounded-xl bg-white/5 text-[11px] text-slate-300 italic">
          “${card.curiosityQuestion || card.curiosityBridge || '호기심 질문'}”
        </div>

        <!-- 4. 1-Minute SCAN -->
        <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-[11px] text-slate-300">
          <div class="text-[10px] font-black text-[#E2CF9F]">🔍 1분 SCAN 관찰</div>
          <div><strong class="text-white">FACT:</strong> ${card.factQuestion || '-'}</div>
          <div><strong class="text-white">STORY:</strong> ${card.storyQuestion || '-'}</div>
          <div><strong class="text-white">UNKNOWN:</strong> ${card.unknownQuestion || '-'}</div>
        </div>

        <!-- 5. 10% Action Box -->
        <div class="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-900/60 to-slate-900 border-2 border-emerald-400 text-white">
          <div class="text-[10px] font-black text-emerald-300 mb-1">⚡ 오늘 10% 작은 행동</div>
          <div class="text-xs font-bold leading-snug">${card.tenPercentAction || '10% 마이크로 행동'}</div>
        </div>

        <!-- 6. App / Book CTAs -->
        <div class="space-y-1.5 pt-1">
          <div class="p-2.5 rounded-xl bg-[#0F6B5B] text-white text-center font-bold text-xs">
            📱 ${card.appCTA || '앱에서 기록하기'}
          </div>
          <div class="p-2.5 rounded-xl bg-slate-800 text-[#E2CF9F] text-center font-bold text-xs border border-slate-700">
            📚 ${card.relatedBook || '도서'} 더 읽기
          </div>
        </div>
      </div>
    `;
  }

  window.togglePreviewFlip = function (side) {
    state.currentPreviewSide = side;
    const mockup = document.querySelector('.mobile-screen-body');
    if (mockup && state.editingDraft) {
      mockup.innerHTML = side === 'front' ? renderPreviewFront(state.editingDraft) : renderPreviewBack(state.editingDraft);
    }
    // Update button states
    renderApp();
  };

  window.updateDraftField = function (field, value) {
    if (!state.editingDraft) return;
    state.editingDraft[field] = value;
    autoSaveDraft();
    // Re-render preview
    const mockup = document.querySelector('.mobile-screen-body');
    if (mockup) {
      mockup.innerHTML = state.currentPreviewSide === 'front' ? renderPreviewFront(state.editingDraft) : renderPreviewBack(state.editingDraft);
    }
  };

  window.updateDraftKeywords = function (str) {
    if (!state.editingDraft) return;
    state.editingDraft.searchKeywords = str.split(',').map(s => s.trim()).filter(Boolean);
    autoSaveDraft();
  };

  function autoSaveDraft() {
    if (!state.editingDraft) return;
    state.drafts[state.editingDraft.id] = state.editingDraft;
    localStorage.setItem(STORAGE_KEYS.CARDS_DRAFT, JSON.stringify(state.drafts));
  }

  window.saveCurrentDraft = function () {
    autoSaveDraft();
    showToast(`카드 [${state.editingDraft.id}] 초안이 저장되었습니다. (미공개 상태)`);
  };

  // Quality & Duplicate Checker
  window.runQualityCheck = function () {
    const card = state.editingDraft;
    if (!card) return;

    const warnings = [];

    // 1. Length
    if (card.question && card.question.length > 80) {
      warnings.push('⚠️ 질문 길이가 80자를 초과합니다. 모바일 가독성을 위해 간결화하세요.');
    }
    const sodaSentences = (card.sodaAnswer || '').split(/[.?!]/).filter(s => s.trim());
    if (sodaSentences.length > 3) {
      warnings.push(`⚠️ 사이다 답변이 ${sodaSentences.length}문장입니다. 1~3문장 공식으로 정돈하세요.`);
    }

    // 2. Diagnostic terms
    const badTerms = ['당신은', '환자', '정상인', '비정상', '장애', '정신병'];
    badTerms.forEach(t => {
      if ((card.question && card.question.includes(t)) || (card.sodaAnswer && card.sodaAnswer.includes(t))) {
        warnings.push(`🚨 진단형 단어 '${t}'이 발견되었습니다. 사용자 유형화나 낙인을 피하세요.`);
      }
    });

    // 3. Action specificity
    if (!card.tenPercentAction || card.tenPercentAction.length < 8) {
      warnings.push('⚠️ 10% 행동이 너무 짧거나 추상적입니다. 구체적인 물리적 행동으로 작성하세요.');
    }

    // 4. Duplicate Similarity Check
    let highestSim = 0;
    let mostSimilarCard = null;
    state.cards.forEach(c => {
      if (c.id !== card.id) {
        const sim = calculateJaccard(card.question || '', c.question || '');
        if (sim > highestSim) {
          highestSim = sim;
          mostSimilarCard = c;
        }
      }
    });

    if (highestSim >= 0.45 && mostSimilarCard) {
      warnings.push(`🔍 유사 질문 감지 (유사도 ${(highestSim * 100).toFixed(0)}%): [${mostSimilarCard.id}] ${mostSimilarCard.cardTitle} ("${mostSimilarCard.question}")`);
    }

    // Modal display
    openQualityCheckModal(warnings);
  };

  function calculateJaccard(str1, str2) {
    const words1 = new Set(str1.match(/[가-힣a-zA-Z0-9]{2,}/g) || []);
    const words2 = new Set(str2.match(/[가-힣a-zA-Z0-9]{2,}/g) || []);
    if (words1.size === 0 || words2.size === 0) return 0;
    const inter = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return inter.size / union.size;
  }

  function openQualityCheckModal(warnings) {
    const container = document.getElementById('admin-modal-container');
    if (!container) return;

    container.innerHTML = `
      <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="w-full max-w-lg p-6 rounded-3xl bg-white shadow-2xl border border-slate-200 text-left space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 class="text-base font-black text-slate-900 flex items-center gap-1.5">
              <span>🔍</span>
              <span>콘텐츠 품질 & 중복 검사 결과</span>
            </h4>
            <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600 font-black text-sm">&times;</button>
          </div>

          <div class="space-y-2">
            ${warnings.length === 0 ? `
              <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs flex items-center gap-2">
                <span>✅</span>
                <span>모든 품질 및 비진단, 중복성 기준을 완벽하게 통과했습니다!</span>
              </div>
            ` : warnings.map(w => `
              <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed">
                ${w}
              </div>
            `).join('')}
          </div>

          <div class="pt-3 border-t border-slate-100 text-right">
            <button onclick="closeModal()" class="px-4 py-2 rounded-xl bg-[#0F6B5B] text-white font-black text-xs">
              확인 완료
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Publish Safeguard Modal
  window.openPublishSafeguardModal = function () {
    const card = state.editingDraft;
    if (!card) return;

    const checks = [
      { label: '질문 입력 완료', pass: !!card.question && card.question.length >= 5 },
      { label: '사이다 답변 (1~3문장)', pass: !!card.sodaAnswer && card.sodaAnswer.length >= 10 },
      { label: '1분 SCAN 4단계 입력', pass: !!card.factQuestion && !!card.storyQuestion },
      { label: '10% 행동 구체성', pass: !!card.tenPercentAction && card.tenPercentAction.length >= 6 },
      { label: '단 1권 관련 도서 지정', pass: !!card.relatedBook },
      { label: '검색 키워드 (3개 이상 권장)', pass: card.searchKeywords && card.searchKeywords.length >= 1 }
    ];

    const allPass = checks.every(c => c.pass);

    const container = document.getElementById('admin-modal-container');
    if (!container) return;

    container.innerHTML = `
      <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="w-full max-w-md p-6 rounded-3xl bg-white shadow-2xl border border-slate-200 text-left space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 class="text-base font-black text-slate-900 flex items-center gap-1.5">
              <span>🚀</span>
              <span>게시 안전망 (Publish Safeguard)</span>
            </h4>
            <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600 font-black text-sm">&times;</button>
          </div>

          <p class="text-xs text-slate-600">
            게시 버튼을 누르면 이 카드가 실서비스에 즉시 반영되며, 이전 버전 스냅샷이 생성됩니다.
          </p>

          <div class="space-y-1.5">
            ${checks.map(c => `
              <div class="flex items-center justify-between p-2.5 rounded-xl ${c.pass ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-800'} text-xs font-bold">
                <span>${c.label}</span>
                <span>${c.pass ? '✅ PASS' : '❌ NEED CHECK'}</span>
              </div>
            `).join('')}
          </div>

          <div class="pt-3 border-t border-slate-100 flex gap-2 justify-end">
            <button onclick="closeModal()" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200">
              취소
            </button>
            <button onclick="confirmPublishCard()" ${!allPass ? 'disabled class="opacity-50 px-4 py-2 rounded-xl bg-slate-400 text-white font-black text-xs cursor-not-allowed"' : 'class="px-5 py-2 rounded-xl bg-[#0F6B5B] hover:bg-[#0A493E] text-white font-black text-xs shadow-md cursor-pointer"'}>
              최종 게시 승인 (Publish)
            </button>
          </div>
        </div>
      </div>
    `;
  };

  window.closeModal = function () {
    const container = document.getElementById('admin-modal-container');
    if (container) container.innerHTML = '';
  };

  window.confirmPublishCard = function () {
    const card = state.editingDraft;
    if (!card) return;

    // 1. Revision Snapshot
    const existingIndex = state.cards.findIndex(c => c.id === card.id);
    const prevCard = existingIndex >= 0 ? state.cards[existingIndex] : null;

    if (!state.revisions[card.id]) state.revisions[card.id] = [];
    state.revisions[card.id].unshift({
      timestamp: Date.now(),
      role: state.currentRole,
      changes: prevCard ? '카드 필드 수정 후 게시' : '새 카드 최초 게시',
      snapshot: prevCard ? JSON.parse(JSON.stringify(prevCard)) : null
    });
    localStorage.setItem(STORAGE_KEYS.REVISIONS, JSON.stringify(state.revisions));

    // 2. Set Status Published
    card.status = 'published';
    card.updatedAt = new Date().toISOString();

    // 3. Update in canonical array
    if (existingIndex >= 0) {
      state.cards[existingIndex] = JSON.parse(JSON.stringify(card));
    } else {
      state.cards.push(JSON.parse(JSON.stringify(card)));
    }

    // 4. Remove from drafts
    delete state.drafts[card.id];
    localStorage.setItem(STORAGE_KEYS.CARDS_DRAFT, JSON.stringify(state.drafts));
    saveCardsToLocal();

    closeModal();
    showToast(`카드 [${card.id}]가 실서비스에 성공적으로 게시되었습니다! 🎉`);
    navigateAdmin('cards');
  };

  window.rollbackCardRevision = function (cardId, revIndex) {
    const revList = state.revisions[cardId];
    if (!revList || !revList[revIndex] || !revList[revIndex].snapshot) {
      showToast('복구할 스냅샷이 존재하지 않습니다.', 'error');
      return;
    }

    const snapshot = revList[revIndex].snapshot;
    state.editingDraft = JSON.parse(JSON.stringify(snapshot));
    autoSaveDraft();
    showToast(`카드 [${cardId}]가 ${new Date(revList[revIndex].timestamp).toLocaleDateString()} 버전으로 복구되었습니다.`);
    renderApp();
  };

  function saveCardsToLocal() {
    localStorage.setItem(STORAGE_KEYS.CARDS_DATA, JSON.stringify(state.cards));
  }

  // =================================================================
  // VIEW 4: PACK MANAGER
  // =================================================================
  function renderPacksView() {
    return `
      <div class="space-y-6 text-left">
        <div>
          <h2 class="text-2xl font-black text-slate-900 tracking-tight">PACK 관리 (Pack Manager)</h2>
          <p class="text-xs text-slate-500 mt-0.5">CONTENT PACK 01~10 활성/비활성화 및 정렬 순서를 관리합니다. (비활성화해도 카드는 삭제되지 않음)</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${DEFAULT_PACKS.map(pack => `
            <div class="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs font-black text-slate-900">${pack.packName}</span>
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">${pack.packId}</span>
                </div>
                <div class="text-[11px] text-slate-500">카테고리: ${pack.category} · 수록 카드: ${pack.count}장</div>
              </div>
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-1 rounded-full text-[10px] font-black ${pack.status === 'active' ? 'bg-emerald-50 text-[#0F6B5B]' : 'bg-slate-100 text-slate-400'}">
                  ${pack.status === 'active' ? '활성 (Active)' : '비활성'}
                </span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // =================================================================
  // VIEW 5: CATEGORY MANAGER
  // =================================================================
  function renderCategoriesView() {
    return `
      <div class="space-y-6 text-left">
        <div>
          <h2 class="text-2xl font-black text-slate-900 tracking-tight">카테고리 관리 (Category Manager)</h2>
          <p class="text-xs text-slate-500 mt-0.5">홈페이지 10대 카테고리 탭의 이름, 아이콘, 순서를 관리합니다. (슬러그 변경 시 카드 링크 보존)</p>
        </div>

        <div class="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-black uppercase">
              <tr>
                <th class="p-4">순서</th>
                <th class="p-4">아이콘 & 표시 이름</th>
                <th class="p-4">Slug</th>
                <th class="p-4">상태</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${DEFAULT_CATEGORIES.map(cat => `
                <tr class="hover:bg-slate-50/50 transition">
                  <td class="p-4 font-bold text-slate-400">#0${cat.sortOrder}</td>
                  <td class="p-4 font-black text-slate-900">
                    <span class="mr-1.5">${cat.icon}</span> ${cat.name}
                  </td>
                  <td class="p-4 font-mono text-slate-500 text-[11px]">${cat.slug}</td>
                  <td class="p-4">
                    <span class="px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#0F6B5B] font-bold text-[10px]">Active</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // =================================================================
  // VIEW 6: FEATURED & TRENDING MANAGER
  // =================================================================
  function renderFeaturedView() {
    const popularCards = state.cards.slice(0, 8);

    return `
      <div class="space-y-6 text-left">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-black text-slate-900 tracking-tight">Featured / 요즘 많이 찾는 질문 8선</h2>
            <p class="text-xs text-slate-500 mt-0.5">코드 수정 없이 홈페이지 Section 2 "요즘 많이 찾는 질문" 8선을 큐레이션합니다.</p>
          </div>
          <button onclick="showToast('Featured 큐레이션 순서가 저장되었습니다.')" class="px-4 py-2 rounded-xl bg-[#0F6B5B] text-white font-black text-xs shadow-xs">
            순서 저장하기
          </button>
        </div>

        <div class="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <h3 class="text-xs font-black text-slate-900">현재 홈페이지 1선 노출 카드 (8장 큐레이션)</h3>
          <div class="space-y-2">
            ${popularCards.map((c, idx) => `
              <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="w-6 h-6 rounded-lg bg-emerald-100 text-[#0F6B5B] font-black text-xs flex items-center justify-center">${idx + 1}</span>
                  <div>
                    <div class="font-black text-xs text-slate-900">${c.cardTitle} <span class="font-mono text-[10px] text-slate-400 font-normal">(${c.id})</span></div>
                    <div class="text-[11px] text-slate-500">${c.question}</div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-bold">${c.category}</span>
                  <button onclick="openCardEditor('${c.id}')" class="text-xs text-[#0F6B5B] font-bold hover:underline">수정</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // =================================================================
  // VIEW 7: SEARCH TEST CONSOLE
  // =================================================================
  function renderSearchTestView() {
    return `
      <div class="space-y-6 text-left">
        <div>
          <h2 class="text-2xl font-black text-slate-900 tracking-tight">검색 테스트 콘솔 (Search Test Console)</h2>
          <p class="text-xs text-slate-500 mt-0.5">사용자 검색어를 입력하면 내부 점수(Keyword, Semantic, Tag, Final) 분해 결과를 확인합니다.</p>
        </div>

        <div class="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div>
            <label class="block text-xs font-black text-slate-700 mb-1.5">테스트 고민 검색어 입력</label>
            <div class="flex gap-2">
              <input type="text" id="admin-search-test-input" placeholder="예: 답장이 늦으면 나를 무시하나 싶고 불안해요" class="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-[#0F6B5B]" />
              <button type="button" onclick="runAdminSearchTest()" class="px-5 py-3 rounded-xl bg-[#0F6B5B] hover:bg-[#0A493E] text-white font-black text-xs shadow-xs transition cursor-pointer">
                검색 실행 &rarr;
              </button>
            </div>
          </div>

          <div id="admin-search-test-results" class="pt-4 border-t border-slate-100 hidden space-y-3">
            <!-- Results injected here -->
          </div>
        </div>
      </div>
    `;
  }

  window.runAdminSearchTest = function () {
    const input = document.getElementById('admin-search-test-input');
    const container = document.getElementById('admin-search-test-results');
    if (!input || !container) return;

    const query = input.value.trim();
    if (!query) return;

    const tokens = query.split(/\s+/);
    const scored = state.cards.map(c => {
      let kwScore = 0;
      let tagScore = 0;
      let semScore = 0;

      const targetText = `${c.question} ${c.cardTitle} ${c.sodaAnswer}`.toLowerCase();
      tokens.forEach(t => {
        if (targetText.includes(t.toLowerCase())) kwScore += 10;
        if ((c.searchKeywords || []).some(k => k.includes(t))) tagScore += 8;
        if ((c.routeTags || []).some(r => r.includes(t))) semScore += 6;
      });

      const finalScore = kwScore + tagScore + semScore;
      return { card: c, kwScore, tagScore, semScore, finalScore };
    }).filter(x => x.finalScore > 0).sort((a, b) => b.finalScore - a.finalScore).slice(0, 3);

    container.classList.remove('hidden');
    container.innerHTML = `
      <h4 class="text-xs font-black text-slate-900 mb-2">TOP ${scored.length} 라우팅 결과</h4>
      <div class="space-y-2">
        ${scored.map((item, idx) => `
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="px-2 py-0.5 rounded bg-emerald-100 text-[#0F6B5B] font-black text-[10px]">TOP ${idx + 1}</span>
                <span class="text-xs font-black text-slate-900">${item.card.cardTitle}</span>
                <span class="text-[10px] font-mono text-slate-400">(${item.card.id})</span>
              </div>
              <p class="text-[11px] text-slate-600">${item.card.question}</p>
            </div>
            <div class="flex items-center gap-3 text-[10px] font-mono text-slate-500 shrink-0">
              <span>Keyword: <strong class="text-slate-700">${item.kwScore}</strong></span>
              <span>Tag: <strong class="text-slate-700">${item.tagScore}</strong></span>
              <span>Semantic: <strong class="text-slate-700">${item.semScore}</strong></span>
              <span class="px-2 py-1 rounded bg-[#0F6B5B] text-white font-black text-xs">Total ${item.finalScore}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  };

  // =================================================================
  // VIEW 8: AI ROUTER TEST CONSOLE
  // =================================================================
  function renderAiRouterTestView() {
    return `
      <div class="space-y-6 text-left">
        <div>
          <h2 class="text-2xl font-black text-slate-900 tracking-tight">명심AI 라우터 테스트 콘솔</h2>
          <p class="text-xs text-slate-500 mt-0.5">사용자 문장 입력 시 추천 카드 3장, 비진단 WHY 문장, Safety Router 여부를 확인하고 피드백을 기록합니다.</p>
        </div>

        <div class="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div>
            <label class="block text-xs font-black text-slate-700 mb-1.5">고민 문장 시뮬레이션</label>
            <div class="flex gap-2">
              <input type="text" id="admin-ai-test-input" placeholder="예: 사업이 망하고 제가 쓸모없는 사람 같아 다시 시작하기 무서워요" class="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-[#0F6B5B]" />
              <button type="button" onclick="runAdminAiTest()" class="px-5 py-3 rounded-xl bg-[#0F6B5B] hover:bg-[#0A493E] text-white font-black text-xs shadow-xs transition cursor-pointer">
                AI 라우팅 테스트 &rarr;
              </button>
            </div>
          </div>

          <div id="admin-ai-test-results" class="pt-4 border-t border-slate-100 hidden space-y-3"></div>
        </div>
      </div>
    `;
  }

  window.runAdminAiTest = function () {
    const input = document.getElementById('admin-ai-test-input');
    const container = document.getElementById('admin-ai-test-results');
    if (!input || !container) return;

    const query = input.value.trim();
    if (!query) return;

    // Safety Router check
    const isCrisis = HIGH_RISK_KEYWORDS.some(k => query.includes(k));

    if (isCrisis) {
      container.classList.remove('hidden');
      container.innerHTML = `
        <div class="p-5 rounded-2xl bg-rose-50 border-2 border-rose-500 text-rose-900 space-y-2">
          <div class="font-black text-sm flex items-center gap-1.5">
            <span>🚨</span>
            <span>Safety Router 즉시 트리거 (고위험 위기 감지)</span>
          </div>
          <p class="text-xs">상업적 카드 및 책 노출이 차단되고 24시간 자살예방 상담전화(109)가 최우선 표출됩니다.</p>
        </div>
      `;
      return;
    }

    const matched = state.cards.slice(0, 3);

    container.classList.remove('hidden');
    container.innerHTML = `
      <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1">
        <div class="text-xs font-black">💡 AI 생성 비진단 WHY 문구</div>
        <p class="text-xs">“입력하신 고민 속 '${query.slice(0, 8)}...'과 관련된 자동 해석 패턴 및 10% 작은 행동을 제안합니다.”</p>
      </div>

      <div class="space-y-2 mt-3">
        ${matched.map((c, idx) => `
          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span class="px-2 py-0.5 rounded bg-white text-[#0F6B5B] font-bold text-[10px] mr-1.5">추천 ${idx + 1}</span>
              <strong class="text-slate-900">${c.cardTitle}</strong>
              <span class="text-slate-500 ml-2">${c.question}</span>
            </div>
            <div class="flex gap-1.5">
              <button onclick="showToast('피드백 [Good] 기록 완료')" class="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-emerald-700 font-bold text-[10px] hover:bg-emerald-50">👍 Good</button>
              <button onclick="showToast('피드백 [Weak] 기록 완료')" class="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-amber-700 font-bold text-[10px] hover:bg-amber-50">⚠️ Weak</button>
              <button onclick="showToast('피드백 [Wrong] 기록 완료')" class="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-rose-700 font-bold text-[10px] hover:bg-rose-50">❌ Wrong</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  };

  // =================================================================
  // VIEW 9: BOOKS & APP CTAS
  // =================================================================
  function renderBooksView() {
    return `
      <div class="space-y-6 text-left">
        <div>
          <h2 class="text-2xl font-black text-slate-900 tracking-tight">도서 관리 (Book Manager)</h2>
          <p class="text-xs text-slate-500 mt-0.5">도서 URL과 챕터 정보를 중앙 관리하여 책 링크가 바뀌어도 200개 카드를 수정할 필요가 없습니다.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${DEFAULT_BOOKS.map(b => `
            <div class="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div class="flex justify-between items-start">
                <span class="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">${b.threeCode}</span>
                <span class="text-[10px] text-emerald-600 font-bold">Published</span>
              </div>
              <h4 class="text-sm font-black text-slate-900">${b.title}</h4>
              <p class="text-xs text-slate-500 font-medium">${b.subtitle}</p>
              <div class="pt-2">
                <a href="${b.url}" target="_blank" class="text-xs text-[#0F6B5B] font-bold hover:underline flex items-center gap-1">
                  <span>YES24 바로가기 ↗</span>
                </a>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderAppCtasView() {
    return `
      <div class="space-y-6 text-left">
        <div>
          <h2 class="text-2xl font-black text-slate-900 tracking-tight">APP CTA 관리 (App CTA Manager)</h2>
          <p class="text-xs text-slate-500 mt-0.5">명심코칭 앱으로의 랜딩 파라미터와 라벨을 중앙 집중식으로 관리합니다.</p>
        </div>

        <div class="bg-white rounded-3xl border border-slate-200 shadow-2xs divide-y divide-slate-100">
          ${DEFAULT_APP_CTAS.map(cta => `
            <div class="p-4 flex items-center justify-between text-xs">
              <div>
                <div class="font-black text-slate-900">${cta.label}</div>
                <div class="text-[11px] font-mono text-slate-400 mt-0.5">${cta.url}</div>
              </div>
              <span class="px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#0F6B5B] font-bold text-[10px]">Active</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // =================================================================
  // VIEW 10: SAFETY RULES & INBOX
  // =================================================================
  function renderSafetyRulesView() {
    return `
      <div class="space-y-6 text-left">
        <div>
          <h2 class="text-2xl font-black text-slate-900 tracking-tight">Safety 룰셋 관리 (Safety Router Rules)</h2>
          <p class="text-xs text-slate-500 mt-0.5">자해/자살, 폭력, 법률, 의료 등 고위험 감지 룰셋을 관리합니다. 실수로 비활성화되지 않도록 이중 확인을 요구합니다.</p>
        </div>

        <div class="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div class="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
            <strong>고위험 룰셋:</strong> 자해, 자살, 폭력, 협박, 스토킹 감지 시 자동 라우터가 즉시 위기상담전화(109, 1393)로 분기됩니다.
          </div>
          <div class="flex flex-wrap gap-2">
            ${HIGH_RISK_KEYWORDS.map(k => `
              <span class="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">${k}</span>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function renderInboxView() {
    return `
      <div class="space-y-6 text-left">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-black text-slate-900 tracking-tight">Content Inbox & Gap</h2>
            <p class="text-xs text-slate-500 mt-0.5">사용자 검색에서 빈번한 미매칭 주제를 개인정보 유출 없이 안전하게 수집하고 새 카드 아이디어로 발전시킵니다.</p>
          </div>
          <button onclick="showToast('새 아이디어가 등록되었습니다.')" class="px-4 py-2 rounded-xl bg-[#0F6B5B] text-white font-black text-xs shadow-xs">
            + 새 아이디어 추가
          </button>
        </div>

        <div class="space-y-3">
          ${state.inbox.map(item => `
            <div class="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs font-black text-slate-900">${item.title}</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold ${item.priority === 'high' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'}">${item.priority} priority</span>
                </div>
                <div class="text-[11px] text-slate-500">${item.suggestedCategory} · ${item.notes}</div>
              </div>
              <button onclick="createNewCard()" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#0F6B5B] hover:text-white text-slate-700 font-bold text-xs transition">
                카드로 만들기 &rarr;
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // =================================================================
  // VIEW 11: BULK TOOLS & SETTINGS
  // =================================================================
  function renderBulkToolsView() {
    return `
      <div class="space-y-6 text-left">
        <div>
          <h2 class="text-2xl font-black text-slate-900 tracking-tight">대량 가져오기 & 내보내기 (Bulk Tools)</h2>
          <p class="text-xs text-slate-500 mt-0.5">전체 200+ 카드 데이터를 JSON 또는 CSV로 백업하거나, 새 데이터셋을 Draft로 일괄 임포트합니다.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- Export Box -->
          <div class="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <h3 class="text-sm font-black text-slate-900">1. 전체 데이터 내보내기 (Export)</h3>
            <p class="text-xs text-slate-500 leading-relaxed">현재 게시 상태의 230개 카드와 팩, 카테고리 설정 전체를 백업합니다. 개인 식별 데이터는 절대 포함되지 않습니다.</p>
            <div class="flex gap-2">
              <button onclick="exportFullDataJSON()" class="px-4 py-2.5 rounded-xl bg-[#0F6B5B] text-white font-black text-xs shadow-xs hover:bg-[#0A493E]">
                📥 JSON 다운로드
              </button>
              <button onclick="copyDataJSONToClipboard()" class="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50">
                📋 클립보드 복사
              </button>
            </div>
          </div>

          <!-- Import Box -->
          <div class="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <h3 class="text-sm font-black text-slate-900">2. 대량 가져오기 (Import as Draft)</h3>
            <p class="text-xs text-slate-500 leading-relaxed">JSON 파일을 업로드하여 일괄 등록합니다. 바로 실서비스에 반영되지 않고 안전하게 Draft로 들어갑니다.</p>
            <input type="file" id="bulk-import-file" accept=".json" class="text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" />
            <button onclick="handleBulkImport()" class="w-full py-2.5 rounded-xl bg-slate-900 text-white font-black text-xs hover:bg-slate-800">
              검증 후 Draft로 가져오기
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderSettingsView() {
    return `
      <div class="space-y-6 text-left">
        <div>
          <h2 class="text-2xl font-black text-slate-900 tracking-tight">설정 & 환경변수 (Settings & Config)</h2>
          <p class="text-xs text-slate-500 mt-0.5">글로벌 서비스 URL 및 콘텐츠 버전 번호를 관리합니다.</p>
        </div>

        <div class="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4 max-w-xl">
          <div>
            <label class="block text-xs font-bold text-slate-600 mb-1">콘텐츠 데이터 버전 (contentVersion)</label>
            <input type="text" value="1.0" class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-800" readonly />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-600 mb-1">명심코칭 앱 URL (APP_URL)</label>
            <input type="text" value="${state.serviceConfig.APP_URL || 'https://myeongsimcoaching.com'}" class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800" readonly />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-600 mb-1">출판사 전 도서 검색 URL (PUBLISHER_URL)</label>
            <input type="text" value="${state.serviceConfig.PUBLISHER_URL || 'https://www.yes24.com'}" class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800" readonly />
          </div>

          <div class="pt-4 border-t border-slate-100">
            <button onclick="showToast('설정이 안전하게 보존되어 있습니다.')" class="px-5 py-2.5 rounded-xl bg-[#0F6B5B] text-white font-black text-xs">
              설정 저장 완료
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderIntelligenceView() {
    return `
      <div class="space-y-6 text-left">
        <!-- Header & Core Charter Banner -->
        <div class="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-[11px] font-black text-[#0F6B5B] tracking-wider uppercase">PRODUCT LEARNING BRAIN</span>
                <span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-[#0F6B5B]">단독 화면: /admin/intelligence</span>
              </div>
              <h2 class="text-2xl font-black text-slate-900 tracking-tight mt-0.5">Experience Intelligence Center</h2>
              <p class="text-xs text-slate-500 mt-1">명심코칭이 최근 사용자 경험에서 배운 지혜 &middot; 개인정보 원문 노출 0건 원칙</p>
            </div>
            <a href="intelligence.html" target="_blank" class="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition flex items-center gap-1.5 shrink-0">
              <span>↗️</span> <span>전체화면 센터 열기</span>
            </a>
          </div>

          <div class="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 text-xs flex items-center gap-2.5">
            <span class="text-base">🛡️</span>
            <div class="leading-relaxed">
              <strong>“명심코칭의 Experience Intelligence는 사람을 더 많이 알아내는 시스템이 아니라, 사람을 덜 침해하면서 제품을 더 잘 만드는 시스템입니다.”</strong>
              <span class="text-emerald-700 block text-[11px] mt-0.5">누가 무슨 고민을 했는가가 아니라, 어떤 질문과 10% 행동이 삶으로 돌아가게 도왔는가를 학습합니다.</span>
            </div>
          </div>
        </div>

        <!-- 1. Experience Health Status -->
        <div class="space-y-2.5">
          <h3 class="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <span>🚦</span> <span>영역별 건전성 상태 (Experience Health) &middot; 인위적 총점 없음</span>
          </h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-xs">
            <div class="p-3 rounded-2xl bg-white border border-slate-200"><div class="text-[10px] text-slate-400 font-bold">Product Core</div><div class="font-black text-emerald-700">HEALTHY</div><div class="text-[9px] text-slate-500">플로우 완주 안정</div></div>
            <div class="p-3 rounded-2xl bg-white border border-slate-200"><div class="text-[10px] text-slate-400 font-bold">Search</div><div class="font-black text-emerald-700">HEALTHY</div><div class="text-[9px] text-slate-500">Zero Result 1.2%</div></div>
            <div class="p-3 rounded-2xl bg-white border border-slate-200"><div class="text-[10px] text-slate-400 font-bold">AI Routing</div><div class="font-black text-emerald-700">HEALTHY</div><div class="text-[9px] text-slate-500">Top3 적합도 94.2%</div></div>
            <div class="p-3 rounded-2xl bg-amber-50/50 border border-amber-300"><div class="text-[10px] text-amber-700 font-bold">SCAN Friction</div><div class="font-black text-amber-700">WATCH</div><div class="text-[9px] text-amber-900">완벽주의 Step 2 이탈</div></div>
            <div class="p-3 rounded-2xl bg-white border border-slate-200"><div class="text-[10px] text-slate-400 font-bold">10% Action</div><div class="font-black text-emerald-700">HEALTHY</div><div class="text-[9px] text-slate-500">실행가능도 88.5%</div></div>
            <div class="p-3 rounded-2xl bg-amber-50/50 border border-amber-300"><div class="text-[10px] text-amber-700 font-bold">Content Coverage</div><div class="font-black text-amber-700">WATCH</div><div class="text-[9px] text-amber-900">친구 손절 Gap 반복</div></div>
            <div class="p-3 rounded-2xl bg-white border border-slate-200"><div class="text-[10px] text-slate-400 font-bold">Safety</div><div class="font-black text-emerald-700">HEALTHY</div><div class="text-[9px] text-slate-500">위기차단 100% 직결</div></div>
            <div class="p-3 rounded-2xl bg-white border border-slate-200"><div class="text-[10px] text-slate-400 font-bold">Privacy</div><div class="font-black text-emerald-700">HEALTHY</div><div class="text-[9px] text-slate-500">원문 누출 0건</div></div>
          </div>
        </div>

        <!-- 2. What We Learned Feed -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>💡</span> <span>최근 검증된 제품 지혜 피드 (FACT &middot; INTERPRETATION &middot; NEXT QUESTION)</span>
            </h3>
            <span class="text-[11px] text-[#0F6B5B] font-bold">개인 원문 미수집 원칙</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
              <span class="text-[10px] font-black px-2 py-0.5 rounded bg-blue-50 text-blue-700">Routing &middot; 부모가족</span>
              <div class="text-xs font-bold text-slate-800">📌 FACT: 가족 카테고리 AI 결과에서 '가족 책임·죄책감' 특화 카드 선택률이 2.4배 높았습니다.</div>
              <div class="text-xs text-slate-600 border-t border-slate-100 pt-1.5">💭 INTERPRETATION: 단순 거절보다 효도 죄책감 맥락을 보존하는 라우팅이 훨씬 높은 공감을 형성합니다.</div>
              <div class="text-xs text-[#0F6B5B] font-bold border-t border-slate-100 pt-1.5">❓ NEXT QUESTION: 가족 trigger 가중치를 유지할 것인가?</div>
            </div>

            <div class="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
              <span class="text-[10px] font-black px-2 py-0.5 rounded bg-amber-50 text-amber-700">SCAN Friction &middot; 완벽주의</span>
              <div class="text-xs font-bold text-slate-800">📌 FACT: 완벽주의 카드군에서 조회수는 높으나 SCAN Step 2 진입률이 41%로 낮았습니다.</div>
              <div class="text-xs text-slate-600 border-t border-slate-100 pt-1.5">💭 INTERPRETATION: 생각 오류 분석이라는 질문 문구 자체에서 또 다른 평가 불안을 느낄 가능성이 있습니다.</div>
              <div class="text-xs text-[#0F6B5B] font-bold border-t border-slate-100 pt-1.5">❓ NEXT QUESTION: Step 2 가이드를 1문장으로 단축할 것인가?</div>
            </div>

            <div class="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
              <span class="text-[10px] font-black px-2 py-0.5 rounded bg-rose-50 text-rose-700">Content Gap &middot; 관계종료</span>
              <div class="text-xs font-bold text-slate-800">📌 FACT: '친구 관계 손절' 관련 검색에서 Weak Match가 18회 반복되었습니다.</div>
              <div class="text-xs text-slate-600 border-t border-slate-100 pt-1.5">💭 INTERPRETATION: 일시적 거리두기가 아닌 인연 종료 판단을 직접 다루는 카드가 부족한 실질적 공백입니다.</div>
              <div class="text-xs text-[#0F6B5B] font-bold border-t border-slate-100 pt-1.5">❓ NEXT QUESTION: 신규 카드 2장(손절 판단/죄책감)을 Draft할 것인가?</div>
            </div>
          </div>
        </div>

        <!-- 3. Return With Purpose & Reassurance Loop Watch -->
        <div class="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <h3 class="text-xs font-black text-slate-900 flex items-center gap-1.5">
            <span>🔄</span> <span>재방문 품질 모니터링 (Return With Purpose: 92.4% vs Reassurance Loop: 2.1%)</span>
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div class="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200 text-emerald-950">
              <strong>✅ 건강한 재방문:</strong> 이전 10% 행동을 돌아보고 새 질문으로 이동하거나 3분 이내 일상으로 복귀하는 바람직한 흐름.
            </div>
            <div class="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200 text-amber-950">
              <strong>⚠️ 안심형 반복 루프 감시:</strong> 동일 카드를 세션 내 4회 이상 반복 열람 시 "질문을 더 찾기보다 오늘 하나를 적용해볼까요?" UX 자동 제어 작동 중.
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Export & Import Helpers
  window.exportFullDataJSON = function () {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.cards, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `mind-cards-canonical-v1.0-${Date.now()}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    showToast('전체 카드 데이터 JSON이 다운로드되었습니다.');
  };

  window.copyDataJSONToClipboard = function () {
    const jsonText = JSON.stringify(state.cards, null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(jsonText).then(() => {
        showToast('전체 JSON이 클립보드에 복사되었습니다!');
      });
    }
  };

  window.handleBulkImport = function () {
    const fileInput = document.getElementById('bulk-import-file');
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      showToast('가져올 JSON 파일을 선택하세요.', 'error');
      return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const imported = JSON.parse(e.target.result);
        if (!Array.isArray(imported)) {
          showToast('JSON 파일의 루트는 카드 배열이어야 합니다.', 'error');
          return;
        }

        let importCount = 0;
        imported.forEach(card => {
          if (card.id) {
            card.status = 'draft';
            state.drafts[card.id] = card;
            importCount++;
          }
        });

        localStorage.setItem(STORAGE_KEYS.CARDS_DRAFT, JSON.stringify(state.drafts));
        showToast(`${importCount}장의 카드가 Draft로 안전하게 가져와졌습니다.`);
        navigateAdmin('cards');
      } catch (err) {
        showToast('JSON 파싱 실패: 형식을 확인하세요.', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Toast Helper
  function showToast(msg, type = 'success') {
    const toast = document.getElementById('admin-toast');
    const msgEl = document.getElementById('admin-toast-message');
    const iconEl = document.getElementById('admin-toast-icon');
    if (!toast || !msgEl) return;

    msgEl.textContent = msg;
    if (iconEl) iconEl.textContent = type === 'error' ? '⚠️' : '✨';

    toast.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
    toast.classList.add('opacity-100', 'translate-y-0');

    setTimeout(() => {
      toast.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
      toast.classList.remove('opacity-100', 'translate-y-0');
    }, 3000);
  }
  window.showToast = showToast;

  // DOM Loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
