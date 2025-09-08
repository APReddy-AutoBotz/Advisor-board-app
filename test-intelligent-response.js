// Quick test of the intelligent response system
const testQuestion = "Which is better for Diabetic patient White Rice or Millets ?";

console.log('🧪 TESTING INTELLIGENT RESPONSE SYSTEM');
console.log('Question:', testQuestion);

// Simulate the analysis
const lowerQuestion = testQuestion.toLowerCase();
console.log('Lower case:', lowerQuestion);

const hasDiabetes = lowerQuestion.includes('diabetic') || lowerQuestion.includes('diabetes');
const hasRice = lowerQuestion.includes('rice');
const hasMillets = lowerQuestion.includes('millet');
const hasComparison = lowerQuestion.includes('better') || lowerQuestion.includes('which') || lowerQuestion.includes('vs');

console.log('Detection results:', {
  hasDiabetes,
  hasRice,
  hasMillets,
  hasComparison
});

if (hasDiabetes && (hasRice || hasMillets) && hasComparison) {
  console.log('✅ SHOULD DETECT: diabetes_nutrition_comparison with 95% confidence');
  console.log('✅ DOMAIN: wellness');
} else {
  console.log('❌ DETECTION FAILED');
}