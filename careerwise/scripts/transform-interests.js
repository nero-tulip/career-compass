const fs = require('fs');
const path = require('path');

// Read the original interests data
const interestsPath = path.join(__dirname, '../src/app/data/interests.json');
const outputPath = path.join(__dirname, '../src/app/data/careers.json');

console.log('Reading interests data...');
const interestsData = JSON.parse(fs.readFileSync(interestsPath, 'utf8'));

console.log(`Processing ${interestsData.length} records...`);

// Group by O*NET-SOC Code
const groupedData = {};

interestsData.forEach(record => {
  const socCode = record['O*NET-SOC Code'];
  const title = record['Title'];
  const elementName = record['Element Name'];
  const dataValue = record['Data Value'];
  
  if (!groupedData[socCode]) {
    groupedData[socCode] = {
      code: socCode,
      title: title,
      riasec: {
        R: 0, // Realistic
        I: 0, // Investigative
        A: 0, // Artistic
        S: 0, // Social
        E: 0, // Enterprising
        C: 0  // Conventional
      }
    };
  }
  
  // Map Element Name to RIASEC key
  const riasecMap = {
    'Realistic': 'R',
    'Investigative': 'I',
    'Artistic': 'A',
    'Social': 'S',
    'Enterprising': 'E',
    'Conventional': 'C'
  };
  
  const riasecKey = riasecMap[elementName];
  if (riasecKey) {
    groupedData[socCode].riasec[riasecKey] = dataValue;
  }
});

// Convert to array and sort by title
const transformedData = Object.values(groupedData).sort((a, b) => a.title.localeCompare(b.title));

console.log(`Transformed ${transformedData.length} unique occupations`);

// Write the transformed data
fs.writeFileSync(outputPath, JSON.stringify(transformedData, null, 2));

console.log(`✅ Transformed data written to ${outputPath}`);
console.log(`Sample record:`);
console.log(JSON.stringify(transformedData[0], null, 2)); 