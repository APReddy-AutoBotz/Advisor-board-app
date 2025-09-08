// Debug script to test avatar assignments
import { BOARDS } from './src/lib/boards.js';

console.log('=== AVATAR DEBUG ===');

Object.entries(BOARDS).forEach(([boardKey, board]) => {
  console.log(`\n${board.title} (${board.id}):`);
  board.experts.forEach(expert => {
    console.log(`  ${expert.name} (${expert.role}): ${expert.avatar}`);
  });
});

// Test the conversion from Board to Domain
console.log('\n=== CONVERSION TEST ===');

const productBoard = BOARDS.product;
console.log('Original Board Expert avatars:');
productBoard.experts.forEach(expert => {
  console.log(`  ${expert.name}: ${expert.avatar}`);
});

// Simulate the conversion in PremiumBoardPicker
const domain = {
  id: productBoard.id,
  name: productBoard.title,
  description: productBoard.description,
  advisors: productBoard.experts.map(expert => ({
    id: expert.id,
    name: expert.name,
    expertise: expert.role,
    background: expert.blurb,
    domain: productBoard.id,
    isSelected: false,
    avatar: expert.avatar,
    credentials: expert.credentials
  }))
};

console.log('\nConverted Domain Advisor avatars:');
domain.advisors.forEach(advisor => {
  console.log(`  ${advisor.name}: ${advisor.avatar}`);
});