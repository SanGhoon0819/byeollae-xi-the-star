// Create a dedicated spreadsheet and Apps Script web app for this project.
// This server-side configuration is separate from the public form endpoint.
const PROJECT_NAME = '별내자이 더 스타 이그제큐티브';
const SHEET_NAME = '상담접수';
const SPREADSHEET_ID = '17g6cuFi3-XHFvz79n3hy60SKhd4Gtqzb9kQwJqjLn1U';
const ALERT_EMAIL = 'realestateinfo@naver.com';
const COLUMNS = ['접수일시','접수번호','현장','이름','연락처','문의내용','동의','관심타입','방문희망일','utm_source','utm_medium','utm_campaign','utm_content','utm_term','페이지','알림상태','알림일시'];
function notify_(sheet,row) {
  const values=sheet.getRange(row,1,1,COLUMNS.length).getValues()[0];
  if(values[15]==='발송완료')return;
  try {
    MailApp.sendEmail({to:ALERT_EMAIL,subject:'[별내자이더스타] 새 문의 접수: '+values[3],body:'새 문의가 접수되었습니다.\n\n이름: '+values[3]+'\n연락처: '+values[4]+'\n문의내용: '+(values[5]||'(없음)')+'\n접수번호: '+values[1]+'\n\n접수 시트: https://docs.google.com/spreadsheets/d/'+SPREADSHEET_ID+'/edit',name:'별내자이더스타 문의알림'});
    sheet.getRange(row,16,1,2).setValues([['발송완료',new Date()]]);
  } catch(error) { sheet.getRange(row,16).setValue('발송대기'); }
}
function setup() {
  const sheet=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  sheet.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm:ss');
  sheet.getRange('Q:Q').setNumberFormat('yyyy-mm-dd hh:mm:ss');
  const existing=ScriptApp.getProjectTriggers().map(t=>t.getHandlerFunction());
  if(!existing.includes('retryNotifications'))ScriptApp.newTrigger('retryNotifications').timeBased().everyHours(1).create();
  if(!existing.includes('deleteExpiredLeads'))ScriptApp.newTrigger('deleteExpiredLeads').timeBased().everyDays(1).atHour(3).create();
  console.log('상담 접수와 메일 알림 설정 완료');
}
function retryNotifications() {
  const lock=LockService.getScriptLock();if(!lock.tryLock(10000))return;
  try {
    const sheet=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    for(let row=2;row<=sheet.getLastRow();row++)if(sheet.getRange(row,16).getValue()!=='발송완료')notify_(sheet,row);
  } finally {lock.releaseLock();}
}
function response_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
function safe_(value,limit) {
  const text=String(value||'').slice(0,limit||200);
  return /^[=+\-@\t\r]/.test(text) ? "'"+text : text;
}
function doPost(e) {
  let data;
  try {if(!e || !e.postData || e.postData.contents.length>12000)throw new Error();data=JSON.parse(e.postData.contents);}catch{return response_({ok:false});}
  const id=String(data.request_id||''),name=String(data.name||'').trim(),phone=String(data.phone||'').replace(/\D/g,''),message=String(data.message||'');
  if(!/^[a-zA-Z0-9-]{20,64}$/.test(id)||data.project!==PROJECT_NAME||data.privacy_agree!==true||data.website||name.length<2||name.length>30||/[<>=]/.test(name)||!/^0\d{8,10}$/.test(phone)||message.length>1000)return response_({ok:false});
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(10000))return response_({ok:false});
  try{
    const sheetId=SPREADSHEET_ID;
    if(!sheetId)return response_({ok:false});
    const book=SpreadsheetApp.openById(sheetId),sheet=book.getSheetByName(SHEET_NAME)||book.insertSheet(SHEET_NAME);
    if(sheet.getLastRow()===0){sheet.appendRow(COLUMNS);sheet.setFrozenRows(1);sheet.getRange(1,1,1,COLUMNS.length).setFontWeight('bold');}
    const last=sheet.getLastRow();
    if(last>1){const match=sheet.getRange(2,2,last-1,1).createTextFinder(id).matchEntireCell(true).findNext();if(match){const old=sheet.getRange(match.getRow(),4,1,3).getValues()[0];const same=String(old[0]).replace(/^'/,'')===name&&String(old[1]).replace(/^'/,'')===phone&&String(old[2]).replace(/^'/,'')===message;return response_({ok:same,request_id:id});}}
    // Store phone numbers as text and neutralize spreadsheet formulas in every submitted field.
    const row=sheet.getLastRow()+1;
    sheet.getRange(row,2,1,COLUMNS.length-1).setNumberFormat('@');
    sheet.getRange(row,1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
    sheet.getRange(row,17).setNumberFormat('yyyy-mm-dd hh:mm:ss');
    sheet.getRange(row,1,1,COLUMNS.length).setValues([[new Date(),id,PROJECT_NAME,safe_(name,30),phone,safe_(message,1000),'동의',safe_(data.interest_type),safe_(data.visit_date),...['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].map(k=>safe_(data[k])),safe_(data.page_path),'발송대기','']]);
    SpreadsheetApp.flush();
    notify_(sheet,row);
    return response_({ok:true,request_id:id});
  }catch{return response_({ok:false});}finally{lock.releaseLock();}
}
// Match the published retention period. Configure a daily trigger after deployment.
function deleteExpiredLeads() {
  const id=SPREADSHEET_ID;if(!id)return;
  const lock=LockService.getScriptLock();if(!lock.tryLock(10000))return;
  try{
    const sheet=SpreadsheetApp.openById(id).getSheetByName(SHEET_NAME);if(!sheet||sheet.getLastRow()<2)return;
    const cutoff=new Date();cutoff.setFullYear(cutoff.getFullYear()-1);
    const dates=sheet.getRange(2,1,sheet.getLastRow()-1,1).getValues();
    for(let i=dates.length-1;i>=0;i--)if(dates[i][0] instanceof Date && dates[i][0]<cutoff)sheet.deleteRow(i+2);
  }finally{lock.releaseLock();}
}
