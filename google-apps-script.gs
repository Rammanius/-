const SPREADSHEET_ID = '';

const CONFIG = {
  membership: {
    sheetName: 'Заявки на вступление',
    position: 1,
    headers: ['Дата отправки', 'Наименование юридического лица', 'ФИО представителя', 'Сфера деятельности и опыт', 'Контактный E-mail / Телефон', 'Дополнительная информация', 'Страница сайта'],
    fields: ['company', 'rep', 'exp', 'contact', 'comment', 'pageUrl']
  },
  feedback: {
    sheetName: 'Обратная связь',
    position: 2,
    headers: ['Дата отправки', 'Имя', 'E-mail', 'Сообщение', 'Страница сайта'],
    fields: ['name', 'email', 'message', 'pageUrl']
  },
  knowledgeAccess: {
    sheetName: 'Доступ к базе знаний',
    position: 3,
    headers: ['Дата отправки', 'ФИО', 'E-mail', 'Название материала', 'Страница сайта'],
    fields: ['fullName', 'email', 'materialTitle', 'pageUrl']
  }
};

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const params = e.parameter || {};
    const type = String(params.formType || '').trim();
    const config = CONFIG[type];

    if (!config) {
      throw new Error('Неизвестный тип формы: ' + type);
    }

    const spreadsheet = getSpreadsheet_();
    const sheet = getSheet_(spreadsheet, config);
    const row = [new Date()].concat(config.fields.map(function (field) {
      return params[field] || '';
    }));

    ensureHeaders_(sheet, config.headers);
    sheet.appendRow(row);

    return json_({ status: 'ok' });
  } catch (error) {
    return json_({ status: 'error', message: error.message });
  } finally {
    lock.releaseLock();
  }
}

function getSpreadsheet_() {
  if (SPREADSHEET_ID) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('Укажите ID таблицы в SPREADSHEET_ID или создайте Apps Script из Google Таблицы.');
  }
  return spreadsheet;
}

function getSheet_(spreadsheet, config) {
  let sheet = spreadsheet.getSheetByName(config.sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(config.sheetName);
  }
  spreadsheet.setActiveSheet(sheet);
  spreadsheet.moveActiveSheet(config.position);
  return sheet;
}

function ensureHeaders_(sheet, headers) {
  const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const hasHeaders = firstRow.some(function (cell) {
    return String(cell || '').trim() !== '';
  });

  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}