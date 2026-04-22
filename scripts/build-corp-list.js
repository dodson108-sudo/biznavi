/**
 * 빌드 시 실행: DART corpCode.xml 다운로드 → api/corp-list.json 생성
 * Vercel buildCommand: node scripts/build-corp-list.js
 */
const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

const OUTPUT = path.join(__dirname, '..', 'api', 'corp-list.json');

async function main() {
  const apiKey = process.env.DART_API_KEY;
  if (!apiKey) {
    console.warn('[build-corp-list] DART_API_KEY 없음 — corp-list.json 생성 건너뜀');
    process.exit(0);
  }

  console.log('[build-corp-list] corpCode.xml 다운로드 중...');
  const res = await fetch(`https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key=${apiKey}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const buf = Buffer.from(await res.arrayBuffer());
  const zip = new AdmZip(buf);
  const entries = zip.getEntries();
  const entry = entries.find(e => /corpcode/i.test(e.entryName)) || entries[0];
  if (!entry) throw new Error('ZIP 비어있음');

  const xml = entry.getData().toString('utf-8');
  const codes  = [...xml.matchAll(/<corp_code>\s*(\d+)\s*<\/corp_code>/gi)].map(m => m[1]);
  const names  = [...xml.matchAll(/<corp_name>\s*([^<]+?)\s*<\/corp_name>/gi)].map(m => m[1].trim());
  const stocks = [...xml.matchAll(/<stock_code>\s*([^<]*?)\s*<\/stock_code>/gi)].map(m => m[1].trim());

  const list = {};
  const len = Math.min(codes.length, names.length);
  for (let i = 0; i < len; i++) {
    if (!list[names[i]]) list[names[i]] = { corpCode: codes[i], stockCode: stocks[i] || '' };
  }

  const count = Object.keys(list).length;
  console.log(`[build-corp-list] ${count}개 파싱 완료 → ${OUTPUT}`);
  fs.writeFileSync(OUTPUT, JSON.stringify(list));
  console.log('[build-corp-list] 완료');
}

main().catch(e => {
  console.error('[build-corp-list] 오류:', e.message);
  process.exit(0); // 실패해도 빌드는 계속 진행
});
