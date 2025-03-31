const fs = require('fs');
const { createCanvas } = require('canvas');

// Create directory if it doesn't exist
const profileDir = './UChain-UI/src/assets/images/profile';
if (!fs.existsSync(profileDir)) {
  fs.mkdirSync(profileDir, { recursive: true });
}

// Function to create a default profile image
function createDefaultImage(filename, label, bgColor) {
  const canvas = createCanvas(200, 200);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 200, 200);
  
  // Label
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 100, 100);
  
  // Save image
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`${profileDir}/${filename}`, buffer);
  console.log(`Created ${filename}`);
}

// Create default images
createDefaultImage('default-seller.png', 'Seller', '#3498db');
createDefaultImage('default-buyer.png', 'Buyer', '#e74c3c');
createDefaultImage('default-driver.png', 'Driver', '#2ecc71');

// Additionally, create some specific user images for testing
const usernames = ['Abrham', 'Eyerus'];
usernames.forEach(username => {
  createDefaultImage(`${username}.jpg`, username, '#9b59b6');
});

console.log('All profile images created successfully!');
