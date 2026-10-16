# AMC 런칭 종합점검 최종 보고 (2026-10-16)

## 1. 작업 범위와 산출물

- 저장소 `ggamzie317/amc-decision-architecture`, 기준 `main` = Production `2df6d9ac3eddfa7e01eb6208a139d9fb6701be3c` (GitHub Production 배포 기록 2026-10-15T15:46Z, 운영 도메인 `app.allofmycareer.com`, 함수 리전 `iad1` 관찰).
- 순서: 0단계 → 2부 → 1부 → 3부. 소유자 지시("작업 이어서 마무리")에 따라 1부·3부는 중간 보고 없이 이어서 진행했다.

| 산출물 | 위치 | 상태 |
|---|---|---|
| 기준 문서 + CLAUDE.md 참조 (0단계) | PR #113, `docs/AMC_engineering_handoff_2026-10-13.md` | 열림, 미병합 |
| 데이터 인벤토리 (2부) | PR #114, `docs/data-inventory.md` | 열림, 미병합 |
| 최종 보고 (이 문서) + 3부 설계안 | 이 PR, `docs/launch-check-2026-10-16.md`, `docs/design-proposals-2026-10-16.md` | 열림, 미병합 |
| 테스트 PDF·확인 이미지 | 로컬 `~/amc-worktrees/v2-launch-hardening/launch-check-2026-10-16/pdf/` (저장소에 넣지 않음) | 전달 |

- **실행 코드 수정 없음.** Production 배포·main 병합·DB 스키마·점수 규칙·프레임워크·환경변수·API 제공자·모델·검색 정책·출처 검증 기준을 바꾸지 않았다.
- 승인 없이 바꾸지 않은 것(발견했지만 수정하지 않음): 아래 FAIL 항목 전부, JEV 전체 합산 한도 버그, 레거시 경로 공개 상태, 문구 충돌.

## 2. 실제 유료 호출 기록 (상한 15회)

| # | 시각(UTC) | 목적 | 엔드포인트·API | 주제 | 앱 응답 | 결과 |
|---|---|---|---|---|---|---|
| 1 | 2026-10-15 18:53 | STOP-SHIP 재현 1차 | 운영 `/api/amc/external-intelligence-v2` → Perplexity `/v1/agent`, preset 기본 `medium`(모델 필드 미전송) | 졸업 후 성과 + 취업 연계 | 200 (4분 이상 소요) | 본문 확보 못 함(아래 사고 참조) |
| 2 | 18:53 | 〃 | 〃 | 학비 마련 + 비용 | 200 | 카드 2, live, complete |
| 3 | 18:56 | 재현 2차 | 〃 | 졸업 후 성과 + 취업 연계 | **503** | 본문·진단 헤더 확보 못 함 |
| 4 | 18:56 | 〃 | 〃 | 학비 마련 + 비용 | 200 | 카드 2 |
| 5 | 18:58 | 2차 자동 재시도(주제 단위) | 〃 | 취업 연계 | 200 | 카드 1 |
| 6 | 18:59 | 〃 | 〃 | 졸업 후 성과 | 200 | 카드 4 |

- **관찰한 호출 6회 / 15회.** 서버 내부의 429 자동 재시도(호출당 최대 2회)는 앱 응답에 드러나지 않아 횟수 **확인 불가**. 앱 응답 헤더·로그로 확인할 수 없는 최대치는 18회지만, 429 응답 흔적(지연·오류)은 관찰되지 않았다.
- 토큰·비용: 응답에 사용량이 포함되지 않고 Perplexity 콘솔 미접근 → **확인 불가**. 추정치는 계산하지 않았다.
- 언어 전환·보고서 열기 후 추가 호출 0건(B).
- 사고: 1차 실행 중 조사용 하위 작업이 같은 브라우저 탭을 다른 사이트로 이동시켜 1차 결과 화면(메모리 상태)을 잃었다. 2차 실행으로 대체했고 이후 해당 작업은 브라우저 사용을 중단했다.

운영 DB에 생성된 테스트 기록(합성 입력, 연구 동의 해제): `AMC-20261015-B71A3311`, `AMC-20261015-185EC4AC`. 기존 데이터 수정·삭제 없음.

## 3. 항목별 결과

표기: 코드 = 코드상 확인, 모의 = 목 테스트, 재생 = 운영에서 기록한 실제 응답을 로컬에서 재생, 실호출 = 운영 실제 호출.

### 3.1 STOP-SHIP 학위 사례와 외부 근거 파이프라인 (1부-1)

- **비식별 재구성 재현.** 원본 고객 입력·요청 원문·공급자 원문은 기록에 없어 확보하지 못했다. 확보한 것: 사례 유형(학위), 기본 검색 주제, 당시 진단(`source_unavailable / no_evidence`, 카드 0, URL 10), 당시 코드(PR #92). 원본 대비 차이: 기관·과정·지역을 합성값(국내 EMBA, "고려대학교 EMBA 과정 진학", 지역 기본값 "한국")으로 대체, 현재 코드는 학위 검색 지침·주제 범위·주제별 분할 요청·(URL, 주제) 중복 규칙이 추가된 버전.
- 현재 코드 사용 항목 (코드 + D, 2026-10-16): 엔드포인트 `https://api.perplexity.ai/v1/agent`(현행), SDK 없음(`fetch`), 동기 호출(`stream:false`), preset `medium`(공식 문서상 무버전·변동 가능), 서버 240초·브라우저 270초 제한, 429만 2회 재시도, 응답 `object/status/output[]`의 `search_results` 항목과 최종 `output_text` 사용 — 현행 문서 구조와 일치. 출처 추출·검증·카드 생성: `inspectV2AgentResponse` → `validateV2Evidence` → `probePublicSource` → 클라이언트 `acceptV2Evidence`.

| 단계 | 결과 (실호출, 2차 실행) |
|---|---|
| 요청 생성 | 6개 필드, 주제 2그룹. 대상 "고려대학교 EMBA 과정 진학"(접미어 "진학"이 정리되지 않음 — 정리 규칙에 없음), 지역 "한국" |
| 공급자 응답 | 그룹 1(성과+취업) 503, 그룹 2(학비+비용) 200. 실패 단계 구분(공급자 실패/빈 근거/출처 탈락)은 응답 본문·헤더 미확보로 **확인 불가** |
| 파싱·출처 검증·카드 | 200 응답 3건 모두 live, `sourceCoverage: complete`. 카드 2 + 1 + 4 = 7. 출처 전부 기관 공식 페이지(biz.korea.ac.kr) |
| 분석 반영 | 시장 근거 단계 "확인 전" → "일부 확인됨", 확인 조건 6/8 → 7/8. 핵심 숫자(등록금), 안전 여유·경로 조정 문장에 반영 |
| 대시보드 | 7개 카드 표시, 출처 링크, 같은 출처 표기("근거 4와 같은 출처") |
| PDF | 재생으로 생성 (§3.5) |

- 판정: **PASS (조건부)** — 원래의 0카드 증상은 재구성 입력 2회 실행에서 재현되지 않았다. 다만 같은 주제 그룹이 1차에 4분 이상, 2차에 503으로 실패해 클라이언트의 주제 단위 재시도로 회복됐다. 503의 원인은 확정하지 못했다. **남은 위험**: 성과·취업 주제의 지연·실패가 반복될 가능성, 실패 단계 진단 정보가 브라우저 헤더에만 있고 서버에 저장되지 않음.
- 분석 품질 관찰(실호출 화면):
  - **FAIL** 판단이 바뀌는 조건의 방향 오류: 고객이 "머물거나 기다릴 이유"로 고른 `손실 위험 · 높음`이 "고려대학교 EMBA 과정 진학 쪽으로 단계적으로 옮겨 가는 데 힘이 실립니다"로 표시됨. 원인: 방향을 조건의 쪽이 아니라 목록 순서로 정함(`amcProductApplicationV3.ts:405-414`, `index < 2`). 점수 규칙 변경 없이 고칠 수 있으나 승인 필요.
  - 경로 조정 "중간 경로(금·토요일 수업을 운영하는 2년 과정이며 졸업 기준을 공개합니다)" — 근거 카드 제목이 "중간 경로" 자리에 들어가 의미가 맞지 않음(`amcV2Analysis.ts:942-956`).
  - "‘교과과정 페이지는 2년 과정을 안내합니다’가 고려대학교 EMBA 과정 진학에도 맞는 기준인지 원문에서 확인하세요" — 같은 과정의 공식 자료에도 같은 문장이 붙어 무의미한 확인 지시가 됨.
  - 입학 마감일 카드가 "실행 준비도·새 경로 지원"과 자동 비교됨 — 관련성 약함.
  - 반면 등록금·일정·졸업 요건·취업 성과 비공개 등 사실과 그 한계는 정확히 연결됨.
- `#109` 전후 장애: PR #109의 `.js` 누락으로 검색 함수가 500을 낸 사실은 당시 코드 diff와 수정 PR #112, 회귀 테스트로 확인된 기록이다. 그 외 원인은 확정하지 않는다.

### 3.2 외부 근거 확인 전 화면 전환과 완료 이벤트 (1부-2, 의뢰서 7.2)

| 확인 | 결과 | 근거 |
|---|---|---|
| 입력 완료 → processing 화면 | PASS | 실호출 화면, 코드 |
| 처리 중 표시가 실제 상태 기반 (가짜 진행률 없음) | PASS. 단 "1~2분" 안내는 실제 최대(약 9분)와 다르고 취소 버튼 없음 | 실호출(37초·3분), 코드 |
| 외부 근거 확인 완료 전 대시보드 전환 | **FAIL**: 첫 주제가 확인되면 대시보드가 열리고 `dashboard_generated`가 기록됨. 나머지 주제는 "근거 추가 수집 중" | 실호출(37초 시점, 1개 주제 수집 중), 코드 `:976-978, :820-842` |
| 전체 실패 시 재시도·구조 초안 명시적 선택 | PASS | 코드, 렌더 테스트 |
| 일부 실패 시 실패 주제만 재검색 | **FAIL**: 재검색 버튼이 숨겨짐 | 코드 `V2Dashboard.tsx:84-111` |
| 구조 초안과 완성 분석 구분 | PASS (화면·보고서 표지·페이지 하단). 일부 확인 상태는 완성과 같은 표시 | 코드 |
| 고객이 고른 초안과 실패 후 초안 구분 | **FAIL**: 같은 상태·같은 이벤트 값 | 코드 |
| 이벤트와 실제 상태 일치 | **FAIL**: 부분 근거를 live로 기록, 검색 전 `unavailable` 기록, 수정 후 `full_intake_completed` 중복 | 코드 |
| 새로고침 | 모든 진행 소실(원문 비저장 계약상 의도). 같은 탭에서 새로 시작하면 이전 제출 기록에 이벤트가 이어 붙을 수 있음 | 실호출(새로고침 후 설정 화면), 코드 |
| 뒤로 가기 | 이력 연동 없음 → 페이지 이탈 | 코드 |
| 중복 클릭 | 검색은 보호됨, 완료·대시보드 이벤트는 보호 없음 | 코드 |
| 언어 전환·시뮬레이터·보고서에서 재검색 | 없음 PASS | 실호출(네트워크 확인), 코드 |

변경안(승인 대기): 결과 모드 명시(완성/일부/수집 중/선택 초안/실패 후 초안), 모든 주제 확정 전 `dashboard_generated` 보류 또는 보고서 인쇄 비활성, 실패 주제 재검색 버튼, `try/finally`, 처리 중 "기다리지 않고 초안 보기", 이벤트에 초안 사유 추가(운영 필드 추가는 §12 승인 사항).

### 3.3 Posture 문구의 행동 권고 여부 (1부-3, 의뢰서 2.2)

- **FAIL.** `Preserve and Validate` 판단이 고객에게 `현재 계획 유지` / `Keep the current plan for now`로 표시된다(`v2ReportPresentation.ts:114,122`). 실호출 화면에서 KO·EN 모두 헤드라인으로 확인. 아래 질문 `지금 조건에 가장 잘 맞는 움직임은 무엇인가요?` / `Which move fits your current conditions best?`가 권고로 읽히게 한다.
- 전수 확인: 6개 엔진 라벨 KO/EN 실행(코드 실행), 화면·보고서·시뮬레이터·결론 추적 코드 검색, Perplexity 프롬프트. 실제 AI 출력의 지시형 문장은 모든 경우를 검증할 수 없음(동적 경로).
- 승인 대기 문구안: W1~W15 (부록 A). 점수·분류·프레임워크 의미 변경 없음.

### 3.4 한국어 조사 결합 (1부-4, 의뢰서 7.6)

- 원래 버그 "현재 직무와 생활 기반는": 재현되지 않음 **PASS** (`koreanParticle.ts`, 9개 경로 모두 사용).
- 실행 확인 PASS: 받침 있음/없음, ㄹ(으로/로), 숫자, 약어, 괄호·따옴표·문장부호, 한영 혼합. 줄바꿈은 입력이 한 줄이라 해당 없음.
- **FAIL**: 영어 단어를 마지막 글자로만 판정 → `Google를`, `Apple가`, `Microsoft을`, `Product으로` (`koreanParticle.ts:41-45`). 수정안 부록 A.
- 경미: 분석 계층은 끝 문장부호를 지우지 않아 `개발자!를 그만두지 않고` (`amcV2Analysis.ts:913-914,514`).

### 3.5 PDF 검증 (1부-5, 의뢰서 7.5~7.6)

(가) 헤드리스 인쇄 렌더링 PDF — 수행함. Chrome 155.0.8059.79 `--headless=new`, CDP `Page.printToPDF {printBackground:true, preferCSSPageSize:true, A4, scale:1}`, 로컬 프로덕션 빌드(코드 = `2df6d9a`의 `manus-ui`), 127.0.0.1과 Google Fonts 외 네트워크 차단, 운영 DB 미사용(메모리 저장소). "재생"은 §2의 실호출 응답 3건을 그대로 돌려준 것이며 실호출이 아니다.

| # | 조건 | 언어 | 경로 | 쪽수 | 경로 조정 카드 (화면→PDF) | 잘림 | 카드 분리 | 빈 공간 | 상태 표기 |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 학위, 외부 근거 있음 | KO | 재생 | 20 | 3→3 (근거 7→7) | FAIL¹ | FAIL | FAIL (5·8쪽 대부분 빈 페이지) | PASS |
| 2 | 같은 사례, 대시보드에서 EN 전환 | EN | 재생 | 23 | 3→3 | FAIL¹ | FAIL | FAIL (23쪽 한 줄) | PASS |
| 3 | 검색 실패 → 초안 선택 | KO | 실패 | 12 | 3→3 | FAIL¹ | PASS | 경미 | **부분**² |
| 4 | 고객이 고른 초안(검색 전) | KO | 초안 | 12 | 3→3 | FAIL¹ | PASS | 경미 | PASS |
| 5 | 경로 조정 0개 | KO | 초안 | 12 | 0→0 | FAIL¹ | PASS | 경미 | PASS |
| 5b | 5의 입력 + 근거 재생 | KO | 재생 | 20 | 1→1 | FAIL¹ | FAIL | FAIL | PASS |
| 6 | 경로 조정 1개 | KO | 초안 | 12 | 1→1 | FAIL¹ | FAIL (결정 지도 7/8쪽) | 경미 | PASS |
| 7 | 긴 한국어 입력 (120자 × 2) | KO | 초안 | 13 | 3→3 | FAIL¹ | PASS | 경미 | PASS |
| 8 | 초안, 처음부터 영어 | EN | 초안 | 14 | 3→3 | FAIL¹ | PASS | FAIL (12쪽 약 85% 빈칸) | PASS |

¹ 07 "조건이 바뀌면" 표의 영향 표시가 16×16px 고정 상자(`client/src/styles/v2.css:732`)라 EN은 단어가 "Rea/din/g"처럼 끊겨 칸 밖으로 넘치고 KO 두 글자 라벨은 세로로 쌓인다. 화면 보고서에서도 24개 중 24개가 넘침(인쇄 전용 문제 아님). 직접 이미지로 확인함(08 13쪽).
² 실제로 검색이 실패했는데 표지 "검색 없이 본 초안 · 공개 자료 확인 전", 1쪽 "아직 공개 자료를 찾지 않았습니다"로 표시됨(03장 본문·08장은 "확인 가능한 출처를 찾지 못했습니다"로 맞음).

- 모든 PDF PASS: 한글 폰트 깨짐 없음(Noto Sans KR 로드), 긴 문자열·URL 줄바꿈, 카드 누락·중복 없음, 화면과 PDF의 판단·근거 상태·초안 표기 일치.
- 카드 0개와 근거 실패는 다른 상태로 출력됨: 0개는 "제시할 경로 조정안이 없습니다", 실패는 카드 3개 유지 + 실패 표기.
- 경로 조정 0개는 재정 여유·되돌릴 여지 충분, 손실 위험 낮음, 실시간 근거 없음에서 나온다(`deriveChangingPlays`). 기록한 학위 근거(신뢰도 medium)가 있으면 중간 경로 카드가 항상 1개 생긴다.
- 판정: **FAIL** (공통 표시 넘침, 재생 PDF의 카드 분리와 빈 페이지, 실패 상태 표기 불일치).
- 파일: PDF 9개, 쪽별 PNG, 화면 캡처, 실패 화면 캡처, README — `launch-check-2026-10-16/pdf/`.
- 검증 안 함: 실제 "PDF로 저장·인쇄" 버튼(`window.print()`)과 저장 대화상자, 파일명, `print_save_clicked` 이벤트, 다른 브라우저·모바일 인쇄, 처음부터 영어로 근거를 받은 실행(영어 실호출 응답 없음).

(나) 브라우저 기본 저장 대화상자: **NOT TESTED** — 아래 체크리스트로 소유자 확인 필요.

#### 저장 대화상자 체크리스트 (소유자 직접 확인)

환경별로 반복: macOS Chrome, macOS Safari, Windows Chrome(가능하면), 모바일 Safari/Chrome(공유 → PDF).

1. `https://app.allofmycareer.com/amc-interactive-v2?lang=ko`에서 "검색 없이 본 초안 먼저 보기"로 결과를 연다(유료 호출 없음).
2. "보고서 열기" → "인쇄 / PDF 저장".
3. 인쇄 창 대상 "PDF로 저장" 선택 시 미리보기 페이지 수를 적는다.
4. 저장 → 제안된 파일명을 적는다. 기대: 사례 유형이 들어간 이름(코드 `AmcInteractiveV2.tsx:1495`), 한글 깨짐 없음, `undefined` 없음.
5. 저장된 PDF를 열어 첫 페이지 표지, 마지막 페이지, 카드가 페이지 사이에서 잘리지 않는지 확인.
6. 다시 "인쇄 / PDF 저장" → **취소**. 브라우저 탭 제목이 원래 제목(`allofmycareer | Career Decision Report`)으로 돌아오는지, 화면이 보고서 상태로 남는지 확인.
7. EN(`?lang=en`)으로 4~6 반복.
8. 결과를 "환경 / 페이지 수 / 파일명 / 잘림 / 취소 후 제목" 표로 회신.

### 3.6 자동 추정 사례 유형 확인·변경 (1부-6)

| 확인 | 결과 | 근거 |
|---|---|---|
| 첫 화면에서 추정 유형 확인 | PASS ("적어 주신 내용으로 본 결정 유형", 근거 단어 표시) | 실호출 화면, 코드 |
| 직접 변경 | PASS (상위 3개 + "모든 유형 보기 (9개)"), 시작 화면에서만 | 실호출 화면, 코드 |
| 변경 유형의 일관 반영 (설문·검색·분석·대시보드·PDF) | PASS (단일 `state.caseType`) | 코드 |
| 자동 추정이 명시 선택을 덮어씀 | 없음 PASS. 단 "시작"을 누르면 고객이 고르지 않아도 고정되고, 결론 추적은 항상 "자동 판단"으로 표기 | 코드 |
| 이전 유형 데이터 재사용 | 대부분 PASS. 예외: `keyFacts` 미초기화(같은 id·다른 질문 문구), 같은 유형 재클릭 시 편집한 검색 대상 초기화, 실패 후 유형 변경 시 이전 실패 스냅숏 표시 | 코드 |

- 대시보드·설문 화면에는 유형이 표시되지 않는다(보고서 표지·결론 추적에만). 변경안 부록 A.

## 4. 문서와 승인 대기안

- 2부 문서: [docs/data-inventory.md](data-inventory.md) (PR #114). 개인정보처리방침·이용약관 작성 전에 반드시 확인할 확인 불가 항목:
  1. Postgres 제공자·리전·백업 보존 (콘솔)
  2. Perplexity 계정의 보존·ZDR 설정, 처리 위치 (콘솔·계약)
  3. Vercel 요금제·로그 보존·IP 기록 여부·Deployment Protection (콘솔)
  4. SMTP 제공자·리전 (환경변수 값)
  5. Express 서버(원문·이메일 파일 저장)의 운영 실행 여부
  6. 보유 기간·삭제·철회 정책 (현재 코드에 없음 → 정책 결정 필요)
- 승인 대기안 모음 (부록 A, 3부 문서):
  - 고객 문구: W1~W15(Posture·지시형), 2부 §9의 문구 충돌 4건("검색 대상만", "요청할 때만", "출처는 점수를 바꾸지 않음", KO/EN 불일치)
  - 코드 수정: 판단 전환 방향 오류, 조사 영어 규칙, 7.2 상태·이벤트, 사례 유형 데이터 초기화, JEV 전체 합산 한도
  - AI 안내 / 법률 페이지 구조 / 연구 동의 / 요청 제한: [docs/design-proposals-2026-10-16.md](design-proposals-2026-10-16.md)

## 5. 출시 판단

이번 판단은 출시 승인이나 배포 승인이 아니다. 이번 점검은 의뢰서 전체 재검증이 아니며, 범위 밖 항목은 아래에 따로 적었다.

### 비공개 베타: **조건부 가능**

| 영역 | 상태 |
|---|---|
| 기술적 고객 흐름 | 실호출 1개 사례(KO 학위)로 입력 → 검색 → 근거 7개 → 분석 → 대시보드 → 보고서까지 확인. 실패·초안 경로는 재생·코드로 확인. 부분 근거 상태에서 완료 처리되는 문제(§3.2) 있음 |
| 분석 품질·외부 근거 | 근거 사실과 한계는 정확. 판단 전환 방향 오류(§3.1)와 근거 제목을 경로 이름에 넣는 문장 오류는 고객에게 틀린 해석을 줌 |
| 화면·한국어·PDF | Posture 헤드라인이 행동 권고로 읽힘(§3.3, 브랜드 원칙 위반). PDF 07장 표시 넘침, 빈 페이지·카드 분리. 조사는 대체로 정상 |
| 개인정보·보안·동의·고지 | 개인정보처리방침·약관 링크 없음, 보유 기간·삭제·철회 경로 없음, 동의·고지 문구 4건 사실과 다름(2부 §9), 레거시 `/amc-web-mvp`·`/api/amc/external-snapshot`이 원문을 저장·전송, 검색 API 무인증·무제한, 운영 빌드에 Manus 런타임 포함 |
| 확인 못 한 것 | 콘솔 설정 전부(Vercel·Perplexity·DB·SMTP), 저장 대화상자, 모바일 재확인, 9개 유형 전체 실호출, 운영 DB 저장 응답 본문(`stored:true`) 재확인 |

베타 시작 전 조건과 완료 확인 방법:
1. Posture 라벨·질문 수정(W1, W3, W4) — 승인 후 Preview에서 KO/EN 헤드라인·보고서 표지 확인.
2. 판단 전환 방향 오류 수정 — "머물 이유" 조건을 고른 합성 사례에서 문장이 머무는 쪽으로 나오는지 화면 확인 + 단위 테스트.
3. 사실과 다른 고지 문구 4건 수정 — 2부 §9 목록과 화면 대조.
4. 레거시 경로 처리 결정(비공개 또는 차단) — 해당 URL 접근 시 V2로 이동하거나 404인지 확인.
5. 7.2 최소 조치: 모든 주제가 끝나기 전에는 보고서 인쇄를 막거나 "수집 중"으로 표기, 부분 근거 표기 — 실호출 1회로 확인.
6. PDF 07장 표시 넘침과 빈 페이지 수정 — 이번 PDF 매트릭스 재실행으로 확인.
7. 베타 참여자에게 데이터 처리 범위(2부 문서 기준)와 삭제 요청 방법(메일 + 기록 ID)을 서면 안내.
8. 소유자 콘솔 확인: Perplexity 잔액·자동 충전(비용 상한 역할 여부), Vercel 요금제(Hobby 비상업 조건 해당 여부).

### 공개 출시: **보류**

베타 조건에 더해 다음이 필요하다.
1. 개인정보처리방침·이용약관 작성(법률 검토) 및 연결 — 3부 §2 구조. 확인 불가 항목(§4)을 먼저 확인.
2. 보유 기간·삭제·연구 동의 철회 구현과 동의 기록(시각·문구 버전) — 3부 §3, 스키마 승인 필요.
3. AI 사용 안내(사전 고지·결과물 표시) — 3부 §1, 인공지능기본법 제31조·EU AI Act 제50조 적용 여부 법률 검토.
4. 검색 API 요청 제한(제출별 + 서비스 전체 일일 상한, 가능하면 WAF) — 3부 §4.
5. 7.2 전체: 결과 모드, 이벤트 정확성, 실패 주제 재검색.
6. 저장 대화상자 체크리스트(§3.5) 결과, 모바일·다른 브라우저 인쇄.
7. 9개 유형 실호출 표본(각 1회 이상 — 15회 상한 밖의 별도 승인 필요)과 성과·취업 주제의 503·지연 재발 여부.
8. 운영 빌드에서 Manus 런타임 제거 여부 결정.

### 검증 범위 밖 / 과거 결과 인용

- 9개 사례 유형 전체 동작: 2026-10-14 로컬 초안 경로 기록(인수인계 문서) 인용, 이번에 재검증 안 함. 실호출은 학위 1개 유형만.
- 모바일 375px: 2026-10-15 운영 점검 기록 인용, 이번에 재검증 안 함.
- 시뮬레이터 수용 기준(재평가·리셋·원본 근거 불변): 이번에 확인 안 함.
- FIFWM 원래 평가 연결(§7.3)·프레임워크 연결표: 이번 범위 아님.
- 운영 DB 왕복: 이번 실행의 `ops/track` 응답은 HTTP 200만 확인, 본문 `stored:true`는 확인 안 함(2026-10-14 기록 인용).

## 부록 A. 승인 대기 문구·수정안

### A-1. Posture·지시형 문구 (형식: 위치 / 현재 KO / 현재 EN / 문제 / 제안 KO / 제안 EN / 의미 보존)

Format: location / current KO / current EN / problem / proposed KO / proposed EN / meaning preserved. None of these change scoring, posture classification or framework meaning; they change display strings only.


**W1 (High).** `v2ReportPresentation.ts:114` (EN) and `:122` (KO), validate label. Shown at `V2ExecutiveBrief.tsx:139`, `V2Report.tsx:294,456`, `V2PathMap.tsx:68`, `V2Simulator.tsx:244`, `V2DecisionTrace.tsx:106`, the sensitivity table and engine switches.
- Current KO: `현재 계획 유지`
- Current EN: `Keep the current plan for now`
- Problem: reads as a stay/keep verdict. The same label is used even when the guardrail applies and opportunity evidence exists. It contradicts `V2ReadingGuide.tsx:11`.
- Proposed KO: `기반을 지키며 확인하는 쪽이 더 뒷받침됨`. Short alternative: `기반을 지키며 확인하는 단계`.
- Proposed EN: `Better supported: keeping your base while checking the new path`. Short alternative: `Keeping your base while checking`.
- Meaning preserved: yes. It restates the engine's own validate sentence (`amcProductApplicationV3.ts:400`). The utility handles the engine-switch frame correctly (`…뒷받침됨’으로` / `…단계’로`).


**W2 (Medium).** `v2ReportPresentation.ts:115` (EN), `:131-132` (KO), reconfigure label.
- Current KO: `안전 여유를 지키며 경로 조정`
- Current EN: `Adjust the path while protecting your margin`
- Problem: the EN is an imperative about the route, and is inconsistent with the transition label's reading form.
- Proposed KO: `안전 여유를 지키며 경로를 조정하는 쪽이 더 뒷받침됨`
- Proposed EN: `Better supported: adjusting the path while protecting your margin`
- Meaning preserved: yes (engine sentence `:394`).


**W3 (High).** `v2Readings.ts:24` and `trace/traceSchema.ts:183`, the posture question under the label.
- Current KO: `지금 조건에 가장 잘 맞는 움직임은 무엇인가요?`
- Current EN: `Which move fits your current conditions best?`
- Problem: makes the label read as "the best move" (a recommendation).
- Proposed KO: `지금 조건에서는 어느 방향이 더 잘 뒷받침되나요?`
- Proposed EN: `Under your current conditions, which direction is better supported?`
- Meaning preserved: yes.


**W4 (High).** `V2ScenarioExplain.tsx:41-42`.
- Current KO: `중간 구간 · 현재 계획 유지`
- Current EN: `Middle range · keep the current plan`
- Problem: imperative / verdict.
- Proposed KO: `중간 구간 · 기반을 지키며 확인하는 쪽`
- Proposed EN: `Middle range · keeping your base while checking`
- Meaning preserved: yes (same support band).


**W5 (Medium).** `amcProductApplicationV3.ts:410`, transition switch direction.
- Current KO: `${optionB} 쪽 근거가 유지되면 단계적으로 계속 옮겨 가고, 약해지면 투입을 줄여 현재 기반을 다시 지킵니다.`
- Current EN: `If it holds, keep moving in stages; if it weakens, scale back and protect your current base again.`
- Problem: states the decision for the customer.
- Proposed KO: `${optionB} 쪽 근거가 유지되면 단계적으로 옮겨 가는 쪽이 계속 뒷받침되고, 약해지면 투입을 줄이고 현재 기반을 지키는 쪽으로 판단이 돌아갑니다.`
- Proposed EN: `If it holds, moving in stages stays better supported; if it weakens, the reading shifts back toward scaling back and protecting your current base.`
- Meaning preserved: yes.


**W6 (Medium).** `amcProductApplicationV3.ts:413`.
- Current KO: `약해지면 현재 판단을 다시 보고, ${optionA} 쪽 기반을 더 단단히 지킵니다.`
- Current EN: `If it weakens, revisit the current reading and keep more of your footing in your current role.`
- Problem: "keep footing in current role" is an instruction to stay.
- Proposed KO: `약해지면 현재 판단을 다시 볼 조건이 되고, ${optionA} 쪽 기반을 더 지키는 쪽이 더 잘 뒷받침됩니다.`
- Proposed EN: `If it weakens, the current reading needs another look, and keeping more of your footing in your current role becomes better supported.`
- Meaning preserved: yes.


**W7 (Medium, EN only).** `amcProductApplicationV3.ts:346` (move) and `amcV2Analysis.ts:931` (changes).
- Current KO: `…을 유지하면서, …가 맞는지 실제 근거로 확인합니다.` / `…을 그만두지 않고, …확인합니다.` (OK, declarative)
- Current EN: `Keep your current role as your base while checking the new path against real evidence.` / `Stay in your current role and check, one small step at a time, what the new path requires.`
- Problem: EN imperatives to stay.
- Proposed KO: no change.
- Proposed EN: `Your current role stays the base while the new path is checked against real evidence.` / `Your current role continues while what the new path requires is checked one small step at a time.`
- Meaning preserved: yes.


**W8 (Low).** `v2ReportPresentation.ts:145`, KO play title.
- Current KO: `현재 계획을 유지하며 대안 확인`
- Current EN: `Test it alongside your current job`
- Problem: echoes the verdict-like phrase `현재 계획 유지`.
- Proposed KO: `현재 직무를 이어 가며 대안 확인`
- Proposed EN: no change.
- Meaning preserved: yes.


**W9 (Low).** `amcProductApplicationV3.ts:407-408`, guardrail switch.
- Current KO: `…보완할 방법이 확인될 때만 검토하세요.`
- Current EN: `Consider moving further only when the evidence supports it and …`
- Problem: instruction form on moving.
- Proposed KO: `…보완할 방법이 확인될 때에야 더 본격적으로 옮기는 것을 검토할 조건이 됩니다.`
- Proposed EN: `Moving further becomes worth considering only once the evidence supports it and …`
- Meaning preserved: yes.


**W10 (Low, EN only).** `amcProductApplicationV3.ts:349` and `amcV2Analysis.ts:949`, timing.
- Current KO: `돌아올 길이 분명해질 때까지 옮기는 시점을 늦춥니다.` / `옮길 날짜를 먼저 정하지 않고, …` (OK)
- Current EN: `Hold off on a fixed move date until the way back is clearer.` / `Do not fix a date first; set the timing once a way back (now X) is confirmed.`
- Problem: EN imperatives on move timing.
- Proposed KO: no change.
- Proposed EN: `The move date stays open until the way back is clearer.` / `No date is fixed first; timing is set once a way back (now X) is confirmed.`
- Meaning preserved: yes.


**W11 (High, prompt).** `server/externalIntelligenceV2Service.ts:204`, plus a new line after `:205`.
- Current KO/EN: `Korean text must read as natural Korean career guidance in polite form (~합니다/~하세요)…`
- Problem: invites `-하세요` imperatives and has no stay/leave ban. Provider text has no directive filter.
- Proposed text: `…in polite declarative form (~합니다). Use ~하세요 only for a preparation or checking step, never about whether to stay, leave, move, apply, enroll, start, quit or give up.` Add: `implication, whyItMatters and action must not tell the person to keep, leave, switch to, proceed with or give up a career option; describe what the fact means for the decision's conditions.`
- Meaning preserved: yes (research scope unchanged).


**W12 (Low, demo only).** `client/src/data/externalIntelligenceV2.ts:145` (KO), `:125` (EN).
- Current KO: `실제 제안과 보상 수준을 확인하는 동안 지금 소득을 지키세요.`
- Current EN: `Keep your income steady while you collect real offers and pay information.`
- Problem: implies "do not leave yet".
- Proposed KO: `실제 제안과 보상 수준을 확인하는 동안에는 소득이 이어지는지가 중요한 조건입니다.`
- Proposed EN: `While you collect real offers and pay information, whether your income continues is a key condition.`
- Meaning preserved: yes.


**W13 (Low, latent / not rendered).** `v2ReportPresentation.ts:124`, KO validate sentence.
- Current KO: `현재 계획을 유지하면서 ${optionB}에 필요한 외부 근거를 먼저 확인하세요. 지금 조건에서는 이 순서가 더 잘 뒷받침됩니다.`
- Current EN: n/a (EN keeps the engine sentence).
- Problem: an imperative stay instruction, live if any surface ever renders `.sentence`.
- Proposed KO: `지금 조건에서는 현재 기반을 지키면서 ${optionB}에 필요한 외부 근거를 먼저 확인하는 순서가 더 잘 뒷받침됩니다.`
- Proposed EN: n/a
- Meaning preserved: yes.


**W14 (Low, optional).** Section subtitle `V2Dashboard.tsx:398`, `V2Report.tsx:441`.
- Current KO: `목표는 그대로 두고 방법을 바꾸는 길` / `…방법 바꾸기` (OK)
- Current EN: `Keep the goal, change how you get there`
- Problem: imperative framing of the Changing concept.
- Proposed KO: no change.
- Proposed EN: `The goal stays; the way there can change`
- Meaning preserved: yes.


**W15 (Low, optional).** `v2Language.ts:271`, report subtitle.
- Current KO: `무엇을 확인하고 무엇을 할지`
- Current EN: `What to check, and what to do next`
- Problem: "what to do" sounds prescriptive.
- Proposed KO: `다음에 확인할 것과 판단이 바뀌는 조건`
- Proposed EN: `What to check next, and what would change the reading`
- Meaning preserved: yes.

**Non-directive fix for the same review (Low).** `v2EngineSwitches.ts:108`: the KO `시장 근거 근거 확인 전` duplication. Proposal: drop the label prefix when the level text already contains `근거`, or use `시장 근거: 확인 전`.

### A-2. 7.2 처리 상태·이벤트 변경안

- **State flow**
  - Add an explicit result mode, e.g. `resultMode: "complete" | "partial" | "collecting" | "draft_by_choice" | "draft_after_failure"`.
  - Either keep `processing` until every topic settles, or keep early open but treat the screen as "collecting". With early open: do not log `dashboard_generated` (or log a separate `dashboard_preview_opened`) until all topics settle, and disable Report/Print while `pendingAreas` is non-empty, or label the printout "수집 중 / still collecting".
  - Expose a "실패한 주제만 다시 검색 / Search the missing topics again" button when the result is live but partial. This is a show condition on the existing resume path.
  - Wrap the run in `try/finally` to reset `evidencePending` and the loading language, with a failure fallback.
  - Add a cancel option while processing ("기다리지 않고 초안 보기 / See the draft without waiting").
  - On "Edit search target", clear the stale failed snapshot.
  - Require a run-key match at `:905` before reusing a live snapshot.
  - Optionally `history.pushState` per phase, plus a `beforeunload` prompt during the questions and processing.
- **Events**
  - Fire `dashboard_generated` only when evidence settles (or on explicit draft), with `externalEvidenceMode` ∈ `live | partial | fallback` and a draft-reason enum: `customer_choice_before_search | customer_choice_after_failure`.
  - Record `not_checked` separately from `unavailable` at `full_intake_completed`.
  - Guard `full_intake_completed` and `openDashboard` with a ref.
  - Note that adding ops fields needs approval under handoff §12 (schema and contract change).
- **Customer copy**
  - On failure, make the headline and step label kind-specific. For example, for service/timeout: "검색을 끝내지 못했습니다 / The search could not finish".
  - Align the "1~2분" estimate with the real ceiling, or say "길면 몇 분 / up to a few minutes".
  - Label a partial live result in the status chip, e.g. "일부 주제만 확인됨 / Some topics confirmed".

### A-3. 사례 유형 변경안

1. Track `caseChosenBy: "inferred" | "customer"` instead of reusing `casePinned` for Begin.
   - Re-infer on edits only while the type is `inferred`. If inference later disagrees with a customer-chosen type, show a non-blocking hint ("적은 내용은 ‘X’에 더 가까워 보입니다").
   - Change the card heading when the type was chosen by the customer ("선택한 결정 유형 / The decision type you chose").
   - Make the trace note conditional on the same flag (`traceSchema.ts:98`).
2. In `v2WithCaseType`: no-op when `caseType` is unchanged, so the edited target is preserved. Only clear `publicSearchTarget` if it equals the old prefill.
3. On a type change, drop `keyFacts` entries whose question **wording differs** between the old and new sets. The simplest fix is to drop every key not in the new catalogue and every key whose question object differs.
4. Clear `evidenceByLanguage` and `topicRun` when `caseType` changes. Alternatively, have `v2PickEvidence` ignore snapshots whose `caseType !== state.caseType`. Add the key check at `:905`.
5. Optionally show the chosen type in the module sidebar and the dashboard header, so the customer can confirm it after setup. This is a display change, not a framework change.

### A-4. 코드 수정안 (승인 필요)

- 판단이 바뀌는 조건 방향: `amcProductApplicationV3.ts:405-414`에서 `index < 2` 대신 조건이 속한 쪽(‘더 나아갈 이유’/‘머물거나 기다릴 이유’, `amcV2Model.ts` switch 정의)으로 문장을 고른다. 점수·분류 변경 없음.
- 조사 유틸리티: 영어 단어 끝소리 규칙 보강(`-le`→ㄹ, 무성 파열음 끝 `-t/-k/-p` 등 → 받침), 판정 불확실 시 기존 중립형 `은(는)` 유지. `koreanParticle.ts:41-45`.
- 분석 계층 고객 라벨 끝 문장부호 정리를 엔진과 같게(`amcV2Analysis.ts:913-914,514`).
- 검색 대상 정리 규칙에 `진학` 등 학위 의도어 추가 여부 (`v2CaseInference.ts:134`) — 고객이 편집 가능하므로 낮음.
- JEV 예약 계수에 `submission_id` 조건 추가(`founderOpsStore.ts:210-211`) — 단 의도된 전체 상한인지 소유자 확인 먼저.
- 경로 조정 ‘중간 경로’ 자리에 근거 카드 제목을 넣지 않도록(`amcV2Analysis.ts:942-956`).


## 6. 추가 판단 (2026-10-16 오후): 지인에게 링크를 줄 수 있는가

### 이번 묶음 결과

| PR | 내용 | 테스트 | Preview 실검색 |
|---|---|---|---|
| #116 | 레거시 `/amc-web-mvp`·`/amc-interactive-v1`·옛 별칭 → V2, `external-snapshot` 410 | 543/543 | PASS (2호출, 근거 6, 4주제), 리디렉트·410 확인 |
| #117 | 판단 전환 방향 | 548/548 | PASS (2호출, 근거 5), "손실 위험 · 높음"이 머무름 쪽 문장 |
| #118 | 모든 주제 확정 후 `dashboard_generated`, 수집 중 인쇄·파일 저장 차단, 인쇄용 미완성 표시, 실패 주제 재검색 | 546/546 | 검색 PASS (2호출, 근거 9). 수집 중 인쇄 차단 화면은 Preview에서 포착 못 함 → 로컬 통합 QA에서 PASS |
| #119 | PDF 표시 넘침·빈 페이지·카드 잘림·실패 표기 | 548/548 | PASS (2호출, 근거 7), 화면 표시 넘침 0/24 |
| #120 | 운영 기록: 원문 필드·비대화형 요청·레거시 행 수정 거부 | 564/564 | 유료 호출 없음(Preview DB 없음) |
| #121 | 조사 뒤 금액 인식("2,220만 원입니다") | 557/557 | 유료 호출 없음(상한) |

- 실호출: 8/10. Preview는 운영 DB가 연결되어 있지 않아(`backend_unavailable`) 테스트 기록이 생기지 않았다.
- 6개 PR 로컬 통합: 충돌 1건(CSS, 해결), 606/606, `tsc` 통과.
- 통합 빌드 QA(유료 호출 없음, 실제 서버 코드 + 모의 공급자): 9개 유형 KO·6개 EN 초안, 모바일 375px, 근거 재생, 부분 실패 재검색, 전체 실패, 레거시 경로(클라이언트), 개인정보(138건 운영 기록 전부 저장 허용, 원문 0건) 모두 PASS. 보고서: `launch-check-2026-10-16/integration-qa/README.md`.

### 판단

| 상태 | 지인 공유 |
|---|---|
| 지금 운영(`2df6d9a`) 그대로 | **권장하지 않음** — 판단 전환 방향 오류, 수집 중 완료 처리, PDF 넘침, 금액 미표시, 레거시 원문 저장 경로가 그대로 있음 |
| #116~#121 릴리스 1회 배포 후 | **조건부 가능** (아래 조건) |
| 공개 출시 | **보류** (§5 공개 출시 조건 그대로) |

지인 공유 전 조건:
1. 릴리스 브랜치 Preview 통합 실검색 1회(2호출, 이번 상한 밖 — 별도 승인) 후 Production 1회 배포(merge-plan 문서).
2. Posture 헤드라인 "현재 계획 유지 / Keep the current plan for now"(W1·W3·W4) 결정 — 브랜드 원칙 §2.2와 충돌하는 가장 눈에 띄는 문구.
3. 사실과 다른 고지 문구 4건 결정("검색 대상만", "요청할 때만", "출처는 점수를 바꾸지 않습니다", KO/EN 불일치).
4. 지인에게 안내: 무료 시험판, 저장 범위(원문 비저장, 비식별 운영 기록), 외부 AI 검색 사용, 삭제 요청은 report@ + 기록 ID.
5. 소유자 콘솔 확인: Perplexity 잔액·자동 충전(검색 API에 요청 제한이 없으므로 링크가 퍼질 때 비용 상한 역할), Vercel Hobby 비상업 조건.

지인 시험에서 알려진 채로 둘 수 있는 것(공유 시 안내 권장): 일부 사례 유형 자동 추정 오류(고객이 바꿀 수 있음, 예: "burned out", "핀테크 스타트업 PM", "프리랜서"), Corporate Stay "놓치기 쉬운 조건" 문장 반복, PDF 9장 제목만 페이지 끝에 남는 경우, 모바일 비교표가 좁음, 부분 실패 시 대시보드에 실패 주제 표시 없음, 머무름 쪽 전환 문장 어색함(W6), 알 수 없는 주소의 영문 404.
