// Comprehensive test of the intelligent response system
// Since we're using ES modules in the hook, we need to use dynamic import
async function testIntelligentResponse() {

  const testQuestion = "Which is best for a diabetic Patient with 36 years age and give the best diet plan suitable";

  console.log('🧪 TESTING FULL INTELLIGENT RESPONSE SYSTEM');
  console.log('Question:', testQuestion);
  console.log('='.repeat(80));

  try {
    // Dynamic import of the TypeScript module (will be compiled to JS)
    const intelligentResponseModule = await import('./.kiro/hooks/intelligent-response-generator.ts');
    const { analyzeQuestion, enhanceConsultationResponse } = intelligentResponseModule;

    // Test question analysis
    console.log('📊 TESTING QUESTION ANALYSIS');
    try {
      const analysis = analyzeQuestion(testQuestion);
      console.log('Analysis Result:', analysis);
      
      if (analysis.domain === 'wellness' && (analysis.type === 'diabetes' || analysis.type === 'nutrition')) {
        console.log('✅ Question analysis PASSED');
      } else {
        console.log('❌ Question analysis FAILED');
      }
    } catch (error) {
      console.error('❌ Question analysis ERROR:', error.message);
    }

    console.log('='.repeat(80));

    // Test response generation for different advisors
    console.log('🧠 TESTING RESPONSE GENERATION');

    const testAdvisors = [
      {
        id: 'djw',
        name: 'Dr. James Wilson',
        code: 'DJW',
        role: 'Naturopathic Medicine',
        blurb: 'Holistic health expert',
        credentials: 'ND, Licensed Naturopathic Doctor',
        avatar: '/images/advisors/djw.jpg',
        specialties: ['Naturopathic Medicine', 'Holistic Health', 'Nutrition']
      },
      {
        id: 'dlc',
        name: 'Dr. Lisa Chen',
        code: 'DLC',
        role: 'Traditional Chinese Medicine',
        blurb: 'TCM and acupuncture specialist',
        credentials: 'DTCM, Licensed Acupuncturist',
        avatar: '/images/advisors/dlc.jpg',
        specialties: ['Traditional Chinese Medicine', 'Acupuncture', 'Herbal Medicine']
      }
    ];

    for (const advisor of testAdvisors) {
      console.log(`\n🩺 Testing ${advisor.name} (${advisor.role})`);
      try {
        const response = await enhanceConsultationResponse(testQuestion, advisor, 'remediboard');
        
        console.log(`Response length: ${response.length} characters`);
        console.log('Response preview:', response.substring(0, 200) + '...');
        
        // Check if response contains diabetes-specific content
        const hasSpecificContent = response.toLowerCase().includes('millet') && 
                                  response.toLowerCase().includes('diabetes') &&
                                  response.length > 500;
        
        if (hasSpecificContent) {
          console.log('✅ Response generation PASSED - Contains specific diabetes/nutrition content');
        } else {
          console.log('❌ Response generation FAILED - Generic or too short');
        }
        
      } catch (error) {
        console.error(`❌ Response generation ERROR for ${advisor.name}:`, error.message);
      }
    }

  } catch (importError) {
    console.error('❌ Failed to import intelligent response module:', importError.message);
  }

  console.log('='.repeat(80));
  console.log('🎯 TEST COMPLETE');
}

// Run the test
testIntelligentResponse().catch(console.error);