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
      assert.equal(Object.keys(before.answersJson).length, 15);
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
      await simulator
        .getByRole("button", {
          name: ko ? "이 시나리오 평가" : "ASSESS THIS SCENARIO",
          exact: true,
        })
        .click();
      await simulator.getByRole("status").waitFor();
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
      assert.equal(ext.externalPressure, before.answersJson["5"]);
      assert.equal(ext.validationNeed, before.answersJson["6"]);
      let after;
      for (let i = 0; i < 50; i++) {
        const all = await records();
        after = all.submissions.find(s => s.submissionId === storage);
        if (
          all.events.some(
            e =>
              e.submissionId === storage &&
              e.eventType === "jev_assessment_unavailable"
          )
        )
          break;
        await new Promise(r => setTimeout(r, 40));
      }
      assert.deepEqual(after.answersJson, before.answersJson);
      assert.deepEqual(after.structuralOutputJson, before.structuralOutputJson);
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
