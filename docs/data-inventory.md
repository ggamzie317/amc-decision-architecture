# AMC 데이터 인벤토리 (개인정보처리방침·이용약관 검토용)

- 대상: `ggamzie317/amc-decision-architecture`, 앱 `manus-ui/`
- 기준 커밋: `main` `2df6d9ac3eddfa7e01eb6208a139d9fb6701be3c`
- 작성일: 2026-10-16
- 운영 도메인: `app.allofmycareer.com` (Vercel Production = `main`)
- 성격: 현재 실제 동작의 기록. 정책 문구 제안이나 코드 변경은 포함하지 않는다(3부에서 설계만 다룸).

## 0. 형식과 근거 표기

| 표기 | 의미 |
|---|---|
| **A** | 코드 확인 (파일·줄 번호는 `manus-ui/` 기준, 위 커밋) |
| **B** | 실행 관찰 (운영 응답 헤더, 로컬 합성 입력 실행) |
| **C** | 계정·콘솔 설정 확인 |
| **D** | 공식 문서 (확인일 2026-10-16) |
| **확인 불가** | 위 근거로 판단할 수 없음. 추정으로 채우지 않음 |

접근하지 못한 곳(C 근거 없음):
- Vercel 대시보드: 브라우저 세션이 로그아웃 상태이며, 비밀번호 입력은 하지 않았다. 로그 보존 설정, 함수 리전 설정, 환경변수 값, Deployment Protection 설정은 확인하지 못했다.
- Perplexity 계정 콘솔: 접근하지 않았다(ZDR 등 계정별 설정 확인 불가).
- Postgres 제공자 콘솔: 접근하지 않았다(제공자, 리전, 백업·보존 정책 확인 불가).

실행 관련:
- 이번 단계의 유료 Perplexity 호출: 0회. 로컬 실행은 `fetch`를 스텁으로 바꿔 네트워크 호출 없이 요청 본문만 캡처했다.
- 운영 DB 쓰기: 없음.

표면(surface) 구분 (A, `client/src/App.tsx:15-31`):

| 경로 | 화면 | 비고 |
|---|---|---|
| `/` | `/amc-interactive-v2`로 이동 | |
| `/amc-interactive-v2` | V2 (현재 제품) | 이 문서의 주 대상 |
| `/amc-web-mvp` | 레거시 MVP | 공개 접근 가능. 원문 답변 저장 (§1.4) |
| `/amc-interactive-v1` | 레거시 V1 | V2와 같은 저장 투영 사용 |
| `/amc-admin` | 운영자 화면 | 공유 비밀번호 |

서버 실행면 (A):
- Vercel 함수: `api/amc/**` (`ops/track`, `admin/*`, `external-intelligence-v2`, `external-snapshot`, `jev-scenario`)
- Express 서버 `server/index.ts`: 위 기능 + `/api/submissions*`, `/api/send-email`. 운영에서 실행되는지는 **확인 불가** (배포 설정에 Express를 지정하는 곳이 없고, `vercel.json`은 `api/` 함수만 다룸).

---

## 1. 저장되는 데이터 전체

### 1.1 운영 DB (Postgres)

- 드라이버 `postgres@3.4.9`, 연결 문자열 환경변수 `DATABASE_URL` (A, `server/founderOpsStore.ts:444`). 값은 확인하지 않았다.
- DB 제공자·리전·백업: **확인 불가** (C 미접근).
- 테이블 2개뿐 (A, `db/001_amc_founder_ops.sql`, `db/002_amc_usage_event_contract.sql`).

**`submissions`** (A, `001:3-30`)

| 컬럼 | 내용 | V2에서 실제 값 |
|---|---|---|
| `submission_id` | `AMC-YYYYMMDD-<8 hex>`, 서버 생성 (`founderOpsStore.ts:55-58`) | 저장 |
| `created_at`, `updated_at` | 서버 시각 | 저장 |
| `product_version`, `framework_version` | 코드 상수 | 저장 |
| `language` | `en`/`ko` | 저장 |
| `case_type` | 결정 유형 | 9개 enum만 (`shared/interactivePrivacy.ts:10-20`) |
| `current_stage` | 진행 단계 | 허용 목록만 |
| 단계별 시각 6개 | 미리보기 시작~인쇄 클릭 | 저장 |
| `external_evidence_mode` | `live`/`fallback`/`mock` | 저장 |
| `external_evidence_confidence` | | 항상 `null` |
| `service_storage_consent` | 불리언 | 항상 `true` (없으면 저장 거부) |
| `research_use_consent` | 불리언 | 체크 값 |
| `answers_json` | 원문 답변 | 항상 `{}` |
| `structural_output_json` | 파생 구조 | 허용 키만 (아래) |
| `external_evidence_json` | 근거 스냅샷 | 항상 `{}` |
| `missing_point`, `alternative_path` | 텍스트 | 항상 `null` |
| `decision_conditions_json` | | 항상 `[]` |
| `safety_margin_structured_data` | | `{band}`만 |
| `existing_fifwm_structured_data` | | 항상 `{}` |

V2 `structural_output_json` 허용 키 (A, `interactivePrivacy.ts:119-149`):
- `experienceVersion`, `intakeSchemaVersion` (상수)
- `baselineBands`: 7개 변수 × 구간(enum)
- `changingPlays[].family` (5개 enum, 최대 5) / `changingCount`
- `completedIntakeQuestionCount`
- `externalEvidenceStatus`: `live`/`unavailable`/`demo`
- `currentStructuralPosture.label` (6개 enum)
- `safetyMargin.band`
- `decisionSwitchCount` (0-20)

**`usage_events`** (A, `001:32-44`, `002:7-16`)

| 컬럼 | 내용 |
|---|---|
| `event_id` | 서버 UUID |
| `submission_id` | FK, **ON DELETE CASCADE** |
| `event_type` | 18개 허용 값 |
| `created_at` | 서버 시각 |
| `metadata_json` | 최대 4000 bytes. V2는 허용 키만 (§1.2) |

### 1.2 V2가 보내는 이벤트와 메타데이터 (A)

| 이벤트 | 위치 (`AmcInteractiveV2.tsx`) | 메타데이터 |
|---|---|---|
| `preview_started` | 1193-1201 (시작 버튼) | 식별 상수만 |
| `full_intake_started` | 1202-1205 | 식별 상수만 |
| `full_intake_completed` | 869-874 | 식별 상수만 |
| `external_evidence_requested` | 923-927 | `externalEvidenceMode:"checking"` |
| `external_evidence_live` / `_fallback` | 987-996 | 모드 |
| `dashboard_generated` | 825-839 | `selectedVariables` |
| `language_changed` | 881 | `from`/`to` |
| `detailed_report_opened` | 1411 | 식별 상수만 |
| 시뮬레이터 4종 | 1431-1437 | 변수명, 구간, 변경 여부 불리언 |
| `print_save_clicked` | 1489-1492 | 식별 상수만 |
| `jev_assessment_*` 3종 | 서버 작성 (`server/jevScenario.ts:197-214`) | 요청 지문(SHA-256), 또는 low/medium/high 3개 |

- 메타데이터 허용 목록: `shared/interactivePrivacy.ts:180-214` (A). 자유 텍스트 키 없음.
- 투영은 클라이언트(`AmcInteractiveV2.tsx:244-255`)와 서버(`server/founderOpsApi.ts:150-187`)에서 두 번 적용된다 (A).

**V2에서 DB에 저장되지 않는 것** (A, 위 투영 + `track()` 호출 내용):
- 현재 하는 일·고민하는 커리어 원문(`optionA`/`optionB`), 결정 문장
- 선택 메모(`optionalNote`), 직접 쓴 조건(`customCondition`)
- 자가 점검·근거 비교 응답 원문, 핵심 사실(`keyFacts`) 선택값
- 공개 자료 근거(카드 문장, URL, 요약)
- 이름, 이메일, IP, User-Agent (해당 컬럼 없음, 핸들러가 읽지 않음)

### 1.3 저장 경로의 인증 여부 (A)

- `POST /api/amc/ops/track`에는 인증이 없다 (`api/amc/ops/track.ts`, `server/vercelFounderOps.ts:99-129`).
- 서버 투영은 요청에 interactive 식별 표식이 있을 때만 적용된다 (`founderOpsApi.ts:150-153`).
- 표식이 없는 요청은 길이 제한(`sanitizePatch`, `founderOpsApi.ts:50-117`)만 거쳐 저장된다. 원문 답변 최대 29개 × 4000자, 메타데이터 4000 bytes 무필터.
- 즉 V2 화면을 쓰는 한 원문은 저장되지 않지만, **엔드포인트 자체는 원문을 받을 수 있다.**

### 1.4 레거시 `/amc-web-mvp` (공개 접근 가능, 같은 테이블) (A)

- 투영 없이 전송한다 (`AmcWebMvp.tsx:2653-2656`).
- `answers_json`: 전체 설문 원문 (`AmcWebMvp.tsx:2959-2969`).
- `structural_output_json`, `missing_point`, `alternative_path`, `decision_conditions_json` 등: 파생 결과. 고객 문장이 그대로 들어갈 수 있다 (`amcProductApplicationV3.ts:148-149, 357-364` 등). 경우별 정확한 키는 실행 없이 **확인 불가**.
- `external_evidence_json`: 외부 근거 스냅샷 전체.
- 이벤트 메타데이터: 무필터.
- 동의 문구도 V2와 다르다 (§8.4): "입력 내용이 저장될 수 있음에 동의".

### 1.5 식별자 (A)

| 식별자 | 생성 | 쓰이는 곳 |
|---|---|---|
| 제출 ID `AMC-YYYYMMDD-XXXXXXXX` | 서버 무작위 | DB 키, sessionStorage, JEV 요청 헤더, 리포트 화면 표시(`AmcInteractiveV2.tsx:1394`), 피드백 메일 링크 |
| 이벤트 ID | 서버 UUID | DB |
| 근거 `requestId` | 브라우저 UUID (레거시) | 이벤트 메타데이터 |
| 관리자 세션 쿠키 | 서버 HMAC | 관리자만 |

- 사용자 계정, 로그인, 사용자 테이블은 없다.

### 1.6 보존·삭제 (A)

- TTL, 정리 작업, cron, `DELETE` 문, 삭제 API가 코드 어디에도 없다 (`server/`, `api/`, `db/`, `scripts/`, `vercel.json` 검색).
- 고객이 자기 기록을 지우거나 연구 동의를 철회하는 경로가 없다.
- DB 콘솔에서 수동으로 하는 삭제·백업 보존: **확인 불가** (C 미접근).

### 1.7 관리자 접근 (A)

- 인증: 공유 비밀번호 1개(`AMC_ADMIN_PASSWORD`), 사용자 이름 없음. 세션 서명 키 `AMC_ADMIN_SESSION_SECRET` (`server/founderAdminAuth.ts`).
- 쿠키 `amc_founder_session`: HttpOnly, SameSite=Strict, 8시간, 운영에서 Secure. 무상태 토큰이라 만료 전 서버 측 폐기 불가.
- 감사 로그 없음. 관리자 API는 읽기 전용(조회·로그인·로그아웃).

| 관리자 API | 반환 |
|---|---|
| `admin/summary` | 집계. `mode=research`면 연구 동의 행만 |
| `admin/submissions` | 최대 500행, 메타데이터 컬럼만 |
| `admin/submission?id=` | 행 전체 + 이벤트. V1/V2 행은 재투영, **레거시 행은 원문 그대로** |
| `admin/export?mode=full` | CSV 최대 10,000행, 파일명 `amc-full-responses-sensitive.csv`. 레거시 원문 포함 |
| `admin/launch`, `admin/health` | 운영 집계, DB 상태 |

### 1.8 이메일 (A)

**운영자 알림** (`server/founderNotification.ts`):
- 시점: `dashboard_generated` 저장 직후.
- 수신: 고정 `report@allofmycareer.com`.
- 내용: 제출 ID, 언어, 결정 유형, 설문 완료 여부, 근거 모드, 연구 동의 Yes/No, 시각. 고객 문장 없음.
- 켜짐 조건: `AMC_FOUNDER_NOTIFICATIONS_ENABLED=true` + `AMC_SMTP_HOST/PORT/USER/PASS`, `AMC_EMAIL_FROM`. 운영 값: **확인 불가** (C). 이전 세션에서 해당 메일 수신을 사용자가 확인함.
- SMTP 제공자: 환경변수 값 미확인으로 **확인 불가**.

**고객 리포트 메일** (`server/emailSender.ts`, `server/amcSubmissionBridge.ts`):
- Express 서버 전용. 고객 이메일·이름·원문 답변을 `output/submissions/<id>/`에 파일로 쓴다.
- Vercel 함수가 없고 V2 클라이언트가 호출하지 않는다.
- 운영에서 실행 여부: **확인 불가** (위 서버 실행면 참조).

### 1.9 그 밖의 서버 저장소 (A)

- 외부 캐시·큐·KV·Blob: 없음.
- 프로세스 메모리 `Map`: JEV 중복 요청 방지(최대 32), 요청 단위 근거 맵.
- 에러 추적 SDK(Sentry 등): 없음.

---

## 2. 로그

### 2.1 앱이 남기는 서버 로그 (A, 전수)

| 위치 | 경로 | 내용 | 고객 문장 | ID |
|---|---|---|---|---|
| `server/providerObservation.ts:37-39` `amc_external_evidence` | external-intelligence-v2, external-snapshot | 제공자, 프리셋, 상태, 사유 코드, 지연, 진단 enum, 상위 HTTP 상태, 요청 형태(결정 유형, 언어, 영역 id, 핵심 사실 개수, **대상·지역 글자 수만**) | 없음 | 없음 |
| `server/jevScenario.ts:194` `amc_jev_contract_shape` | jev-scenario | 거부된 응답의 키 이름 | 없음 | 없음 |
| `server/jevScenario.ts:212` `amc_jev_unavailable` | jev-scenario | 단계 라벨 | 없음 | 없음 |
| `server/index.ts:139,143` | Express만 | 시작 메시지 | 없음 | 없음 |

- `ops/track`, `admin/*`, `external-snapshot` 핸들러에는 로그 호출이 없다.
- B (합성 실행): 로그 한 줄 예시는 §3.1의 관찰 기록 참조. 대상 문자열 대신 `targetLength`만 찍혔다.

### 2.2 플랫폼 로그 (Vercel)

- D (Vercel Runtime Logs 문서, 최종 수정 2026-08-28): 런타임 로그에는 요청 경로, User-Agent, 쿼리 파라미터, 리전, `console` 출력이 포함된다. 보존 기간은 Hobby 1시간, Pro 1일, Pro + Observability Plus 30일, Enterprise 3일.
- C (현재 요금제와 실제 보존 설정): **확인 불가**. 이전 세션 대시보드 화면에서 Hobby로 보였으나, 이번 단계에서 재확인하지 못했다.
- 요청 IP가 플랫폼 로그에 남는지, 본문이 남는지: **확인 불가** (D 문서에 IP 항목이 명시되지 않음; 본문은 앱이 `console`로 찍지 않으므로 코드 경로로는 남지 않음).
- 앱 응답 헤더 `X-AMC-Evidence-*`는 enum 진단값만 브라우저로 보낸다 (A, `api/amc/external-intelligence-v2.ts:82-89`).

---

## 3. 외부 전송과 처리 위치

### 3.1 Perplexity Agent API (공개 자료 검색)

| 항목 | 값 | 근거 |
|---|---|---|
| 호출 주체 | 서버 (`/api/amc/external-intelligence-v2` → Perplexity) | A |
| 엔드포인트 | `POST https://api.perplexity.ai/v1/agent` | A, `server/externalIntelligenceV2Service.ts:369-371` |
| 인증 | `PERPLEXITY_API_KEY`, 없으면 `PPLX_API_KEY` | A (값 미확인) |
| 프리셋 | `PERPLEXITY_V2_AGENT_PRESET` 또는 기본 `medium`. `model` 필드는 보내지 않음 | A, L254-257 |
| 호출 수 | 1회 검색이 최대 4개 주제 그룹으로 나뉨. 브라우저도 주제별로 요청하고, 결과 없는 주제는 1회 재시도. 서버는 HTTP 429만 최대 2회 재시도 | A |
| 시간 제한 | 서버 240초, 브라우저 270초 | A |

**전송되는 고객 유래 데이터** (A, `shared/externalIntelligenceV2Request.ts:102-152`):

| 필드 | 성격 |
|---|---|
| `caseType` | enum (고객 문장에서 규칙으로 추론, 고객이 확인·변경 가능) |
| `externalAreas` | 고정 목록에서 고른 영역 id |
| `targetGeography` | **자유 텍스트 최대 80자.** 장소 표에서 미리 채움, 한국어 사용자는 비어 있으면 `한국` (`AmcInteractiveV2.tsx:1191`) |
| `targetLabel` (`boundedOptionBTargetLabel`) | **자유 텍스트 최대 120자.** 고객의 "고민하는 커리어" 원문에서 접속어·의도어 몇 개만 제거해 미리 채움 (`v2CaseInference.ts:126-138`). 개인정보 필터가 아니다. 이름·회사명은 고객이 직접 지우지 않으면 그대로 간다 |
| `language` | `en`/`ko` |
| `keyFacts` | 객관식 선택 id. Perplexity에는 고정 영어 힌트 문장으로 변환되어 감 |

- 서버는 위 6개 외의 키가 있으면 요청 전체를 거부한다. B: 합성 요청에 `optionalNote`를 추가하자 `null`로 거부됨.
- **보내지 않는 것** (A): 결정 문장, 현재 하는 일 원문, 고민하는 커리어 원문(편집 가능한 파생 대상만), 메모, 직접 쓴 조건, 구간·자가 점검 응답, 동의 값, 제출 ID.

B (합성 실행, 네트워크 스텁): 입력 "싱가포르 핀테크 회사로 이직하여 가족과 함께 생활 추진" → 전송 대상 `싱가포르 핀테크 회사로 이직`, 지역 `싱가포르`. 합성 메모·조건에 넣은 표식 문자열은 어떤 요청에도 나타나지 않았다. 호출은 3개 그룹으로 나뉘었다.

처리 위치·보존 (D, Perplexity API 개인정보 페이지, 날짜 표기 없음, 2026-10-16 확인):
- API 고객 콘텐츠를 모델 학습에 쓰지 않는다고 명시.
- 보존 기간은 API·모델·계정 설정에 따라 다르다고만 기재. 구체 기간 없음.
- API 키를 포함한 사용 메타데이터를 수집.
- Zero Data Retention은 기본값이 아님.
- 처리 국가·리전: 명시 없음.
- 이 계정의 ZDR·보존 설정: **확인 불가** (C 미접근).

### 3.2 공개 출처 확인 요청 (서버 → 제3자 웹사이트)

- A (`server/publicSourceAvailability.ts`): 모델이 인용한 URL마다(그 응답의 검색 결과에 있는 것만) 서버가 `GET`, `Range: bytes=0-4095`, `User-Agent: AMC-Evidence-Source-Check/1.0`.
- 쿠키·인증·고객 데이터 없음. 사설 IP 차단, 리다이렉트 최대 3회, 건당 4초, 전체 12초.
- 상대 사이트에는 Vercel 함수의 출구 IP와 위 User-Agent가 보인다.

### 3.3 JEV 보조 판단 (Vercel AI Gateway)

| 항목 | 값 | 근거 |
|---|---|---|
| 엔드포인트 | `POST https://ai-gateway.vercel.sh/typesafe/v1/systemone`, 모델 `typesafe-ai/jev` | A, `server/jevScenario.ts:145-164` |
| 인증 | `AI_GATEWAY_API_KEY`, 없으면 Vercel OIDC 토큰 | A |
| 켜짐 조건 | `AMC_JEV_V2_ENABLED=true` 또는 특정 프리뷰 브랜치 | A. 운영 값은 이전 세션에서 `true`로 확인(C, 당시) — 이번 단계 재확인 못함 |
| 전송 내용 | 결정 유형, 구간 값, 국면 라벨, 안전 여유 구간, 변경 계열, 고정 질문 문장. strict 스키마라 자유 텍스트 불가 | A |
| 제출 ID | 본문에 없음. DB 조회와 SHA-256 지문에만 사용 | A |
| 저장 | 요청 지문, 성공 시 low/medium/high 3개 | A |

- 게이트웨이 뒤 실제 처리 사업자·위치·보존: **확인 불가** (D 미확인, C 미접근).
- 발견 사항(보고만, 수정 안 함): 호출 한도 검사가 제출별이 아니라 전체 제출 합산으로 6회를 센다 (`server/founderOpsStore.ts:210-211`). 실제로는 서비스 전체에서 JEV가 6회까지만 호출될 수 있다.

### 3.4 그 밖의 외부 연결

| 대상 | 주체 | 전송 내용 | 근거 |
|---|---|---|---|
| Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`) | 브라우저, 모든 페이지 로드 | 브라우저 기본 요청 정보(IP, User-Agent, Referer 정책에 따름). 앱 데이터 없음 | A, `client/index.html:19-21` |
| SMTP 서버 | 서버 | 운영자 알림 (§1.8) | A |
| 메일 앱 (`mailto:report@allofmycareer.com`) | 고객이 직접 보낼 때만 | 고정 제목·본문 + 제출 ID | A, `client/src/data/v2Feedback.ts` |
| Manus 런타임 스크립트 | 브라우저, 운영 빌드에 인라인 | §6.3 참조 | A |

### 3.5 레거시 V1 검색 경로 (공개 함수)

- `api/amc/external-snapshot.ts`는 배포된 Vercel 함수다 (A).
- 현재하는 일·고민하는 커리어 원문(최대 240자), 결정 문장, 외부 압력·확인 필요 사항(최대 1200자) 등 **자유 텍스트를 Perplexity에 보낸다** (A, `server/externalSnapshotService.ts:127-152, 210`).
- V2 화면은 호출하지 않지만 `/amc-web-mvp`에서 호출되며 엔드포인트는 공개되어 있다.

### 3.6 처리 위치 요약

| 처리자 | 위치 | 근거 |
|---|---|---|
| Vercel 함수 | `iad1` (미국 동부, 워싱턴 D.C.) | B: 운영 응답 헤더 `x-vercel-id`에 `::iad1::`. A: `vercel.json`에 `regions` 없음. D: 신규 프로젝트 기본 리전 `iad1` (문서 최종 수정 2026-08-11) |
| Vercel 정적 자산·CDN | 사용자와 가까운 엣지 | B: 헤더 첫 구간이 엣지 위치(관찰 시 `cle1`) |
| Postgres | **확인 불가** | C 미접근 |
| Perplexity | **확인 불가** | D에 명시 없음 |
| Vercel AI Gateway / JEV 모델 | **확인 불가** | |
| SMTP | **확인 불가** | 환경변수 값 미확인 |
| Google Fonts | Google | A |

---

## 4. 연구 동의 (선택)

- 위치: 시작 화면 `AmcInteractiveV2.tsx:1167-1174`. 기본값 해제 (`amcV2Model.ts:247`). 선택 사항 (A).
- 저장: `research_use_consent` 불리언만. 동의 시각, 문구 버전, 문구 원문은 저장하지 않는다 (A, 해당 컬럼 없음).
- 시작 후 바꾸는 UI 없음. 철회 경로 없음 (A).

**동의 여부에 따라 달라지는 것** (A):

| 구분 | 동의 O | 동의 X |
|---|---|---|
| 고객 화면·분석·리포트 | 차이 없음 | 차이 없음 |
| 저장되는 필드 | 같음 (불리언 값만 다름) | 같음 |
| 외부 전송 | 같음 | 같음 |
| 관리자 연구 집계 (`mode=research`) | 포함 | 제외 |
| 관리자 운영 집계·상세·전체 CSV | 포함 | **포함** |
| 운영자 알림 메일 | "Research Consent: Yes" | "No" |

즉 연구 동의는 현재 **수집 범위를 바꾸지 않고**, 관리자 화면의 연구용 필터에만 쓰인다.

---

## 5. 서비스 동의 (필수)와 수집 시점

- 위치: `AmcInteractiveV2.tsx:1159-1166`. 기본 해제. 체크하지 않으면 시작 버튼 비활성 (`:1178-1182`) (A).
- 동의 전 수집 차단 3중 (A): 화면 `track()` (`:238`), 클라이언트 추적기 (`amcFounderOps.ts:110-113`), 서버 (`founderOpsApi.ts:120-121`).
- 동의 전에는 sessionStorage 쓰기도, 운영 요청도 없다 (A).
- B: 운영 페이지 첫 로드 시 Set-Cookie 없음.
- 서버는 클라이언트가 보낸 `serviceStorageConsent:true`를 그대로 믿는다. 별도 검증 없음 (A).
- 데모 모드(`?demo=1`)는 추적·검색 모두 꺼짐 (A).
- 공개 자료 검색 엔드포인트 자체에는 동의 검사가 없다. 화면상으로는 시작 후에만 도달한다 (A, `:889-897`).

---

## 6. 브라우저 저장소와 분석 도구

### 6.1 저장소 (A)

| 키 | 종류 | 값 | 기록 시점 | 삭제 | 전송 |
|---|---|---|---|---|---|
| `amc_launch_v3_active_submission_id_interactive-v2` | sessionStorage | 제출 ID | 서버가 저장 성공을 응답한 뒤 | 새 여정 시작, 실패, 탭 종료 | 운영 요청 본문, JEV 헤더 |
| `amc_launch_v3_active_journey_status_interactive-v2` | sessionStorage | `active`/`completed` | 같음 | 같음 | 없음 |
| `amc_launch_v3_submission_id` | localStorage | — | 쓰지 않음, 매 요청마다 삭제만 | — | — |
| `amc-trace-personal:<제출 ID 또는 local-해시>` | **localStorage** | 결론 추적 화면의 단계별 **자유 메모(단계당 최대 600자)**, 별표·숨김·접힘 | 입력할 때마다 | "메모 모두 지우기" 클릭 시 현재 키만 | 없음 (로컬 HTML 내보내기, 인쇄에만 포함) |
| (레거시) 네임스페이스 없는 키, `_interactive-v1` 키 | sessionStorage | 같은 형식 | 레거시 화면 | | |

- `amc-trace-personal`:
  - 만료·자동 정리 없음. 동의 게이트 없음(데모에서도 동작).
  - 제출 ID가 없을 때 키는 `결정 유형|현재 하는 일|고민하는 커리어`의 32비트 해시다 (`trace/V2DecisionTrace.tsx:23-28`). 원문은 키에 없지만 짧은 원문의 짧은 해시다.
  - **충돌**: 인수인계 문서 §12와 상충 (0단계 보고에서 이미 보고함). 변경하지 않았다.
- IndexedDB, Cache API, Service Worker, sendBeacon: 없음 (A).
- `theme` localStorage: `switchable`이 꺼져 있어 쓰지 않음 (A).
- `sidebar_state` 쿠키: 컴포넌트를 아무 곳에서도 import하지 않아 설정되지 않음 (A).

### 6.2 쿠키

- 고객 대상 쿠키: 앱 코드상 없음 (A). 운영 첫 로드에서 Set-Cookie 없음 (B).
- 관리자 쿠키 `amc_founder_session`: §1.7.
- Vercel 플랫폼이 붙이는 쿠키: 관찰 시 없음 (B). Deployment Protection 설정은 **확인 불가** (C).

### 6.3 운영 빌드에 포함된 Manus 런타임 스크립트

- `vite.config.ts:153`의 `vitePluginManusRuntime()`(0.0.57)이 운영 빌드의 `index.html`에도 스크립트를 인라인한다 (A; 이 체크아웃엔 `node_modules`가 없어 같은 버전을 다른 worktree에서 확인).
- 포함 동작 (A, 압축 코드 확인):
  - localStorage `manus-runtime-user-info` 읽기 → 오류 보고 시 `window.parent.postMessage(..., "*")`로 현재 URL과 함께 전송
  - `setCookie` 메시지를 받으면 `document.cookie`에 기록. 메시지 출처(`event.origin`) 검사 없음
  - URL 변경·이탈 등도 부모 창에 `"*"`로 전송
- 이 메시지들은 페이지가 iframe에 들어 있을 때만 다른 창에 닿는다. 최상위 창에서 런타임이 초기화되는지는 실행 확인하지 않음 (**NOT TESTED**).

### 6.4 분석 도구

- 제3자 분석 SDK 없음. Umami는 주석으로 비활성 (A, `client/index.html:44-48`).
- 1자 수집은 §1.2의 운영 이벤트뿐.
- 개발 서버 전용 디버그 수집기(콘솔·네트워크·세션 리플레이)는 운영 빌드에서 주입되지 않음 (A, `vite.config.ts:81-98`). 파일 `client/public/__manus__/debug-collector.js`는 빌드 산출물에 복사되지만 로드하는 곳이 없음.

---

## 7. AI가 만든 문장이 고객에게 보이는 지점

### 7.1 AI 출처

| 출처 | 고객에게 가는 것 |
|---|---|
| Perplexity | 근거 카드 제목, 사실, 왜 중요한가, 할 일, 기간(영·한 동시 생성), 기회·마찰·불확실 문장, 전체 함의 |
| JEV | low/medium/high 라벨 5개만. 설명 문장은 서버의 고정 영어 문장이며 한국어 화면에서는 숨김 |

### 7.2 AI 문장에 적용되는 검사 (A)

- 인용 표시 제거, 길이 제한 (초과 시 주제 응답 전체 실패 또는 해당 필드 제외).
- 카드 출처 URL은 해당 응답의 검색 결과에 있어야 하고, 서버 확인 요청에서 열려야 함.
- 화면 언어와 맞지 않는 카드는 제외.
- 카드가 하나라도 제외되면 요약 문장은 고정 문장으로 교체.
- 브라우저에서 한 번 더 형식 검사.
- 서버 DB에는 저장되지 않음. 브라우저 메모리에만 있음.

### 7.3 표시 위치 (A)

- 대시보드 (`V2Dashboard.tsx`): 카드, 출처, 신호 문장
- 리포트·PDF (`V2Report.tsx`): 카드, 출처, 기간, 불확실 문장, 첫 발견의 함의
- 인사이트 보드, 분석 화면, 근거 비교표, 요약 브리프, 프레임워크 계획, 경로 지도, 시나리오 설명, 지표 프로필
- 결론 추적 (`trace/V2DecisionTrace.tsx:185-186`)

### 7.4 고정 템플릿 문장 안에 AI 문장이 들어가는 곳 (A)

- 카드 제목·사실의 첫 구절(한국어 50자, 영어 80자)을 따옴표로 넣는 곳: 발견의 함의, 확인 항목, 해석 (`amcV2Analysis.ts:551-670, 763-772`), 계속 조건 (`:987`), 프레임워크 단계 (`:942-956`), 실험 행동 (`:1066, 1081-1082`).
- 외부 읽기 문장 = AI 함의 그대로 (`:709`).

### 7.5 AI 선택값이 점수 입력을 바꾸는 곳 (A)

- 모델이 고른 신뢰도(low/medium/high)와 카드 방향(supportive/caution)이 엔진의 `externalValidation` 구간을 바꾼다 (`v2ExternalContext.ts:7-30`, `amcCurrentCaseStructuralSignals.ts:42-52`).
- 요청한 모든 주제에 확인된 카드가 있을 때만 적용 (소유자 규칙).
- 화면 문구 "출처는 점수를 바꾸지 않습니다 / Sources do not change scores" (`V2Processing.tsx:123`)와 **충돌**한다 (§9 참조).

### 7.6 AI가 아닌 것 (A)

- 규칙 엔진(국면, 안전 여유, 변경안, 전환), V2 분석 템플릿, 결정 유형·지역·검색 대상 추론 규칙, 역할 필드 용어집 번역, 핵심 사실 문장, JEV 라벨과 안내문.

---

## 8. 동의·고지 문구 원문 (KO / EN)

언어 선택: `?lang=ko`, 없으면 브라우저 언어가 `ko`로 시작할 때 KO, 그 외 EN. 한글 입력 시 KO로 전환 (A, `AmcInteractiveV2.tsx:108-114, 181-183`). 아래 문구는 모두 KO/EN 쌍이 있고 선택된 언어만 표시된다.

### 8.1 서비스 동의 (필수) — `v2Language.ts:19`, 화면 `AmcInteractiveV2.tsx:1159-1166`

- KO: 작성한 답변 원문은 저장되지 않습니다. 개인을 알아볼 수 없게 처리한 분석 결과와 서비스 이용 기록을 저장하는 데 동의합니다.
- EN: I agree that de-identified analysis results and service usage may be stored. My written answers are not stored.

### 8.2 연구 동의 (선택) — `v2Language.ts:20`, 화면 `:1167-1174`

- KO: 선택: 개인을 알아볼 수 없게 처리한 결정 패턴을 집계 연구에 쓰는 데 동의합니다.
- EN: Optional: my de-identified decision patterns may be used in aggregated research.

### 8.3 개인정보 안내 (시작 화면 `:1158`, 설문 사이드바 `:1239`) — `v2Language.ts:21`

- KO: 작성한 답변 원문은 allofmycareer에 저장되지 않습니다. 공개 자료 검색은 요청할 때만 실행합니다. 이때 검색 대상과 지역 등 결정에 필요한 일부 내용이 외부 AI·검색 서비스로 전달됩니다. 회사 기밀이나 민감한 개인정보는 입력하지 마세요.
- EN: allofmycareer does not store your written answers. Public search runs only when you ask for it. It then sends the search target, the place and a few decision details to an outside AI and search service. Do not enter confidential company information or sensitive personal data.

시작 화면 방법 항목 (`AmcInteractiveV2.tsx:1079`):
- 제목 KO: 답변 원문은 저장하지 않음 / EN: Your words stay private
- KO: 작성한 답변 원문은 저장하지 않습니다. 검색에는 검색 대상만 씁니다.
- EN: Your written answers are not stored. Only the search target is used to search.

### 8.4 검색 대상 안내 (설문 3단계, `AmcInteractiveV2.tsx:606-610`)

- KO: 위에서 고른 주제를 먼저 찾고, 이 결정 유형에서 기본으로 보는 주제도 함께 찾습니다. 예를 들어 해외 이주라면 비자, 채용 수요, 급여, 생활비를 봅니다. 검색 대상과 지역은 처음에 적은 ‘고민하는 커리어’로 미리 채워 두었습니다. 마지막 단계에서 이 내용으로 공개 자료를 찾습니다. 다르면 고쳐 주시고, 회사 기밀이나 개인정보가 있으면 지워 주세요. 점검 메모와 재정 정보는 검색에 쓰지 않습니다.
- EN: We look up the topics you picked first, plus the standard topics for this kind of decision. For a move abroad, that means visas, hiring demand, pay and living costs. The search target and place were filled in from the career you are considering. The final step searches public sources with them. Edit them if needed, and remove any confidential or personal details. Your check notes and financial answers are never used in the search.

### 8.5 근거 전송 고지 (대시보드, `V2Dashboard.tsx:110`, `v2Language.ts:132-135`)

- KO: 공개 검색 주제, 선택한 확인 항목, 대상 지역(입력한 경우)이 allofmycareer에 연결된 검색 제공자에게 전달됩니다. 개인 메모와 내부 재정·준비 조건은 전송하지 않으며, 작성한 답변 원문은 allofmycareer에 저장하지 않습니다. 검색 주제에는 공개된 직무·기관·산업 키워드를 사용하세요.
- EN: Public search sends the visible search topic, selected areas and geography (if given) to allofmycareer's connected search provider. Personal notes and internal financial or readiness conditions are not sent. allofmycareer does not store your written answers.

### 8.6 처리 화면 (`V2Processing.tsx`)

| 위치 | KO | EN |
|---|---|---|
| 1단계 (`:121`) | 필수 답변과 동의를 확인했습니다 | Required answers and consent are in place |
| 2단계 (`:122`) | 검색 대상만으로 검색하고, 인용한 페이지가 실제로 열리는지 확인합니다 | We search with the target only, then check that each cited page opens |
| 3단계 (`:123`) | 근거를 내 조건 옆에 놓습니다. 출처는 점수를 바꾸지 않습니다 | Evidence sits next to your answers. Sources do not change scores |
| 방법 노트 (`:243-248`) | 공개 자료는 확인할 수 있는 출처가 있을 때만 사용합니다. 작성하신 원문은 저장하지 않습니다. | Public evidence is used only with a verifiable source. Your written answers are not stored. |
| 실패 안내 (`:190-195`) | 다시 검색하거나 검색 대상을 고칠 수 있습니다. 검색 없이 본 초안을 볼 수도 있으며, 이때 결과에 ‘검색 없이 본 초안’으로 표시됩니다. | You can search again or edit the search target. You can also see a draft without public search. It will be marked as a draft. |

### 8.7 면책·하단 문구

사이트 하단 (`AmcInteractiveV2.tsx:1456-1468`, **리포트 단계에서는 숨김**):
- KO: allofmycareer는 결정을 대신하거나 특정 진로를 권하지 않습니다. 결과는 입력한 조건과 확인된 공개 자료에 따른 구조적 해석이며, 법률·세무·의료·이민·재무 자문이 아닙니다.
- EN: allofmycareer does not decide for you or recommend a path. Results are a structural reading of your inputs and verified public evidence, not legal, tax, medical, immigration or financial advice.

리포트 브리프 (`V2Report.tsx:324-329`):
- KO: 이 분석은 결정을 대신하지 않습니다. 지금 무엇을 지켜야 하는지, 어떤 근거가 생기면 다음 단계를 검토할 수 있는지 보여 줍니다.
- EN: This brief does not decide for you. It shows what to protect now and which evidence would make the next step worth reviewing.

리포트 출처 페이지 (`V2Report.tsx:540-543`):
- KO: 출처에 접속할 수 있다고 해서 내용이 검증된 것은 아닙니다. 자료의 표본·시점·지역이 내 목표와 맞는지 비교해 보세요.
- EN: A reachable source is not a verified claim. Check whether its sample, timing and region match your target.

결론 추적 하단 (`trace/V2DecisionTrace.tsx:214-217`):
- KO: 이 화면은 이미 계산된 분석 결과를 읽기만 합니다. 결정을 대신하거나 확률을 말하지 않습니다.
- EN: This view only reads the analysis that was already calculated. It does not decide for you or state probabilities.

결론 추적 메모 안내 (`trace/V2DecisionTrace.tsx:135, 205, 113`):
- KO: 메모·별표·숨기기는 이 기기의 브라우저에만 저장되며 서버로 보내지 않습니다. 공용 컴퓨터라면 ‘메모 모두 지우기’를 눌러 주세요. / 내 메모 (이 브라우저에만 저장) / 메모 모두 지우기
- EN: Notes, stars and hidden steps are saved only in this device's browser and never sent to a server. On a shared computer, use ‘Clear my notes’. / My note (saved in this browser only) / Clear my notes

JEV 안내 (`V2JevAdvisory.tsx:72, 89-92`):
- KO: JEV 보조 판단 · 참고용 / JEV는 바꾼 조건을 말로 풀어 본 참고 의견입니다. allofmycareer의 판단과 점수는 바뀌지 않습니다.
- EN: JEV advisory · for reference / JEV gives a descriptive second opinion on the changed conditions, for reference only. It does not change the allofmycareer reading or scores.

피드백 (`AmcInteractiveV2.tsx:1441-1455`):
- KO: 써 보신 의견을 들려주세요 / 도움이 된 부분, 이해하기 어려웠던 부분, 빠졌다고 느낀 근거를 알려 주세요. 메일 앱이 열리며, 보내기 전까지 아무것도 전송되지 않습니다.
- EN: Tell us how it worked for you / What helped, what was hard to follow, and which evidence felt missing. Your email app opens; nothing is sent until you send it.

### 8.8 레거시 화면 서비스 동의 (`AmcWebMvp.tsx:3765-3768`)

`/amc-web-mvp`:
- KO: 리포트 생성, 서비스 운영 및 allofmycareer 개선을 위해 입력 내용이 저장될 수 있음에 동의합니다. 회사 기밀이나 민감한 개인정보는 입력하지 않겠습니다.
- EN: I agree that my responses may be stored to generate my report, operate the service, and improve allofmycareer. I will not enter confidential company information or sensitive personal data.

`/amc-interactive-v1`:
- KO: 작성한 답변은 현재 세션에만 유지됩니다. 비식별 구조 결과와 서비스 활동 정보 저장에 동의합니다.
- EN: My written answers stay in this session. I agree to storage of de-identified structural results and service activity.

### 8.9 정책·약관 링크

- V2 시작 화면, 하단, 동의 문구 어디에도 개인정보처리방침·이용약관 링크가 없다 (A).
- `/privacy`, `/terms` 경로는 존재하지 않으며 SPA 기본 화면으로 처리된다 (A, `vercel.json` rewrite + `App.tsx` 라우트 없음).

---

## 9. 하지 말아야 할 일 (현재 실제 동작과 다른 표현·조치)

정책·약관·화면 문구를 쓸 때 아래는 현재 코드 기준으로 사실이 아니거나 근거가 없다. 바꾸려면 코드나 설정 변경이 먼저이며, 그 변경은 소유자 승인 대상이다.

**문구에서 하지 말 것**
1. "검색에는 검색 대상만 쓴다"라고 쓰지 말 것. 실제로는 결정 유형, 영역, 지역, 대상, 언어, 핵심 사실 힌트가 간다 (§3.1). 현재 `AmcInteractiveV2.tsx:1079`, `V2Processing.tsx:122`가 이 표현을 쓴다.
2. "요청할 때만 검색한다"라고 쓰지 말 것. 설문 완료 시 대상과 지역이 있으면 자동 검색되고, 한국어 사용자는 지역이 `한국`으로 채워진다 (A, `:875, :1191`).
3. "출처는 점수를 바꾸지 않는다"라고 쓰지 말 것. 모든 주제가 확인되면 모델의 신뢰도·방향 선택이 `externalValidation` 구간을 바꾼다 (§7.5).
4. 고객 데이터의 보존 기간을 명시하지 말 것. 코드상 삭제가 없어 기간이 정해져 있지 않다 (§1.6).
5. "삭제·철회를 요청할 수 있다"를 기능처럼 쓰지 말 것. 경로가 없다 (§1.6, §4).
6. 연구 동의가 수집 범위를 바꾼다고 쓰지 말 것. 저장·전송은 같고 관리자 필터만 다르다 (§4).
7. Perplexity·AI Gateway·DB·SMTP의 처리 국가나 보존 기간을 단정하지 말 것. 확인 불가다 (§3.6). Vercel 함수 리전 `iad1`(미국)만 관찰 근거가 있다.
8. Perplexity가 데이터를 보관하지 않는다고 쓰지 말 것. 공식 문서상 ZDR은 기본값이 아니고 이 계정 설정은 미확인이다 (§3.1).
9. "IP를 수집하지 않는다"를 서비스 전체에 대해 단정하지 말 것. 앱 DB에는 없지만 Vercel 플랫폼 로그와 Google Fonts 요청은 별개다 (§2.2, §3.4).
10. "모든 화면에서 원문을 저장하지 않는다"라고 쓰지 말 것. 공개 접근 가능한 `/amc-web-mvp`는 원문을 저장하고, V1 검색 함수는 원문을 Perplexity에 보낸다 (§1.4, §3.5).
11. 리포트·PDF에 법률·재무 자문 아님 면책이 있다고 쓰지 말 것. 리포트 단계에서는 하단 문구가 숨겨진다 (§8.7).

**작업에서 하지 말 것 (이번 작업 범위)**
12. 이 인벤토리를 근거로 코드, 로그, 보존, 스키마, 환경변수, 배포 설정을 바꾸지 말 것. 3부는 설계 제안만이다.
13. 기존 운영 데이터를 수정·삭제하거나, 레거시 원문 행을 정리하지 말 것.
14. 확인 불가 항목을 정책 초안에서 추정값으로 채우지 말 것. C 근거(콘솔 확인)를 먼저 받는다.

### 9.1 기존 문서·문구와의 충돌 (보고만 함, 아무 쪽도 바꾸지 않음)

| # | 충돌 | 영향 |
|---|---|---|
| 1 | 인수인계 §12 vs 결론 추적 메모의 localStorage 영구 저장 (0단계에서 보고) | 공용 기기에 자유 메모가 만료 없이 남음 |
| 2 | 화면 "검색 대상만" vs 실제 전송 필드 | 고지 부족 |
| 3 | 화면 "요청할 때만 검색" vs 자동 검색 | 고지 부족 |
| 4 | 화면 "출처는 점수를 바꾸지 않음" vs `externalValidation` 반영 | 고지와 엔진 동작 불일치 |
| 5 | KO 근거 고지의 추가 문장 (EN에 없음, `v2Language.ts:134`) | KO/EN 불일치 |
| 6 | V2 "원문 저장 안 함" vs 같은 DB에 원문을 쓰는 레거시 화면·무인증 엔드포인트 | 정책 문구 범위 |
| 7 | JEV 호출 한도가 전체 합산 6회 (`founderOpsStore.ts:210-211`) | 운영 중 JEV가 사실상 멈출 수 있음 (기능 이슈) |
| 8 | 운영 빌드의 Manus 런타임 (`postMessage "*"`, 출처 미검사 쿠키 설정) | 보안·고지 검토 필요 |

### 9.2 소유자 확인이 필요한 항목 (C 근거)

- Vercel: 요금제, 로그 보존·드레인 설정, 함수 리전 설정, Deployment Protection, 환경변수 존재 여부(`AMC_JEV_V2_ENABLED`, `AMC_FOUNDER_NOTIFICATIONS_ENABLED`, `PERPLEXITY_V2_AGENT_PRESET` 등).
- Perplexity: ZDR·보존 설정, 계정 리전.
- Postgres 제공자: 이름, 리전, 백업 보존 기간.
- SMTP 제공자: 이름, 리전.
- Express 서버(`server/index.ts`)가 운영 어디선가 실행되는지.
