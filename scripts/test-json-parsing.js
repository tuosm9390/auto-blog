// Standalone test for JSON extraction regex
// This regex MUST match the one used in lib/ai.ts
const REGEX = /\{[\s\S]*\}/;

const testCases = [
  {
    name: "Standard JSON",
    input: '{"key": "value"}',
    expected: '{"key": "value"}'
  },
  {
    name: "Markdown Code Block JSON",
    input: '```json\n{"key": "value"}\n```',
    expected: '{"key": "value"}'
  },
  {
    name: "Markdown Code Block (no lang)",
    input: '```\n{"key": "value"}\n```',
    expected: '{"key": "value"}'
  },
  {
    name: "Text with JSON in middle",
    input: 'Here is the JSON:\n{"key": "value"}\nHope this helps.',
    expected: '{"key": "value"}'
  },
  {
    name: "Multiline JSON",
    input: 'Starting text\n{\n  "title": "Hello",\n  "content": "World"\n}\nEnding text',
    expected: '{\n  "title": "Hello",\n  "content": "World"\n}'
  },
  {
    name: "Malformed JSON (Missing brace)",
    input: '{"key": "value"',
    expected: null
  }
];

console.log("🔍 Testing JSON Extraction Logic...");
let passed = 0;
let failed = 0;

testCases.forEach(test => {
  try {
    const jsonMatch = test.input.match(REGEX);
    const result = jsonMatch ? jsonMatch[0] : null;

    if (result === test.expected) {
      console.log(`✅ ${test.name}: Passed`);
      passed++;
    } else {
      console.error(`❌ ${test.name}: Failed. Expected '${test.expected}', got '${result}'`);
      failed++;
    }
  } catch (e) {
    console.error(`❌ ${test.name}: Error ${e}`);
    failed++;
  }
});

console.log(`\nTest Result: ${passed} Passed, ${failed} Failed`);

if (failed > 0) process.exit(1);
