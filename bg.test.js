const { generatePassword } = require('./password-generator.js');
console.log(
  generatePassword({
    length: 200000,
    uppercase: true,
    lowercase: true,
    digits: true,
    special: true,
    avoidSimilar: true,
    requireEachSelected: false
  })
);
