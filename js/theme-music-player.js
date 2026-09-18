/**
 * =================================================================
 * MYUNGSIM COACHING OFFICIAL THEME SONG PLAYER
 * 명심코칭 메인 테마곡: "내 선택은 내가 해 (SCAN · SYNC · SHIFT)"
 * 자동 재생(브라우저 정책 준수) · 음소거(Mute) · 플로팅 컨트롤러 · 헤더 위젯
 * =================================================================
 */

(function () {
  'use strict';

  const AUDIO_SRC = '/assets/myeongsim-theme.mp3';
  const STORAGE_KEY_MUTED = 'mindflow_bgm_muted';
  const STORAGE_KEY_ENABLED = 'mindflow_bgm_enabled';

  let audioElement = null;
  let isPlaying = false;
  let isMuted = localStorage.getItem(STORAGE_KEY_MUTED) === 'true';
  let hasUserInteracted = false;
  let isInitialized = false;

  // 1. 오디오 엘리먼트 초기화
  function initAudio() {
    if (audioElement) return audioElement;

    audioElement = new Audio();
    audioElement.src = AUDIO_SRC;
    audioElement.preload = 'auto';
    audioElement.loop = true;
    audioElement.muted = isMuted;
    audioElement.volume = 0.7; // 편안하고 선명한 음량

    audioElement.addEventListener('play', () => {
      isPlaying = true;
      updateUI();
      if (window.trackMindEvent) {
        window.trackMindEvent('theme_song_played', { title: '내 선택은 내가 해' });
      }
    });

    audioElement.addEventListener('pause', () => {
      isPlaying = false;
      updateUI();
    });

    audioElement.addEventListener('timeupdate', () => {
      updateProgress();
    });

    audioElement.addEventListener('volumechange', () => {
      isMuted = audioElement.muted;
      localStorage.setItem(STORAGE_KEY_MUTED, isMuted ? 'true' : 'false');
      updateUI();
    });

    audioElement.addEventListener('error', (e) => {
      console.warn('[Mindflow Audio] 오디오 로드 안내:', e);
      updateUI();
    });

    return audioElement;
  }

  // 2. 재생 시작 (브라우저 Autoplay Policy 대응)
  async function playAudio() {
    const audio = initAudio();
    try {
      audio.muted = isMuted;
      await audio.play();
      isPlaying = true;
      localStorage.setItem(STORAGE_KEY_ENABLED, 'true');
      updateUI();
    } catch (err) {
      // 자동재생 차단 시 (브라우저의 첫 상호작용 필요 제약)
      isPlaying = false;
      updateUI();
      setupFirstInteractionListener();
    }
  }

  // 3. 일시정지
  function pauseAudio() {
    if (!audioElement) return;
    audioElement.pause();
    isPlaying = false;
    localStorage.setItem(STORAGE_KEY_ENABLED, 'false');
    updateUI();
    if (window.trackMindEvent) {
      window.trackMindEvent('theme_song_paused');
    }
  }

  // 4. 재생/일시정지 토글
  function togglePlay() {
    hasUserInteracted = true;
    if (isPlaying) {
      pauseAudio();
    } else {
      if (isMuted) {
        setMuted(false);
      }
      playAudio();
    }
  }

  // 5. 음소거 토글
  function toggleMute() {
    hasUserInteracted = true;
    setMuted(!isMuted);
  }

  // 6. 음소거 설정
  function setMuted(muted) {
    isMuted = !!muted;
    localStorage.setItem(STORAGE_KEY_MUTED, isMuted ? 'true' : 'false');
    if (audioElement) {
      audioElement.muted = isMuted;
    }
    // 음소거 해제 시 오디오가 멈춰있었다면 재생
    if (!isMuted && !isPlaying && audioElement) {
      playAudio();
    }
    updateUI();
    if (window.trackMindEvent) {
      window.trackMindEvent('theme_song_mute_toggled', { muted: isMuted });
    }
  }

  // 7. 첫 상호작용(화면 클릭/터치) 시 자동 시작 리스너
  function setupFirstInteractionListener() {
    if (hasUserInteracted) return;

    const onFirstUserAction = () => {
      hasUserInteracted = true;
      window.removeEventListener('click', onFirstUserAction);
      window.removeEventListener('touchstart', onFirstUserAction);
      window.removeEventListener('keydown', onFirstUserAction);

      const userDisabled = localStorage.getItem(STORAGE_KEY_ENABLED) === 'false';
      if (!userDisabled && !isPlaying) {
        playAudio();
      }
    };

    window.addEventListener('click', onFirstUserAction, { once: true, passive: true });
    window.addEventListener('touchstart', onFirstUserAction, { once: true, passive: true });
    window.addEventListener('keydown', onFirstUserAction, { once: true, passive: true });
  }

  // 8. 프로그레스 바 & 시간 표시
  function updateProgress() {
    if (!audioElement || !audioElement.duration) return;
    const percent = (audioElement.currentTime / audioElement.duration) * 100;
    const progressBar = document.getElementById('bgm-progress-bar');
    if (progressBar) {
      progressBar.style.width = `${percent}%`;
    }
    const timeDisplay = document.getElementById('bgm-time-display');
    if (timeDisplay) {
      const curM = Math.floor(audioElement.currentTime / 60);
      const curS = Math.floor(audioElement.currentTime % 60).toString().padStart(2, '0');
      const durM = Math.floor(audioElement.duration / 60);
      const durS = Math.floor(audioElement.duration % 60).toString().padStart(2, '0');
      timeDisplay.textContent = `${curM}:${curS} / ${durM}:${durS}`;
    }
  }

  // 9. UI 동기화
  function updateUI() {
    // A. 헤더 위젯
    const headerPlayBtn = document.getElementById('header-bgm-toggle');
    const headerMuteBtn = document.getElementById('header-bgm-mute');
    const headerWave = document.getElementById('header-bgm-wave');
    const headerText = document.getElementById('header-bgm-text');

    if (headerPlayBtn) {
      headerPlayBtn.setAttribute('aria-label', isPlaying ? '테마곡 일시정지' : '테마곡 재생');
      headerPlayBtn.innerHTML = isPlaying
        ? `<svg class="w-3.5 h-3.5 text-emerald-700" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`
        : `<svg class="w-3.5 h-3.5 text-emerald-700 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
    }

    if (headerMuteBtn) {
      headerMuteBtn.setAttribute('aria-label', isMuted ? '소리 켜기' : '음소거');
      headerMuteBtn.innerHTML = isMuted
        ? `<svg class="w-3.5 h-3.5 text-rose-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/><path stroke-linecap="round" stroke-linejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/></svg>`
        : `<svg class="w-3.5 h-3.5 text-emerald-700" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>`;
    }

    if (headerWave) {
      if (isPlaying && !isMuted) {
        headerWave.classList.remove('opacity-30');
        headerWave.classList.add('opacity-100', 'bg-emerald-500');
        const bars = headerWave.querySelectorAll('.wave-bar');
        bars.forEach(b => b.classList.add('animate-wave'));
      } else {
        headerWave.classList.add('opacity-30');
        headerWave.classList.remove('opacity-100', 'bg-emerald-500');
        const bars = headerWave.querySelectorAll('.wave-bar');
        bars.forEach(b => b.classList.remove('animate-wave'));
      }
    }

    if (headerText) {
      if (isPlaying) {
        headerText.textContent = isMuted ? '음소거' : '테마곡 재생 중';
      } else {
        headerText.textContent = '메인 테마곡';
      }
    }

    // B. 플로팅 위젯
    const floatPlayBtn = document.getElementById('float-bgm-toggle');
    const floatMuteBtn = document.getElementById('float-bgm-mute');
    const floatDisc = document.getElementById('float-bgm-disc');
    const floatStatus = document.getElementById('float-bgm-status');
    const floatEqualizer = document.getElementById('float-bgm-equalizer');

    if (floatPlayBtn) {
      floatPlayBtn.innerHTML = isPlaying
        ? `<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`
        : `<svg class="w-5 h-5 text-white translate-x-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
    }

    if (floatMuteBtn) {
      floatMuteBtn.innerHTML = isMuted
        ? `<svg class="w-4 h-4 text-rose-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/><path stroke-linecap="round" stroke-linejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/></svg>`
        : `<svg class="w-4 h-4 text-emerald-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>`;
      floatMuteBtn.title = isMuted ? '음소거 해제 (소리 켜기)' : '음소거';
    }

    if (floatDisc) {
      if (isPlaying && !isMuted) {
        floatDisc.classList.add('animate-spin-slow');
      } else {
        floatDisc.classList.remove('animate-spin-slow');
      }
    }

    if (floatEqualizer) {
      floatEqualizer.style.display = (isPlaying && !isMuted) ? 'flex' : 'none';
    }

    if (floatStatus) {
      if (isPlaying) {
        floatStatus.textContent = isMuted ? '🔇 음소거 중' : '🎵 에너지 재생 중';
        floatStatus.className = isMuted ? 'text-[10px] text-rose-300 font-bold' : 'text-[10px] text-emerald-300 font-bold';
      } else {
        floatStatus.textContent = '⏸️ 일시정지';
        floatStatus.className = 'text-[10px] text-slate-400 font-medium';
      }
    }

    // C. 히어로 카드 위젯
    const heroPlayBtn = document.getElementById('hero-bgm-toggle');
    const heroMuteBtn = document.getElementById('hero-bgm-mute');
    const heroStatus = document.getElementById('hero-bgm-status');

    if (heroPlayBtn) {
      heroPlayBtn.innerHTML = isPlaying
        ? `<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg><span>일시정지</span>`
        : `<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg><span>테마곡 듣기</span>`;
      heroPlayBtn.classList.toggle('bg-emerald-600', isPlaying);
      heroPlayBtn.classList.toggle('bg-slate-900', !isPlaying);
    }

    if (heroMuteBtn) {
      heroMuteBtn.innerHTML = isMuted
        ? `<svg class="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/><path stroke-linecap="round" stroke-linejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/></svg><span>소리 켜기</span>`
        : `<svg class="w-4 h-4 text-emerald-700" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg><span>음소거</span>`;
    }

    if (heroStatus) {
      heroStatus.textContent = isPlaying
        ? (isMuted ? '🔇 음소거 상태입니다. 우측 [소리 켜기] 버튼을 누르면 신나는 노래가 나옵니다!' : '🎶 명심코칭 메인 테마곡이 재생되고 있습니다. 즐겁게 사이트를 둘러보세요!')
        : '🎧 "내 선택은 내가 해 (SCAN·SYNC·SHIFT)" · 1분 20초 에너지 트랙';
    }
  }

  // 10. 플로팅 플레이어 토글 (축소 / 확장)
  window.toggleFloatBgmPlayer = function (expand) {
    const player = document.getElementById('mindflow-floating-bgm');
    const pill = document.getElementById('mindflow-collapsed-bgm-pill');
    if (!player || !pill) return;

    if (expand === true || (expand === undefined && player.classList.contains('hidden'))) {
      player.classList.remove('hidden');
      pill.classList.add('hidden');
    } else {
      player.classList.add('hidden');
      pill.classList.remove('hidden');
    }
  };

  // 11. 외부 전역 바인딩
  window.MindflowAudio = {
    play: playAudio,
    pause: pauseAudio,
    togglePlay: togglePlay,
    toggleMute: toggleMute,
    setMuted: setMuted,
    isPlaying: () => isPlaying,
    isMuted: () => isMuted
  };

  // 12. DOM 로드 시 실행
  document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) return;
    isInitialized = true;

    initAudio();
    updateUI();

    // 사용자가 명시적으로 중지하지 않은 경우 부드럽게 자동 재생 시도
    const userDisabled = localStorage.getItem(STORAGE_KEY_ENABLED) === 'false';
    if (!userDisabled) {
      setTimeout(() => {
        playAudio();
      }, 500);
    } else {
      setupFirstInteractionListener();
    }
  });

})();
