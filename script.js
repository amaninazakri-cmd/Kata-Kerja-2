"use strict";

/* =====================================================
   PERISAI BAHASA — MISI KATA KERJA
   Static, GitHub Pages-compatible educational game.
===================================================== */

const VocabularyManager = (() => {
  const words = [
    { word: "makan", emoji: "🍚", sentence: "Ali makan nasi.", standardSentence: "Ali sedang makan nasi.", cloze: "Ali sedang ______ nasi." },
    { word: "minum", emoji: "🥤", sentence: "Siti minum air.", standardSentence: "Siti sedang minum air.", cloze: "Siti sedang ______ air." },
    { word: "baca", emoji: "📖", sentence: "Amir baca buku.", standardSentence: "Amir sedang membaca buku.", cloze: "Amir sedang ______ buku.", standardForm: "membaca" },
    { word: "tulis", emoji: "✏️", sentence: "Mei Ling tulis nama.", standardSentence: "Mei Ling sedang menulis nama.", cloze: "Mei Ling sedang ______ nama.", standardForm: "menulis" },
    { word: "duduk", emoji: "🪑", sentence: "Kumar duduk di kerusi.", standardSentence: "Kumar sedang duduk di kerusi.", cloze: "Kumar sedang ______ di kerusi." },
    { word: "berdiri", emoji: "🧍", sentence: "Hana berdiri di hadapan kelas.", standardSentence: "Hana sedang berdiri di hadapan kelas.", cloze: "Hana sedang ______ di hadapan kelas." },
    { word: "berjalan", emoji: "🚶", sentence: "Ali berjalan ke kelas.", standardSentence: "Ali sedang berjalan ke kelas.", cloze: "Ali sedang ______ ke kelas." },
    { word: "berlari", emoji: "🏃", sentence: "Amir berlari di padang.", standardSentence: "Amir sedang berlari di padang.", cloze: "Amir sedang ______ di padang." },
    { word: "melompat", emoji: "🤸", sentence: "Siti melompat dengan gembira.", standardSentence: "Siti sedang melompat dengan gembira.", cloze: "Siti sedang ______ dengan gembira." },
    { word: "menyapu", emoji: "🧹", sentence: "Ibu menyapu lantai.", standardSentence: "Ibu sedang menyapu lantai.", cloze: "Ibu sedang ______ lantai." },
    { word: "mencuci", emoji: "🧼", sentence: "Amin mencuci tangan.", standardSentence: "Amin sedang mencuci tangan.", cloze: "Amin sedang ______ tangan." },
    { word: "membuka", emoji: "📖", sentence: "Sara membuka buku.", standardSentence: "Sara sedang membuka buku.", cloze: "Sara sedang ______ buku." },
    { word: "menutup", emoji: "🚪", sentence: "Adam menutup pintu.", standardSentence: "Adam sedang menutup pintu.", cloze: "Adam sedang ______ pintu." },
    { word: "tidur", emoji: "😴", sentence: "Adik sedang tidur.", standardSentence: "Adik sedang tidur.", cloze: "Adik sedang ______." },
    { word: "mandi", emoji: "🚿", sentence: "Adik sedang mandi.", standardSentence: "Adik sedang mandi.", cloze: "Adik sedang ______." },
    { word: "bermain", emoji: "⚽", sentence: "Mereka bermain bola.", standardSentence: "Mereka sedang bermain bola.", cloze: "Mereka sedang ______ bola." }
  ];

  const byWord = (word) => words.find((item) => item.word === word);
  const all = () => words.map((item) => ({ ...item }));
  return { all, byWord };
})();

const gameState = {
  currentWord: null,
  currentMission: null,
  currentOptions: [],
  level: 1,
  score: 0,
  combo: 1,
  highestCombo: 1,
  completed: [],
  needsReview: [],
  correct: 0,
  incorrect: 0,
  attempts: 0,
  perWordErrors: {},
  hintLevel: 0,
  controlMode: "touch",
  cameraActive: false,
  missionQueue: [],
  reviewMode: false,
  waitingForNext: false,
  gameStarted: false
};

const settings = {
  speech: true,
  sound: true,
  visuals: true,
  highContrast: false,
  reducedMotion: window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false,
  fontSize: "normal"
};

const refs = {};

const StorageManager = {
  SETTINGS_KEY: "perisaiBahasa.settings.v1",
  STATS_KEY: "perisaiBahasa.stats.v1",

  loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.SETTINGS_KEY));
      if (saved && typeof saved === "object") Object.assign(settings, saved);
    } catch (error) {
      console.warn("Tetapan tidak dapat dibaca.", error);
    }
  },

  saveSettings() {
    try { localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings)); }
    catch (error) { console.warn("Tetapan tidak dapat disimpan.", error); }
  },

  loadStats() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.STATS_KEY));
      return saved && typeof saved === "object" ? saved : {};
    } catch { return {}; }
  },

  saveStats() {
    try {
      const old = this.loadStats();
      const highScore = Math.max(Number(old.highScore || 0), gameState.score);
      const bestMastery = Math.max(Number(old.bestMastery || 0), gameState.completed.length);
      localStorage.setItem(this.STATS_KEY, JSON.stringify({
        highScore,
        bestMastery,
        lastControlMode: gameState.controlMode,
        updatedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.warn("Statistik tidak dapat disimpan.", error);
    }
  }
};

const AudioManager = {
  ctx: null,

  ensureContext() {
    if (!settings.sound) return null;
    try {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === "suspended") this.ctx.resume();
      return this.ctx;
    } catch { return null; }
  },

  tone(freq = 440, duration = 0.12, type = "sine", gainValue = 0.035, delay = 0) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(gainValue, ctx.currentTime + delay + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.03);
  },

  hover() { this.tone(610, .08, "sine", .018); },
  lock() { this.tone(780, .08, "square", .025); this.tone(1040, .11, "sine", .02, .06); },
  correct() { [523, 659, 784].forEach((f, i) => this.tone(f, .22, "sine", .04, i * .08)); },
  retry() { this.tone(240, .14, "triangle", .03); this.tone(190, .16, "triangle", .02, .09); },
  levelUp() { [392, 523, 659, 784].forEach((f, i) => this.tone(f, .17, "sine", .035, i * .065)); },
  complete() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, .32, "sine", .04, i * .1)); }
};

const SpeechManager = {
  supported: "speechSynthesis" in window && "SpeechSynthesisUtterance" in window,

  speak(text, force = false) {
    if ((!settings.speech && !force) || !this.supported || !text) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ms-MY";
      utterance.rate = 0.84;
      utterance.pitch = 1;
      utterance.volume = 1;
      const voices = window.speechSynthesis.getVoices();
      const malay = voices.find((v) => /ms(-|_)?MY|Malay/i.test(`${v.lang} ${v.name}`));
      if (malay) utterance.voice = malay;
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.warn("Audio bacaan tidak tersedia.", error);
    }
  },

  stop() {
    if (this.supported) window.speechSynthesis.cancel();
  }
};

const AccessibilityManager = {
  apply() {
    document.body.classList.toggle("high-contrast", settings.highContrast);
    document.body.classList.toggle("reduced-motion", settings.reducedMotion);
    document.body.classList.toggle("hide-visuals", !settings.visuals);
    document.body.classList.toggle("font-large", settings.fontSize === "large");
    document.body.classList.toggle("font-xlarge", settings.fontSize === "xlarge");

    refs.audioToggle.checked = settings.speech;
    refs.soundToggle.checked = settings.sound;
    refs.visualToggle.checked = settings.visuals;
    refs.contrastToggle.checked = settings.highContrast;
    refs.motionToggle.checked = settings.reducedMotion;
    refs.fontSizeSelect.value = settings.fontSize;
  },

  readForm() {
    settings.speech = refs.audioToggle.checked;
    settings.sound = refs.soundToggle.checked;
    settings.visuals = refs.visualToggle.checked;
    settings.highContrast = refs.contrastToggle.checked;
    settings.reducedMotion = refs.motionToggle.checked;
    settings.fontSize = refs.fontSizeSelect.value;
    this.apply();
    StorageManager.saveSettings();
  }
};

const Utility = {
  shuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  },

  clamp(value, min, max) { return Math.min(max, Math.max(min, value)); },

  unique(array) { return [...new Set(array)]; },

  showToast(message, ms = 2200) {
    refs.toast.textContent = message;
    refs.toast.classList.remove("hidden");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => refs.toast.classList.add("hidden"), ms);
  },

  escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    }[char]));
  }
};

const UIManager = {
  openModal(id) { refs[id]?.classList.remove("hidden"); },
  closeModal(id) { refs[id]?.classList.add("hidden"); },

  setGameVisible(visible) {
    [refs.hud, refs.learningCard, refs.choicesContainer, refs.novaPanel].forEach((el) => el.classList.toggle("hidden", !visible));
  },

  updateHUD() {
    refs.scoreText.textContent = String(gameState.score);
    refs.comboText.textContent = `×${gameState.combo}`;
    refs.levelBadge.textContent = `TAHAP ${gameState.level}`;
    refs.progressText.textContent = `${gameState.completed.length} / 16`;
    refs.progressNodes.setAttribute("aria-valuenow", String(gameState.completed.length));
    refs.progressNodes.innerHTML = Array.from({ length: 16 }, (_, i) => `<span class="progress-node ${i < gameState.completed.length ? "done" : ""}"></span>`).join("");
  },

  updateNova(message, speak = false) {
    refs.novaMessage.textContent = message;
    if (speak) SpeechManager.speak(message);
  },

  renderMission(mission) {
    refs.missionTypePill.textContent = mission.label;
    refs.visualPrompt.textContent = mission.showVisual ? mission.target.emoji : "🔤";
    refs.visualPrompt.classList.toggle("hidden", !mission.showVisual);
    refs.learningPrompt.textContent = mission.prompt;
    refs.learningSupport.textContent = mission.support;
    refs.missionBanner.textContent = mission.banner;
    refs.choicesContainer.innerHTML = "";
    refs.choicesContainer.classList.toggle("two-choices", mission.options.length === 2);

    mission.options.forEach((option, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "drone-choice";
      button.dataset.word = option.word;
      button.setAttribute("aria-label", `Pilihan ${index + 1}: ${option.word}`);
      button.innerHTML = `
        <span class="drone-arm left" aria-hidden="true"></span>
        <span class="drone-arm right" aria-hidden="true"></span>
        <span class="rotor left" aria-hidden="true"></span>
        <span class="rotor right" aria-hidden="true"></span>
        <span class="choice-number" aria-hidden="true">${index + 1}</span>
        <span class="drone-core" aria-hidden="true"></span>
        <span class="choice-word">${Utility.escapeHtml(option.word)}</span>
      `;
      button.addEventListener("mouseenter", () => AudioManager.hover(), { passive: true });
      button.addEventListener("click", () => GameManager.handleAnswer(option.word, button));
      refs.choicesContainer.appendChild(button);
    });

    this.updateHUD();
    const nova = mission.type === "A" ? "Lihat visual. Pilih kata kerja yang betul." : mission.type === "B" ? "Baca arahan. Cari perkataan sasaran." : "Baca ayat. Pilih kata kerja yang melengkapkannya.";
    this.updateNova(nova, settings.speech);
  },

  markChoice(button, state) {
    button?.classList.add(state);
    setTimeout(() => button?.classList.remove(state), 700);
  },

  showCorrectFeedback(target, points) {
    refs.feedbackCard.className = "modal-card feedback-card correct-state";
    refs.feedbackIcon.textContent = "✅";
    refs.feedbackKicker.textContent = `+${points} MATA`;
    refs.feedbackTitle.textContent = "BETUL!";
    refs.feedbackVisual.textContent = target.emoji;
    refs.feedbackWord.textContent = target.word.toUpperCase();
    refs.feedbackSentence.textContent = target.standardSentence;
    refs.feedbackExtra.textContent = target.standardForm ? `Bentuk dalam ayat: ${target.standardForm}` : "";
    refs.nextQuestionBtn.classList.remove("hidden");
    refs.feedbackSpeakBtn.classList.remove("hidden");
    this.openModal("feedbackModal");
    SpeechManager.speak(`${target.word}. ${target.standardSentence}`);
  },

  showRetryFeedback(target, attemptCount, hintText) {
    refs.feedbackCard.className = "modal-card feedback-card retry-state";
    refs.feedbackIcon.textContent = "🔄";
    refs.feedbackKicker.textContent = "BIMBINGAN";
    refs.feedbackTitle.textContent = attemptCount >= 3 ? "MARI BELAJAR" : "CUBA LAGI";
    refs.feedbackVisual.textContent = settings.visuals && attemptCount >= 2 ? target.emoji : "💡";
    refs.feedbackWord.textContent = attemptCount >= 3 ? target.word.toUpperCase() : hintText;
    refs.feedbackSentence.textContent = attemptCount >= 3 ? target.standardSentence : "Perhatikan petunjuk dan cuba sekali lagi.";
    refs.feedbackExtra.textContent = attemptCount >= 3 ? "Perkataan ini akan dimasukkan dalam sesi ulang kaji." : "";
    refs.nextQuestionBtn.classList.toggle("hidden", attemptCount < 3);
    refs.feedbackSpeakBtn.classList.toggle("hidden", attemptCount < 3);
    this.openModal("feedbackModal");
    SpeechManager.speak(attemptCount >= 3 ? `${target.word}. ${target.standardSentence}` : `Cuba lagi. ${hintText}`);
  },

  renderWordBank() {
    const mastered = new Set(gameState.completed);
    const review = new Set(gameState.needsReview);
    refs.wordBankGrid.innerHTML = VocabularyManager.all().map((item) => {
      let status = "BELUM DIMAINKAN";
      let cls = "";
      if (review.has(item.word)) { status = "🔄 ULANG KAJI"; cls = "review"; }
      else if (mastered.has(item.word)) { status = "✅ DIKUASAI"; cls = "mastered"; }
      return `<article class="word-card ${cls}">
        <div class="word-emoji" aria-hidden="true">${item.emoji}</div>
        <h3>${Utility.escapeHtml(item.word)}</h3>
        <p>${Utility.escapeHtml(item.standardSentence)}</p>
        <span class="word-status">${status}</span>
        <button class="word-speak" data-speak-word="${Utility.escapeHtml(item.word)}" type="button">🔊 Dengar</button>
      </article>`;
    }).join("");
    refs.wordBankGrid.querySelectorAll("[data-speak-word]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = VocabularyManager.byWord(btn.dataset.speakWord);
        SpeechManager.speak(`${item.word}. ${item.standardSentence}`, true);
      });
    });
  },

  showVictory() {
    refs.masteredStat.textContent = `${gameState.completed.length} / 16`;
    refs.correctStat.textContent = String(gameState.correct);
    refs.reviewStat.textContent = String(gameState.needsReview.length);
    refs.comboStat.textContent = `×${gameState.highestCombo}`;
    refs.finalScoreStat.textContent = String(gameState.score);

    const mastery = gameState.completed.length;
    const stars = mastery >= 15 ? 3 : mastery >= 12 ? 2 : 1;
    refs.starRating.innerHTML = "";
    for (let i = 0; i < stars; i++) {
      const star = document.createElement("span");
      star.textContent = "⭐";
      star.style.animationDelay = `${i * 180}ms`;
      refs.starRating.appendChild(star);
    }
    this.openModal("victoryModal");
  }
};

const MissionManager = {
  resetQueue() {
    gameState.missionQueue = Utility.shuffle(VocabularyManager.all().map((item) => item.word));
  },

  calculateLevel() {
    const completed = gameState.completed.length;
    if (completed < 5) return 1;
    if (completed < 11) return 2;
    return 3;
  },

  pickMissionType(level) {
    if (level === 1) return Math.random() < .55 ? "A" : "B";
    if (level === 2) return Math.random() < .5 ? "A" : "B";
    const r = Math.random();
    return r < .33 ? "A" : r < .66 ? "B" : "C";
  },

  makeOptions(target, count) {
    const distractors = Utility.shuffle(VocabularyManager.all().filter((item) => item.word !== target.word)).slice(0, count - 1);
    return Utility.shuffle([target, ...distractors]);
  },

  generate(targetWord = null) {
    gameState.level = this.calculateLevel();
    const target = VocabularyManager.byWord(targetWord || gameState.missionQueue[0]);
    const type = this.pickMissionType(gameState.level);
    const optionCount = gameState.level === 1 ? 2 : 3;
    const options = this.makeOptions(target, optionCount);

    let prompt = "";
    let support = "";
    let banner = "";
    let showVisual = false;
    let label = `MISI ${type}`;

    if (type === "A") {
      prompt = "Apakah perbuatan ini?";
      support = "Lihat visual dan pilih kata kerja yang sesuai.";
      banner = "KENAL GAMBAR";
      showVisual = true;
    } else if (type === "B") {
      prompt = `Cari perkataan: ${target.word.toUpperCase()}`;
      support = "Baca pilihan pada drone dan cari perkataan yang sama.";
      banner = `CARI: ${target.word.toUpperCase()}`;
      showVisual = gameState.level < 3;
    } else {
      prompt = target.cloze;
      support = "Pilih kata kerja yang melengkapkan ayat. Selepas itu, lihat bentuk ayat lengkap.";
      banner = "LENGKAPKAN AYAT";
      showVisual = settings.visuals && Math.random() < .45;
    }

    return { type, label, target, options, prompt, support, banner, showVisual };
  }
};

const GameManager = {
  async start(mode = "touch") {
    AudioManager.ensureContext();
    gameState.controlMode = mode;
    gameState.gameStarted = true;
    gameState.reviewMode = false;
    this.resetProgress();
    MissionManager.resetQueue();
    UIManager.closeModal("startModal");
    UIManager.closeModal("victoryModal");
    UIManager.setGameVisible(true);

    if (mode === "camera") {
      const ok = await CameraManager.start();
      if (!ok) return;
    } else {
      CameraManager.stop();
    }

    this.nextMission();
  },

  resetProgress() {
    Object.assign(gameState, {
      currentWord: null,
      currentMission: null,
      currentOptions: [],
      level: 1,
      score: 0,
      combo: 1,
      highestCombo: 1,
      completed: [],
      needsReview: [],
      correct: 0,
      incorrect: 0,
      attempts: 0,
      perWordErrors: {},
      hintLevel: 0,
      waitingForNext: false
    });
    UIManager.updateHUD();
  },

  nextMission() {
    UIManager.closeModal("feedbackModal");
    gameState.waitingForNext = false;
    gameState.hintLevel = 0;
    TargetManager.resetLock();

    if (!gameState.reviewMode && gameState.missionQueue.length === 0) {
      this.finishMainMission();
      return;
    }

    let targetWord;
    if (gameState.reviewMode) {
      const reviewLeft = gameState.needsReview.filter((w) => !gameState.reviewCompleted?.includes(w));
      if (reviewLeft.length === 0) {
        gameState.reviewMode = false;
        UIManager.showVictory();
        return;
      }
      targetWord = reviewLeft[0];
    } else {
      targetWord = gameState.missionQueue[0];
    }

    const mission = MissionManager.generate(targetWord);
    gameState.currentWord = mission.target.word;
    gameState.currentMission = mission;
    gameState.currentOptions = mission.options.map((o) => o.word);
    UIManager.renderMission(mission);
  },

  handleAnswer(selectedWord, sourceButton = null) {
    if (!gameState.gameStarted || gameState.waitingForNext || !gameState.currentMission) return;
    gameState.attempts += 1;
    const target = gameState.currentMission.target;
    const isCorrect = selectedWord === target.word;

    if (isCorrect) {
      gameState.waitingForNext = true;
      UIManager.markChoice(sourceButton, "correct");
      AudioManager.correct();
      const points = 100 * gameState.combo;
      gameState.score += points;
      gameState.correct += 1;
      gameState.highestCombo = Math.max(gameState.highestCombo, gameState.combo);
      gameState.combo = Math.min(5, gameState.combo + 1);

      if (gameState.reviewMode) {
        gameState.reviewCompleted = Utility.unique([...(gameState.reviewCompleted || []), target.word]);
      } else {
        gameState.completed.push(target.word);
        gameState.missionQueue.shift();
      }

      UIManager.updateHUD();
      UIManager.updateNova("Bagus! Jawapan kamu tepat.");
      UIManager.showCorrectFeedback(target, points);
    } else {
      AudioManager.retry();
      UIManager.markChoice(sourceButton, "wrong");
      gameState.incorrect += 1;
      gameState.combo = 1;
      gameState.perWordErrors[target.word] = (gameState.perWordErrors[target.word] || 0) + 1;
      const errors = gameState.perWordErrors[target.word];
      if (errors >= 2) gameState.needsReview = Utility.unique([...gameState.needsReview, target.word]);
      UIManager.updateHUD();

      const hint = this.getHint(target, errors);
      UIManager.updateNova(errors === 1 ? "Cuba lagi. Lihat pilihan dengan teliti." : "Gunakan petunjuk untuk membantu kamu.");
      UIManager.showRetryFeedback(target, errors, hint);

      if (errors >= 3) {
        gameState.waitingForNext = true;
        if (!gameState.reviewMode) {
          gameState.completed.push(target.word);
          gameState.missionQueue.shift();
        } else {
          gameState.reviewCompleted = Utility.unique([...(gameState.reviewCompleted || []), target.word]);
        }
        UIManager.updateHUD();
      }
    }
  },

  getHint(target, level) {
    if (level <= 1) return settings.visuals ? `Petunjuk visual: ${target.emoji}` : "Perhatikan maksud perbuatan.";
    const chars = [...target.word.toUpperCase()];
    const shown = Math.max(2, Math.ceil(chars.length * .45));
    return `${chars.slice(0, shown).join("")}${"_".repeat(Math.max(2, chars.length - shown))}`;
  },

  requestHint() {
    if (!gameState.currentMission || gameState.waitingForNext) return;
    gameState.hintLevel = Math.min(4, gameState.hintLevel + 1);
    const target = gameState.currentMission.target;
    let message;
    if (gameState.hintLevel === 1) message = `Ulang arahan: ${gameState.currentMission.prompt}`;
    else if (gameState.hintLevel === 2) message = settings.visuals ? `Petunjuk visual: ${target.emoji}` : "Fikirkan perbuatan yang sesuai.";
    else if (gameState.hintLevel === 3) message = `Huruf awal: ${this.getHint(target, 2)}`;
    else message = `Jawapan: ${target.word.toUpperCase()}. ${target.standardSentence}`;

    UIManager.updateNova(message, settings.speech);
    Utility.showToast(message, 3000);
    if (gameState.hintLevel === 4) gameState.needsReview = Utility.unique([...gameState.needsReview, target.word]);
  },

  finishMainMission() {
    StorageManager.saveStats();
    AudioManager.complete();
    CameraManager.stop();
    UIManager.setGameVisible(false);
    UIManager.showVictory();
    SpeechManager.speak("Tahniah! Kamu telah menyelesaikan Misi Kata Kerja.");
  },

  startReview() {
    UIManager.closeModal("victoryModal");
    if (gameState.needsReview.length === 0) {
      Utility.showToast("Hebat! Semua kata kerja telah dikuasai.");
      UIManager.showVictory();
      return;
    }
    gameState.reviewMode = true;
    gameState.reviewCompleted = [];
    UIManager.setGameVisible(true);
    UIManager.updateNova("Mari ulang kaji perkataan yang masih sukar.", true);
    this.nextMission();
  },

  goHome() {
    CameraManager.stop();
    SpeechManager.stop();
    gameState.gameStarted = false;
    gameState.reviewMode = false;
    UIManager.setGameVisible(false);
    ["feedbackModal", "victoryModal", "wordBankModal", "settingsModal", "cameraErrorModal", "cameraLoadingModal"].forEach((id) => UIManager.closeModal(id));
    UIManager.openModal("startModal");
  }
};

const TargetManager = {
  hoveredButton: null,
  lockStart: 0,
  rafId: null,
  pointer: { x: 0, y: 0 },
  origin: { x: 0, y: 0 },
  locked: false,

  setPointer(x, y, originX = x, originY = y) {
    this.pointer = { x, y };
    this.origin = { x: originX, y: originY };
    refs.targetReticle.style.left = `${x}px`;
    refs.targetReticle.style.top = `${y}px`;
    refs.targetReticle.classList.remove("hidden");
    this.evaluateTarget();
  },

  evaluateTarget() {
    const el = document.elementFromPoint(this.pointer.x, this.pointer.y)?.closest?.(".drone-choice");
    if (el !== this.hoveredButton) {
      this.hoveredButton?.classList.remove("targeted");
      this.hoveredButton = el || null;
      this.lockStart = performance.now();
      this.locked = false;
      if (this.hoveredButton) {
        this.hoveredButton.classList.add("targeted");
        AudioManager.hover();
      }
    }

    if (!this.hoveredButton || this.locked) {
      refs.lockProgress.textContent = "0%";
      return;
    }

    const elapsed = performance.now() - this.lockStart;
    const pct = Utility.clamp(Math.round((elapsed / 800) * 100), 0, 100);
    refs.lockProgress.textContent = `${pct}%`;
    if (pct >= 100) {
      this.locked = true;
      AudioManager.lock();
      this.fire(this.hoveredButton);
    }
  },

  fire(button) {
    const rect = button.getBoundingClientRect();
    const tx = rect.left + rect.width / 2;
    const ty = rect.top + rect.height / 2;
    this.drawBeam(this.origin.x, this.origin.y, tx, ty);
    button.click();
  },

  drawBeam(x1, y1, x2, y2) {
    if (settings.reducedMotion) return;
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    refs.energyBeam.style.left = `${x1}px`;
    refs.energyBeam.style.top = `${y1}px`;
    refs.energyBeam.style.width = `${len}px`;
    refs.energyBeam.style.transform = `rotate(${angle}deg)`;
    refs.energyBeam.classList.remove("hidden");
    setTimeout(() => refs.energyBeam.classList.add("hidden"), 180);
  },

  tick() {
    if (!refs.targetReticle.classList.contains("hidden")) this.evaluateTarget();
    this.rafId = requestAnimationFrame(() => this.tick());
  },

  resetLock() {
    this.hoveredButton?.classList.remove("targeted");
    this.hoveredButton = null;
    this.lockStart = 0;
    this.locked = false;
    refs.lockProgress.textContent = "0%";
  },

  hide() {
    refs.targetReticle.classList.add("hidden");
    this.resetLock();
  }
};

const CameraManager = {
  stream: null,
  hands: null,
  frameRequest: null,
  processing: false,
  canvasCtx: null,

  async start() {
    UIManager.openModal("cameraLoadingModal");
    refs.cameraLoadingText.textContent = "Memeriksa sokongan kamera...";
    refs.cameraLoadingBar.style.width = "22%";

    if (!navigator.mediaDevices?.getUserMedia) {
      return this.fail("Pelayar ini tidak menyediakan akses kamera yang diperlukan.");
    }

    try {
      refs.cameraLoadingText.textContent = "Meminta kebenaran kamera...";
      refs.cameraLoadingBar.style.width = "42%";
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      refs.webcam.srcObject = this.stream;
      await refs.webcam.play();
      refs.webcam.classList.add("active");
      refs.cameraPrivacyBadge.classList.remove("hidden");
      gameState.cameraActive = true;

      refs.cameraLoadingText.textContent = "Mengaktifkan pengesanan tangan...";
      refs.cameraLoadingBar.style.width = "68%";

      if (typeof window.Hands !== "function") {
        return this.fail("MediaPipe Hands tidak dapat dimuatkan. Gunakan mod sentuh untuk meneruskan.");
      }

      await this.initHands();
      refs.cameraLoadingBar.style.width = "100%";
      refs.cameraLoadingText.textContent = "Cyber Vision sedia!";
      setTimeout(() => UIManager.closeModal("cameraLoadingModal"), 280);
      this.processFrame();
      return true;
    } catch (error) {
      console.warn("Camera start failed:", error);
      return this.fail(error?.name === "NotAllowedError" ? "Kebenaran kamera tidak diberikan. Kamu masih boleh bermain menggunakan mod sentuh." : "Kamera tidak dapat dimulakan. Kamu masih boleh bermain menggunakan mod sentuh.");
    }
  },

  async initHands() {
    this.canvasCtx = refs.handCanvas.getContext("2d");
    this.resizeCanvas();
    window.addEventListener("resize", this.resizeCanvasBound || (this.resizeCanvasBound = () => this.resizeCanvas()), { passive: true });

    this.hands = new window.Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`
    });
    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.55
    });
    this.hands.onResults((results) => this.onResults(results));
  },

  async processFrame() {
    if (!gameState.cameraActive || !this.hands || this.processing) {
      if (gameState.cameraActive) this.frameRequest = requestAnimationFrame(() => this.processFrame());
      return;
    }
    this.processing = true;
    try {
      if (refs.webcam.readyState >= 2) await this.hands.send({ image: refs.webcam });
    } catch (error) {
      console.warn("Hand processing error:", error);
    } finally {
      this.processing = false;
      if (gameState.cameraActive) this.frameRequest = requestAnimationFrame(() => this.processFrame());
    }
  },

  onResults(results) {
    const ctx = this.canvasCtx;
    if (!ctx) return;
    ctx.clearRect(0, 0, refs.handCanvas.width, refs.handCanvas.height);
    const landmarks = results.multiHandLandmarks?.[0];
    if (!landmarks) {
      TargetManager.hide();
      return;
    }

    this.drawGauntlet(landmarks);
    if (!this.isOpenPalm(landmarks)) {
      TargetManager.hide();
      return;
    }

    // Video is mirrored with CSS. Mirror normalized X for screen coordinates.
    const palmX = 1 - ((landmarks[0].x + landmarks[5].x + landmarks[9].x + landmarks[13].x + landmarks[17].x) / 5);
    const palmY = (landmarks[0].y + landmarks[5].y + landmarks[9].y + landmarks[13].y + landmarks[17].y) / 5;
    const tip = landmarks[9];
    const directionX = (1 - tip.x) - palmX;
    const directionY = tip.y - palmY;
    const boost = 2.35;
    const targetNormX = Utility.clamp(palmX + directionX * boost, 0.02, .98);
    const targetNormY = Utility.clamp(palmY + directionY * boost, 0.05, .95);
    const rect = refs.cameraStage.getBoundingClientRect();
    const x = rect.left + targetNormX * rect.width;
    const y = rect.top + targetNormY * rect.height;
    const originX = rect.left + palmX * rect.width;
    const originY = rect.top + palmY * rect.height;
    TargetManager.setPointer(x, y, originX, originY);
  },

  isOpenPalm(lm) {
    const fingerTips = [8, 12, 16, 20];
    const fingerPips = [6, 10, 14, 18];
    const extended = fingerTips.reduce((sum, tip, i) => sum + (lm[tip].y < lm[fingerPips[i]].y ? 1 : 0), 0);
    const thumbOpen = Math.abs(lm[4].x - lm[2].x) > 0.045;
    return extended >= 3 && thumbOpen;
  },

  drawGauntlet(lm) {
    const ctx = this.canvasCtx;
    const c = refs.handCanvas;
    const rect = refs.cameraStage.getBoundingClientRect();
    const points = lm.map((p) => ({ x: (1 - p.x) * rect.width, y: p.y * rect.height }));
    const connections = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];

    ctx.save();
    ctx.lineWidth = Math.max(2, c.width / 520);
    ctx.strokeStyle = "rgba(53,244,255,.72)";
    ctx.shadowColor = "rgba(53,244,255,.8)";
    ctx.shadowBlur = 9;
    connections.forEach(([a,b]) => {
      ctx.beginPath(); ctx.moveTo(points[a].x, points[a].y); ctx.lineTo(points[b].x, points[b].y); ctx.stroke();
    });
    ctx.shadowBlur = 0;
    points.forEach((p, i) => {
      ctx.beginPath();
      ctx.fillStyle = i === 0 ? "#ffffff" : "rgba(139,92,246,.92)";
      ctx.arc(p.x, p.y, i === 0 ? 6 : 3.6, 0, Math.PI * 2);
      ctx.fill();
    });
    const palm = points[9];
    ctx.beginPath();
    ctx.strokeStyle = "rgba(53,244,255,.92)";
    ctx.lineWidth = 4;
    ctx.arc(palm.x, palm.y, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.fillStyle = "rgba(53,244,255,.25)";
    ctx.arc(palm.x, palm.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },

  resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = refs.cameraStage.getBoundingClientRect();
    refs.handCanvas.width = Math.max(1, Math.floor(rect.width * dpr));
    refs.handCanvas.height = Math.max(1, Math.floor(rect.height * dpr));
    refs.handCanvas.style.width = `${rect.width}px`;
    refs.handCanvas.style.height = `${rect.height}px`;
    // Draw in CSS-pixel coordinates while retaining a high-DPI backing store.
    if (this.canvasCtx) this.canvasCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  },

  fail(message) {
    this.stop();
    UIManager.closeModal("cameraLoadingModal");
    refs.cameraErrorText.textContent = message;
    UIManager.openModal("cameraErrorModal");
    return false;
  },

  stop() {
    gameState.cameraActive = false;
    if (this.frameRequest) cancelAnimationFrame(this.frameRequest);
    this.frameRequest = null;
    TargetManager.hide();
    this.stream?.getTracks?.().forEach((track) => track.stop());
    this.stream = null;
    refs.webcam.pause?.();
    refs.webcam.srcObject = null;
    refs.webcam.classList.remove("active");
    refs.cameraPrivacyBadge.classList.add("hidden");
    try { this.hands?.close?.(); } catch {}
    this.hands = null;
    this.processing = false;
    this.canvasCtx?.clearRect(0, 0, refs.handCanvas.width, refs.handCanvas.height);
  }
};

function cacheRefs() {
  const ids = [
    "homeBtn","settingsBtn","gameArea","cameraStage","webcam","handCanvas","cameraPrivacyBadge","hud","levelBadge","missionBanner","progressText","progressNodes","scoreText","comboText","learningCard","missionTypePill","visualPrompt","learningPrompt","learningSupport","repeatPromptBtn","choicesContainer","targetReticle","lockProgress","energyBeam","novaPanel","novaMessage","hintBtn",
    "startModal","startGameBtn","openWordBankBtn","settingsModal","audioToggle","soundToggle","visualToggle","contrastToggle","motionToggle","fontSizeSelect","saveSettingsBtn",
    "cameraLoadingModal","cameraLoadingText","cameraLoadingBar","cameraErrorModal","cameraErrorText","useTouchModeBtn","retryCameraBtn",
    "feedbackModal","feedbackCard","feedbackIcon","feedbackKicker","feedbackTitle","feedbackVisual","feedbackWord","feedbackSentence","feedbackExtra","feedbackSpeakBtn","nextQuestionBtn",
    "victoryModal","starRating","masteredStat","correctStat","reviewStat","comboStat","finalScoreStat","replayBtn","reviewBtn","victoryWordBankBtn","victoryHomeBtn",
    "wordBankModal","wordBankGrid","toast","ambientParticles"
  ];
  ids.forEach((id) => { refs[id] = document.getElementById(id); });
}

function bindEvents() {
  refs.startGameBtn.addEventListener("click", () => {
    const mode = document.querySelector('input[name="controlMode"]:checked')?.value || "touch";
    GameManager.start(mode);
  });

  refs.settingsBtn.addEventListener("click", () => UIManager.openModal("settingsModal"));
  refs.homeBtn.addEventListener("click", () => GameManager.goHome());
  refs.saveSettingsBtn.addEventListener("click", () => {
    AccessibilityManager.readForm();
    UIManager.closeModal("settingsModal");
    Utility.showToast("Tetapan disimpan.");
  });

  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => UIManager.closeModal(btn.dataset.close));
  });

  refs.openWordBankBtn.addEventListener("click", () => { UIManager.renderWordBank(); UIManager.openModal("wordBankModal"); });
  refs.victoryWordBankBtn.addEventListener("click", () => { UIManager.renderWordBank(); UIManager.openModal("wordBankModal"); });
  refs.hintBtn.addEventListener("click", () => GameManager.requestHint());
  refs.repeatPromptBtn.addEventListener("click", () => SpeechManager.speak(gameState.currentMission?.prompt || "Lihat arahan dengan teliti.", true));

  refs.feedbackSpeakBtn.addEventListener("click", () => {
    const target = VocabularyManager.byWord(gameState.currentWord);
    if (target) SpeechManager.speak(`${target.word}. ${target.standardSentence}`, true);
  });

  refs.nextQuestionBtn.addEventListener("click", () => GameManager.nextMission());
  refs.replayBtn.addEventListener("click", () => GameManager.start(gameState.controlMode));
  refs.reviewBtn.addEventListener("click", () => GameManager.startReview());
  refs.victoryHomeBtn.addEventListener("click", () => GameManager.goHome());

  refs.useTouchModeBtn.addEventListener("click", () => {
    UIManager.closeModal("cameraErrorModal");
    gameState.controlMode = "touch";
    document.querySelector('input[name="controlMode"][value="touch"]').checked = true;
    UIManager.setGameVisible(true);
    GameManager.nextMission();
  });

  refs.retryCameraBtn.addEventListener("click", async () => {
    UIManager.closeModal("cameraErrorModal");
    const ok = await CameraManager.start();
    if (ok) {
      gameState.controlMode = "camera";
      UIManager.setGameVisible(true);
      GameManager.nextMission();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      ["settingsModal","wordBankModal"].forEach((id) => UIManager.closeModal(id));
      return;
    }
    if (!gameState.gameStarted || gameState.waitingForNext) return;
    if (["1","2","3"].includes(event.key)) {
      const index = Number(event.key) - 1;
      const button = refs.choicesContainer.querySelectorAll(".drone-choice")[index];
      button?.click();
    } else if (event.key.toLowerCase() === "h") {
      GameManager.requestHint();
    } else if (event.key.toLowerCase() === "r") {
      SpeechManager.speak(gameState.currentMission?.prompt || "", true);
    }
  });

  window.addEventListener("beforeunload", () => CameraManager.stop());
  document.addEventListener("visibilitychange", () => { if (document.hidden) SpeechManager.stop(); });
}

function createAmbientParticles() {
  if (settings.reducedMotion) return;
  refs.ambientParticles.innerHTML = "";
  for (let i = 0; i < 22; i++) {
    const p = document.createElement("span");
    p.style.left = `${Math.random() * 100}%`;
    p.style.setProperty("--dur", `${7 + Math.random() * 9}s`);
    p.style.setProperty("--delay", `${-Math.random() * 10}s`);
    p.style.opacity = String(.25 + Math.random() * .65);
    refs.ambientParticles.appendChild(p);
  }
}

function detectSmallPortrait() {
  if (window.innerWidth < 520 && window.innerHeight > window.innerWidth) {
    Utility.showToast("Tip: putarkan peranti secara melintang untuk pengalaman AR yang lebih luas.", 4200);
  }
}

function init() {
  cacheRefs();
  StorageManager.loadSettings();
  AccessibilityManager.apply();
  bindEvents();
  createAmbientParticles();
  UIManager.renderWordBank();
  UIManager.setGameVisible(false);
  TargetManager.tick();
  detectSmallPortrait();

  const savedStats = StorageManager.loadStats();
  if (savedStats.lastControlMode === "camera") {
    document.querySelector('input[name="controlMode"][value="camera"]').checked = true;
  }
}

document.addEventListener("DOMContentLoaded", init);
