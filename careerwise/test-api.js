async function testAPI() {
  try {
    // Create test data with 60 RIASEC answers (10 per category)
    const testAnswers = [];
    
    // Generate 10 answers for each RIASEC category
    ['r', 'i', 'a', 's', 'e', 'c'].forEach(category => {
      for (let i = 1; i <= 10; i++) {
        testAnswers.push({
          questionId: `${category}${i}`,
          score: Math.floor(Math.random() * 5) + 1 // Random score 1-5
        });
      }
    });

    const testData = {
      macroAnswers: [
        { questionId: 'm1', score: 3 },
        { questionId: 'm2', score: 4 }
      ],
      riaAnswers: testAnswers
    };

    console.log('Sending test data:');
    console.log('Total RIASEC answers:', testAnswers.length);
    console.log('Sample RIASEC answers:', testAnswers.slice(0, 5));
    console.log('Sample macro answers:', testData.macroAnswers);

    const response = await fetch('http://localhost:3000/api/results', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();
    
    console.log('\n=== API RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Success:', result.success);
    console.log('RIASEC Profile:', result.profile?.riasec);
    console.log('Dominant Traits:', result.profile?.dominantTraits);
    console.log('Top Career Matches:', result.matchingCareers?.map(c => c.title));
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testAPI(); 