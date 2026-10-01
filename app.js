/**
 * VOCAB STUDIO PRO - SPREADSHEET ENGINE & CONTROLLER (V2.1 REFACTORED)
 * Quét dữ liệu tự do, quản lý Mã Từ hàng ngang, xóa hàng/cột, Test thử trực tiếp, xuất Excel chuẩn
 */

// Bộ dữ liệu mẫu thực tế chuẩn nhiều cột (Tiếng Trung, Anh, Nhật)
const SAMPLE_DATASETS = {
  chinese: {
    name: 'Tiếng Trung HSK 3 (Hán tự • Pinyin • Nghĩa • Câu ví dụ • Pinyin câu • Dịch câu)',
    delimiter: '\t',
    columns: ['Hán tự', 'Pinyin', 'Nghĩa tiếng Việt', 'Câu tiếng Trung', 'Pinyin câu', 'Dịch nghĩa câu'],
    targetIndex: 0, // Mặc định gõ Hán tự (nhập pinyin ra hán tự)
    text: `苹果\tpíngguǒ\tquả táo\t我非常喜欢吃苹果。\tWǒ fēicháng xǐhuan chī píngguǒ.\tTôi rất thích ăn táo.
满意\tmǎnyì\thài lòng\t经理对他的工作很满意。\tJīnglǐ duì tā de gōngzuò hěn mǎnyì.\tGiám đốc rất hài lòng với công việc của anh ấy.
照顾\tzhàogù\tchăm sóc\t生病的时候要好好照顾自己。\tShēngbìng de shíhou yào hǎohǎo zhàogù zìjǐ.\tKhi bị ốm phải chăm sóc bản thân thật tốt.
方便\tfāngbiàn\ttiện lợi / thuận tiện\t这里的交通非常方便。\tZhèlǐ de jiāotōng fēicháng fāngbiàn.\tGiao thông ở đây rất thuận tiện.
清楚\tqīngchu\trõ ràng\t这个问题你听清楚了吗？\tZhè ge wèntí nǐ tīng qīngchu le ma?\tCâu hỏi này bạn đã nghe rõ chưa?
努力\tnǔlì\tcố gắng / nỗ lực\t只有努力学习才能取得好成绩。\tZhǐyǒu nǔlì xuéxí cái néng qǔdé hǎo chéngjì.\tChỉ có nỗ lực học tập mới đạt được thành tích tốt.`
  },
  english: {
    name: 'Tiếng Anh IELTS C1 (Từ vựng • Phiên âm IPA • Từ loại • Nghĩa tiếng Việt • Câu ví dụ)',
    delimiter: '\t',
    columns: ['Từ vựng', 'Phiên âm IPA', 'Từ loại', 'Nghĩa tiếng Việt', 'Câu ví dụ'],
    targetIndex: 0,
    text: `Abundant\t/əˈbʌndənt/\t(adj)\tdồi dào, phong phú\tThe country has abundant natural resources.
Mitigate\t/ˈmɪtɪɡeɪt/\t(v)\tlàm giảm nhẹ, làm dịu\tMeasures were taken to mitigate the risks.
Substantial\t/səbˈstænʃəl/\t(adj)\tđáng kể, quan trọng\tA substantial amount of funding was provided.
Ambiguous\t/æmˈbɪɡjuəs/\t(adj)\tmơ hồ, không rõ ràng\tThe instructions were ambiguous and confusing.
Scrutinize\t/ˈskruːtənaɪz/\t(v)\txem xét kỹ lưỡng\tEvery detail was carefully scrutinized.`
  },
  japanese: {
    name: 'Tiếng Nhật JLPT (Kanji • Hiragana • Nghĩa tiếng Việt • Ví dụ)',
    delimiter: '\t',
    columns: ['Kanji', 'Hiragana', 'Nghĩa tiếng Việt', 'Câu ví dụ'],
    targetIndex: 0,
    text: `約束\tやくそく\tlời hứa, cuộc hẹn\t友達と約束があります。
案内\tあんない\thướng dẫn, dẫn đường\t京都の町を案内します。
複雑\tふくざつ\tphức tạp\tこの文法は少し複雑です。
大切\tたいせつ\tquan trọng, quý giá\t健康はとても大切です。`
  }
};

const App = (function () {
  'use strict';

  // Trạng thái ứng dụng
  const state = {
    columns: [],
    rows: [],
    originalRows: [],
    selectedRowIndices: new Set(),
    activeTab: 'editor', // 'editor' | 'test'
    targetColKey: null,
    testInputs: {},
    ttsLang: 'auto'
  };

  // Web Audio Context cho hiệu ứng âm thanh
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioClass = window.AudioContext || window.webkitAudioContext;
      if (AudioClass) audioCtx = new AudioClass();
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
        osc1.type = 'sine'; osc2.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now);
        osc1.frequency.setValueAtTime(880, now + 0.08);
        osc2.frequency.setValueAtTime(880, now);
        osc2.frequency.setValueAtTime(1174.66, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc1.connect(gain); osc2.connect(gain); gain.connect(ctx.destination);
        osc1.start(now); osc2.start(now);
        osc1.stop(now + 0.35); osc2.stop(now + 0.35);
      } else if (type === 'wrong') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(190, now);
        osc.frequency.setValueAtTime(130, now + 0.12);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.25);
      } else if (type === 'celebrate') {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.12, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start(now + i * 0.08); osc.stop(now + i * 0.08 + 0.3);
        });
      }
    } catch (e) {
      console.warn(e);
    }
  }

  // Web Speech TTS
  function speak(text) {
    if (!('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text.trim());
    let lang = state.ttsLang;
    if (lang === 'auto') {
      if (/[\u4e00-\u9fff]/.test(text)) lang = 'zh-CN';
      else if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) lang = 'ja-JP';
      else if (/[\uac00-\ud7af]/.test(text)) lang = 'ko-KR';
      else if (/[a-zA-Z]/.test(text)) lang = 'en-US';
      else lang = 'vi-VN';
    }
    utt.lang = lang;
    utt.rate = 0.95;
    window.speechSynthesis.speak(utt);
  }

  function init() {
    loadSampleDataset('chinese');
    bindEvents();
    renderAll();
    if (window.lucide) window.lucide.createIcons();
  }

  function loadSampleDataset(key) {
    const sample = SAMPLE_DATASETS[key];
    if (!sample) return;

    const lines = sample.text.split(/\r?\n/).filter(l => l.trim().length > 0);
    const parsedMatrix = lines.map(line => line.split(sample.delimiter).map(c => c.trim()));

    // Khởi tạo danh sách cột: Tên cột giữ nguyên hoặc để trống, không tự chọn sai vai trò
    state.columns = sample.columns.map((colName, idx) => ({
      id: `col_${Date.now()}_${idx}`,
      key: `col_${idx}`,
      title: colName || `Cột ${idx + 1}`,
      isTarget: idx === sample.targetIndex
    }));

    state.targetColKey = state.columns[sample.targetIndex]?.key || state.columns[0]?.key;

    // Gán dữ liệu từng dòng kèm Mã Từ định danh hàng ngang (ID-001, ID-002...)
    state.rows = parsedMatrix.map((rowArr, rIdx) => {
      const code = `ID-${String(rIdx + 1).padStart(3, '0')}`;
      const rowObj = {
        id: rIdx + 1,
        code: code
      };
      state.columns.forEach((col, cIdx) => {
        rowObj[col.key] = rowArr[cIdx] || '';
      });
      return rowObj;
    });

    state.originalRows = JSON.parse(JSON.stringify(state.rows));
    state.selectedRowIndices.clear();
    state.testInputs = {};

    renderAll();
  }

  function bindEvents() {
    document.querySelectorAll('[data-sheet-tab]').forEach(tabBtn => {
      tabBtn.addEventListener('click', (e) => {
        const tab = e.currentTarget.dataset.sheetTab;
        switchTab(tab);
      });
    });

    document.getElementById('ttsLangSelect')?.addEventListener('change', (e) => {
      state.ttsLang = e.target.value;
    });

    document.querySelectorAll('[data-load-sample]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        loadSampleDataset(e.currentTarget.dataset.loadSample);
      });
    });

    document.getElementById('btnOpenImportModal')?.addEventListener('click', openImportModal);
    document.getElementById('btnCloseImportModal')?.addEventListener('click', closeImportModal);
    document.getElementById('btnConfirmImport')?.addEventListener('click', confirmImport);
    document.getElementById('importTextarea')?.addEventListener('input', updateImportPreview);
    document.querySelectorAll('input[name="importDelim"]').forEach(r => {
      r.addEventListener('change', updateImportPreview);
    });

    document.getElementById('btnAddRow')?.addEventListener('click', addNewRow);
    document.getElementById('btnAddCol')?.addEventListener('click', addNewCol);
    document.getElementById('btnDeleteSelectedRows')?.addEventListener('click', deleteSelectedRows);
    document.getElementById('btnShuffleRows')?.addEventListener('click', shuffleRows);
    document.getElementById('btnResetRows')?.addEventListener('click', resetRows);
    document.getElementById('btnOpenTargetColModal')?.addEventListener('click', openTargetColModal);
    document.getElementById('selectAllRowsCheckbox')?.addEventListener('change', toggleSelectAllRows);
    document.getElementById('gridSearchInput')?.addEventListener('input', handleSearch);

    document.getElementById('btnCloseTargetModal')?.addEventListener('click', closeTargetColModal);
    document.getElementById('btnConfirmTargetCol')?.addEventListener('click', confirmTargetCol);
    document.getElementById('btnResetTest')?.addEventListener('click', resetTestInputs);

    document.getElementById('btnOpenExportModal')?.addEventListener('click', openExportModal);
    document.getElementById('btnCloseExportModal')?.addEventListener('click', closeExportModal);
    document.getElementById('btnExecuteExport')?.addEventListener('click', executeExport);
  }

  function switchTab(tab) {
    state.activeTab = tab;
    document.querySelectorAll('[data-sheet-tab]').forEach(b => {
      const isAct = b.dataset.sheetTab === tab;
      b.classList.toggle('active', isAct);
    });
    document.querySelectorAll('.sheet-view').forEach(v => v.classList.add('hidden'));
    const targetView = document.getElementById(`view_${tab}`);
    if (targetView) targetView.classList.remove('hidden');

    if (tab === 'test') {
      renderTestSheet();
    }

    if (window.lucide) window.lucide.createIcons();
  }

  function renderAll() {
    renderStatsHeader();
    renderSpreadsheetGrid();
    if (state.activeTab === 'test') renderTestSheet();
    if (window.lucide) window.lucide.createIcons();
  }

  function renderStatsHeader() {
    const totalEl = document.getElementById('statTotalRows');
    const colCountEl = document.getElementById('statTotalCols');
    const targetNameEl = document.getElementById('statTargetColName');

    if (totalEl) totalEl.textContent = state.rows.length;
    if (colCountEl) colCountEl.textContent = state.columns.length;

    const targetCol = state.columns.find(c => c.key === state.targetColKey);
    if (targetNameEl) {
      targetNameEl.textContent = targetCol ? targetCol.title : 'Chưa chọn';
    }
  }

  // ==========================================
  // SHEET 1: BẢNG TÍNH & BIÊN TẬP DỮ LIỆU
  // ==========================================
  function renderSpreadsheetGrid(filteredRows = null) {
    const thead = document.getElementById('gridThead');
    const tbody = document.getElementById('gridTbody');
    if (!thead || !tbody) return;

    const displayRows = filteredRows || state.rows;

    let headerRow = `
      <tr>
        <th class="excel-col-header w-10 px-2 py-2">
          <input type="checkbox" id="selectAllRowsCheckbox" class="rounded border-gray-300 text-emerald-600 focus:ring-0 cursor-pointer">
        </th>
        <th class="excel-col-header w-12 px-2 py-2">STT</th>
        <th class="excel-col-header w-24 px-3 py-2 bg-slate-100 font-mono text-slate-600">Mã Từ (ID)</th>
    `;

    state.columns.forEach((col, idx) => {
      const isTarget = col.key === state.targetColKey;
      const colLetter = String.fromCharCode(68 + idx);
      headerRow += `
        <th class="excel-col-header px-3 py-2 min-w-[180px] ${isTarget ? 'bg-emerald-50 border-emerald-300' : ''}">
          <div class="flex items-center justify-between gap-1 text-[11px] text-gray-500 font-mono mb-1">
            <span>Cột ${colLetter}</span>
            <button onclick="App.deleteCol('${col.id}')" class="text-gray-400 hover:text-red-500 p-0.5 rounded" title="Xóa cột này">
              <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
          </div>
          <div class="flex items-center gap-1.5">
            <input type="text" value="${escapeHtml(col.title)}" onblur="App.renameCol('${col.id}', this.value)" placeholder="Tên cột (để trống nếu muốn)" class="w-full text-xs font-bold text-gray-800 bg-white border border-gray-200 px-2 py-1 rounded focus:border-emerald-500 outline-none">
          </div>
          <div class="mt-1 flex items-center justify-between">
            ${isTarget 
              ? `<span class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full"><i data-lucide="check-circle" class="w-3 h-3"></i> Đáp án chuẩn</span>`
              : `<button onclick="App.setAsTargetCol('${col.key}')" class="text-[10px] text-gray-500 hover:text-emerald-700 underline font-medium">Đặt làm đáp án</button>`
            }
          </div>
        </th>
      `;
    });

    headerRow += `
        <th class="excel-col-header w-16 px-2 py-2">Thao tác</th>
      </tr>
    `;
    thead.innerHTML = headerRow;

    if (displayRows.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="${state.columns.length + 4}" class="py-12 text-center text-gray-400">
            <i data-lucide="file-spreadsheet" class="w-10 h-10 mx-auto mb-2 text-gray-300"></i>
            <p class="text-sm font-medium">Chưa có dữ liệu từ vựng nào. Hãy dán dữ liệu vào hoặc nạp mẫu có sẵn ở trên!</p>
          </td>
        </tr>
      `;
      return;
    }

    let bodyHtml = '';
    displayRows.forEach((row, rIdx) => {
      const isSelected = state.selectedRowIndices.has(rIdx);
      bodyHtml += `
        <tr class="hover:bg-slate-50 transition-colors ${isSelected ? 'excel-row-selected' : ''}">
          <td class="excel-row-header text-center">
            <input type="checkbox" onchange="App.toggleSelectRow(${rIdx})" ${isSelected ? 'checked' : ''} class="rounded border-gray-300 text-emerald-600 focus:ring-0 cursor-pointer">
          </td>
          <td class="excel-row-header text-center">${rIdx + 1}</td>
          <td class="px-3 py-1.5 font-mono text-xs text-slate-500 text-center font-bold bg-slate-50/50">
            ${escapeHtml(row.code || `ID-${String(rIdx + 1).padStart(3, '0')}`)}
          </td>
      `;

      state.columns.forEach(col => {
        const val = row[col.key] || '';
        const isTarget = col.key === state.targetColKey;
        bodyHtml += `
          <td class="px-0 py-0 ${isTarget ? 'bg-emerald-50/30' : ''}">
            <input type="text" value="${escapeHtml(val)}" onblur="App.updateCell(${row.id}, '${col.key}', this.value)" class="excel-cell-input ${isTarget ? 'font-semibold text-emerald-950' : ''}">
          </td>
        `;
      });

      bodyHtml += `
          <td class="text-center px-2 py-1">
            <button onclick="App.deleteSingleRow(${row.id})" class="text-gray-400 hover:text-red-500 p-1 transition-colors" title="Xóa dòng này">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = bodyHtml;
  }

  function updateCell(rowId, colKey, val) {
    const row = state.rows.find(r => r.id === rowId);
    if (row) {
      row[colKey] = val;
    }
  }

  function renameCol(colId, newTitle) {
    const col = state.columns.find(c => c.id === colId);
    if (col) {
      col.title = newTitle.trim();
    }
  }

  function deleteCol(colId) {
    if (state.columns.length <= 1) {
      alert('Bảng tính cần giữ lại ít nhất 1 cột.');
      return;
    }
    if (confirm('Bạn có chắc chắn muốn xóa cột này?')) {
      const colToRemove = state.columns.find(c => c.id === colId);
      state.columns = state.columns.filter(c => c.id !== colId);
      if (colToRemove && colToRemove.key === state.targetColKey) {
        state.targetColKey = state.columns[0]?.key || null;
      }
      renderAll();
    }
  }

  function addNewCol() {
    const newIdx = state.columns.length;
    const newKey = `col_${Date.now()}`;
    state.columns.push({
      id: `col_${Date.now()}`,
      key: newKey,
      title: `Cột ${newIdx + 1}`,
      isTarget: false
    });
    state.rows.forEach(r => {
      r[newKey] = '';
    });
    renderAll();
  }

  function addNewRow() {
    const newId = state.rows.length > 0 ? Math.max(...state.rows.map(r => r.id)) + 1 : 1;
    const code = `ID-${String(state.rows.length + 1).padStart(3, '0')}`;
    const newRow = { id: newId, code: code };
    state.columns.forEach(c => {
      newRow[c.key] = '';
    });
    state.rows.push(newRow);
    renderAll();
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
    renderSpreadsheetGrid();
    if (window.lucide) window.lucide.createIcons();
  }

  function toggleSelectAllRows(e) {
    if (e.target.checked) {
      state.selectedRowIndices = new Set(state.rows.map((_, i) => i));
    } else {
      state.selectedRowIndices.clear();
    }
    renderSpreadsheetGrid();
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

  // TRỘN HÀNG NGANG (Fisher-Yates) - KHÔNG ĐẢO CỘT DỌC
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

  function setAsTargetCol(colKey) {
    state.targetColKey = colKey;
    state.columns.forEach(c => {
      c.isTarget = c.key === colKey;
    });
    renderAll();
  }

  function openTargetColModal() {
    const modal = document.getElementById('targetColModal');
    const select = document.getElementById('targetColSelect');
    if (!modal || !select) return;

    select.innerHTML = state.columns.map((c, i) => `
      <option value="${c.key}" ${c.key === state.targetColKey ? 'selected' : ''}>
        Cột ${String.fromCharCode(68 + i)}: ${escapeHtml(c.title || 'Dữ liệu')}
      </option>
    `).join('');

    modal.classList.remove('hidden');
  }

  function closeTargetColModal() {
    document.getElementById('targetColModal')?.classList.add('hidden');
  }

  function confirmTargetCol() {
    const select = document.getElementById('targetColSelect');
    if (select && select.value) {
      setAsTargetCol(select.value);
      closeTargetColModal();
    }
  }

  function handleSearch(e) {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
      renderSpreadsheetGrid();
      return;
    }
    const filtered = state.rows.filter(row => {
      return Object.values(row).some(v => String(v).toLowerCase().includes(q));
    });
    renderSpreadsheetGrid(filtered);
    if (window.lucide) window.lucide.createIcons();
  }

  // ==========================================
  // SHEET 2: LÀM TEST THỬ TRƯỚC KHI XUẤT FILE
  // ==========================================
  function renderTestSheet() {
    const container = document.getElementById('testSheetContainer');
    if (!container) return;

    const targetCol = state.columns.find(c => c.key === state.targetColKey);
    if (!targetCol) {
      container.innerHTML = `<div class="p-8 text-center text-amber-600 bg-amber-50 rounded-xl border border-amber-200">Vui lòng chỉ định cột Đáp án chuẩn trước khi làm test thử.</div>`;
      return;
    }

    let correctCount = 0;
    let answeredCount = 0;
    const totalCount = state.rows.length;

    let tableHtml = `
      <div class="overflow-x-auto bg-white border border-gray-200 rounded-xl shadow-sm">
        <table class="excel-grid">
          <thead>
            <tr>
              <th class="excel-col-header w-12 px-2 py-2">STT</th>
              <th class="excel-col-header w-24 px-3 py-2 bg-slate-100 font-mono text-slate-600">Mã Từ</th>
    `;

    state.columns.forEach(col => {
      const isTarget = col.key === state.targetColKey;
      tableHtml += `
        <th class="excel-col-header px-4 py-2 min-w-[160px] ${isTarget ? 'bg-emerald-50 text-emerald-800' : ''}">
          ${escapeHtml(col.title)}
          ${isTarget ? ' (Đáp án ẩn)' : ''}
        </th>
      `;
    });

    tableHtml += `
              <th class="excel-col-header px-4 py-2 min-w-[200px] bg-yellow-50 text-yellow-800 font-bold border-l-2 border-yellow-400">
                Ô Làm Bài (Gõ Đáp Án)
              </th>
              <th class="excel-col-header px-4 py-2 w-28 text-center bg-gray-100">
                Kết Quả Chấm
              </th>
            </tr>
          </thead>
          <tbody>
    `;

    state.rows.forEach((row, idx) => {
      const userVal = (state.testInputs[row.id] || '').trim();
      const targetVal = String(row[targetCol.key] || '').trim();
      const isFilled = userVal.length > 0;
      if (isFilled) answeredCount++;

      const acceptedAnswers = targetVal.split('|').map(s => s.trim().toLowerCase());
      const isCorrect = acceptedAnswers.includes(userVal.toLowerCase());
      if (isCorrect) correctCount++;

      let resultBadge = `<span class="text-xs text-gray-400">-</span>`;
      let inputBorderClass = 'border-gray-200';

      if (isFilled) {
        if (isCorrect) {
          resultBadge = `<span class="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs"><i data-lucide="check" class="w-3.5 h-3.5"></i> ĐÚNG</span>`;
          inputBorderClass = 'bg-emerald-50/50 border-emerald-400 text-emerald-900';
        } else {
          resultBadge = `<span class="inline-flex items-center gap-1 text-red-600 font-bold text-xs"><i data-lucide="x" class="w-3.5 h-3.5"></i> SAI</span>`;
          inputBorderClass = 'bg-red-50/50 border-red-300 text-red-900';
        }
      }

      tableHtml += `
        <tr class="hover:bg-slate-50 transition-colors">
          <td class="excel-row-header text-center">${idx + 1}</td>
          <td class="px-3 py-2 font-mono text-xs text-slate-500 text-center font-bold bg-slate-50/40">
            ${escapeHtml(row.code || `ID-${String(idx + 1).padStart(3, '0')}`)}
          </td>
      `;

      state.columns.forEach(col => {
        const val = row[col.key] || '';
        const isTarget = col.key === state.targetColKey;
        tableHtml += `
          <td class="px-3 py-2 text-sm text-gray-800 ${isTarget ? 'bg-emerald-50/20 font-medium' : ''}">
            <div class="flex items-center justify-between gap-1">
              <span>${escapeHtml(val)}</span>
              ${val ? `<button onclick="App.speakText('${escapeHtml(val)}')" class="text-gray-300 hover:text-emerald-600 p-0.5" title="Nghe phát âm"><i data-lucide="volume-2" class="w-3.5 h-3.5"></i></button>` : ''}
            </div>
          </td>
        `;
      });

      tableHtml += `
          <td class="px-2 py-1 cell-student-input border-l-2 border-yellow-300">
            <input type="text" value="${escapeHtml(state.testInputs[row.id] || '')}" oninput="App.handleTestInput(${row.id}, this.value)" placeholder="Gõ từ vựng / pinyin / hán tự..." class="w-full text-sm px-3 py-1.5 rounded bg-white border ${inputBorderClass} outline-none focus:ring-1 focus:ring-yellow-500 font-semibold text-gray-900">
          </td>
          <td class="px-3 py-2 text-center ${isFilled ? (isCorrect ? 'cell-result-correct' : 'cell-result-wrong') : ''}">
            ${resultBadge}
          </td>
        </tr>
      `;
    });

    tableHtml += `</tbody></table></div>`;
    container.innerHTML = tableHtml;

    const scoreVal = totalCount > 0 ? ((correctCount / totalCount) * 10).toFixed(1) : 0;
    const progressPct = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

    document.getElementById('testKpiTotal').textContent = totalCount;
    document.getElementById('testKpiDone').textContent = answeredCount;
    document.getElementById('testKpiCorrect').textContent = correctCount;
    document.getElementById('testKpiWrong').textContent = answeredCount - correctCount;
    document.getElementById('testKpiScore').textContent = scoreVal;
    document.getElementById('testKpiProgress').textContent = `${progressPct}%`;

    if (totalCount > 0 && correctCount === totalCount && answeredCount === totalCount) {
      playSound('celebrate');
      if (typeof confetti === 'function') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    }

    if (window.lucide) window.lucide.createIcons();
  }

  function handleTestInput(rowId, val) {
    state.testInputs[rowId] = val;
    renderTestSheet();
  }

  function resetTestInputs() {
    state.testInputs = {};
    renderTestSheet();
  }

  // ==========================================
  // PARSER MODAL (QUÉT DỮ LIỆU)
  // ==========================================
  function openImportModal() {
    const modal = document.getElementById('importModal');
    if (modal) modal.classList.remove('hidden');
    document.getElementById('importTextarea').value = '';
    document.getElementById('importPreviewArea').innerHTML = '<p class="text-xs text-gray-400 py-6 text-center italic">Dán văn bản vào khung trên để xem bảng chia cột...</p>';
  }

  function closeImportModal() {
    document.getElementById('importModal')?.classList.add('hidden');
  }

  function updateImportPreview() {
    const text = document.getElementById('importTextarea')?.value || '';
    if (!text.trim()) {
      document.getElementById('importPreviewArea').innerHTML = '<p class="text-xs text-gray-400 py-6 text-center italic">Dán văn bản vào khung trên để xem bảng chia cột...</p>';
      return;
    }

    const delimRadio = document.querySelector('input[name="importDelim"]:checked');
    let delim = delimRadio ? delimRadio.value : '\t';
    if (delim === 'spaces') delim = /\s{2,}/;

    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0).slice(0, 10);
    const parsed = lines.map(l => l.split(delim).map(c => c.trim()));
    const colCount = Math.max(...parsed.map(r => r.length));

    let html = `<div class="overflow-x-auto max-h-56 border border-gray-200 rounded-lg"><table class="excel-grid"><thead><tr>`;
    for (let c = 0; c < colCount; c++) {
      html += `
        <th class="excel-col-header px-3 py-2">
          <input type="text" id="previewColName_${c}" value="Cột ${c + 1}" class="text-xs font-bold text-gray-800 bg-white border border-gray-200 px-2 py-1 rounded w-full">
        </th>
      `;
    }
    html += `</tr></thead><tbody>`;

    parsed.slice(0, 5).forEach(rowArr => {
      html += `<tr>`;
      for (let c = 0; c < colCount; c++) {
        html += `<td class="px-2 py-1.5 text-xs text-gray-700 truncate max-w-[140px]">${escapeHtml(rowArr[c] || '')}</td>`;
      }
      html += `</tr>`;
    });
    html += `</tbody></table></div>`;

    document.getElementById('importPreviewArea').innerHTML = html;
  }

  function confirmImport() {
    const text = document.getElementById('importTextarea')?.value || '';
    if (!text.trim()) {
      alert('Vui lòng dán dữ liệu từ vựng.');
      return;
    }

    const delimRadio = document.querySelector('input[name="importDelim"]:checked');
    let delim = delimRadio ? delimRadio.value : '\t';
    if (delim === 'spaces') delim = /\s{2,}/;

    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    const parsedMatrix = lines.map(l => l.split(delim).map(c => c.trim()));
    const colCount = Math.max(...parsedMatrix.map(r => r.length));

    const newColumns = [];
    for (let c = 0; c < colCount; c++) {
      const inputEl = document.getElementById(`previewColName_${c}`);
      const title = inputEl ? inputEl.value.trim() : `Cột ${c + 1}`;
      newColumns.push({
        id: `col_${Date.now()}_${c}`,
        key: `col_${c}`,
        title: title || `Cột ${c + 1}`,
        isTarget: c === 0
      });
    }

    state.columns = newColumns;
    state.targetColKey = newColumns[0]?.key;

    state.rows = parsedMatrix.map((rowArr, idx) => {
      const code = `ID-${String(idx + 1).padStart(3, '0')}`;
      const rowObj = { id: idx + 1, code: code };
      newColumns.forEach((col, cIdx) => {
        rowObj[col.key] = rowArr[cIdx] || '';
      });
      return rowObj;
    });

    state.originalRows = JSON.parse(JSON.stringify(state.rows));
    state.selectedRowIndices.clear();
    state.testInputs = {};

    closeImportModal();
    renderAll();
  }

  // ==========================================
  // XUẤT FILE EXCEL (.XLSX)
  // ==========================================
  function openExportModal() {
    const modal = document.getElementById('exportModal');
    if (modal) modal.classList.remove('hidden');

    const targetCol = state.columns.find(c => c.key === state.targetColKey);
    const badge = document.getElementById('exportTargetColInfo');
    if (badge && targetCol) {
      badge.textContent = `Đáp án đối chiếu: [${targetCol.title}]`;
    }
  }

  function closeExportModal() {
    document.getElementById('exportModal')?.classList.add('hidden');
  }

  async function executeExport() {
    const btn = document.getElementById('btnExecuteExport');
    const origText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Đang tạo file Excel...`;

    try {
      const title = document.getElementById('exportTitle')?.value || 'BÀI TẬP TỰ ĐỘNG CHẤM ĐIỂM';
      const subtitle = document.getElementById('exportSubtitle')?.value || 'Luyện tập tương tác • Nhập đáp án vào cột màu vàng';
      const author = document.getElementById('exportAuthor')?.value || 'Biên soạn bởi: Vocab Studio Pro • Hotline/Zalo: 09xx.xxx.xxx';
      const themeKey = document.getElementById('exportTheme')?.value || 'excelGreen';
      const protectSheet = document.getElementById('exportProtect')?.checked ?? true;
      const password = document.getElementById('exportPassword')?.value || '';

      const result = await ExcelEngine.generateWorkbook({
        title,
        subtitle,
        author,
        themeKey,
        targetColKey: state.targetColKey,
        protectSheet,
        password,
        columns: state.columns,
        rows: state.rows
      });

      closeExportModal();
      alert(`🎉 Đã xuất file Excel thành công: "${result.fileName}" (${result.totalQuestions} câu)!\nFile mở tốt 100% trên Excel, WPS Office và Google Sheets.`);
    } catch (err) {
      alert('Lỗi xuất file: ' + err.message);
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
    speakText: speak,
    loadSampleDataset,
    switchTab,
    renameCol,
    deleteCol,
    addNewCol,
    addNewRow,
    updateCell,
    deleteSingleRow,
    toggleSelectRow,
    deleteSelectedRows,
    shuffleRows,
    resetRows,
    setAsTargetCol,
    openTargetColModal,
    closeTargetColModal,
    confirmTargetCol,
    handleTestInput,
    resetTestInputs,
    openImportModal,
    closeImportModal,
    confirmImport,
    openExportModal,
    closeExportModal,
    executeExport
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
