/**
 * VOCAB STUDIO PRO - EXCEL ENGINE
 * Professional, Macro-Free Interactive Excel Workbook Generator (.xlsx)
 * Powered by ExcelJS
 */

const ExcelEngine = (function () {
  'use strict';

  // Chuyển đổi số thứ tự cột sang chữ cái Excel (1 = A, 2 = B, 27 = AA...)
  function getColumnLetter(colIndex) {
    let temp = colIndex;
    let letter = '';
    while (temp > 0) {
      let mod = (temp - 1) % 26;
      letter = String.fromCharCode(65 + mod) + letter;
      temp = Math.floor((temp - mod) / 26);
    }
    return letter;
  }

  // Bảng phối màu hiện đại chuẩn SaaS Dashboard
  const THEMES = {
    slate: {
      name: 'Chuyên nghiệp (Slate Navy)',
      primary: 'FF1E293B',    // Navy slate đậm
      secondary: 'FF334155',  
      accent: 'FF3B82F6',     // Xanh dương
      headerText: 'FFFFFFFF',
      dashBg: 'FFF8FAFC',
      cardBg: 'FFFFFFFF',
      cardBorder: 'FFE2E8F0',
      inputBg: 'FFFEF9C3',    // Vàng kem mềm cho ô học sinh nhập
      inputBorder: 'FFF59E0B',
      correctBg: 'FFDCFCE7',  // Xanh lá mềm
      correctText: 'FF166534',
      wrongBg: 'FFFEE2E2',    // Đỏ mềm
      wrongText: 'FF991B1B',
      zebraBg: 'FFF8FAFC'
    },
    emerald: {
      name: 'Tươi sáng (Emerald)',
      primary: 'FF065F46',
      secondary: 'FF047857',
      accent: 'FF10B981',
      headerText: 'FFFFFFFF',
      dashBg: 'FFF0FDF4',
      cardBg: 'FFFFFFFF',
      cardBorder: 'FFBBF7D0',
      inputBg: 'FFFEF9C3',
      inputBorder: 'FFF59E0B',
      correctBg: 'FFDCFCE7',
      correctText: 'FF166534',
      wrongBg: 'FFFEE2E2',
      wrongText: 'FF991B1B',
      zebraBg: 'FFF9FAFB'
    },
    indigo: {
      name: 'Hiện đại (Royal Indigo)',
      primary: 'FF312E81',
      secondary: 'FF4338CA',
      accent: 'FF6366F1',
      headerText: 'FFFFFFFF',
      dashBg: 'FFE0E7FF',
      cardBg: 'FFFFFFFF',
      cardBorder: 'FFC7D2FE',
      inputBg: 'FFFEF9C3',
      inputBorder: 'FFF59E0B',
      correctBg: 'FFDCFCE7',
      correctText: 'FF166534',
      wrongBg: 'FFFEE2E2',
      wrongText: 'FF991B1B',
      zebraBg: 'FFF8FAFC'
    },
    amber: {
      name: 'Trang nhã (Warm Amber)',
      primary: 'FF78350F',
      secondary: 'FF92400E',
      accent: 'FFF59E0B',
      headerText: 'FFFFFFFF',
      dashBg: 'FFFFFBEB',
      cardBg: 'FFFFFFFF',
      cardBorder: 'FFFDE68A',
      inputBg: 'FFFEF9C3',
      inputBorder: 'FFF59E0B',
      correctBg: 'FFDCFCE7',
      correctText: 'FF166534',
      wrongBg: 'FFFEE2E2',
      wrongText: 'FF991B1B',
      zebraBg: 'FFFFFDF5'
    }
  };

  /**
   * Tạo và tải về workbook Excel tương tác tự động chấm điểm (.xlsx)
   */
  async function generateWorkbook(config) {
    if (typeof ExcelJS === 'undefined') {
      throw new Error('Thư viện ExcelJS chưa được tải. Vui lòng kiểm tra kết nối mạng.');
    }

    const {
      title = 'BÀI TẬP TỰ ĐỘNG CHẤM ĐIỂM - VOCAB STUDIO PRO',
      subtitle = 'Luyện tập từ vựng tương tác | Nhập đáp án vào ô màu vàng | Chấm điểm tự động',
      author = 'Biên soạn bởi: Vocab Studio Pro | Hotline/Zalo: 09xx.xxx.xxx',
      themeKey = 'slate',
      mode = 'exam', // 'exam' | 'practice' | 'hybrid'
      protectSheet = true,
      password = '',
      showStandardAnswerCol = true,
      columns = [],
      rows = []
    } = config;

    if (!rows || rows.length === 0) {
      throw new Error('Không có dữ liệu từ vựng để xuất Excel.');
    }

    const theme = THEMES[themeKey] || THEMES.slate;
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Vocab Studio Pro';
    wb.lastModifiedBy = author || 'Vocab Studio Pro';
    wb.created = new Date();
    wb.modified = new Date();

    const ws = wb.addWorksheet('Luyện Tập', {
      views: [{ showGridLines: true }]
    });

    // Xác định các cột vai trò
    const qCol = columns.find(c => c.role === 'q');
    const aCol = columns.find(c => c.role === 'a');
    const maskCol = columns.find(c => c.role === 'mask');
    const pinyinCol = columns.find(c => c.role === 'pinyin');
    const extraCol = columns.find(c => c.role === 'extra');

    if (!qCol || !aCol) {
      throw new Error('Cần ít nhất 1 cột Đề bài (q) và 1 cột Đáp án (a) để tạo bài tập.');
    }

    const colDefs = [];
    let currentIdx = 1;

    // Col A: Metadata ẩn (Dùng để phục hồi dữ liệu 100% khi nạp ngược lại)
    const colMeta = { id: 'meta', letter: getColumnLetter(currentIdx++), title: 'Metadata (Ẩn)', width: 8, hidden: true };
    colDefs.push(colMeta);

    // Col B: STT
    const colSTT = { id: 'stt', letter: getColumnLetter(currentIdx++), title: 'STT', width: 7 };
    colDefs.push(colSTT);

    // Col C: Đề bài
    const colQuestion = { id: 'q', letter: getColumnLetter(currentIdx++), title: qCol.title || 'Đề Bài', width: 26 };
    colDefs.push(colQuestion);

    // Optional Pinyin
    let colPinyin = null;
    if (pinyinCol) {
      colPinyin = { id: 'pinyin', letter: getColumnLetter(currentIdx++), title: pinyinCol.title || 'Phiên Âm / Pinyin', width: 22 };
      colDefs.push(colPinyin);
    }

    // Optional Ghi chú / Ví dụ
    let colExtra = null;
    if (extraCol) {
      colExtra = { id: 'extra', letter: getColumnLetter(currentIdx++), title: extraCol.title || 'Ghi Chú / Ví Dụ', width: 28 };
      colDefs.push(colExtra);
    }

    // Ô làm bài (Học sinh nhập)
    const colInput = { id: 'input', letter: getColumnLetter(currentIdx++), title: 'Ô Làm Bài (Học Sinh Nhập)', width: 26, isInput: true };
    colDefs.push(colInput);

    // Kết quả chấm
    const colResult = { id: 'result', letter: getColumnLetter(currentIdx++), title: 'Kết Quả Chấm', width: 16 };
    colDefs.push(colResult);

    // Ô che mở khóa (Scratch & Reveal)
    let colMask = null;
    if (maskCol) {
      colMask = { id: 'mask', letter: getColumnLetter(currentIdx++), title: maskCol.title || 'Ô Che Mở Khóa', width: 24 };
      colDefs.push(colMask);
    }

    // Cột Đáp án chuẩn (Tự mở khi nộp bài)
    let colStdAnswer = null;
    if (showStandardAnswerCol) {
      colStdAnswer = { id: 'std_answer', letter: getColumnLetter(currentIdx++), title: 'Đáp Án Chuẩn', width: 22 };
      colDefs.push(colStdAnswer);
    }

    // Cột Đáp án gốc (ẨN HOÀN TOÀN để chống gian lận)
    const colTargetAns = { id: 'target_ans', letter: getColumnLetter(currentIdx++), title: 'Đáp Án Gốc (Ẩn)', width: 10, hidden: true };
    colDefs.push(colTargetAns);

    // Cột Nội dung che gốc (Ẩn)
    let colTargetMask = null;
    if (maskCol) {
      colTargetMask = { id: 'target_mask', letter: getColumnLetter(currentIdx++), title: 'Nội Dung Che Gốc (Ẩn)', width: 10, hidden: true };
      colDefs.push(colTargetMask);
    }

    // Cấu hình thuộc tính cột cho Worksheet
    colDefs.forEach(cd => {
      const col = ws.getColumn(cd.letter);
      col.width = cd.width;
      if (cd.hidden) {
        col.hidden = true;
      }
    });

    const startRow = 6;
    const endRow = startRow + rows.length - 1;
    const lastVisibleColLetter = colDefs.filter(c => !c.hidden).slice(-1)[0].letter;

    // ==========================================
    // 1. BANNER & HEADER (ROWS 1 & 2)
    // ==========================================
    // Row 1: Tiêu đề chính
    ws.mergeCells(`B1:${lastVisibleColLetter}1`);
    const titleCell = ws.getCell('B1');
    titleCell.value = title.toUpperCase();
    titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: theme.headerText } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.primary } };
    ws.getRow(1).height = 34;

    // Row 2: Phụ đề & Watermark thương hiệu bán hàng
    ws.mergeCells(`B2:${lastVisibleColLetter}2`);
    const subtitleCell = ws.getCell('B2');
    subtitleCell.value = `${subtitle}  •  ${author}`;
    subtitleCell.font = { name: 'Segoe UI', size: 9.5, italic: true, color: { argb: 'FFE2E8F0' } };
    subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.secondary } };
    ws.getRow(2).height = 22;

    // ==========================================
    // 2. DASHBOARD THỐNG KÊ KPI (ROWS 3 & 4)
    // ==========================================
    ws.getRow(3).height = 42;
    ws.getRow(4).height = 18;

    function setupKpiCard(col, label, formulaOrVal, isFormula = true, customNumFormat = null) {
      const cell = ws.getCell(`${col}3`);
      if (isFormula) {
        cell.value = { formula: formulaOrVal };
      } else {
        cell.value = formulaOrVal;
      }
      if (customNumFormat) {
        cell.numFmt = customNumFormat;
      }
      cell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: theme.primary } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.dashBg } };
      cell.border = {
        top: { style: 'thin', color: { argb: theme.cardBorder } },
        bottom: { style: 'medium', color: { argb: theme.accent } },
        left: { style: 'thin', color: { argb: theme.cardBorder } },
        right: { style: 'thin', color: { argb: theme.cardBorder } }
      };

      const labelCell = ws.getCell(`${col}4`);
      labelCell.value = label;
      labelCell.font = { name: 'Segoe UI', size: 8, bold: true, color: { argb: 'FF64748B' } };
      labelCell.alignment = { vertical: 'middle', horizontal: 'center' };
      labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      labelCell.border = {
        top: { style: 'hair', color: { argb: theme.cardBorder } },
        bottom: { style: 'thin', color: { argb: theme.cardBorder } },
        left: { style: 'thin', color: { argb: theme.cardBorder } },
        right: { style: 'thin', color: { argb: theme.cardBorder } }
      };
    }

    // KPI 1: Tổng số câu
    const sttCol = colSTT.letter;
    setupKpiCard(sttCol, 'TỔNG CÂU', `COUNTA(${sttCol}${startRow}:${sttCol}${endRow})`);

    // KPI 2: Đã làm
    const inputCol = colInput.letter;
    setupKpiCard(colQuestion.letter, 'ĐÃ LÀM', `COUNTIF(${inputCol}${startRow}:${inputCol}${endRow},"<>")`);

    // KPI 3: Số câu Đúng
    const resultCol = colResult.letter;
    setupKpiCard(colResult.letter, 'SỐ CÂU ĐÚNG', `COUNTIF(${resultCol}${startRow}:${resultCol}${endRow},"*ĐÚNG*")`);

    // KPI 4: Điểm số hệ 10
    const totalRef = `${sttCol}3`;
    const correctRef = `${resultCol}3`;
    const scoreCellLetter = colMask ? colMask.letter : (colStdAnswer ? colStdAnswer.letter : inputCol);
    setupKpiCard(scoreCellLetter, 'ĐIỂM SỐ (10)', `IF(${totalRef}=0,0,ROUND((${correctRef}/${totalRef})*10,1))`, true, '0.0');

    // KPI 5: Trạng thái Nộp bài (Ô Dropdown tại góc phải Dashboard)
    const statusColLetter = lastVisibleColLetter;
    const statusCellRef = `${statusColLetter}3`;
    const statusCell = ws.getCell(statusCellRef);
    
    let defaultStatus = (mode === 'exam') ? 'Chưa nộp' : 'Luyện tập';
    statusCell.value = defaultStatus;
    statusCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFB45309' } };
    statusCell.alignment = { vertical: 'middle', horizontal: 'center' };
    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
    statusCell.border = {
      top: { style: 'medium', color: { argb: 'FFF59E0B' } },
      bottom: { style: 'medium', color: { argb: 'FFF59E0B' } },
      left: { style: 'medium', color: { argb: 'FFF59E0B' } },
      right: { style: 'medium', color: { argb: 'FFF59E0B' } }
    };

    const statusLabelCell = ws.getCell(`${statusColLetter}4`);
    statusLabelCell.value = (mode === 'exam') ? 'TRẠNG THÁI NỘP BÀI ▼' : 'CHẾ ĐỘ HỌC ▼';
    statusLabelCell.font = { name: 'Segoe UI', size: 8, bold: true, color: { argb: 'FF92400E' } };
    statusLabelCell.alignment = { vertical: 'middle', horizontal: 'center' };
    statusLabelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDE68A' } };

    // Dropdown Data Validation cho ô trạng thái
    if (mode === 'exam') {
      statusCell.dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: ['"Chưa nộp,Đã nộp"'],
        showErrorMessage: true,
        errorTitle: 'Chọn trạng thái',
        error: 'Vui lòng chọn "Chưa nộp" hoặc "Đã nộp" từ danh sách.'
      };
    } else {
      statusCell.dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: ['"Luyện tập,Kiểm tra"'],
        showErrorMessage: true,
        errorTitle: 'Chọn chế độ',
        error: 'Vui lòng chọn "Luyện tập" hoặc "Kiểm tra".'
      };
    }

    // Mở khóa ô trạng thái để học sinh đổi được khi Sheet bị Protect
    statusCell.protection = { locked: false };

    // Phủ nền các ô trống trên Row 3 & 4
    colDefs.forEach(cd => {
      if (!cd.hidden) {
        const c3 = ws.getCell(`${cd.letter}3`);
        if (!c3.value) {
          c3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.dashBg } };
          c3.border = {
            top: { style: 'thin', color: { argb: theme.cardBorder } },
            bottom: { style: 'thin', color: { argb: theme.cardBorder } }
          };
        }
        const c4 = ws.getCell(`${cd.letter}4`);
        if (!c4.value) {
          c4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
          c4.border = {
            top: { style: 'hair', color: { argb: theme.cardBorder } },
            bottom: { style: 'thin', color: { argb: theme.cardBorder } }
          };
        }
      }
    });

    // ==========================================
    // 3. TIÊU ĐỀ CỘT BẢNG (ROW 5)
    // ==========================================
    ws.getRow(5).height = 28;
    colDefs.forEach(cd => {
      const headerCell = ws.getCell(`${cd.letter}5`);
      headerCell.value = cd.title;
      headerCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: theme.headerText } };
      headerCell.alignment = { vertical: 'middle', horizontal: 'center' };
      headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cd.isInput ? theme.accent : theme.primary } };
      headerCell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };
    });

    // ==========================================
    // 4. DỮ LIỆU TỪNG DÒNG (ROWS 6 TRỞ ĐI)
    // ==========================================
    const targetAnsColLetter = colTargetAns.letter;
    const targetMaskColLetter = colTargetMask ? colTargetMask.letter : null;

    rows.forEach((row, idx) => {
      const r = startRow + idx;
      ws.getRow(r).height = 26;
      const zebraBg = idx % 2 === 1 ? theme.zebraBg : 'FFFFFFFF';

      // Col A: Hidden Metadata JSON (Phục hồi 100% khi nạp ngược lại vào web)
      const metaCell = ws.getCell(`${colMeta.letter}${r}`);
      metaCell.value = JSON.stringify({
        id: row.id || (idx + 1),
        q: row[qCol.key] || '',
        a: row[aCol.key] || '',
        mask: maskCol ? (row[maskCol.key] || '') : '',
        pinyin: pinyinCol ? (row[pinyinCol.key] || '') : '',
        extra: extraCol ? (row[extraCol.key] || '') : ''
      });

      // Col B: STT
      const sttCell = ws.getCell(`${colSTT.letter}${r}`);
      sttCell.value = idx + 1;
      sttCell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF64748B' } };
      sttCell.alignment = { vertical: 'middle', horizontal: 'center' };
      sttCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
      sttCell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      // Col C: Đề bài
      const qCell = ws.getCell(`${colQuestion.letter}${r}`);
      qCell.value = String(row[qCol.key] || '');
      qCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF0F172A' } };
      qCell.alignment = { vertical: 'middle', horizontal: 'left' };
      qCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
      qCell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      // Col D: Pinyin / Phiên âm (nếu có)
      if (colPinyin) {
        const pyCell = ws.getCell(`${colPinyin.letter}${r}`);
        pyCell.value = String(row[pinyinCol.key] || '');
        pyCell.font = { name: 'Segoe UI', size: 10.5, color: { argb: 'FF475569' } };
        pyCell.alignment = { vertical: 'middle', horizontal: 'left' };
        pyCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
        pyCell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      }

      // Col E: Ghi chú / Ví dụ (nếu có)
      if (colExtra) {
        const exCell = ws.getCell(`${colExtra.letter}${r}`);
        exCell.value = String(row[extraCol.key] || '');
        exCell.font = { name: 'Segoe UI', size: 9.5, italic: true, color: { argb: 'FF64748B' } };
        exCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        exCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
        exCell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      }

      // Cột Ẩn: Đáp án gốc
      const targetAnsCell = ws.getCell(`${targetAnsColLetter}${r}`);
      targetAnsCell.value = String(row[aCol.key] || '').trim();

      // Cột Ẩn: Nội dung che gốc
      if (colTargetMask && maskCol) {
        const targetMaskCell = ws.getCell(`${targetMaskColLetter}${r}`);
        targetMaskCell.value = String(row[maskCol.key] || '').trim();
      }

      // Col F: Ô Làm Bài (HỌC SINH NHẬP - ĐƯỢC PHÉP CHỈNH SỬA)
      const inCell = ws.getCell(`${colInput.letter}${r}`);
      inCell.value = '';
      inCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF1E293B' } };
      inCell.alignment = { vertical: 'middle', horizontal: 'left' };
      inCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.inputBg } };
      inCell.border = {
        top: { style: 'thin', color: { argb: theme.inputBorder } },
        bottom: { style: 'thin', color: { argb: theme.inputBorder } },
        left: { style: 'medium', color: { argb: theme.inputBorder } },
        right: { style: 'medium', color: { argb: theme.inputBorder } }
      };
      // Mở khóa cell này khi Sheet bị Protect:
      inCell.protection = { locked: false };

      // Col G: Công thức Kết Quả Chấm
      // Hỗ trợ không phân biệt hoa thường, nhiều đáp án phân cách bằng '|', cắt tỉa khoảng trắng
      const inRef = `${colInput.letter}${r}`;
      const tgtRef = `${targetAnsColLetter}${r}`;
      const matchFormula = `ISNUMBER(SEARCH("|"&LOWER(TRIM(${inRef}))&"|","|"&SUBSTITUTE(SUBSTITUTE(LOWER(TRIM(${tgtRef}))," |","|"),"| ","|")&"|"))`;

      let resultFormula = '';
      if (mode === 'exam') {
        // Trong chế độ kiểm tra: Khi "Chưa nộp" thì báo "⏳ Đã ghi nhận", khi "Đã nộp" mới bung kết quả Đúng/Sai
        resultFormula = `IF(${statusCellRef}="Chưa nộp",IF(${inRef}="","[Chưa làm]","⏳ Đã ghi nhận"),IF(${inRef}="","[Bỏ trống]",IF(${matchFormula},"✓ ĐÚNG","✗ SAI")))`;
      } else if (mode === 'hybrid') {
        resultFormula = `IF(${statusCellRef}="Kiểm tra",IF(${inRef}="","[Chưa làm]","⏳ Đã ghi nhận"),IF(${inRef}="","[Chưa làm]",IF(${matchFormula},"✓ ĐÚNG","✗ SAI")))`;
      } else {
        // Luyện tập tự do: Chấm tức thì thời gian thực
        resultFormula = `IF(${inRef}="","[Chưa làm]",IF(${matchFormula},"✓ ĐÚNG","✗ SAI"))`;
      }

      const resCell = ws.getCell(`${colResult.letter}${r}`);
      resCell.value = { formula: resultFormula };
      resCell.font = { name: 'Segoe UI', size: 10.5, bold: true, color: { argb: 'FF475569' } };
      resCell.alignment = { vertical: 'middle', horizontal: 'center' };
      resCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
      resCell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      // Col H: Công thức Ô Che Mở Khóa (Scratch & Reveal)
      if (colMask && colTargetMask) {
        const maskRef = `${targetMaskColLetter}${r}`;
        let maskFormula = '';
        if (mode === 'exam') {
          maskFormula = `IF(OR(${statusCellRef}="Đã nộp",AND(${inRef}<>"",${matchFormula})),${maskRef},"🔒 [Nhập đúng để mở]")`;
        } else {
          maskFormula = `IF(AND(${inRef}<>"",${matchFormula}),${maskRef},"🔒 [Nhập đúng để mở]")`;
        }

        const mCell = ws.getCell(`${colMask.letter}${r}`);
        mCell.value = { formula: maskFormula };
        mCell.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF334155' } };
        mCell.alignment = { vertical: 'middle', horizontal: 'left' };
        mCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
        mCell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      }

      // Col I: Đáp án chuẩn (Tự mở khi nộp bài)
      if (colStdAnswer) {
        const stdFormula = (mode === 'exam')
          ? `IF(${statusCellRef}="Đã nộp",${tgtRef},"🔒 [Nộp bài để xem]")`
          : `IF(AND(${inRef}<>"",${matchFormula}),${tgtRef},"🔒 [Làm đúng để xem]")`;

        const sCell = ws.getCell(`${colStdAnswer.letter}${r}`);
        sCell.value = { formula: stdFormula };
        sCell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF475569' } };
        sCell.alignment = { vertical: 'middle', horizontal: 'left' };
        sCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
        sCell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      }
    });

    // ==========================================
    // 5. CONDITIONAL FORMATTING (MÀU XANH / ĐỎ)
    // ==========================================
    try {
      ws.addConditionalFormatting({
        ref: `${colResult.letter}${startRow}:${colResult.letter}${endRow}`,
        rules: [
          {
            type: 'containsText',
            operator: 'containsText',
            text: 'ĐÚNG',
            style: {
              fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: theme.correctBg } },
              font: { color: { argb: theme.correctText }, bold: true }
            }
          },
          {
            type: 'containsText',
            operator: 'containsText',
            text: 'SAI',
            style: {
              fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: theme.wrongBg } },
              font: { color: { argb: theme.wrongText }, bold: true }
            }
          }
        ]
      });
    } catch (cfErr) {
      console.warn('Conditional formatting error, skipped:', cfErr);
    }

    // ==========================================
    // 6. FOOTER WATERMARK BẢN QUYỀN
    // ==========================================
    const footerRow = endRow + 2;
    ws.mergeCells(`B${footerRow}:${lastVisibleColLetter}${footerRow}`);
    const footCell = ws.getCell(`B${footerRow}`);
    footCell.value = `★ Hãy kiên trì luyện tập mỗi ngày! Chúc bạn đạt kết quả xuất sắc. ${author}`;
    footCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF94A3B8' } };
    footCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // ==========================================
    // 7. KHÓA BẢO VỆ SHEET (CHỐNG LỘ CÔNG THỨC)
    // ==========================================
    if (protectSheet) {
      await ws.protect(password || '', {
        selectLockedCells: true,
        selectUnlockedCells: true,
        formatCells: false,
        formatColumns: false,
        formatRows: false,
        insertColumns: false,
        insertRows: false,
        insertHyperlinks: false,
        deleteColumns: false,
        deleteRows: false,
        sort: false,
        autoFilter: true
      });
    }

    // Xuất file tải về máy
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const cleanFileName = (title.replace(/[^a-zA-Z0-9\s_-]/g, '').trim() || 'Vocab_Studio_Interactive_Exam') + '.xlsx';

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = cleanFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return {
      success: true,
      fileName: cleanFileName,
      totalQuestions: rows.length
    };
  }

  /**
   * Nạp ngược file Excel (.xlsx) đã xuất trước đó vào tool
   */
  async function reverseImportWorkbook(fileOrBuffer) {
    if (typeof ExcelJS === 'undefined') {
      throw new Error('Thư viện ExcelJS chưa được tải.');
    }

    let buffer;
    if (fileOrBuffer instanceof File) {
      buffer = await fileOrBuffer.arrayBuffer();
    } else {
      buffer = fileOrBuffer;
    }

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer);

    const ws = wb.worksheets[0];
    if (!ws) {
      throw new Error('File Excel rỗng hoặc không có trang tính (Sheet).');
    }

    const titleVal = ws.getCell('B1').value;
    const title = typeof titleVal === 'string' ? titleVal : 'Đề Bài Tập Excel';

    const rows = [];
    const detectedColumns = [
      { key: 'q', title: 'Đề bài', role: 'q' },
      { key: 'a', title: 'Đáp án chuẩn', role: 'a' }
    ];

    let hasMask = false;
    let hasPinyin = false;
    let hasExtra = false;

    const rowCount = ws.rowCount;
    for (let r = 6; r <= rowCount; r++) {
      const metaCell = ws.getCell(`A${r}`).value;
      if (metaCell) {
        try {
          const meta = typeof metaCell === 'string' ? JSON.parse(metaCell) : metaCell;
          if (meta.mask) hasMask = true;
          if (meta.pinyin) hasPinyin = true;
          if (meta.extra) hasExtra = true;

          rows.push({
            id: meta.id || (r - 5),
            q: meta.q || '',
            a: meta.a || '',
            mask: meta.mask || '',
            pinyin: meta.pinyin || '',
            extra: meta.extra || ''
          });
          continue;
        } catch (e) {}
      }

      // Fallback nếu không có metadata
      const qVal = ws.getCell(`C${r}`).text || ws.getCell(`C${r}`).value;
      if (qVal) {
        rows.push({
          id: r - 5,
          q: String(qVal).trim(),
          a: String(ws.getCell(`J${r}`).text || ws.getCell(`I${r}`).text || '').trim(),
          mask: '',
          pinyin: '',
          extra: ''
        });
      }
    }

    if (hasPinyin) {
      detectedColumns.splice(1, 0, { key: 'pinyin', title: 'Phiên âm / Pinyin', role: 'pinyin' });
    }
    if (hasMask) {
      detectedColumns.push({ key: 'mask', title: 'Ô che mở khóa', role: 'mask' });
    }
    if (hasExtra) {
      detectedColumns.push({ key: 'extra', title: 'Ghi chú / Ví dụ', role: 'extra' });
    }

    return {
      title,
      columns: detectedColumns,
      rows: rows
    };
  }

  return {
    THEMES,
    generateWorkbook,
    reverseImportWorkbook
  };
})();
