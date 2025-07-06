const fs = require('fs');
const path = require('path');

// Simulate quiz answers
const mockQuizSubmission = {
  macroAnswers: [
    { questionId: "m1", score: 4 },
    { questionId: "m2", score: 3 },
    { questionId: "m3", score: 2 },
    { questionId: "m4", score: 3 },
    { questionId: "m5", score: 2 },
    { questionId: "m6", score: 3 },
    { questionId: "m7", score: 4 },
    { questionId: "m8", score: 3 }
  ],
  riaAnswers: [
    // Realistic questions (r1-r10)
    { questionId: "r1", score: 4 }, { questionId: "r2", score: 5 }, { questionId: "r3", score: 4 },
    { questionId: "r4", score: 5 }, { questionId: "r5", score: 4 }, { questionId: "r6", score: 3 },
    { questionId: "r7", score: 4 }, { questionId: "r8", score: 5 }, { questionId: "r9", score: 4 },
    { questionId: "r10", score: 3 },
    // Investigative questions (i1-i10)
    { questionId: "i1", score: 5 }, { questionId: "i2", score: 4 }, { questionId: "i3", score: 5 },
    { questionId: "i4", score: 4 }, { questionId: "i5", score: 5 }, { questionId: "i6", score: 4 },
    { questionId: "i7", score: 5 }, { questionId: "i8", score: 4 }, { questionId: "i9", score: 5 },
    { questionId: "i10", score: 4 },
    // Artistic questions (a1-a10)
    { questionId: "a1", score: 2 }, { questionId: "a2", score: 3 }, { questionId: "a3", score: 2 },
    { questionId: "a4", score: 3 }, { questionId: "a5", score: 2 }, { questionId: "a6", score: 3 },
    { questionId: "a7", score: 2 }, { questionId: "a8", score: 3 }, { questionId: "a9", score: 2 },
    { questionId: "a10", score: 3 },
    // Social questions (s1-s10)
    { questionId: "s1", score: 3 }, { questionId: "s2", score: 4 }, { questionId: "s3", score: 3 },
    { questionId: "s4", score: 4 }, { questionId: "s5", score: 3 }, { questionId: "s6", score: 4 },
    { questionId: "s7", score: 3 }, { questionId: "s8", score: 4 }, { questionId: "s9", score: 3 },
    { questionId: "s10", score: 4 },
    // Enterprising questions (e1-e10)
    { questionId: "e1", score: 2 }, { questionId: "e2", score: 3 }, { questionId: "e3", score: 2 },
    { questionId: "e4", score: 3 }, { questionId: "e5", score: 2 }, { questionId: "e6", score: 3 },
    { questionId: "e7", score: 2 }, { questionId: "e8", score: 3 }, { questionId: "e9", score: 2 },
    { questionId: "e10", score: 3 },
    // Conventional questions (c1-c10)
    { questionId: "c1", score: 4 }, { questionId: "c2", score: 3 }, { questionId: "c3", score: 4 },
    { questionId: "c4", score: 3 }, { questionId: "c5", score: 4 }, { questionId: "c6", score: 3 },
    { questionId: "c7", score: 4 }, { questionId: "c8", score: 3 }, { questionId: "c9", score: 4 },
    { questionId: "c10", score: 3 }
  ]
};

async function testAPI() {
  try {
    console.log('Testing API endpoint...');
    
    const response = await fetch('http://localhost:3000/api/results', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockQuizSubmission)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('✅ API Response:');
    console.log('Success:', data.success);
    console.log('Message:', data.message);
    console.log('\nProfile:');
    console.log('RIASEC Scores:', data.profile.riasec);
    console.log('Dominant Traits:', data.profile.dominantTraits);
    
    console.log('\nTop Career Matches:');
    data.matchingCareers.forEach((career, index) => {
      console.log(`${index + 1}. ${career.title} (${career.code})`);
    });
    
    console.log('\nAnalysis Preview:');
    console.log(data.analysis.substring(0, 200) + '...');
    
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
  }
}

// Wait a moment for the dev server to start, then test
setTimeout(testAPI, 3000); 