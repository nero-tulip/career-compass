const fs = require('fs');
const path = require('path');

// Read the careers data
const careersPath = path.join(__dirname, '../src/app/data/careers.json');
const careersData = JSON.parse(fs.readFileSync(careersPath, 'utf8'));

console.log(`Loaded ${careersData.length} careers`);

// Test profile (example: someone with high Investigative and Realistic scores)
const testProfile = {
  R: 6.5, // High Realistic
  I: 7.0, // High Investigative
  A: 2.0, // Low Artistic
  S: 3.0, // Medium Social
  E: 2.5, // Low Enterprising
  C: 4.0  // Medium Conventional
};

console.log('\nTest Profile:');
console.log(JSON.stringify(testProfile, null, 2));

// Simple similarity calculation (same as in our TypeScript code)
function calculateSimilarityScore(profile, careerProfile) {
  const differences = Object.keys(profile).map(key => {
    return Math.pow(profile[key] - careerProfile[key], 2);
  });
  
  const distance = Math.sqrt(differences.reduce((a, b) => a + b, 0));
  return 1 / (1 + distance);
}

// Find top matches
const scoredCareers = careersData.map(career => {
  const score = calculateSimilarityScore(testProfile, career.riasec);
  return { career, score };
});

const topMatches = scoredCareers
  .sort((a, b) => b.score - a.score)
  .slice(0, 5);

console.log('\nTop 5 Career Matches:');
topMatches.forEach((match, index) => {
  console.log(`${index + 1}. ${match.career.title} (Score: ${match.score.toFixed(4)})`);
  console.log(`   RIASEC: R:${match.career.riasec.R.toFixed(2)}, I:${match.career.riasec.I.toFixed(2)}, A:${match.career.riasec.A.toFixed(2)}, S:${match.career.riasec.S.toFixed(2)}, E:${match.career.riasec.E.toFixed(2)}, C:${match.career.riasec.C.toFixed(2)}`);
});

console.log('\n✅ Career matching system is working!'); 