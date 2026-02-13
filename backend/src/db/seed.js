/**
 * Database Seed Script
 * Pre-populates skill taxonomy and admin user
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const categories = [
  { name: 'Emergency Home Services', name_hi: 'आपातकालीन गृह सेवाएं', name_te: 'అత్యవసర గృహ సేవలు', slug: 'emergency-home' },
  { name: 'Appliance Repair & IT', name_hi: 'उपकरण मरम्मत और आईटी', name_te: 'ఉపకరణ మరమ్మత్తు & IT', slug: 'appliance-it' },
  { name: 'Handyman & Carpentry', name_hi: 'हैंडीमैन और बढ़ईगीरी', name_te: 'హ్యాండీమ్యాన్ & వడ్రంగి', slug: 'handyman-carpentry' },
  { name: 'Logistics & Errands', name_hi: 'लॉजिस्टिक्स और कार्य', name_te: 'లాజిస్టిక్స్ & పనులు', slug: 'logistics-errands' },
  { name: 'Senior & Child Assistance', name_hi: 'वरिष्ठ और बाल सहायता', name_te: 'సీనియర్ & చైల్డ్ సహాయం', slug: 'senior-child' },
  { name: 'Pet Care', name_hi: 'पालतू जानवरों की देखभाल', name_te: 'పెంపుడు జంతువుల సంరక్షణ', slug: 'pet-care' },
  { name: 'Automotive Services', name_hi: 'ऑटोमोटिव सेवाएं', name_te: 'ఆటోమోటివ్ సేవలు', slug: 'automotive' },
  { name: 'Cleaning & Housekeeping', name_hi: 'सफाई और हाउसकीपिंग', name_te: 'శుభ్రపరచడం & హౌస్‌కీపింగ్', slug: 'cleaning' },
];

const skillsData = {
  'emergency-home': [
    {
      name: 'Plumbing', name_hi: 'प्लंबिंग', name_te: 'ప్లంబింగ్', slug: 'plumbing',
      subSkills: [
        { name: 'Drain Unclogging', name_hi: 'नाली खोलना', name_te: 'డ్రెయిన్ అన్‌క్లాగింగ్', slug: 'plumbing.drain_unclog', aliases: ['kitchen drain', 'sink unclog', 'pipe blockage'], avg_base_rate: 300 },
        { name: 'Tap Repair', name_hi: 'नल मरम्मत', name_te: 'ట్యాప్ రిపేర్', slug: 'plumbing.tap_repair', aliases: ['leaky faucet', 'tap washer'], avg_base_rate: 250 },
        { name: 'Flush Repair', name_hi: 'फ्लश मरम्मत', name_te: 'ఫ్లష్ రిపేర్', slug: 'plumbing.flush_repair', aliases: ['cistern fix', 'toilet flush'], avg_base_rate: 350 },
      ]
    },
    {
      name: 'Electrical', name_hi: 'इलेक्ट्रिकल', name_te: 'ఎలక్ట్రికల్', slug: 'electrical',
      subSkills: [
        { name: 'Fuse/MCB Reset', name_hi: 'फ्यूज/MCB रीसेट', name_te: 'ఫ్యూజ్/MCB రీసెట్', slug: 'electrical.fuse_reset', aliases: ['power trip', 'breaker reset'], avg_base_rate: 200 },
        { name: 'Socket/Switch Replace', name_hi: 'सॉकेट/स्विच बदलना', name_te: 'సాకెట్/స్విచ్ మార్పు', slug: 'electrical.socket_replace', aliases: ['socket fix', 'switch repair'], avg_base_rate: 350 },
        { name: 'Light Fitting', name_hi: 'लाइट फिटिंग', name_te: 'లైట్ ఫిట్టింగ్', slug: 'electrical.light_fitting', aliases: ['bulb replacement', 'tube light'], avg_base_rate: 200 },
        { name: 'Fan Installation', name_hi: 'पंखा लगाना', name_te: 'ఫ్యాన్ ఇన్‌స్టాలేషన్', slug: 'electrical.fan_install', aliases: ['ceiling fan', 'fan regulator'], avg_base_rate: 500 },
      ]
    },
    {
      name: 'Locksmith', name_hi: 'ताला बनाने वाला', name_te: 'తాళం చెవి తయారీదారు', slug: 'locksmith',
      subSkills: [
        { name: 'Door Unlock', name_hi: 'दरवाजा खोलना', name_te: 'తలుపు తెరవడం', slug: 'locksmith.door_unlock', aliases: ['locked out', 'key stuck'], avg_base_rate: 400 },
        { name: 'Lock Replacement', name_hi: 'ताला बदलना', name_te: 'తాళం మార్పు', slug: 'locksmith.lock_replace', aliases: ['new lock', 'lock change'], avg_base_rate: 500 },
      ]
    },
  ],
  'appliance-it': [
    {
      name: 'WiFi & Router', name_hi: 'वाईफाई और राउटर', name_te: 'వైఫై & రూటర్', slug: 'wifi-router',
      subSkills: [
        { name: 'Router Setup', name_hi: 'राउटर सेटअप', name_te: 'రూటర్ సెటప్', slug: 'wifi.router_setup', aliases: ['wifi not working', 'internet setup'], avg_base_rate: 250 },
      ]
    },
    {
      name: 'AC Service', name_hi: 'एसी सर्विस', name_te: 'AC సర్వీస్', slug: 'ac-service',
      subSkills: [
        { name: 'AC Filter Clean', name_hi: 'एसी फिल्टर सफाई', name_te: 'AC ఫిల్టర్ క్లీన్', slug: 'ac.filter_clean', aliases: ['ac maintenance', 'ac not cooling'], avg_base_rate: 400 },
      ]
    },
  ],
  'logistics-errands': [
    {
      name: 'Delivery & Errands', name_hi: 'डिलीवरी और कार्य', name_te: 'డెలివరీ & పనులు', slug: 'delivery-errands',
      subSkills: [
        { name: 'Medicine Pickup', name_hi: 'दवाई लेना', name_te: 'మందుల పికప్', slug: 'errand.medicine_pickup', aliases: ['pharmacy run', 'urgent medicine'], avg_base_rate: 150 },
        { name: 'Document Delivery', name_hi: 'दस्तावेज़ डिलीवरी', name_te: 'డాక్యుమెంట్ డెలివరీ', slug: 'errand.document_delivery', aliases: ['courier', 'document drop'], avg_base_rate: 200 },
      ]
    },
  ],
  'automotive': [
    {
      name: 'Vehicle Emergency', name_hi: 'वाहन आपातकाल', name_te: 'వాహన అత్యవసరం', slug: 'vehicle-emergency',
      subSkills: [
        { name: 'Jump Start', name_hi: 'जंप स्टार्ट', name_te: 'జంప్ స్టార్ట్', slug: 'auto.jump_start', aliases: ['battery dead', 'car wont start'], avg_base_rate: 300 },
        { name: 'Tyre Puncture', name_hi: 'टायर पंचर', name_te: 'టైర్ పంక్చర్', slug: 'auto.tyre_puncture', aliases: ['flat tire', 'puncture repair'], avg_base_rate: 200 },
      ]
    },
  ],
};

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create admin user
    const adminHash = await bcrypt.hash('admin123', 10);
    await client.query(
      `INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      ['admin@helpinminutes.com', adminHash, 'Admin User', 'admin']
    );

    // Create test buyer
    const buyerHash = await bcrypt.hash('buyer123', 10);
    await client.query(
      `INSERT INTO users (email, password_hash, name, role, phone) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING`,
      ['buyer@test.com', buyerHash, 'Test Buyer', 'buyer', '+919876543210']
    );

    // Create test helper
    const helperHash = await bcrypt.hash('helper123', 10);
    const helperResult = await client.query(
      `INSERT INTO users (email, password_hash, name, role, phone) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
      ['helper@test.com', helperHash, 'Test Helper', 'helper', '+919876543211']
    );

    // Insert categories and skills
    for (const cat of categories) {
      const catResult = await client.query(
        `INSERT INTO categories (name, name_hi, name_te, slug) VALUES ($1, $2, $3, $4)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
        [cat.name, cat.name_hi, cat.name_te, cat.slug]
      );
      const catId = catResult.rows[0].id;

      const skills = skillsData[cat.slug] || [];
      for (const skill of skills) {
        const skillResult = await client.query(
          `INSERT INTO skills (category_id, name, name_hi, name_te, slug) VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
          [catId, skill.name, skill.name_hi, skill.name_te, skill.slug]
        );
        const skillId = skillResult.rows[0].id;

        for (const sub of skill.subSkills) {
          await client.query(
            `INSERT INTO sub_skills (skill_id, name, name_hi, name_te, slug, aliases, avg_base_rate)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name`,
            [skillId, sub.name, sub.name_hi, sub.name_te, sub.slug, sub.aliases, sub.avg_base_rate]
          );
        }
      }
    }

    // Create helper profile with verified KYC for testing
    if (helperResult.rows[0]) {
      const helperId = helperResult.rows[0].id;
      const profileResult = await client.query(
        `INSERT INTO helper_profiles (user_id, kyc_status, is_online, current_lat, current_lng, current_h3_index, rating)
         VALUES ($1, 'VERIFIED', true, 17.4500, 78.3910, '892830828a3ffff', 4.5)
         ON CONFLICT (user_id) DO UPDATE SET kyc_status = 'VERIFIED' RETURNING id`,
        [helperId]
      );

      // Assign some skills to the helper
      if (profileResult.rows[0]) {
        const hpId = profileResult.rows[0].id;
        const subSkills = await client.query(`SELECT id FROM sub_skills LIMIT 5`);
        for (const ss of subSkills.rows) {
          await client.query(
            `INSERT INTO helper_skills (helper_id, sub_skill_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [hpId, ss.id]
          );
        }
      }
    }

    await client.query('COMMIT');
    console.log('Seed completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
