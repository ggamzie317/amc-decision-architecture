const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE_PATH || "playwright"
);
const assert = require("node:assert/strict");
const fs = require("node:fs");
const base = process.env.AMC_QA_BASE_URL || "http://127.0.0.1:3060";
const output = process.env.AMC_QA_OUTPUT || "/tmp/allofmycareer-interactive-qa";
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const results = [];
  for (const language of ["en", "ko"])
    for (const width of [390, 430, 768, 1024, 1440]) {
      const ko = language === "ko",
        page = await browser.newPage({ viewport: { width, height: 900 } }),
        errors = [],
        requests = [];
      page.on("pageerror", e => errors.push(e.message));
      page.on("request", r => {
        if (r.url().includes("/api/"))
          requests.push({ url: r.url(), body: r.postDataJSON() });
      });
      await page.goto(`${base}/amc-interactive-v1?start=preview`);
      if (ko)
        await page.getByRole("button", { name: "KR", exact: true }).click();
      const noOverflow = async stage => {
        const sizes = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth,
          width: innerWidth,
        }));
        assert(
          sizes.scroll <= sizes.width + 1,
          `${language} ${width} ${stage} overflow ${JSON.stringify(sizes)}`
        );
      };
      await noOverflow("entry");
      const privacyCopy = ko
        ? "작성한 답변 원문은 allofmycareer에 저장되지 않습니다. 현재 외부 근거를 생성하기 위해 결정에 필요한 일부 내용이 외부 AI/검색 제공자에게 전달될 수 있습니다. 회사 기밀이나 민감한 개인정보는 입력하지 마세요."
        : "Your written answers are not stored by allofmycareer. Limited decision context may be sent to an external AI/search provider to generate current external evidence. Please do not enter confidential company information or sensitive personal data.";
      assert((await page.locator("body").innerText()).includes(privacyCopy));
      await page.locator("input[type=checkbox]").check();
      await page
        .getByRole("button", {
          name: ko ? "질문으로 이동하기" : "Continue to questions",
        })
        .click();
      const preview = ko
        ? [
            "서울 전략 직무를 유지할지 부산에서 교육 자문 사업을 검증할지 결정합니다.",
            "현재 기업 전략 직무와 안정적인 소득 유지",
            "가족의 생활 기반을 보호하며 교육 자문 사업 검증",
            "장기적인 정체성과 학습",
            "가족 돌봄과 재정 여유",
            "아직 검증하지 않은 수요",
            "실제 고객 근거",
          ]
        : [
            "Stay in strategy or test advisory business",
            "Current strategy role",
            "Bounded advisory practice",
            "Learning and identity",
            "Family and runway",
            "Unvalidated demand",
            "Buyer evidence",
          ];
      for (let i = 0; i < 7; i++)
        await page.locator("#preview-intake textarea").nth(i).fill(preview[i]);
      await noOverflow("preview");
      await page
        .getByRole("button", {
          name: ko ? "Free Preview 생성하기" : "Generate Free Preview",
          exact: true,
        })
        .click();
      await page
        .getByRole("button", {
          name: ko ? "Full Intake로 계속하기" : "Continue to Full Intake",
          exact: true,
        })
        .click();
      const intake = page.locator("#full-intake");
      assert((await intake.innerText()).includes(privacyCopy));
      while (await intake.locator("button[aria-expanded=false]").count())
        await intake.locator("button[aria-expanded=false]").first().click();
      assert.equal(await intake.locator("textarea").count(), 15);
      assert.equal(await intake.locator("fieldset").count(), 6);
      for (let i = 1; i <= 15; i++)
        await page
          .locator(`#full-intake-${i}`)
          .fill(
            ko
              ? `질문 ${i}: 가족의 생활 기반과 재정 여유를 보호하며 고객 수요를 검증합니다.`
              : `Evidence for question ${i}: protect runway while validating demand.`
          );
      for (const fieldset of await intake.locator("fieldset").all())
        await fieldset.locator("button").nth(1).click();
      assert((await intake.innerText()).includes("15 / 15"));
      await noOverflow("intake");
      if (width === 390 || width === 1440)
        await intake.screenshot({
          path: `${output}/intake-${language}-${width}.png`,
        });
      await page
        .getByRole("button", {
          name: ko ? "Full Dashboard 생성하기" : "Generate Full Dashboard",
          exact: true,
        })
        .click();
      const simulator = page.getByRole("region", {
        name: ko ? "결정 시뮬레이터" : "Interactive decision simulator",
        exact: true,
      });
      await simulator.waitFor();
      await noOverflow("dashboard");
      const baselineText = await simulator
        .locator("article")
        .first()
        .innerText();
      const baselineParagraphs = await simulator
        .locator("article")
        .first()
        .locator("p")
        .allTextContents();
      const storage = await page.evaluate(() =>
        sessionStorage.getItem(
          "amc_launch_v3_active_submission_id_interactive-v1"
        )
      );
      assert(storage);
      const records = async () => {
        const response = await page.request.get(`${base}/qa-records`);
        return response.json();
      };
      let before;
      for (let i = 0; i < 50; i++) {
        const all = await records();
        before = all.submissions.find(s => s.submissionId === storage);
        if (
          all.events.some(
            e =>
              e.submissionId === storage &&
              e.eventType === "external_evidence_fallback"
          )
        )
          break;
        await new Promise(r => setTimeout(r, 40));
      }
      assert.equal(Object.keys(before.answersJson).length, 0);
      const assessButton = simulator.getByRole("button", {
        name: ko ? "이 시나리오 평가" : "ASSESS THIS SCENARIO",
        exact: true,
      });
      assert(await assessButton.isDisabled());
      assert(
        (await simulator.innerText()).includes(
          ko
            ? "먼저 한 가지 조건을 변경해 주세요."
            : "Change at least one condition first."
        )
      );
      assert(
        (await simulator.innerText()).includes(
          ko
            ? "작성한 답변 원문은 이 선택형 평가에는 전송되지 않습니다."
            : "Your written answers are not sent to this optional assessment."
        )
      );
      assert.equal(
        requests.filter(r => r.url.includes("jev-scenario")).length,
        0
      );
      assert.equal(
        (await records()).events.filter(
          e => e.submissionId === storage && e.metadataJson.packetFingerprint
        ).length,
        0
      );
      assert.equal(
        before.structuralOutputJson.intakeSchemaVersion,
        "AMC-INTAKE-V4-15"
      );
      await simulator
        .locator("fieldset")
        .nth(0)
        .locator("button")
        .nth(0)
        .click();
      assert.equal(
        await simulator.locator("article").first().innerText(),
        baselineText
      );
      await noOverflow("single");
      assert(await assessButton.isEnabled());
      assert.equal(
        requests.filter(r => r.url.includes("jev-scenario")).length,
        0
      );
      assert.equal(
        (await records()).events.filter(
          e => e.submissionId === storage && e.metadataJson.packetFingerprint
        ).length,
        0
      );
      await simulator
        .getByRole("button", {
          name: ko ? "기본 상태로 초기화" : "RESET TO BASELINE",
          exact: true,
        })
        .click();
      assert.deepEqual(
        await simulator
          .locator("article")
          .nth(1)
          .locator("p")
          .allTextContents(),
        baselineParagraphs
      );
      assert(await assessButton.isDisabled());
      assert.equal(
        requests.filter(r => r.url.includes("jev-scenario")).length,
        0
      );
      assert.equal(
        (await records()).events.filter(
          e => e.submissionId === storage && e.metadataJson.packetFingerprint
        ).length,
        0
      );
      await simulator
        .getByRole("button", {
          name: ko ? "여러 조건 조합" : "BUILD A SCENARIO",
          exact: true,
        })
        .click();
      await simulator
        .locator("fieldset")
        .nth(0)
        .locator("button")
        .nth(2)
        .click();
      await simulator
        .locator("fieldset")
        .nth(1)
        .locator("button")
        .nth(2)
        .click();
      await simulator
        .locator("fieldset")
        .nth(6)
        .locator("button")
        .nth(2)
        .click();
      assert(await assessButton.isEnabled());
      assert.equal(
        requests.filter(r => r.url.includes("jev-scenario")).length,
        0
      );
      assert(
        (await simulator.innerText()).includes(
          ko ? "비식별 구조 요약" : "de-identified structural summary"
        )
      );
      await simulator
        .getByRole("button", {
          name: ko ? "이 시나리오 평가" : "ASSESS THIS SCENARIO",
          exact: true,
        })
        .click();
      await simulator.getByRole("status").waitFor();
      assert.equal(
        requests.filter(r => r.url.includes("jev-scenario")).length,
        1
      );
      await simulator
        .getByRole("button", {
          name: ko ? "이 시나리오 평가" : "ASSESS THIS SCENARIO",
          exact: true,
        })
        .click();
      await simulator.getByRole("status").waitFor();
      assert.equal(
        requests.filter(r => r.url.includes("jev-scenario")).length,
        1
      );
      assert.equal(
        before.structuralOutputJson.completedIntakeQuestionCount,
        15
      );
      assert.equal(
        Object.keys(before.structuralOutputJson.baselineBands).length,
        7
      );
      const ops = requests.filter(r => r.url.includes("ops/track"));
      assert(!JSON.stringify(ops).includes("Evidence for question"));
      assert(
        !JSON.stringify(ops).includes(
          "가족의 생활 기반과 재정 여유를 보호하며 고객 수요를 검증합니다."
        )
      );
      await noOverflow("multi-advisory");
      const shortButtons = await simulator
        .locator("button")
        .evaluateAll(els =>
          els
            .filter(e => e.getBoundingClientRect().height < 43.5)
            .map(e => e.textContent)
        );
      assert.deepEqual(shortButtons, []);
      await simulator.screenshot({
        path: `${output}/simulator-${language}-${width}.png`,
      });
      assert.equal(
        requests.filter(r => r.url.includes("external-snapshot")).length,
        1
      );
      assert(
        !requests.some(r =>
          /scenario-assessment|typesafe|openai|anthropic/.test(r.url)
        )
      );
      const ext = requests.find(r => r.url.includes("external-snapshot")).body;
      assert.equal(
        ext.externalPressure,
        ko
          ? "질문 5: 가족의 생활 기반과 재정 여유를 보호하며 고객 수요를 검증합니다."
          : "Evidence for question 5: protect runway while validating demand."
      );
      assert.equal(
        ext.validationNeed,
        ko
          ? "질문 6: 가족의 생활 기반과 재정 여유를 보호하며 고객 수요를 검증합니다."
          : "Evidence for question 6: protect runway while validating demand."
      );
      let after;
      for (let i = 0; i < 50; i++) {
        const all = await records();
        after = all.submissions.find(s => s.submissionId === storage);
        if (
          all.events.some(
            e =>
              e.submissionId === storage &&
              [
                "jev_assessment_unavailable",
                "jev_assessment_completed",
              ].includes(e.eventType)
          )
        )
          break;
        await new Promise(r => setTimeout(r, 40));
      }
      assert.deepEqual(after.answersJson, before.answersJson);
      assert.deepEqual(after.structuralOutputJson, before.structuralOutputJson);
      await simulator
        .getByRole("button", {
          name: ko ? "기본 상태로 초기화" : "RESET TO BASELINE",
          exact: true,
        })
        .click();
      assert.equal(await simulator.getByRole("status").count(), 0);
      assert(await assessButton.isDisabled());
      assert.equal(
        requests.filter(r => r.url.includes("jev-scenario")).length,
        1
      );
      await page
        .getByRole("button", {
          name: ko ? "Detailed PDF Report 보기" : "View Detailed PDF Report",
          exact: true,
        })
        .click();
      await page.locator(".pdf-report-view").waitFor();
      await noOverflow("report");
      assert.equal(
        await page
          .getByRole("region", {
            name: ko ? "결정 시뮬레이터" : "Interactive decision simulator",
          })
          .count(),
        0
      );
      assert(
        (await page.locator(".pdf-report-view").innerText()).includes(
          "allofmycareer"
        )
      );
      if (width === 390 || width === 1440)
        await page
          .locator(".pdf-report-view")
          .screenshot({ path: `${output}/report-${language}-${width}.png` });
      assert.deepEqual(errors, []);
      results.push({
        route: "interactive",
        language,
        width,
        status: "PASS",
        submissionId: storage,
        evidenceRequests: 1,
      });
      fs.writeFileSync(
        `${output}/results.json`,
        JSON.stringify(results, null, 2)
      );
      console.log("PASS", language, width);
      await page.close();
    }
  await browser.close();
})();
