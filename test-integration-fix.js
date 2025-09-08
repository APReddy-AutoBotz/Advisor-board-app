#!/usr/bin/env node

/**
 * Quick test runner to verify integration test fixes
 */

const { execSync } = require('child_process');

console.log('🧪 Running integration test fixes...\n');

try {
  const result = execSync(
    'npm test -- --run src/test/integration/complete-user-workflow-integration.test.tsx',
    { 
      encoding: 'utf8',
      cwd: process.cwd(),
      stdio: 'pipe'
    }
  );
  
  console.log('✅ Integration tests PASSED!');
  console.log(result);
  
} catch (error) {
  console.log('❌ Integration tests still have issues:');
  console.log(error.stdout);
  console.log('\n🔧 Error details:');
  console.log(error.stderr);
  
  // Extract specific test failures
  const output = error.stdout || '';
  const failures = output.match(/FAIL.*?(?=\n\n|\n$)/gs) || [];
  
  if (failures.length > 0) {
    console.log('\n📋 Specific failures to fix:');
    failures.forEach((failure, index) => {
      console.log(`${index + 1}. ${failure.trim()}`);
    });
  }
}