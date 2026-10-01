/**
 * VOCAB STUDIO PRO - MAIN APPLICATION ENGINE
 * Complete Studio Controller: Parser, Table Grid, 3D Flashcards, Quiz, TTS, Reverse Import
 */

// Bộ dữ liệu mẫu có sẵn để kiểm tra tức thì
const SAMPLE_DATASETS = {
  hsk: {
    name: 'Tiếng Trung HSK 3 (Kèm Hán tự, Pinyin, Nghĩa & Ví dụ)',
    delimiter: '\t',
    text: `苹果\tpíngguǒ\tquả táo\tTôi thích ăn táo (我喜欢吃苹果)\tQuả táo
满意\tmǎnyì\thài lòng\tRất hài lòng với công việc (对工作很满意)\tHài lòng
努力\tnǔlì\tcố gắng\tCần nỗ lực học tập (要努力学习)\tNỗ lực / cố gắng
热情\trèqíng\tnhiệt tình\tNgười bạn rất nhiệt tình (朋友很热情)\tNhiệt tình
照顾\tzhàogù\tchăm sóc\tChăm sóc bản thân thật tốt (好好照顾自己)\tChăm sóc
方便\tfāngbiàn\ttiện lợi\tGiao thông rất thuận tiện (交通很方便)\tThuận tiện / tiện lợi
清楚\tqīngchu\trõ ràng\tNói rất rõ ràng (说得很清楚)\tRõ ràng
决定\tjuédìng\tquyết định\tĐưa ra quyết định (做出决定)\tQuyết định`
  },
  ielts: {
    name: 'IELTS Academic C1 (Nhiều đáp án đồng nghĩa, IPA, Từ loại)',
    delimiter: '\t',
    text: `Abundant\t/əˈbʌndənt/\t(adj)\tDồi dào, phong phú\trich|plentiful|bountiful\tThe country has abundant natural resources.
Mitigate\t/ˈmɪtɪɡeɪt/\t(v)\tLàm giảm nhẹ, làm dịu\talleviate|reduce|ease\tMeasures were taken to mitigate environmental damage.
Substantial\t/səbˈstænʃəl/\t(adj)\tĐáng kể, quan trọng\tsignificant|considerable|large\tA substantial amount of cash was found.
Ambiguous\t/æmˈbɪɡjuəs/\t(adj)\tmơ hồ, không rõ ràng\tunclear|vague|obscure\tThe election result was ambiguous.
Scrutinize\t/ˈskruːtənaɪz/\t(v)\tXem xét kỹ lưỡng\texamine|inspect|analyze\tHer performance was carefully scrutinized.`
  },
  jp: {
    name: 'Tiếng Nhật JLPT N4 (Kanji, Hiragana, Nghĩa tiếng Việt)',
    delimiter: '\t',
    text: `約束\tやくそく\tcuộc hẹn, lời hứa\thẹn / hứa\t友達と約束があります。
案内\tあんない\thướng dẫn, dẫn đường\thướng dẫn\t京都の町を案内します。
準備\tじゅんび\tchuẩn bị\tchuẩn bị\t旅行の準備をします。
複雑\tふくざつ\tphức tạp\tphức tạp\tこの問題は複雑です。
大切\tたいせつ\tquan trọng, quý giá\tquan trọng\t家族はとても大切です。`
  },
  kr: {
    name: 'Tiếng Hàn Topik I (Hangul, Phát âm, Nghĩa tiếng Việt)',
    delimiter: '\t',
    text: `선생님\t[seonsaengnim]\tthầy cô giáo\tgiáo viên\t한국어 선생님입니다.
병원\t[byeong-won]\tbệnh viện\tbệnh viện\t배가 아파서 병원에 가요.
약속\t[yak-sok]\tlời hứa, cuộc hẹn\thẹn / hứa\t오늘 친구와 약속이 있어요.
도서관\t[doseogwan]\tthư viện\tthư viện\t도서관에서 책을 읽어요.
가족\t[gajok]\tgia đình\tgia đình\t우리 가족은 네 명이에요.`
  }
};

const App = (function () {
  'use strict';

  const state = {
    columns: [
      { id: 'col_1', key: 'q', title: 'Đề bài (Từ vựng)', role: 'q' },
      { id: 'col_2', key: 'pinyin', title: 'Phiên âm / Pinyin', role: 'pinyin' },
      { id: 'col_3', key: 'a', title: 'Đáp án chuẩn', role: 'a' },
      { id: 'col_4', key: 'mask', title: 'Ô che mở khóa', role: 'mask' },
      { id: 'col_5', key: 'extra', title: 'Ghi chú / Ví dụ', role: 'extra' }
    ],
    rows: [],
    originalRows: [],
    selectedRowIndices: new Set(),
    activeTab: 'editor',
    selectedLang: 'auto',
    
    // Live Practice State
    liveMode: 'practice',
    liveInputs: {},
    isSubmitted: false,

    // Flashcard State
    flashcardIndex: 0,
    isFlipped: false,

    // Quiz State
    quizIndex: 0,
    quizScore: 0,
    quizStreak: 0,
    quizQuestions: [],
    selectedQuizOption: null,
    isQuizAnswered: false,

    parsedPreviewData: null
  };

  // Tự sinh âm thanh bằng Web Audio API (không phụ thuộc file mp3 ngoài)
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) audioCtx = new AudioCtxClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playSound(type) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (type === 'correct') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now);
        osc1.frequency.setValueAtTime(880, now + 0.1);
        osc2.frequency.setValueAtTime(880, now);
        osc2.frequency.setValueAtTime(1174.66, now + 0.1);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.4);
        osc2.stop(now + 0.4);
      } else if (type === 'wrong') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.setValueAtTime(130, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'fanfare') {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.12, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.35);
        });
      }
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // Web Speech API Text-to-Speech
  function speak(text, customLang = null) {
    if (!('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text.trim());
    let lang = customLang || state.selectedLang;

    if (lang === 'auto') {
      if (/[\u4e00-\u9fff]/.test(text)) lang = 'zh-CN';
      else if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) lang = 'ja-JP';
      else if (/[\uac00-\ud7af]/.test(text)) lang = 'ko-KR';
      else if (/[a-zA-Z]/.test(text)) lang = 'en-US';
      else lang = 'vi-VN';
    }

    utterance.lang = lang;
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }

  // Tự động nhận diện phân cách
  function detectDelimiter(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0).slice(0, 20);
    if (lines.length === 0) return '\t';

    const candidates = [
      { delim: '\t', count: 0, consistency: 0 },
      { delim: ',', count: 0, consistency: 0 },
      { delim: ';', count: 0, consistency: 0 },
      { delim: '|', count: 0, consistency: 0 },
      { delim: ' - ', count: 0, consistency: 0 },
      { delim: ':', count: 0, consistency: 0 }
    ];

    candidates.forEach(cand => {
      let counts = [];
      lines.forEach(line => {
        let cnt = line.split(cand.delim).length - 1;
        cand.count += cnt;
        counts.push(cnt);
      });
      if (cand.count > 0) {
        const avg = cand.count / lines.length;
        const variance = counts.reduce((acc, c) => acc + Math.pow(c - avg, 2), 0) / lines.length;
        cand.consistency = 1 / (1 + variance);
      }
    });

    candidates.sort((a, b) => (b.count * b.consistency) - (a.count * a.consistency));
    return candidates[0].count > 0 ? candidates[0].delim : '\t';
  }

  function parseTextWithDelimiter(text, delimiter) {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    const parsedMatrix = [];

    lines.forEach(line => {
      let parts = [];
      if (delimiter === ',') {
        const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
        let match;
        while ((match = regex.exec(line)) !== null && match.index < line.length) {
          let val = match[1] || '';
          if (val.startsWith('"') && val.endsWith('"')) {
            val = val.substring(1, val.length - 1).replace(/""/g, '"');
          }
          parts.push(val.trim());
          if (regex.lastIndex === match.index) regex.lastIndex++;
        }
      } else if (delimiter === 'spaces') {
        parts = line.split(/\s{2,}/).map(s => s.trim());
      } else {
        parts = line.split(delimiter).map(s => s.trim());
      }

      if (parts.length > 0 && parts.some(p => p.length > 0)) {
        parsedMatrix.push(parts);
      }
    });

    return parsedMatrix;
  }

  function autoAssignRoles(matrix) {
    if (!matrix || matrix.length === 0) return [];
    const colCount = Math.max(...matrix.map(r => r.length));
    const assignedRoles = [];

    for (let c = 0; c < colCount; c++) {
      const sampleVals = matrix.slice(0, 10).map(r => r[c] || '').join(' ');
      let role = 'ignore';
      let title = `Cột ${c + 1}`;

      if (c === 0) {
        role = 'q';
        title = 'Đề bài (Từ vựng)';
      } else if (c === 1) {
        if (/[\u4e00-\u9fff]/.test(sampleVals) === false && /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/.test(sampleVals)) {
          role = 'pinyin';
          title = 'Phiên âm / Pinyin';
        } else if (/\/[^\/]+\/|\[[^\]]+\]/.test(sampleVals)) {
          role = 'pinyin';
          title = 'Phiên âm IPA';
        } else {
          role = 'a';
          title = 'Đáp án chuẩn';
        }
      } else if (c === 2) {
        if (assignedRoles.some(r => r.role === 'a')) {
          role = 'mask';
          title = 'Ô che mở khóa';
        } else {
          role = 'a';
          title = 'Đáp án chuẩn';
        }
      } else if (c === 3) {
        if (!assignedRoles.some(r => r.role === 'mask')) {
          role = 'mask';
          title = 'Ô che mở khóa';
        } else {
          role = 'extra';
          title = 'Ghi chú / Ví dụ';
        }
      } else {
        role = 'extra';
        title = `Ghi chú / Cột ${c + 1}`;
      }

      assignedRoles.push({
        id: `col_${c + 1}`,
        key: role === 'ignore' ? `extra_${c}` : (role === 'q' ? 'q' : (role === 'a' ? 'a' : (role === 'mask' ? 'mask' : (role === 'pinyin' ? 'pinyin' : `extra_${c}`)))),
        title: title,
        role: role
      });
    }

    return assignedRoles;
  }

  function init() {
    loadSampleDataset('hsk');
    bindGlobalEvents();
    renderAll();
    if (window.lucide) window.lucide.createIcons();
  }

  function loadSampleDataset(key) {
    const sample = SAMPLE_DATASETS[key];
    if (!sample) return;

    const matrix = parseTextWithDelimiter(sample.text, sample.delimiter);
    const roles = autoAssignRoles(matrix);

    state.columns = roles;
    state.rows = matrix.map((rowArr, idx) => {
      const rowObj = { id: idx + 1 };
      roles.forEach((col, cIdx) => {
        rowObj[col.key] = rowArr[cIdx] || '';
      });
      return rowObj;
    });

    state.originalRows = JSON.parse(JSON.stringify(state.rows));
    state.selectedRowIndices.clear();
    state.liveInputs = {};
    state.isSubmitted = false;

    renderAll();
  }

  function bindGlobalEvents() {
    document.querySelectorAll('[data-tab-target]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget.dataset.tabTarget;
        switchTab(target);
      });
    });

    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
      langSelect.addEventListener('change', (e) => {
        state.selectedLang = e.target.value;
      });
    }

    document.getElementById('btnOpenImportModal')?.addEventListener('click', openImportModal);
    document.getElementById('btnCloseImportModal')?.addEventListener('click', closeImportModal);
    document.getElementById('btnConfirmImport')?.addEventListener('click', confirmImportModal);

    document.querySelectorAll('input[name="importDelimiter"]').forEach(radio => {
      radio.addEventListener('change', () => {
        const rawText = document.getElementById('importTextarea')?.value || '';
        reparsePreview(rawText, radio.value);
      });
    });

    document.getElementById('importTextarea')?.addEventListener('input', (e) => {
      const text = e.target.value;
      const detected = detectDelimiter(text);
      const radio = document.querySelector(`input[name="importDelimiter"][value="${detected}"]`);
      if (radio) radio.checked = true;
      reparsePreview(text, detected);
    });

    document.getElementById('fileUploadInput')?.addEventListener('change', handleFileUpload);

    document.querySelectorAll('[data-sample-key]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const key = e.currentTarget.dataset.sampleKey;
        loadSampleDataset(key);
      });
    });

    document.getElementById('btnAddRow')?.addEventListener('click', addNewRow);
    document.getElementById('btnAddColumn')?.addEventListener('click', addNewColumn);
    document.getElementById('btnDeleteSelectedRows')?.addEventListener('click', deleteSelectedRows);
    document.getElementById('btnShuffleRows')?.addEventListener('click', shuffleRows);
    document.getElementById('btnResetRows')?.addEventListener('click', resetRows);
    document.getElementById('btnPickRandom')?.addEventListener('click', pickRandomRows);
    document.getElementById('selectAllRows')?.addEventListener('change', toggleSelectAllRows);
    document.getElementById('searchInput')?.addEventListener('input', handleSearch);

    document.getElementById('btnToggleLiveMode')?.addEventListener('click', toggleLiveMode);
    document.getElementById('btnSubmitLiveExam')?.addEventListener('click', submitLiveExam);
    document.getElementById('btnResetLiveExam')?.addEventListener('click', resetLiveExam);

    document.getElementById('flashcardContainer')?.addEventListener('click', toggleFlashcardFlip);
    document.getElementById('btnPrevFlashcard')?.addEventListener('click', prevFlashcard);
    document.getElementById('btnNextFlashcard')?.addEventListener('click', nextFlashcard);
    document.getElementById('btnShuffleFlashcard')?.addEventListener('click', shuffleFlashcards);
    document.getElementById('btnFlashcardSpeak')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = state.rows[state.flashcardIndex];
      const qCol = state.columns.find(c => c.role === 'q');
      if (card && qCol) speak(card[qCol.key]);
    });

    window.addEventListener('keydown', (e) => {
      if (state.activeTab === 'flashcard') {
        if (e.code === 'Space') {
          e.preventDefault();
          toggleFlashcardFlip();
        } else if (e.code === 'ArrowRight') {
          e.preventDefault();
          nextFlashcard();
        } else if (e.code === 'ArrowLeft') {
          e.preventDefault();
          prevFlashcard();
        }
      }
    });

    document.getElementById('btnRestartQuiz')?.addEventListener('click', restartQuiz);
    document.getElementById('btnNextQuiz')?.addEventListener('click', nextQuizQuestion);

    document.getElementById('btnOpenExportModal')?.addEventListener('click', openExportModal);
    document.getElementById('btnCloseExportModal')?.addEventListener('click', closeExportModal);
    document.getElementById('btnExecuteExport')?.addEventListener('click', executeExport);
  }

  function switchTab(tabId) {
    state.activeTab = tabId;

    document.querySelectorAll('[data-tab-target]').forEach(btn => {
      const isCurrent = btn.dataset.tabTarget === tabId;
      btn.classList.toggle('text-blue-400', isCurrent);
      btn.classList.toggle('border-blue-500', isCurrent);
      btn.classList.toggle('bg-blue-500/10', isCurrent);
      btn.classList.toggle('text-slate-400', !isCurrent);
      btn.classList.toggle('border-transparent', !isCurrent);
    });

    document.querySelectorAll('.tab-view').forEach(view => {
      view.classList.add('hidden');
    });

    const activeView = document.getElementById(`tabView_${tabId}`);
    if (activeView) activeView.classList.remove('hidden');

    if (tabId === 'live') renderLivePractice();
    else if (tabId === 'flashcard') {
      state.flashcardIndex = 0;
      state.isFlipped = false;
      renderFlashcard();
    } else if (tabId === 'quiz') initQuiz();

    if (window.lucide) window.lucide.createIcons();
  }

  function renderAll() {
    renderStats();
    renderSpreadsheet();
    if (state.activeTab === 'live') renderLivePractice();
    if (state.activeTab === 'flashcard') renderFlashcard();
    if (state.activeTab === 'quiz') initQuiz();
    if (window.lucide) window.lucide.createIcons();
  }

  function renderStats() {
    const totalCount = state.rows.length;
    const statTotalEl = document.getElementById('statTotalQuestions');
    if (statTotalEl) statTotalEl.textContent = totalCount;

    const qCol = state.columns.find(c => c.role === 'q');
    const aCol = state.columns.find(c => c.role === 'a');
    const badge = document.getElementById('statStatusBadge');
    if (badge) {
      if (qCol && aCol) {
        badge.innerHTML = `<span class="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full text-xs font-medium"><i data-lucide="check-circle" class="w-3.5 h-3.5"></i> Sẵn sàng xuất Excel</span>`;
      } else {
        badge.innerHTML = `<span class="inline-flex items-center gap-1 text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2.5 py-1 rounded-full text-xs font-medium"><i data-lucide="alert-triangle" class="w-3.5 h-3.5"></i> Cần gán Đề bài & Đáp án</span>`;
      }
    }
  }

  function renderSpreadsheet(filteredRows = null) {
    const thead = document.getElementById('tableHeader');
    const tbody = document.getElementById('tableBody');
    if (!thead || !tbody) return;

    const displayRows = filteredRows || state.rows;

    let headerHtml = `
      <th class="w-12 px-3 py-3 text-center bg-slate-900/90 text-slate-400 font-semibold text-xs border-b border-slate-700">
        <input type="checkbox" id="selectAllRows" class="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-0 cursor-pointer">
      </th>
      <th class="w-14 px-3 py-3 text-center bg-slate-900/90 text-slate-400 font-semibold text-xs border-b border-slate-700">STT</th>
    `;

    state.columns.forEach((col) => {
      const roleColor = getRoleBadgeColor(col.role);
      headerHtml += `
        <th class="px-4 py-2 bg-slate-900/90 text-slate-200 border-b border-slate-700 text-left min-w-[180px]">
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="font-bold text-xs uppercase tracking-wider text-slate-300 truncate" title="Nhấp đúp để đổi tên" ondblclick="App.editColumnTitle('${col.id}')">
              ${escapeHtml(col.title)}
            </span>
            <button onclick="App.deleteColumn('${col.id}')" class="text-slate-500 hover:text-rose-400 transition-colors p-1" title="Xóa cột này">
              <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
          </div>
          <div class="flex items-center gap-1.5">
            <select onchange="App.changeColumnRole('${col.id}', this.value)" class="text-xs py-1 px-2 rounded font-medium ${roleColor.bg} ${roleColor.text} border ${roleColor.border} focus:ring-1 focus:ring-blue-500 outline-none w-full cursor-pointer">
              <option value="q" ${col.role === 'q' ? 'selected' : ''}>📘 Đề bài (q)</option>
              <option value="a" ${col.role === 'a' ? 'selected' : ''}>🎯 Đáp án chuẩn (a)</option>
              <option value="mask" ${col.role === 'mask' ? 'selected' : ''}>🔒 Ô che mở khóa (mask)</option>
              <option value="pinyin" ${col.role === 'pinyin' ? 'selected' : ''}>🔤 Pinyin / Phiên âm</option>
              <option value="extra" ${col.role === 'extra' ? 'selected' : ''}>📝 Ghi chú / Ví dụ (extra)</option>
              <option value="ignore" ${col.role === 'ignore' ? 'selected' : ''}>🚫 Bỏ qua (ignore)</option>
            </select>
          </div>
        </th>
      `;
    });

    headerHtml += `
      <th class="w-16 px-3 py-3 text-center bg-slate-900/90 text-slate-400 font-semibold text-xs border-b border-slate-700">Hành động</th>
    `;
    thead.innerHTML = headerHtml;

    if (displayRows.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="${state.columns.length + 3}" class="py-12 text-center text-slate-500">
            <i data-lucide="inbox" class="w-10 h-10 mx-auto mb-2 text-slate-600"></i>
            <p class="text-sm font-medium">Chưa có từ vựng nào. Hãy bấm "Nạp Dữ Liệu" hoặc chọn mẫu có sẵn ở trên!</p>
          </td>
        </tr>
      `;
      return;
    }

    let bodyHtml = '';
    displayRows.forEach((row, rowIdx) => {
      const isSelected = state.selectedRowIndices.has(rowIdx);
      bodyHtml += `
        <tr class="hover:bg-slate-800/40 transition-colors ${isSelected ? 'row-selected' : ''}">
          <td class="text-center px-3 py-2.5">
            <input type="checkbox" onchange="App.toggleSelectRow(${rowIdx})" ${isSelected ? 'checked' : ''} class="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-0 cursor-pointer">
          </td>
          <td class="text-center px-3 py-2.5 text-xs text-slate-400 font-mono">${rowIdx + 1}</td>
      `;

      state.columns.forEach(col => {
        const val = row[col.key] || '';
        bodyHtml += `
          <td class="px-3 py-1.5 text-sm text-slate-200">
            <input type="text" value="${escapeHtml(val)}" onblur="App.updateCellValue(${row.id}, '${col.key}', this.value)" class="w-full bg-transparent px-2 py-1 rounded hover:bg-slate-800/60 focus:bg-slate-900 border border-transparent focus:border-blue-500/50 outline-none text-sm transition-all text-slate-200">
          </td>
        `;
      });

      bodyHtml += `
        <td class="text-center px-3 py-2.5">
          <button onclick="App.deleteSingleRow(${row.id})" class="text-slate-500 hover:text-rose-400 p-1 transition-colors" title="Xóa dòng này">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </td>
      </tr>`;
    });

    tbody.innerHTML = bodyHtml;
  }

  function getRoleBadgeColor(role) {
    switch (role) {
      case 'q': return { bg: 'bg-blue-950/60', text: 'text-blue-300', border: 'border-blue-700/60' };
      case 'a': return { bg: 'bg-emerald-950/60', text: 'text-emerald-300', border: 'border-emerald-700/60' };
      case 'mask': return { bg: 'bg-amber-950/60', text: 'text-amber-300', border: 'border-amber-700/60' };
      case 'pinyin': return { bg: 'bg-purple-950/60', text: 'text-purple-300', border: 'border-purple-700/60' };
      case 'extra': return { bg: 'bg-cyan-950/60', text: 'text-cyan-300', border: 'border-cyan-700/60' };
      default: return { bg: 'bg-slate-800', text: 'text-slate-400', border: 'border-slate-700' };
    }
  }

  function changeColumnRole(colId, newRole) {
    const col = state.columns.find(c => c.id === colId);
    if (!col) return;
    col.role = newRole;
    if (['q', 'a', 'mask', 'pinyin'].includes(newRole)) {
      col.key = newRole;
    }
    renderAll();
  }

  function editColumnTitle(colId) {
    const col = state.columns.find(c => c.id === colId);
    if (!col) return;
    const newTitle = prompt('Nhập tên hiển thị mới cho cột:', col.title);
    if (newTitle && newTitle.trim()) {
      col.title = newTitle.trim();
      renderSpreadsheet();
      if (window.lucide) window.lucide.createIcons();
    }
  }

  function deleteColumn(colId) {
    if (state.columns.length <= 2) {
      alert('Bảng tính cần duy trì ít nhất 2 cột.');
      return;
    }
    if (confirm('Bạn có chắc chắn muốn xóa cột này?')) {
      state.columns = state.columns.filter(c => c.id !== colId);
      renderAll();
    }
  }

  function addNewColumn() {
    const title = prompt('Nhập tiêu đề cột mới:', 'Cột mới');
    if (!title) return;

    const newKey = `custom_${Date.now()}`;
    state.columns.push({
      id: `col_${Date.now()}`,
      key: newKey,
      title: title.trim(),
      role: 'extra'
    });

    state.rows.forEach(r => { r[newKey] = ''; });
    renderAll();
  }

  function addNewRow() {
    const newId = state.rows.length > 0 ? Math.max(...state.rows.map(r => r.id)) + 1 : 1;
    const newRow = { id: newId };
    state.columns.forEach(c => { newRow[c.key] = ''; });
    state.rows.push(newRow);
    renderAll();
  }

  function updateCellValue(rowId, colKey, val) {
    const row = state.rows.find(r => r.id === rowId);
    if (row) row[colKey] = val;
  }

  function deleteSingleRow(rowId) {
    state.rows = state.rows.filter(r => r.id !== rowId);
    renderAll();
  }

  function toggleSelectRow(idx) {
    if (state.selectedRowIndices.has(idx)) {
      state.selectedRowIndices.delete(idx);
    } else {
      state.selectedRowIndices.add(idx);
    }
    renderSpreadsheet();
    if (window.lucide) window.lucide.createIcons();
  }

  function toggleSelectAllRows(e) {
    if (e.target.checked) {
      state.selectedRowIndices = new Set(state.rows.map((_, i) => i));
    } else {
      state.selectedRowIndices.clear();
    }
    renderSpreadsheet();
    if (window.lucide) window.lucide.createIcons();
  }

  function deleteSelectedRows() {
    if (state.selectedRowIndices.size === 0) {
      alert('Vui lòng tích chọn ít nhất 1 dòng để xóa.');
      return;
    }
    if (confirm(`Bạn có chắc muốn xóa ${state.selectedRowIndices.size} dòng đã chọn?`)) {
      state.rows = state.rows.filter((_, idx) => !state.selectedRowIndices.has(idx));
      state.selectedRowIndices.clear();
      renderAll();
    }
  }

  function shuffleRows() {
    const arr = [...state.rows];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    state.rows = arr;
    renderAll();
  }

  function resetRows() {
    if (state.originalRows && state.originalRows.length > 0) {
      state.rows = JSON.parse(JSON.stringify(state.originalRows));
      renderAll();
    }
  }

  function pickRandomRows() {
    const countStr = prompt(`Nhập số câu ngẫu nhiên bạn muốn lấy (Tối đa ${state.rows.length}):`, Math.min(20, state.rows.length));
    if (!countStr) return;
    const count = parseInt(countStr, 10);
    if (isNaN(count) || count <= 0 || count > state.rows.length) {
      alert('Số lượng không hợp lệ.');
      return;
    }
    const shuffled = [...state.rows].sort(() => Math.random() - 0.5);
    state.rows = shuffled.slice(0, count);
    renderAll();
  }

  function handleSearch(e) {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
      renderSpreadsheet();
      return;
    }
    const filtered = state.rows.filter(row => {
      return Object.values(row).some(v => String(v).toLowerCase().includes(q));
    });
    renderSpreadsheet(filtered);
    if (window.lucide) window.lucide.createIcons();
  }

  function openImportModal() {
    const modal = document.getElementById('importModal');
    if (modal) modal.classList.remove('hidden');
    const textarea = document.getElementById('importTextarea');
    if (textarea) textarea.value = '';
    state.parsedPreviewData = null;
    document.getElementById('importPreviewArea').innerHTML = '<p class="text-xs text-slate-500 py-6 text-center italic">Dán văn bản hoặc tải file để xem bảng dữ liệu xem trước...</p>';
  }

  function closeImportModal() {
    const modal = document.getElementById('importModal');
    if (modal) modal.classList.add('hidden');
  }

  function reparsePreview(text, delimiter) {
    if (!text || !text.trim()) {
      document.getElementById('importPreviewArea').innerHTML = '<p class="text-xs text-slate-500 py-6 text-center italic">Dán văn bản hoặc tải file để xem bảng dữ liệu xem trước...</p>';
      state.parsedPreviewData = null;
      return;
    }

    const matrix = parseTextWithDelimiter(text, delimiter);
    if (matrix.length === 0) return;

    const assigned = autoAssignRoles(matrix);
    state.parsedPreviewData = { matrix, assigned };

    let tableHtml = `<div class="overflow-x-auto max-h-60"><table class="w-full text-xs text-left text-slate-300 border-collapse"><thead><tr class="bg-slate-800">`;
    assigned.forEach((col, idx) => {
      tableHtml += `
        <th class="p-2 border border-slate-700">
          <div class="font-bold text-slate-200 mb-1">Cột ${idx + 1}</div>
          <select id="previewColRole_${idx}" class="bg-slate-900 text-xs rounded border border-slate-700 p-1 text-slate-200 w-full">
            <option value="q" ${col.role === 'q' ? 'selected' : ''}>Đề bài (q)</option>
            <option value="a" ${col.role === 'a' ? 'selected' : ''}>Đáp án chuẩn (a)</option>
            <option value="mask" ${col.role === 'mask' ? 'selected' : ''}>Ô che mở khóa (mask)</option>
            <option value="pinyin" ${col.role === 'pinyin' ? 'selected' : ''}>Pinyin / Phiên âm</option>
            <option value="extra" ${col.role === 'extra' ? 'selected' : ''}>Ghi chú (extra)</option>
            <option value="ignore" ${col.role === 'ignore' ? 'selected' : ''}>Bỏ qua (ignore)</option>
          </select>
        </th>
      `;
    });
    tableHtml += `</tr></thead><tbody>`;

    matrix.slice(0, 5).forEach((rowArr) => {
      tableHtml += `<tr class="hover:bg-slate-800/40">`;
      assigned.forEach((_, cIdx) => {
        tableHtml += `<td class="p-2 border border-slate-800 truncate max-w-[150px]">${escapeHtml(rowArr[cIdx] || '')}</td>`;
      });
      tableHtml += `</tr>`;
    });
    tableHtml += `</tbody></table></div>`;

    document.getElementById('importPreviewArea').innerHTML = tableHtml;
  }

  function confirmImportModal() {
    if (!state.parsedPreviewData) {
      alert('Vui lòng nhập văn bản từ vựng hợp lệ.');
      return;
    }

    const { matrix, assigned } = state.parsedPreviewData;

    assigned.forEach((col, idx) => {
      const select = document.getElementById(`previewColRole_${idx}`);
      if (select) {
        col.role = select.value;
        if (col.role === 'q') col.title = 'Đề bài (Từ vựng)';
        else if (col.role === 'a') col.title = 'Đáp án chuẩn';
        else if (col.role === 'mask') col.title = 'Ô che mở khóa';
        else if (col.role === 'pinyin') col.title = 'Phiên âm / Pinyin';
        else if (col.role === 'extra') col.title = 'Ghi chú / Ví dụ';
        else col.title = `Cột ${idx + 1} (Bỏ qua)`;
      }
    });

    state.columns = assigned;
    state.rows = matrix.map((rowArr, idx) => {
      const rowObj = { id: idx + 1 };
      assigned.forEach((col, cIdx) => {
        rowObj[col.key] = rowArr[cIdx] || '';
      });
      return rowObj;
    });

    state.originalRows = JSON.parse(JSON.stringify(state.rows));
    state.selectedRowIndices.clear();
    state.liveInputs = {};
    state.isSubmitted = false;

    closeImportModal();
    renderAll();
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.xlsx')) {
      try {
        const result = await ExcelEngine.reverseImportWorkbook(file);
        if (result && result.rows.length > 0) {
          state.columns = result.columns;
          state.rows = result.rows;
          state.originalRows = JSON.parse(JSON.stringify(state.rows));
          state.selectedRowIndices.clear();
          renderAll();
          alert(`Đã nạp ngược thành công ${result.rows.length} câu từ file Excel: "${result.title}"`);
        }
      } catch (err) {
        alert('Lỗi nạp file Excel: ' + err.message);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        openImportModal();
        const textarea = document.getElementById('importTextarea');
        if (textarea) textarea.value = text;
        const delim = detectDelimiter(text);
        const radio = document.querySelector(`input[name="importDelimiter"][value="${delim}"]`);
        if (radio) radio.checked = true;
        reparsePreview(text, delim);
      };
      reader.readAsText(file);
    }
  }

  // Live Practice
  function renderLivePractice() {
    const container = document.getElementById('livePracticeContainer');
    if (!container) return;

    const qCol = state.columns.find(c => c.role === 'q');
    const aCol = state.columns.find(c => c.role === 'a');
    const maskCol = state.columns.find(c => c.role === 'mask');
    const pinyinCol = state.columns.find(c => c.role === 'pinyin');

    if (!qCol || !aCol) {
      container.innerHTML = `<div class="p-8 text-center text-amber-400">Vui lòng đảm bảo bảng có đủ cột Đề bài (q) và Đáp án (a).</div>`;
      return;
    }

    let correctCount = 0;
    let answeredCount = 0;

    let html = `
      <div class="overflow-x-auto rounded-xl border border-slate-700 bg-slate-900/60 shadow-xl">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-800/80 text-xs font-semibold text-slate-300 uppercase tracking-wider border-b border-slate-700">
              <th class="w-12 px-4 py-3 text-center">STT</th>
              <th class="px-4 py-3 min-w-[180px]">Đề bài</th>
              ${pinyinCol ? `<th class="px-4 py-3 min-w-[140px]">Phiên âm</th>` : ''}
              <th class="px-4 py-3 min-w-[200px]">Ô làm bài (Gõ đáp án)</th>
              <th class="px-4 py-3 w-28 text-center">Kết quả</th>
              ${maskCol ? `<th class="px-4 py-3 min-w-[180px]">Ô che mở khóa</th>` : ''}
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
    `;

    state.rows.forEach((row, idx) => {
      const qVal = row[qCol.key] || '';
      const aVal = row[aCol.key] || '';
      const pyVal = pinyinCol ? (row[pinyinCol.key] || '') : '';
      const maskVal = maskCol ? (row[maskCol.key] || '') : '';

      const userVal = (state.liveInputs[row.id] || '').trim();
      const isFilled = userVal.length > 0;
      if (isFilled) answeredCount++;

      const acceptedAnswers = aVal.split('|').map(s => s.trim().toLowerCase());
      const isCorrect = acceptedAnswers.includes(userVal.toLowerCase());
      if (isCorrect) correctCount++;

      let statusBadge = `<span class="text-xs text-slate-500 font-medium">Chưa làm</span>`;
      let inputClasses = 'border-slate-700 bg-slate-800/60 text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500';

      if (state.liveMode === 'practice') {
        if (isFilled) {
          if (isCorrect) {
            statusBadge = `<span class="inline-flex items-center gap-1 text-emerald-400 font-bold text-xs"><i data-lucide="check" class="w-3.5 h-3.5"></i> ĐÚNG</span>`;
            inputClasses = 'border-emerald-500 bg-emerald-950/20 text-emerald-200';
          } else {
            statusBadge = `<span class="inline-flex items-center gap-1 text-rose-400 font-bold text-xs"><i data-lucide="x" class="w-3.5 h-3.5"></i> SAI</span>`;
            inputClasses = 'border-rose-500 bg-rose-950/20 text-rose-200';
          }
        }
      } else {
        if (state.isSubmitted) {
          if (isCorrect) {
            statusBadge = `<span class="inline-flex items-center gap-1 text-emerald-400 font-bold text-xs"><i data-lucide="check" class="w-3.5 h-3.5"></i> ĐÚNG</span>`;
            inputClasses = 'border-emerald-500 bg-emerald-950/20 text-emerald-200';
          } else {
            statusBadge = `<span class="inline-flex items-center gap-1 text-rose-400 font-bold text-xs"><i data-lucide="x" class="w-3.5 h-3.5"></i> SAI</span>`;
            inputClasses = 'border-rose-500 bg-rose-950/20 text-rose-200';
          }
        } else {
          statusBadge = isFilled ? `<span class="text-xs text-amber-400 font-medium">Đã nhập</span>` : `<span class="text-xs text-slate-500 font-medium">Chưa làm</span>`;
        }
      }

      let maskDisplay = `<span class="text-xs text-slate-500 italic">🔒 [Nhập đúng để mở]</span>`;
      if (maskCol) {
        if (state.isSubmitted || (state.liveMode === 'practice' && isCorrect)) {
          maskDisplay = `<span class="text-xs text-amber-300 font-medium">${escapeHtml(maskVal)}</span>`;
        }
      }

      html += `
        <tr class="hover:bg-slate-800/30 transition-colors">
          <td class="text-center px-4 py-3 text-xs text-slate-400 font-mono">${idx + 1}</td>
          <td class="px-4 py-3 text-sm font-semibold text-slate-100">
            <div class="flex items-center gap-2">
              <span>${escapeHtml(qVal)}</span>
              <button onclick="App.speakWord('${escapeHtml(qVal)}')" class="text-slate-400 hover:text-blue-400 transition-colors p-1" title="Phát âm">
                <i data-lucide="volume-2" class="w-4 h-4"></i>
              </button>
            </div>
          </td>
          ${pinyinCol ? `<td class="px-4 py-3 text-xs text-slate-300 font-mono">${escapeHtml(pyVal)}</td>` : ''}
          <td class="px-4 py-2">
            <input type="text" value="${escapeHtml(state.liveInputs[row.id] || '')}" oninput="App.handleLiveInput(${row.id}, this.value)" placeholder="Nhập đáp án..." class="w-full text-sm px-3 py-1.5 rounded-lg border outline-none transition-all ${inputClasses}">
          </td>
          <td class="px-4 py-3 text-center">${statusBadge}</td>
          ${maskCol ? `<td class="px-4 py-3">${maskDisplay}</td>` : ''}
        </tr>
      `;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;

    const scoreVal = state.rows.length > 0 ? ((correctCount / state.rows.length) * 10).toFixed(1) : 0;
    const liveScoreEl = document.getElementById('liveScoreValue');
    const liveStatsEl = document.getElementById('liveStatsSummary');
    if (liveScoreEl) liveScoreEl.textContent = scoreVal;
    if (liveStatsEl) liveStatsEl.textContent = `Đã làm: ${answeredCount}/${state.rows.length} • Đúng: ${correctCount} câu`;

    if (window.lucide) window.lucide.createIcons();
  }

  function handleLiveInput(rowId, val) {
    state.liveInputs[rowId] = val;
    if (state.liveMode === 'practice') renderLivePractice();
  }

  function toggleLiveMode() {
    state.liveMode = state.liveMode === 'practice' ? 'exam' : 'practice';
    const btn = document.getElementById('btnToggleLiveMode');
    if (btn) btn.textContent = state.liveMode === 'practice' ? 'Chuyển sang Chế độ Kiểm tra' : 'Chuyển sang Chế độ Luyện tập';
    const submitBtn = document.getElementById('btnSubmitLiveExam');
    if (submitBtn) submitBtn.classList.toggle('hidden', state.liveMode === 'practice');
    state.isSubmitted = false;
    renderLivePractice();
  }

  function submitLiveExam() {
    state.isSubmitted = true;
    renderLivePractice();

    const aCol = state.columns.find(c => c.role === 'a');
    let correct = 0;
    state.rows.forEach(r => {
      const userVal = (state.liveInputs[r.id] || '').trim().toLowerCase();
      const accepted = (r[aCol.key] || '').split('|').map(s => s.trim().toLowerCase());
      if (accepted.includes(userVal)) correct++;
    });

    const ratio = correct / state.rows.length;
    if (ratio >= 0.8) {
      playSound('fanfare');
      if (typeof confetti === 'function') confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } else {
      playSound('wrong');
    }
  }

  function resetLiveExam() {
    state.liveInputs = {};
    state.isSubmitted = false;
    renderLivePractice();
  }

  // 3D Flashcards
  function renderFlashcard() {
    if (state.rows.length === 0) return;
    const card = state.rows[state.flashcardIndex];
    if (!card) return;

    const qCol = state.columns.find(c => c.role === 'q');
    const aCol = state.columns.find(c => c.role === 'a');
    const maskCol = state.columns.find(c => c.role === 'mask');
    const pinyinCol = state.columns.find(c => c.role === 'pinyin');
    const extraCol = state.columns.find(c => c.role === 'extra');

    const cardInner = document.getElementById('flashcardInner');
    if (cardInner) cardInner.classList.toggle('flipped', state.isFlipped);

    const frontQuestion = document.getElementById('flashcardFrontQuestion');
    const frontPinyin = document.getElementById('flashcardFrontPinyin');
    const backAnswer = document.getElementById('flashcardBackAnswer');
    const backMask = document.getElementById('flashcardBackMask');
    const backExtra = document.getElementById('flashcardBackExtra');
    const cardProgress = document.getElementById('flashcardProgress');

    if (frontQuestion && qCol) frontQuestion.textContent = card[qCol.key] || '';
    if (frontPinyin && pinyinCol) frontPinyin.textContent = card[pinyinCol.key] || '';
    if (backAnswer && aCol) backAnswer.textContent = card[aCol.key] || '';
    if (backMask) backMask.textContent = maskCol ? (card[maskCol.key] || '') : '';
    if (backExtra) backExtra.textContent = extraCol ? (card[extraCol.key] || '') : '';
    if (cardProgress) cardProgress.textContent = `Thẻ ${state.flashcardIndex + 1} / ${state.rows.length}`;

    if (window.lucide) window.lucide.createIcons();
  }

  function toggleFlashcardFlip() {
    state.isFlipped = !state.isFlipped;
    renderFlashcard();
  }

  function nextFlashcard() {
    if (state.rows.length === 0) return;
    state.isFlipped = false;
    state.flashcardIndex = (state.flashcardIndex + 1) % state.rows.length;
    renderFlashcard();
  }

  function prevFlashcard() {
    if (state.rows.length === 0) return;
    state.isFlipped = false;
    state.flashcardIndex = (state.flashcardIndex - 1 + state.rows.length) % state.rows.length;
    renderFlashcard();
  }

  function shuffleFlashcards() {
    shuffleRows();
    state.flashcardIndex = 0;
    state.isFlipped = false;
    renderFlashcard();
  }

  // Trắc nghiệm 4 lựa chọn (Quiz)
  function initQuiz() {
    if (state.rows.length < 2) {
      const quizView = document.getElementById('quizContainer');
      if (quizView) {
        quizView.innerHTML = `<div class="p-12 text-center text-amber-400">Cần ít nhất 2 câu hỏi để tạo bài trắc nghiệm 4 lựa chọn.</div>`;
      }
      return;
    }

    state.quizIndex = 0;
    state.quizScore = 0;
    state.quizStreak = 0;
    state.selectedQuizOption = null;
    state.isQuizAnswered = false;

    const aCol = state.columns.find(c => c.role === 'a');
    const qCol = state.columns.find(c => c.role === 'q');
    if (!aCol || !qCol) return;

    const allAnswers = state.rows.map(r => r[aCol.key]).filter(Boolean);

    state.quizQuestions = state.rows.map(r => {
      const correctAns = r[aCol.key];
      const otherAnswers = allAnswers.filter(a => a !== correctAns);
      const distractors = [...otherAnswers].sort(() => Math.random() - 0.5).slice(0, 3);
      const options = [correctAns, ...distractors].sort(() => Math.random() - 0.5);

      return {
        question: r[qCol.key],
        pinyin: r.pinyin || '',
        correct: correctAns,
        options: options
      };
    });

    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    if (state.quizIndex >= state.quizQuestions.length) {
      renderQuizFinished();
      return;
    }

    const currentQ = state.quizQuestions[state.quizIndex];
    state.isQuizAnswered = false;
    state.selectedQuizOption = null;

    const qTextEl = document.getElementById('quizQuestionText');
    const qProgressEl = document.getElementById('quizProgress');
    const qScoreEl = document.getElementById('quizScore');
    const qStreakEl = document.getElementById('quizStreak');
    const optionsContainer = document.getElementById('quizOptionsContainer');
    const nextBtn = document.getElementById('btnNextQuiz');

    if (qTextEl) qTextEl.textContent = currentQ.question;
    if (qProgressEl) qProgressEl.textContent = `Câu ${state.quizIndex + 1} / ${state.quizQuestions.length}`;
    if (qScoreEl) qScoreEl.textContent = state.quizScore;
    if (qStreakEl) {
      qStreakEl.innerHTML = state.quizStreak >= 2 ? `🔥 Combo x${state.quizStreak}` : '';
    }
    if (nextBtn) nextBtn.classList.add('hidden');

    if (optionsContainer) {
      let optionsHtml = '';
      currentQ.options.forEach((opt, idx) => {
        optionsHtml += `
          <button onclick="App.chooseQuizOption('${escapeHtml(opt)}')" class="quiz-option-btn p-4 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 text-left font-semibold text-slate-100 flex items-center gap-3 transition-all">
            <span class="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center font-bold text-xs text-blue-400">
              ${['A', 'B', 'C', 'D'][idx]}
            </span>
            <span class="flex-1">${escapeHtml(opt)}</span>
          </button>
        `;
      });
      optionsContainer.innerHTML = optionsHtml;
    }

    if (window.lucide) window.lucide.createIcons();
  }

  function chooseQuizOption(chosen) {
    if (state.isQuizAnswered) return;
    state.isQuizAnswered = true;
    state.selectedQuizOption = chosen;

    const currentQ = state.quizQuestions[state.quizIndex];
    const accepted = currentQ.correct.split('|').map(s => s.trim().toLowerCase());
    const isCorrect = accepted.includes(chosen.trim().toLowerCase());

    if (isCorrect) {
      state.quizScore += 10;
      state.quizStreak++;
      playSound('correct');
    } else {
      state.quizStreak = 0;
      playSound('wrong');
    }

    const buttons = document.querySelectorAll('.quiz-option-btn');
    buttons.forEach(btn => {
      btn.disabled = true;
      const text = btn.querySelector('.flex-1')?.textContent?.trim().toLowerCase();
      if (accepted.includes(text)) {
        btn.classList.add('border-emerald-500', 'bg-emerald-950/40', 'text-emerald-200');
      } else if (text === chosen.trim().toLowerCase()) {
        btn.classList.add('border-rose-500', 'bg-rose-950/40', 'text-rose-200');
      }
    });

    const nextBtn = document.getElementById('btnNextQuiz');
    if (nextBtn) nextBtn.classList.remove('hidden');

    const qScoreEl = document.getElementById('quizScore');
    if (qScoreEl) qScoreEl.textContent = state.quizScore;
    const qStreakEl = document.getElementById('quizStreak');
    if (qStreakEl) {
      qStreakEl.innerHTML = state.quizStreak >= 2 ? `🔥 Combo x${state.quizStreak}` : '';
    }
  }

  function nextQuizQuestion() {
    state.quizIndex++;
    renderQuizQuestion();
  }

  function renderQuizFinished() {
    const quizCard = document.getElementById('quizActiveCard');
    const quizFinishCard = document.getElementById('quizFinishCard');
    const finalScoreEl = document.getElementById('quizFinalScore');

    if (quizCard) quizCard.classList.add('hidden');
    if (quizFinishCard) quizFinishCard.classList.remove('hidden');
    if (finalScoreEl) finalScoreEl.textContent = state.quizScore;

    playSound('fanfare');
    if (typeof confetti === 'function') {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
    }
  }

  function restartQuiz() {
    const quizCard = document.getElementById('quizActiveCard');
    const quizFinishCard = document.getElementById('quizFinishCard');
    if (quizCard) quizCard.classList.remove('hidden');
    if (quizFinishCard) quizFinishCard.classList.add('hidden');
    initQuiz();
  }

  // Xuất file Excel
  function openExportModal() {
    const modal = document.getElementById('exportModal');
    if (modal) modal.classList.remove('hidden');
  }

  function closeExportModal() {
    const modal = document.getElementById('exportModal');
    if (modal) modal.classList.add('hidden');
  }

  async function executeExport() {
    const btn = document.getElementById('btnExecuteExport');
    const origText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Đang tạo file Excel...`;

    try {
      const title = document.getElementById('exportTitle')?.value || 'BÀI TẬP TỰ ĐỘNG CHẤM ĐIỂM';
      const subtitle = document.getElementById('exportSubtitle')?.value || 'Luyện tập từ vựng tương tác | Nhập đáp án vào ô màu vàng';
      const author = document.getElementById('exportAuthor')?.value || 'Biên soạn bởi: Vocab Studio Pro | Hotline/Zalo: 09xx.xxx.xxx';
      const themeKey = document.getElementById('exportTheme')?.value || 'slate';
      const mode = document.getElementById('exportMode')?.value || 'exam';
      const protectSheet = document.getElementById('exportProtect')?.checked ?? true;
      const password = document.getElementById('exportPassword')?.value || '';
      const showStandardAnswerCol = document.getElementById('exportShowAnswers')?.checked ?? true;

      const result = await ExcelEngine.generateWorkbook({
        title,
        subtitle,
        author,
        themeKey,
        mode,
        protectSheet,
        password,
        showStandardAnswerCol,
        columns: state.columns,
        rows: state.rows
      });

      closeExportModal();
      alert(`🎉 Đã xuất file thành công: "${result.fileName}" (${result.totalQuestions} câu hỏi)!\nBạn có thể mở bằng Excel, WPS Office hoặc tải lên Google Sheets.`);
    } catch (err) {
      alert('Lỗi xuất file Excel: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = origText;
      if (window.lucide) window.lucide.createIcons();
    }
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  return {
    init,
    state,
    speakWord: speak,
    loadSampleDataset,
    switchTab,
    editColumnTitle,
    deleteColumn,
    changeColumnRole,
    addNewColumn,
    addNewRow,
    updateCellValue,
    deleteSingleRow,
    toggleSelectRow,
    deleteSelectedRows,
    shuffleRows,
    resetRows,
    pickRandomRows,
    handleLiveInput,
    toggleLiveMode,
    submitLiveExam,
    resetLiveExam,
    toggleFlashcardFlip,
    prevFlashcard,
    nextFlashcard,
    shuffleFlashcards,
    chooseQuizOption,
    nextQuizQuestion,
    restartQuiz,
    openExportModal,
    closeExportModal,
    executeExport
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
