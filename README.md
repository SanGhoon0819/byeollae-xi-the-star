# 분양 홈페이지 MASTER · 별내자이 더 스타 이그제큐티브

메인에서 핵심정보를 확인하고 6개 주제별 상세페이지로 확장하는 정적 홈페이지입니다. HTML이 미리 생성되어 검색엔진이 주요 내용을 읽을 수 있습니다. 별도의 패키지 설치 없이 Node.js로 만들며 기존 GitHub 기반 호스팅에 사용할 수 있습니다.

## 확인하기

`npm run preview` 실행 후 http://127.0.0.1:4173 에서 확인합니다. index.html을 직접 열어도 기본 화면을 볼 수 있습니다. 정상적인 접수와 분석 검수는 HTTP 환경에서 진행해야 합니다.

## 구성

| 파일/폴더 | 역할 |
|---|---|
| content/site.json | 현장명, 색상, 로고, 전화, 메뉴, 모듈, 메인 내용, FAQ, SEO, 접수와 GA4 설정 |
| content/plans.json | 블록별 21개 타입, 공급 실수, 평면도, 옵션 자료, 판매상태 |
| content/details.json | 주제별 상세 내용: 이미지·정보표·설명·갤러리 |
| master/ | 공통 디자인, 생성기, 모바일 메뉴, 타입 선택, 이미지 확대, 접수, 전환추적 |
| assets/ | 공식 자료에서 추출한 이미지. manifest.json에 파일·페이지·크기 기록 |
| backend/Code.gs | 별내자이 전용 Google Sheets 접수 프로그램 예시 |
| index.html | 핵심 정보, 지정 FAQ, 문의폼 |
| inquiry.html | 문의하기 전용 페이지 |
| overview / location / plans / site / premium / community.html | 6개 주제별 상세페이지 |

## 내용 수정

1. content의 JSON 파일을 수정합니다.
2. `npm run build`로 HTML과 runtime-config.js, sitemap.xml, robots.txt를 다시 생성합니다.
3. `npm run check`로 링크·이미지·앵커·제목·설정을 확인합니다.
4. 화면을 확인하고 GitHub에 변경분을 저장합니다. 생성된 HTML을 직접 수정하면 다음 생성에서 덮어써집니다.

## 다음 현장에 재사용

폴더를 새 현장용 저장소에 복사하고 content의 3개 파일과 assets를 교체합니다. 공통 master는 유지할 수 있습니다.

- modules로 각 메인 영역을 켜거나 끕니다. moduleOrder로 순서를 바꿉니다.
- details 배열로 메뉴와 ‘더 자세히 알아보기’ 카드를 함께 관리합니다.
- 상세 sections는 image, overview, premium, text, table, stats, gallery, development 종류를 사용할 수 있습니다.
- plans의 id는 고유해야 합니다. name이 같더라도 block별로 구분합니다.
- plans의 count는 공급 실수입니다. status가 비어 있으면 판매상태 배지를 출력하지 않습니다. 확인된 판매정보가 있을 때만 작성합니다.
- terms는 확인된 계약조건이 있을 때만 켭니다. 팝업도 enabled, title, body를 설정한 후 켭니다. 오늘 하루 보지 않기와 키보드 닫기를 지원합니다.
- interestType과 visitDate는 상담폼 선택 항목입니다. 기본은 이름·연락처·문의내용·개인정보 동의입니다.
- 새 현장에서 이전 현장의 endpoint, ga4Id, domain, phone과 개인정보 처리자 정보를 반드시 교체합니다.

## 추후 연결하기

상담번호는 **1877-2027**로 적용했습니다. 사용자의 요청에 따라 별내자이 접수 주소·GA4 ID·최종 도메인은 비워 두었습니다.

1. 별내자이 전용 상담 시트를 만들고 backend/Code.gs를 Apps Script에 넣습니다. Script Properties의 SPREADSHEET_ID를 설정합니다.
2. 별내자이 데이터만 받도록 PROJECT_NAME을 유지합니다. 웹 앱을 운영 계정으로 실행하고 공개 웹 요청을 받을 수 있게 배포합니다. 실제 개인정보를 넣기 전에 검수용 접수와 시트 저장을 확인합니다.
3. 배포된 /exec URL을 contact.endpoint에 넣습니다. 기존 르웨스트 접수 주소는 사용하지 않습니다.
4. contact.ga4Id에 별내자이 측정 ID를 넣습니다. 고객 개인정보는 GA4로 전송하지 않습니다.
5. domain에 최종 HTTPS 주소를 넣습니다. GitHub Pages의 하위 경로라면 그 경로까지 넣습니다. 재생성하면 canonical, OG URL, sitemap, robots가 함께 적용됩니다.
6. 실제 접수·UTM 저장·성공 응답·GA4 DebugView를 확인한 후 공개합니다. 보유기간 1년에 맞춰 deleteExpiredLeads의 일별 실행을 설정합니다.

도메인이 없을 때는 미리보기 모드로 noindex·검색수집 차단이 적용됩니다. 등록 버튼도 접수 주소를 연결하기 전까지 비활성 상태로 표시합니다. 화면에서 가짜 접수 성공을 표시하지 않습니다.

## 전환추적

- 전화 클릭: phone_click (placement)
- 주요 상담 CTA: cta_click (placement)
- 서버에서 저장 완료가 확인된 접수: generate_lead, lead_submit
- 기타: plan_filter, plan_select, image_view, popup_view

GA4 핵심 이벤트는 **generate_lead 하나**를 상담 완료로 지정합니다. lead_submit은 기존 운영과의 호환용이며 두 이벤트를 동시에 핵심 이벤트로 지정하면 중복 집계됩니다. 전화 클릭은 통화 완료와 구분해야 합니다.

utm_source / medium / campaign / content / term은 세션에 유지되며 내부 상세페이지 링크와 접수에 전달됩니다. 유입 태그가 새로 들어오면 최신 캠페인으로 갱신합니다. 접수 실패·응답 불일치에서는 완료 이벤트를 보내지 않습니다. 같은 내용의 재시도는 같은 접수번호로 처리합니다.

## 호스팅

GitHub Pages 또는 기존 정적 호스팅에서 저장소 루트를 게시할 수 있습니다. 개발 문서와 backend 폴더를 공개 호스팅에서 제외하려면 호스팅용 폴더에 HTML, assets, master/styles.css, master/app.js, runtime-config.js, sitemap.xml, robots.txt, .nojekyll만 복사하면 됩니다. backend와 content를 비공개로 관리하려면 소스 저장소를 비공개로 설정합니다.

이 작업에서는 ChatGPT Sites 호스팅을 사용하지 않았습니다. 최종 도메인 연결 후 Search Console·네이버 Search Advisor의 소유권 확인과 사이트맵 제출이 별도로 필요합니다.

## 자료 기준

2026년 교육자료를 현재 상품안내의 기준으로 사용하고, 브리핑·지도전단·첨부 커뮤니티 이미지에서 조감도·배치도·평면도를 활용했습니다. 과거 청약 일정과 과거 공급금액은 현재 분양조건으로 게재하지 않았습니다. 세부 출처와 적용 판단은 자료분석.md를 참고하세요.

## 콘텐츠 구성 기준

메인은 핵심 정보, 상세는 제공 자료의 이미지·표·내용 중심으로 구성합니다. 외부 자료는 최신 일정 확인용으로만 사용하고 고객 화면에는 기사 링크나 제작 설명을 넣지 않습니다. 자료 이미지의 내용과 주석을 보존하고 확대 기능을 제공합니다. FAQ는 교육자료 30쪽 지정 항목 5·7·9·15·23·25·30의 질문과 상담사 답변만 사용합니다.

