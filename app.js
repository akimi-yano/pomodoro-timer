(function () {
  var circumference = 2 * Math.PI * 120;

  var state = {
    workMinutes: 25,
    breakMinutes: 5,
    mode: 'work',
    timeLeft: 25 * 60,
    isRunning: false,
    completedPomodoros: 0,
    intervalId: null
  };

  var tempSettings = { workMinutes: 25, breakMinutes: 5 };

  var els = {
    subtitle: document.getElementById('subtitle'),
    timeDisplay: document.getElementById('time-display'),
    timerLabel: document.getElementById('timer-label'),
    progressCircle: document.getElementById('progress-circle'),
    toggleBtn: document.getElementById('toggle-btn'),
    resetBtn: document.getElementById('reset-btn'),
    completedCount: document.getElementById('completed-count'),
    settingsBtn: document.getElementById('settings-btn'),
    modalOverlay: document.getElementById('modal-overlay'),
    workMinutesInput: document.getElementById('work-minutes'),
    breakMinutesInput: document.getElementById('break-minutes'),
    applySettingsBtn: document.getElementById('apply-settings')
  };

  function formatTime(seconds) {
    var mins = Math.floor(seconds / 60);
    var secs = seconds % 60;
    return mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
  }

  function updateProgress() {
    var progress = state.mode === 'work'
      ? ((state.workMinutes * 60 - state.timeLeft) / (state.workMinutes * 60)) * 100
      : ((state.breakMinutes * 60 - state.timeLeft) / (state.breakMinutes * 60)) * 100;
    var offset = circumference - (progress / 100) * circumference;
    els.progressCircle.setAttribute('stroke-dashoffset', offset);
    els.progressCircle.setAttribute('stroke-dasharray', circumference);
    els.progressCircle.classList.remove('work', 'break');
    els.progressCircle.classList.add(state.mode);
  }

  function updateUI() {
    els.timeDisplay.textContent = formatTime(state.timeLeft);
    els.timerLabel.textContent = state.mode === 'work' ? '作業中' : '休憩中';
    els.subtitle.textContent = state.mode === 'work' ? '集中時間' : '休憩時間';
    els.completedCount.textContent = state.completedPomodoros;
    updateProgress();

    var toggleLabel = state.isRunning ? '一時停止' : '開始';
    var toggleIcon = state.isRunning
      ? '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
      : '<svg class="icon" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
    els.toggleBtn.innerHTML = toggleIcon + toggleLabel;
    els.toggleBtn.classList.remove('work', 'break');
    els.toggleBtn.classList.add(state.mode);
  }

  function playNotificationSound() {
    try {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      var ctx = new AudioContext();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.log('Audio notification not available');
    }
  }

  function onTimerComplete() {
    state.isRunning = false;
    if (state.intervalId) {
      clearInterval(state.intervalId);
      state.intervalId = null;
    }
    playNotificationSound();
    if (state.mode === 'work') {
      state.completedPomodoros += 1;
      state.mode = 'break';
      state.timeLeft = state.breakMinutes * 60;
    } else {
      state.mode = 'work';
      state.timeLeft = state.workMinutes * 60;
    }
    updateUI();
  }

  function tick() {
    if (state.timeLeft <= 0) {
      onTimerComplete();
      return;
    }
    state.timeLeft -= 1;
    updateUI();
  }

  function toggleTimer() {
    state.isRunning = !state.isRunning;
    if (state.isRunning) {
      state.intervalId = setInterval(tick, 1000);
    } else {
      if (state.intervalId) {
        clearInterval(state.intervalId);
        state.intervalId = null;
      }
    }
    updateUI();
  }

  function resetTimer() {
    state.isRunning = false;
    if (state.intervalId) {
      clearInterval(state.intervalId);
      state.intervalId = null;
    }
    state.timeLeft = state.mode === 'work' ? state.workMinutes * 60 : state.breakMinutes * 60;
    updateUI();
  }

  function openSettings() {
    tempSettings.workMinutes = state.workMinutes;
    tempSettings.breakMinutes = state.breakMinutes;
    els.workMinutesInput.value = tempSettings.workMinutes;
    els.breakMinutesInput.value = tempSettings.breakMinutes;
    els.modalOverlay.classList.add('open');
  }

  function closeSettings() {
    els.modalOverlay.classList.remove('open');
  }

  function applySettings() {
    state.workMinutes = parseInt(els.workMinutesInput.value, 10) || 1;
    state.breakMinutes = parseInt(els.breakMinutesInput.value, 10) || 1;
    state.workMinutes = Math.max(1, Math.min(60, state.workMinutes));
    state.breakMinutes = Math.max(1, Math.min(30, state.breakMinutes));
    state.isRunning = false;
    if (state.intervalId) {
      clearInterval(state.intervalId);
      state.intervalId = null;
    }
    state.mode = 'work';
    state.timeLeft = state.workMinutes * 60;
    closeSettings();
    updateUI();
  }

  els.toggleBtn.addEventListener('click', toggleTimer);
  els.resetBtn.addEventListener('click', resetTimer);
  els.settingsBtn.addEventListener('click', openSettings);
  els.applySettingsBtn.addEventListener('click', applySettings);
  els.modalOverlay.addEventListener('click', function (e) {
    if (e.target === els.modalOverlay) closeSettings();
  });

  updateUI();
})();
