# AMC 현재 상태와 작업 규칙

마지막 갱신: 2026-11-15 (맥북 작업 기준). 다른 컴퓨터나 새 Claude 세션에서 작업을 이어갈 때 이 문서부터 읽는다.
맥북의 Claude 메모리에만 있던 내용을 저장소로 옮긴 것이다.

## 운영 상태

| 항목 | 값 |
|---|---|
| 운영 주소 | https://app.allofmycareer.com/ (`main` 병합 시 Vercel이 자동 배포) |
| 운영 커밋 | `4fcac33` (#129까지 반영) |
| 지인 테스트 링크 | https://app.allofmycareer.com/ (브라우저 언어로 KO/EN 자동, 우측 상단 KO/EN 전환) |
| 내 테스트 링크 | https://app.allofmycareer.com/?test=1 (이 링크로 시작한 여정은 집계에서 테스트로 제외) |
| 관리자 | https://app.allofmycareer.com/amc-admin (공유 관리자 비밀번호 `AMC_ADMIN_PASSWORD`, 세션 8시간, "테스트 기록 제외" 기본 켜짐) |
| Vercel | Pro 요금제. Spend Management 월 예산 설정 권장 |
| 고객 집계 시작 | 2026-10-18 00:00 KST(`TEST_PERIOD_END = 2026-10-17T15:00Z`, `server/testRecords.ts`). 그 이전 기록 47건은 전부 테스트 |

## 사용량 상한

| 기능 | 상한 | 위치 |
|---|---|---|
| Perplexity 공개 자료 검색 | 최근 24시간 300회(서비스 전체, 재시도 포함). 환경변수 `AMC_PERPLEXITY_DAILY_LIMIT`로 변경 가능 | `server/founderOpsStore.ts` `PERPLEXITY_DAILY_LIMIT` |
| JEV 보조 판단(AI Gateway) | 고객 여정당 6회, 최근 24시간 200회 | `JEV_PER_JOURNEY_LIMIT`, `JEV_DAILY_LIMIT` |

- 검색은 추적된(동의한) 고객 여정이 있어야 실행된다(`x-amc-submission-id` 헤더). 없으면 400 `journey_required`, 상한 도달 시 429 `daily_limit`과 안내 문구.
- 운영에서 DB를 확인할 수 없으면 검색을 막는다(비용 보호). "검색 없이 본 초안"은 항상 가능.
- 상한 기록은 `usage_events`의 `external_evidence_requested` + `metadata.providerCall`이며 관리자 집계에서는 제외된다.

## 작업 규칙 (소유자 승인 기준)

- 기준 계약: `docs/AMC_engineering_handoff_2026-10-13.md`.
- `main` 병합 = 운영 배포. 소유자가 PR·커밋 SHA·확인한 Preview를 명시해 승인한 경우에만 병합한다.
- 고객 문구 변경, 점수·Posture·프레임워크 변경, DB 스키마·환경변수 변경은 소유자 승인 후에만.
- 실제 Perplexity 호출은 승인된 범위 안에서만. 학위 사례 검색 1회 ≈ 2호출.
- 테스트는 항상 `?test=1`로 진행한다.
- Preview는 Vercel 로그인이 필요하고 운영 DB가 없다(`backend_unavailable`). 검색 상한·관리자 숫자 등 DB가 필요한 동작은 운영에서만 확인된다.
- 실제 비밀값(API 키, 연결 문자열, 비밀번호)은 문서·PR·로그에 넣지 않는다. 저장소는 **공개(public)** 이다.

## 남은 일

- 운영자 알림 메일: 보류(SMTP 환경변수 미설정). 필요 시 `AMC_FOUNDER_NOTIFICATIONS_ENABLED=true`와 `AMC_SMTP_*`, `AMC_EMAIL_FROM` 설정.
- 레거시 원문 테스트 기록 8건(2026-08-28~09-28): 보관 결정. 삭제 스크립트는 맥북 `~/amc-worktrees/v2-launch-hardening/launch-check-2026-10-16/delete_legacy_raw_records.mjs`에 있으며 실행하지 않음.
- 공개 출시 전 설계만 된 항목: AI 사용 안내, `/privacy`·`/terms`, 연구 동의 기록·철회, 검색 요청 제한 보강(`docs/design-proposals-2026-10-16.md`).
- 비용 확인: Perplexity 1회 비용, JEV(AI Gateway) 1회 비용.
- 알려진 작은 문제: 일부 사례 유형 자동 추정 오류("burned out", "핀테크 스타트업 PM", "프리랜서"), Corporate Stay "놓치기 쉬운 조건" 문장 반복, PDF 9장 제목이 페이지 끝에 남는 경우, 모바일 비교표 좁음, 부분 실패 시 대시보드에 실패 주제 미표시.

## 기록 문서

- 런칭 점검·결정·배포 기록: `docs/launch-check-2026-10-16.md` (§6)
- 문구 결정: `docs/copy-review-2026-10-16.md`
- 데이터 흐름: `docs/data-inventory.md`
- 설계안: `docs/design-proposals-2026-10-16.md`
- 병합·배포 절차: `docs/merge-plan-2026-10-16.md`
- 다른 컴퓨터 설정: `docs/WORKING_ON_ANOTHER_COMPUTER.md`
