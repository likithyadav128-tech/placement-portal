import assert from "node:assert";

// Logic mirroring src/app/student/assignments/page.tsx
function isCodingAssessment(type?: string): boolean {
  const t = type?.toUpperCase();
  return t === "CODING" || t === "MIXED";
}

function isAptitudeAssessment(type?: string): boolean {
  const t = type?.toUpperCase();
  return t === "APTITUDE";
}

function resolveAssessmentUrl(assessment: { id: string; type?: string }): string {
  if (isCodingAssessment(assessment.type)) {
    return `/student/assessments/coding?assessmentId=${assessment.id}`;
  }
  return `/student/assessments/aptitude?assessmentId=${assessment.id}`;
}

function resolveAssessmentIdFromParams(searchParams: URLSearchParams): string | null {
  return searchParams.get("assessmentId") || searchParams.get("id");
}

function checkDefensiveRedirect(
  pageType: "coding" | "aptitude",
  attempt: { assessmentId: string; type?: string }
): string | null {
  const attemptType = attempt.type?.toLowerCase();
  if (pageType === "coding" && attemptType === "aptitude") {
    return `/student/assessments/aptitude?assessmentId=${attempt.assessmentId}`;
  }
  if (pageType === "aptitude" && (attemptType === "coding" || attemptType === "mixed")) {
    return `/student/assessments/coding?assessmentId=${attempt.assessmentId}`;
  }
  return null;
}

async function runAssessmentMappingTests() {
  console.log("=== RUNNING ASSESSMENT MAPPING & NAVIGATION TESTS ===");

  const coreAlgorithmsCoding = {
    id: "5ee35c47-d81c-4e5e-b349-9f16adc2447a",
    title: "Core Algorithms & Problem Solving Benchmark",
    type: "coding", // Returned lowercase by API
  };

  const quantLogicalAptitude = {
    id: "1b78877c-1dc8-4ec0-be17-918299caf6de",
    title: "Quantitative & Logical Placement Benchmark",
    type: "aptitude", // Returned lowercase by API
  };

  const mixedAssessment = {
    id: "mix-test-001",
    title: "Comprehensive Mock Benchmark",
    type: "mixed",
  };

  // Test 1: Core Algorithms launches CODING assessment
  const codingUrl = resolveAssessmentUrl(coreAlgorithmsCoding);
  assert.strictEqual(
    codingUrl,
    "/student/assessments/coding?assessmentId=5ee35c47-d81c-4e5e-b349-9f16adc2447a",
    "Core Algorithms must route to /student/assessments/coding with assessmentId"
  );
  console.log("✅ Test 1 Passed: Core Algorithms launches CODING assessment");

  // Test 2: Quantitative & Logical launches APTITUDE assessment
  const aptitudeUrl = resolveAssessmentUrl(quantLogicalAptitude);
  assert.strictEqual(
    aptitudeUrl,
    "/student/assessments/aptitude?assessmentId=1b78877c-1dc8-4ec0-be17-918299caf6de",
    "Quantitative & Logical must route to /student/assessments/aptitude with assessmentId"
  );
  console.log("✅ Test 2 Passed: Quantitative & Logical launches APTITUDE assessment");

  // Test 3: Uppercase types are handled consistently
  assert.strictEqual(
    resolveAssessmentUrl({ id: "code-1", type: "CODING" }),
    "/student/assessments/coding?assessmentId=code-1"
  );
  assert.strictEqual(
    resolveAssessmentUrl({ id: "apt-1", type: "APTITUDE" }),
    "/student/assessments/aptitude?assessmentId=apt-1"
  );
  console.log("✅ Test 3 Passed: Uppercase types ('CODING', 'APTITUDE') route correctly");

  // Test 4: Mixed type routes to coding assessment
  assert.strictEqual(
    resolveAssessmentUrl(mixedAssessment),
    "/student/assessments/coding?assessmentId=mix-test-001"
  );
  console.log("✅ Test 4 Passed: Mixed assessment routes to coding assessment");

  // Test 5: Category Classification
  // Core Algorithms = Category 2 (Coding & Theory)
  assert.strictEqual(isCodingAssessment(coreAlgorithmsCoding.type), true);
  assert.strictEqual(isAptitudeAssessment(coreAlgorithmsCoding.type), false);

  // Quantitative & Logical = Category 1 (Aptitude & Verbal)
  assert.strictEqual(isAptitudeAssessment(quantLogicalAptitude.type), true);
  assert.strictEqual(isCodingAssessment(quantLogicalAptitude.type), false);
  console.log("✅ Test 5 Passed: Category classifications (Cat 1 Aptitude vs Cat 2 Coding) verified");

  // Test 6: Category counters with mixed-case data
  const sampleAssessments = [
    { id: "1", type: "coding" },
    { id: "2", type: "aptitude" },
    { id: "3", type: "CODING" },
    { id: "4", type: "APTITUDE" },
    { id: "5", type: "mixed" },
  ];
  const cat1Count = sampleAssessments.filter((a) => isAptitudeAssessment(a.type)).length;
  const cat2Count = sampleAssessments.filter((a) => isCodingAssessment(a.type)).length;
  assert.strictEqual(cat1Count, 2, "Cat 1 count must be 2 (aptitude + APTITUDE)");
  assert.strictEqual(cat2Count, 3, "Cat 2 count must be 3 (coding + CODING + mixed)");
  console.log("✅ Test 6 Passed: Category counters handle case-insensitive items");

  // Test 7: Query parameter resolution supports both ?assessmentId and ?id
  const paramsWithAssessmentId = new URLSearchParams("assessmentId=5ee35c47-d81c-4e5e-b349-9f16adc2447a");
  const paramsWithId = new URLSearchParams("id=5ee35c47-d81c-4e5e-b349-9f16adc2447a");
  const paramsWithBoth = new URLSearchParams("assessmentId=preferred-id&id=fallback-id");

  assert.strictEqual(
    resolveAssessmentIdFromParams(paramsWithAssessmentId),
    "5ee35c47-d81c-4e5e-b349-9f16adc2447a"
  );
  assert.strictEqual(
    resolveAssessmentIdFromParams(paramsWithId),
    "5ee35c47-d81c-4e5e-b349-9f16adc2447a"
  );
  assert.strictEqual(
    resolveAssessmentIdFromParams(paramsWithBoth),
    "preferred-id"
  );
  console.log("✅ Test 7 Passed: Query parameter parser accepts both ?assessmentId= and ?id=");

  // Test 8: Defensive redirection across assessment pages
  const codingAttemptOnAptitudePage = checkDefensiveRedirect("aptitude", {
    assessmentId: "5ee35c47-d81c-4e5e-b349-9f16adc2447a",
    type: "coding",
  });
  assert.strictEqual(
    codingAttemptOnAptitudePage,
    "/student/assessments/coding?assessmentId=5ee35c47-d81c-4e5e-b349-9f16adc2447a"
  );

  const aptitudeAttemptOnCodingPage = checkDefensiveRedirect("coding", {
    assessmentId: "1b78877c-1dc8-4ec0-be17-918299caf6de",
    type: "aptitude",
  });
  assert.strictEqual(
    aptitudeAttemptOnCodingPage,
    "/student/assessments/aptitude?assessmentId=1b78877c-1dc8-4ec0-be17-918299caf6de"
  );

  const validCodingAttemptOnCodingPage = checkDefensiveRedirect("coding", {
    assessmentId: "5ee35c47-d81c-4e5e-b349-9f16adc2447a",
    type: "coding",
  });
  assert.strictEqual(validCodingAttemptOnCodingPage, null);
  console.log("✅ Test 8 Passed: Defensive cross-page redirection prevents interface mismatches");

  console.log("\n🎉 All 8/8 Assessment Mapping & Navigation Tests Passed Successfully!");
}

runAssessmentMappingTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
