// Quick test to verify the export fix worked
console.log('🔧 TESTING EXPORT FIX');

// Test that we can import the functions without errors
async function testExports() {
  try {
    console.log('Attempting to import intelligent response generator...');
    
    // This should work now without duplicate export errors
    const module = await import('./.kiro/hooks/intelligent-response-generator.ts');
    
    console.log('✅ Import successful!');
    console.log('Available exports:', Object.keys(module));
    
    // Test that the functions exist
    if (module.analyzeQuestion && module.enhanceConsultationResponse) {
      console.log('✅ All required functions are exported');
      
      // Quick test of analyzeQuestion
      const testResult = module.analyzeQuestion("Which is better for diabetic patient - rice or millets?");
      console.log('✅ analyzeQuestion works:', testResult.type, testResult.domain);
      
    } else {
      console.log('❌ Missing required functions');
    }
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
  }
}

testExports().then(() => {
  console.log('🎉 Export fix test complete!');
}).catch(console.error);