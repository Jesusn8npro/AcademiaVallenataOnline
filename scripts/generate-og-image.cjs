const sharp = require('sharp');
const path = require('path');

const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f0520"/>
      <stop offset="55%" stop-color="#2d1264"/>
      <stop offset="100%" stop-color="#6d28d9"/>
    </linearGradient>
    <linearGradient id="pill" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#a855f7"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Decorative blobs -->
  <circle cx="1060" cy="110" r="290" fill="#7c3aed" opacity="0.12"/>
  <circle cx="140"  cy="530" r="200" fill="#6d28d9" opacity="0.14"/>
  <circle cx="1130" cy="590" r="110" fill="#8b5cf6" opacity="0.10"/>

  <!-- Logo badge -->
  <rect x="72" y="66" width="74" height="74" rx="18" fill="#7c3aed" opacity="0.88"/>
  <text x="109" y="119" font-family="Georgia, serif" font-size="44" fill="white" text-anchor="middle">&#9835;</text>

  <!-- Brand label -->
  <text x="162" y="101" font-family="Arial, Helvetica, sans-serif" font-size="21" font-weight="700" fill="#c4b5fd" letter-spacing="2.5">ACADEMIA VALLENATA</text>
  <text x="162" y="124" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="#a78bfa" letter-spacing="5">ONLINE</text>

  <!-- Divider -->
  <line x1="72" y1="182" x2="820" y2="182" stroke="#7c3aed" stroke-width="1.5" opacity="0.45"/>

  <!-- Headline -->
  <text x="72" y="280" font-family="Arial, Helvetica, sans-serif" font-size="76" font-weight="700" fill="white" letter-spacing="-1">Aprende Acorde&#xF3;n</text>
  <text x="72" y="366" font-family="Arial, Helvetica, sans-serif" font-size="76" font-weight="700" fill="#c4b5fd" letter-spacing="-1">Vallenato Online</text>

  <!-- Tagline -->
  <text x="72" y="426" font-family="Arial, Helvetica, sans-serif" font-size="27" fill="#e9d5ff" opacity="0.82">Desde cero hasta tocar tus canciones favoritas</text>

  <!-- Stat pills -->
  <rect x="72"  y="484" width="194" height="50" rx="25" fill="url(#pill)" opacity="0.72"/>
  <text x="169" y="515" font-family="Arial, Helvetica, sans-serif" font-size="19" font-weight="600" fill="white" text-anchor="middle">69+ Tutoriales</text>

  <rect x="280" y="484" width="200" height="50" rx="25" fill="url(#pill)" opacity="0.72"/>
  <text x="380" y="515" font-family="Arial, Helvetica, sans-serif" font-size="19" font-weight="600" fill="white" text-anchor="middle">101 Estudiantes</text>

  <rect x="494" y="484" width="186" height="50" rx="25" fill="url(#pill)" opacity="0.72"/>
  <text x="587" y="515" font-family="Arial, Helvetica, sans-serif" font-size="19" font-weight="600" fill="white" text-anchor="middle">100% Online</text>

  <!-- URL -->
  <text x="72" y="594" font-family="Arial, Helvetica, sans-serif" font-size="21" fill="#a78bfa" opacity="0.88" letter-spacing="0.5">academiavallenataonline.com</text>

  <!-- Big note decoration -->
  <text x="810" y="540" font-family="Georgia, serif" font-size="380" fill="#8b5cf6" opacity="0.07">&#9835;</text>
</svg>`;

sharp(Buffer.from(svg))
  .jpeg({ quality: 92, mozjpeg: true })
  .toFile(path.join(__dirname, '../public/og-image.jpg'))
  .then(() => console.log('✅ og-image.jpg generada en /public (1200×630)'))
  .catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
