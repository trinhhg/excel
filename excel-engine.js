/**
 * VOCAB STUDIO PRO - EXCEL ENGINE (V2.1 REFACTORED)
 * Bộ tạo file Excel chuyên nghiệp, độc lập không Macro/VBA, tối ưu 100% cho mọi bản Excel
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

  // Bảng màu giao diện Excel Light Theme sang trọng
  const THEMES = {
    excelGreen: {
      name: 'Chuẩn Microsoft Excel (Xanh Lá)',
      primary: 'FF107C41',
      secondary: 'FF0B6A37',
      accent: 'FF15803D',
      bannerText: 'FFFFFFFF',
      dashBg: 'FFF8FAFC',
      cardBg: 'FFFFFFFF',
      cardBorder: 'FFE2E8F0',
      inputBg: 'FFFEFCE8',    // Vàng kem mềm
      inputBorder: 'FFEAB308',
      correctBg: 'FFDCFCE7',
      correctText: 'FF15803D',
      wrongBg: 'FFFEE2E2',
      wrongText: 'FFB91C1C',
      zebraBg: 'FFF9FAFB'
    },
    navy: {
      name: 'Doanh nhân / IELTS (Xanh Navy)',
      primary: 'FF1E3A8A',
      secondary: 'FF1E293B',
      accent: 'FF2563EB',
      bannerText: 'FFFFFFFF',
      dashBg: 'FFF8FAFC',
      cardBg: 'FFFFFFFF',
      cardBorder: 'FFE2E8F0',
      inputBg: 'FFFEFCE8',
      inputBorder: 'FFEAB308',
      correctBg: 'FFDCFCE7',
      correctText: 'FF15803D',
      wrongBg: 'FFFEE2E2',
      wrongText: 'FFB91C1C',
      zebraBg: 'FFF8FAFC'
    },
    emerald: {
      name: 'HSK / Tiếng Trung (Ngọc Bích)',
      primary: 'FF065F46',
      secondary: 'FF047857',
      accent: 'FF059669',
      bannerText: 'FFFFFFFF',
      dashBg: 'FFF0FDF4',
      cardBg: 'FFFFFFFF',
      cardBorder: 'FFBBF7D0',
      inputBg: 'FFFEFCE8',
      inputBorder: 'FFEAB308',
      correctBg: 'FFDCFCE7',
      correctText: 'FF15803D',
      wrongBg: 'FFFEE2E2',
      wrongText: 'FFB91C1C',
      zebraBg: 'FFF9FAFB'
    }
  };

  /**
   * Tạo workbook Excel tương tác tự động chấm điểm (.xlsx)
   */
  async function generateWorkbook(config) {
    if (typeof ExcelJS === 'undefined') {
      throw new Error('Thư viện ExcelJS chưa được nạp.');
    }

    const {
      title = 'BÀI TẬP TỰ ĐỘNG CHẤM ĐIỂM TỪ VỰNG',
      subtitle = 'Luyện tập tương tác • Nhập đáp án vào cột màu vàng • Tự động tính điểm',
      author = 'Biên soạn bởi: Vocab Studio Pro • Hotline/Zalo: 09xx.xxx.xxx',
      themeKey = 'excelGreen',
      targetColKey = null, // Cột đáp án cần chấm
      protectSheet = true,
      password = '',
      columns = [],
      rows = []
    } = config;

    if (!rows || rows.length === 0) {
      throw new Error('Không có dòng từ vựng nào để xuất file.');
    }

    const theme = THEMES[themeKey] || THEMES.excelGreen;
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Vocab Studio Pro';
    wb.lastModifiedBy = author || 'Vocab Studio Pro';
    wb.created = new Date();
    wb.modified = new Date();

    const ws = wb.addWorksheet('Luyện Tập Từ Vựng', {
      views: [{ showGridLines: true }]
    });

    // Xác định cột làm đáp án cần chấm
    let effectiveTargetKey = targetColKey;
    if (!effectiveTargetKey) {
      const explicitAnsCol = columns.find(c => c.isTarget);
      if (explicitAnsCol) {
        effectiveTargetKey = explicitAnsCol.key;
      } else {
        effectiveTargetKey = columns.length > 1 ? columns[1].key : columns[0].key;
      }
    }

    // Xây dựng danh sách các cột trong Sheet
    const colDefs = [];
    let curIdx = 1;

    // Col A: Mã từ (Khóa hàng ngang)
    const colCode = { id: 'code', key: '__code__', letter: getColumnLetter(curIdx++), title: 'Mã Từ (ID)', width: 12 };
    colDefs.push(colCode);

    // Col B: STT
    const colSTT = { id: 'stt', key: '__stt__', letter: getColumnLetter(curIdx++), title: 'STT', width: 7 };
    colDefs.push(colSTT);

    // Các cột dữ liệu của người dùng
    let targetColLetter = null;
    columns.forEach(col => {
      const letter = getColumnLetter(curIdx++);
      if (col.key === effectiveTargetKey) {
        targetColLetter = letter;
      }
      colDefs.push({
        id: col.id,
        key: col.key,
        letter: letter,
        title: col.title || 'Dữ Liệu',
        width: Math.max(18, Math.min(35, (col.title || '').length * 2 + 10))
      });
    });

    // Cột Ô Làm Bài (Học Sinh Nhập)
    const inputColLetter = getColumnLetter(curIdx++);
    const colInput = {
      id: 'student_input',
      key: '__input__',
      letter: inputColLetter,
      title: 'Ô Làm Bài (Học Sinh Nhập)',
      width: 25,
      isInput: true
    };
    colDefs.push(colInput);

    // Cột Kết Quả Chấm
    const resultColLetter = getColumnLetter(curIdx++);
    const colResult = {
      id: 'result_check',
      key: '__result__',
      letter: resultColLetter,
      title: 'Kết Quả',
      width: 15
    };
    colDefs.push(colResult);

    colDefs.forEach(cd => {
      const col = ws.getColumn(cd.letter);
      col.width = cd.width;
    });

    const startRow = 6;
    const endRow = startRow + rows.length - 1;
    const lastColLetter = resultColLetter;

    // ==========================================
    // 1. BANNER TIÊU ĐỀ & THƯƠNG HIỆU (ROWS 1 & 2)
    // ==========================================
    ws.mergeCells(`A1:${lastColLetter}1`);
    const titleCell = ws.getCell('A1');
    titleCell.value = title.toUpperCase();
    titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: theme.bannerText } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.primary } };
    ws.getRow(1).height = 36;

    ws.mergeCells(`A2:${lastColLetter}2`);
    const subtitleCell = ws.getCell('A2');
    subtitleCell.value = `${subtitle}  •  ${author}`;
    subtitleCell.font = { name: 'Segoe UI', size: 9.5, italic: true, color: { argb: 'FFE2E8F0' } };
    subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.secondary } };
    ws.getRow(2).height = 22;

    // ==========================================
    // 2. DASHBOARD KPI THỐNG KÊ ĐIỂM (ROWS 3 & 4)
    // ==========================================
    ws.getRow(3).height = 42;
    ws.getRow(4).height = 18;

    function setupKpi(colLetter, label, formulaText, numFmt = null) {
      const c3 = ws.getCell(`${colLetter}3`);
      c3.value = { formula: formulaText };
      c3.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: theme.primary } };
      c3.alignment = { vertical: 'middle', horizontal: 'center' };
      c3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.dashBg } };
      c3.border = {
        top: { style: 'thin', color: { argb: theme.cardBorder } },
        bottom: { style: 'medium', color: { argb: theme.accent } },
        left: { style: 'thin', color: { argb: theme.cardBorder } },
        right: { style: 'thin', color: { argb: theme.cardBorder } }
      };
      if (numFmt) c3.numFmt = numFmt;

      const c4 = ws.getCell(`${colLetter}4`);
      c4.value = label;
      c4.font = { name: 'Segoe UI', size: 8, bold: true, color: { argb: 'FF64748B' } };
      c4.alignment = { vertical: 'middle', horizontal: 'center' };
      c4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      c4.border = {
        top: { style: 'hair', color: { argb: theme.cardBorder } },
        bottom: { style: 'thin', color: { argb: theme.cardBorder } },
        left: { style: 'thin', color: { argb: theme.cardBorder } },
        right: { style: 'thin', color: { argb: theme.cardBorder } }
      };
    }

    // Các ô thống kê Dashboard
    setupKpi('A', 'TỔNG CÂU', `COUNTA(B${startRow}:B${endRow})`);
    setupKpi('B', 'ĐÃ LÀM', `COUNTIF(${inputColLetter}${startRow}:${inputColLetter}${endRow},"<>")`);
    setupKpi('C', 'ĐÚNG', `COUNTIF(${resultColLetter}${startRow}:${resultColLetter}${endRow},"*ĐÚNG*")`);
    setupKpi('D', 'SAI', `COUNTIF(${resultColLetter}${startRow}:${resultColLetter}${endRow},"*SAI*")`);
    setupKpi(inputColLetter, 'ĐIỂM SỐ (10)', `IF(A3=0,0,ROUND((C3/A3)*10,1))`, '0.0');
    setupKpi(resultColLetter, 'TIẾN ĐỘ', `REPT("■",MIN(10,ROUND(B3/MAX(A3,1)*10,0)))&REPT("□",10-MIN(10,ROUND(B3/MAX(A3,1)*10,0)))&" "&TEXT(IF(A3=0,0,B3/A3),"0%")`);

    colDefs.forEach(cd => {
      const c3 = ws.getCell(`${cd.letter}3`);
      if (!c3.value) {
        c3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.dashBg } };
        c3.border = { top: { style: 'thin', color: { argb: theme.cardBorder } }, bottom: { style: 'thin', color: { argb: theme.cardBorder } } };
      }
      const c4 = ws.getCell(`${cd.letter}4`);
      if (!c4.value) {
        c4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        c4.border = { top: { style: 'hair', color: { argb: theme.cardBorder } }, bottom: { style: 'thin', color: { argb: theme.cardBorder } } };
      }
    });

    // ==========================================
    // 3. TIÊU ĐỀ CỘT BẢNG TÍNH (ROW 5)
    // ==========================================
    ws.getRow(5).height = 28;
    colDefs.forEach(cd => {
      const hCell = ws.getCell(`${cd.letter}5`);
      hCell.value = cd.title;
      hCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: cd.isInput ? 'FFFFFFFF' : theme.bannerText } };
      hCell.alignment = { vertical: 'middle', horizontal: 'center' };
      hCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cd.isInput ? theme.accent : theme.primary } };
      hCell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };
    });

    // ==========================================
    // 4. DỮ LIỆU CÁC DÒNG (ROWS 6 TRỞ ĐI)
    // ==========================================
    rows.forEach((row, idx) => {
      const r = startRow + idx;
      ws.getRow(r).height = 25;
      const zebraBg = idx % 2 === 1 ? theme.zebraBg : 'FFFFFFFF';

      // Col A: Mã từ định danh hàng ngang
      const codeCell = ws.getCell(`A${r}`);
      codeCell.value = row.code || `ID-${String(idx + 1).padStart(3, '0')}`;
      codeCell.font = { name: 'Consolas', size: 9.5, color: { argb: 'FF64748B' } };
      codeCell.alignment = { vertical: 'middle', horizontal: 'center' };
      codeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
      codeCell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      // Col B: STT
      const sttCell = ws.getCell(`B${r}`);
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

      // Các cột dữ liệu của người dùng
      columns.forEach(col => {
        const colDef = colDefs.find(c => c.key === col.key);
        if (!colDef) return;
        const cell = ws.getCell(`${colDef.letter}${r}`);
        cell.value = String(row[col.key] || '');
        cell.font = { name: 'Segoe UI', size: 10.5, color: { argb: 'FF0F172A' } };
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      });

      // Cột Ô Học Sinh Nhập (Vàng kem mềm, được phép nhập)
      const inCell = ws.getCell(`${inputColLetter}${r}`);
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
      // Mở khóa để học sinh gõ:
      inCell.protection = { locked: false };

      // Cột Kết Quả Chấm: Độc lập 100%, không phụ thuộc vào ô khác
      const inRef = `${inputColLetter}${r}`;
      const tgtRef = targetColLetter ? `${targetColLetter}${r}` : `C${r}`;
      const formulaCheck = `IF(TRIM(${inRef})="","",IF(ISNUMBER(SEARCH("|"&LOWER(TRIM(${inRef}))&"|","|"&LOWER(TRIM(${tgtRef}))&"|")),"✓ ĐÚNG","✗ SAI"))`;

      const resCell = ws.getCell(`${resultColLetter}${r}`);
      resCell.value = { formula: formulaCheck };
      resCell.font = { name: 'Segoe UI', size: 10.5, bold: true, color: { argb: 'FF475569' } };
      resCell.alignment = { vertical: 'middle', horizontal: 'center' };
      resCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
      resCell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    });

    // ==========================================
    // 5. CONDITIONAL FORMATTING (ĐÚNG XANH / SAI ĐỎ)
    // ==========================================
    try {
      ws.addConditionalFormatting({
        ref: `${resultColLetter}${startRow}:${resultColLetter}${endRow}`,
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
    // 6. DÒNG CHÚ THÍCH CUỐI BẢNG
    // ==========================================
    const footerRow = endRow + 2;
    ws.mergeCells(`A${footerRow}:${lastColLetter}${footerRow}`);
    const footCell = ws.getCell(`A${footerRow}`);
    footCell.value = `★ Chúc bạn học tốt! ${author}`;
    footCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF94A3B8' } };
    footCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // ==========================================
    // 7. KHÓA BẢO VỆ SHEET (CHỐNG SỬA CÔNG THỨC)
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

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const cleanFileName = (title.replace(/[^a-zA-Z0-9\s_-]/g, '').trim() || 'Bai_Tap_Tu_Vung_Excel') + '.xlsx';

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

  return {
    THEMES,
    generateWorkbook
  };
})();
