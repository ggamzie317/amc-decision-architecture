# 병합·배포 계획안 (2026-10-16, 제안만 — 병합·배포하지 않음)

대상 PR: #116 레거시 경로 차단(+V1), #117 판단 전환 방향, #118 근거 수집 완료 처리, #119 PDF, #120 운영 기록 허용 목록(작성 중).
기준: `main` = Production `2df6d9a`.

## 0. 전제: main 병합 = Production 배포

Vercel Production은 `main`에 자동 배포된다. PR을 `main`에 하나씩 병합하면 병합마다 Production이 바뀐다(최대 5회). 소유자 지시("Production 1회 배포")와 맞추려면 **릴리스 브랜치에 모아 검증한 뒤 `main`에 한 번만 병합**한다. 배포 설정(자동 배포 끄기 등)은 바꾸지 않는다.

## 1. 권장 순서와 방식

1. `release/2026-10-16`를 `main`(`2df6d9a`)에서 만든다.
2. 각 PR의 base를 `release/2026-10-16`로 바꾼다(GitHub PR 편집, 코드 변경 없음).
3. 아래 순서로 릴리스 브랜치에 병합한다. 병합마다 §3 재테스트.

| 순서 | PR | 이유 | 예상 충돌 |
|---|---|---|---|
| 1 | #116 레거시 차단 | 독립적(App.tsx, vercel.json, API) | 없음 (로컬 시험 병합: clean) |
| 2 | #117 판단 전환 방향 | 엔진·모델 2개 파일 | 없음 (clean) |
| 3 | #118 근거 수집 완료 | AmcInteractiveV2, V2Report, trace, v2-analysis.css | 없음 (clean) |
| 4 | #119 PDF | V2Report, v2.css, **v2-analysis.css** | **`client/src/styles/v2-analysis.css`**: 두 PR 모두 파일 끝에 인쇄 블록 추가. 해결 = 둘 다 유지(#118 블록 닫은 뒤 #119 블록). `V2Report.tsx`는 자동 병합됨 |
| 5 | #120 운영 기록 허용 목록 | 서버 `founderOpsApi.ts` + 테스트 다수 | 작성 완료 후 확인. 같은 테스트 파일을 다른 PR이 바꾸지 않아 충돌 가능성 낮음 |

로컬 시험 병합 결과(`local/amc-integration-check`, 푸시 안 함): 1~4 병합 후 빌드 성공, 테스트 565/565, `tsc` 통과. 충돌은 위 CSS 1건뿐.

4. 릴리스 브랜치 Preview에서 §4 통합 실검색.
5. `release/2026-10-16` → `main` PR 1개. 소유자가 커밋 SHA와 검증한 Preview URL을 명시해 승인하면 병합(= Production 1회 배포).

## 2. 대안 (권장하지 않음)

- PR을 `main`에 순서대로 직접 병합: 병합마다 Production 배포, 중간 상태(예: #118만 들어가고 #119 전)가 고객에게 노출됨.
- 모든 PR을 한 PR로 합치기: 검토 단위가 커지고 PR별 승인 기록이 흐려짐.

## 3. 각 병합 후 재테스트

릴리스 브랜치 작업 트리에서:

```
cd manus-ui
npx vite build
npx vitest run --root .. manus-ui/tests
npx tsc --noEmit
```

- 기대: 빌드 성공, 테스트 전부 통과(각 PR의 새 테스트 포함), 타입 오류 0.
- GitHub CI 통과 확인.
- 충돌을 해결한 병합(#119)은 PDF 재생 매트릭스(로컬, 유료 호출 없음)를 다시 돌려 07장 표시 넘침 0, 빈 페이지 없음, 실패 표기 정상인지 확인.

## 4. 릴리스 Preview 통합 실검색 절차

전제: 소유자가 내장 브라우저에서 Vercel에 로그인(Preview 보호 유지).

1. 릴리스 브랜치 최신 커밋의 고정 Preview URL을 기록.
2. 경로: `/amc-web-mvp`, `/amc-interactive-v1`, `/intake` → `/amc-interactive-v2`로 이동(307) 확인. `POST /api/amc/external-snapshot` → 410 확인. (유료 호출 없음)
3. `/api/amc/ops/track`에 원문 필드를 채운 합성 요청 → 400 `raw_text_not_accepted`. (Preview DB 연결 여부를 먼저 확인 — 10-14 기록상 `backend_unavailable`)
4. 학위 합성 사례(현재 직무 "중견기업 재무팀 과장", 고민 "고려대학교 EMBA 과정 진학", 지역 기본값) KO로 실검색 1회 — 공급자 호출 2회(+주제 재시도 시 최대 2회).
   - 처리 화면 → 첫 주제 도착 시 대시보드, 이때 `dashboard_generated` 요청 없음, 보고서 인쇄 버튼 "근거 수집 중"
   - 모든 주제 확정 후 `dashboard_generated` 1회, 인쇄 가능
   - 판단이 바뀌는 조건: "손실 위험 · 높음"(머무름 쪽)이 이동 쪽 문장으로 나오지 않음
   - 일부 주제 실패 시 "실패한 주제만 다시 검색" 버튼(실패가 생긴 경우에만 확인 가능)
   - EN 전환·보고서 열기에서 추가 검색 0회
   - 보고서 → 브라우저 인쇄 미리보기: 07장 표시, 빈 페이지, 카드 잘림
5. 결과·호출 수·테스트 기록 ID를 보고.

유료 호출 예산(이번 묶음 상한 10회): PR별 Preview 4회 × 2호출 = 8 + 통합 1회 2호출 = 10으로 여유가 없다. **권장**: 각 PR Preview는 유료 호출 없는 확인(경로·410·렌더·재생 테스트)으로 하고, 실검색은 실제로 배포될 릴리스 브랜치 커밋에서 1~2회만 한다. 소유자 결정 필요.

## 5. Production 1회 배포와 확인

1. 소유자 승인(대상 PR, 커밋 SHA, 검증한 Preview URL 명시) 후 `release/2026-10-16` → `main` 병합.
2. Vercel Production 배포 완료 확인(GitHub 배포 기록의 SHA가 병합 커밋과 같은지).
3. 운영 확인(유료 호출 없음): `/amc-interactive-v2?lang=ko` 열림, 레거시 경로 307, external-snapshot 410, "검색 없이 본 초안" 경로로 보고서까지, 인쇄 미리보기.
4. 실검색 1회는 별도 승인 시에만(상한 밖).

## 6. 되돌리기

- 스키마·환경변수 변경이 없으므로 코드만 되돌리면 된다. 운영 데이터 정리 불필요.
- 1순위: Vercel 대시보드에서 직전 Production 배포(`2df6d9a`)로 즉시 되돌리기(Instant Rollback/Promote). 대시보드 권한 필요(소유자). Hobby 요금제에서 가능한 범위는 대시보드에서 확인.
- 2순위: `main`에서 릴리스 병합 커밋을 `git revert -m 1 <병합 SHA>` → PR → 병합(재배포). 이후 재적용은 revert를 다시 revert.
- 되돌린 뒤 확인: 운영 SHA가 `2df6d9a`(또는 revert 커밋)인지, `/amc-interactive-v2` 정상.
- 주의: 되돌리면 레거시 경로(`/amc-web-mvp`)와 `external-snapshot`이 다시 열리고, 운영 기록 허용 목록도 풀린다.
