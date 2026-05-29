/**
 * server/utils/seed.js
 * Standalone seed script — run with: cd server && npm run seed
 * Requires MONGO_URI in .env. Does NOT import server.js.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const FAQ = require('../models/FAQ');
const Notification = require('../models/Notification');
const Report = require('../models/Report');

// ── Helpers ─────────────────────────────────────────────────────────────────

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function hoursAgo(h) {
  return new Date(Date.now() - h * 3600 * 1000);
}

// ── Seed data ────────────────────────────────────────────────────────────────

const CATEGORIES = ['general', 'technical', 'billing', 'policy', 'other'];

const FAQ_DATA = [
  {
    question: 'How do I reset my account password if I forgot it?',
    body: 'Click "Forgot Password" on the login page, enter your registered email, and follow the link in the reset email.',
    category: 'general',
    tags: ['password', 'account', 'reset'],
    status: 'approved',
    answers: [
      { body: 'Go to the login page and click "Forgot Password". Enter your email and you will receive a reset link valid for 10 minutes.', votes: 8 },
      { body: 'If you do not receive the email within 5 minutes, check your spam folder. The link expires after 10 minutes.', votes: 3 },
    ],
  },
  {
    question: 'What payment methods are accepted for premium subscriptions?',
    body: 'We accept all major credit cards, debit cards, UPI, and net banking through our secure payment gateway.',
    category: 'billing',
    tags: ['payment', 'subscription', 'billing'],
    status: 'approved',
    answers: [
      { body: 'We accept Visa, Mastercard, American Express, UPI, and net banking. All transactions are encrypted.', votes: 12 },
    ],
  },
  {
    question: 'How can I report inappropriate content on the platform?',
    body: 'Each FAQ, answer, and comment has a "Report" button that lets you submit a report to our moderation team.',
    category: 'policy',
    tags: ['report', 'moderation', 'policy'],
    status: 'approved',
    answers: [
      { body: 'Click the flag icon on any post and select a reason. Our moderators review all reports within 24 hours.', votes: 5 },
      { body: 'You can also email support@example.com for urgent matters involving security or harassment.', votes: 2 },
      { body: 'Repeated false reports may result in restrictions on your account.', votes: 1 },
    ],
  },
  {
    question: 'Why is my FAQ showing as "pending" and not visible to others?',
    body: 'New FAQs require moderator approval before appearing in the public listing to prevent spam and low-quality content.',
    category: 'policy',
    tags: ['pending', 'moderation', 'faq'],
    status: 'approved',
    answers: [
      { body: 'Pending FAQs are only visible to you and moderators. Approval typically takes 1-2 business days.', votes: 7 },
    ],
  },
  {
    question: 'Can I edit or delete my FAQ after submitting it?',
    body: 'Yes, you can edit your FAQ at any time. However, deletion is only allowed if the FAQ has no answers.',
    category: 'general',
    tags: ['edit', 'delete', 'faq'],
    status: 'approved',
    answers: [
      { body: 'Click the "Edit" button on your FAQ page. Major edits are logged in the revision history.', votes: 6 },
      { body: 'If your FAQ has answers, you can close it instead of deleting it, which hides it from new activity.', votes: 4 },
    ],
  },
  {
    question: 'How does the reputation and badge system work?',
    body: 'Users earn reputation points when their answers are upvoted or accepted. Badges are awarded at reputation milestones.',
    category: 'general',
    tags: ['reputation', 'badges', 'gamification'],
    status: 'approved',
    answers: [
      { body: '+5 rep when your answer is upvoted, +10 when accepted. Badges include Contributor (50+ rep) and Expert (200+ rep).', votes: 15 },
      { body: 'Reputation affects your voting power and can unlock privileges like editing community wiki posts.', votes: 9 },
    ],
  },
  {
    question: 'What should I do if my account has been suspended?',
    body: 'If you believe your suspension was a mistake, contact the moderation team via the support email with your account details.',
    category: 'policy',
    tags: ['suspended', 'account', 'support'],
    status: 'pending',
    answers: [],
  },
  {
    question: 'How do I enable two-factor authentication on my account?',
    body: 'Two-factor authentication adds an extra layer of security by requiring a verification code in addition to your password.',
    category: 'technical',
    tags: ['2fa', 'security', 'authentication'],
    status: 'approved',
    answers: [
      { body: 'Go to Profile > Security > Enable 2FA. Scan the QR code with any authenticator app like Google Authenticator or Authy.', votes: 11 },
    ],
  },
  {
    question: 'Are there any API rate limits for programmatic access?',
    body: 'Yes. Public API endpoints are limited to 100 requests per 15 minutes per IP address.',
    category: 'technical',
    tags: ['api', 'rate-limit', 'developer'],
    status: 'pending',
    answers: [
      { body: 'Authenticated endpoints have a higher limit of 500 requests per 15 minutes. Contact us for enterprise limits.', votes: 4 },
    ],
  },
  {
    question: 'How is the "Hot" or trending FAQ ranking calculated?',
    body: 'Trending FAQs are ranked using a formula that balances votes, answer activity, and recency.',
    category: 'general',
    tags: ['trending', 'hot-score', 'ranking'],
    status: 'approved',
    answers: [
      { body: 'The hot score formula: (votes×3 + answers×2 + views×0.1) / (hoursOld+2)^1.5 — newer useful content rises to the top.', votes: 18 },
      { body: 'Only approved FAQs within the last 7 days are considered for the trending list.', votes: 7 },
      { body: 'Pinned FAQs always appear at the top regardless of their hot score.', votes: 3 },
    ],
  },
  {
    question: 'Can I follow other users to see their activity in my feed?',
    body: 'Yes, following users adds their activity to your personal activity feed on the Feed page.',
    category: 'general',
    tags: ['follow', 'feed', 'social'],
    status: 'approved',
    answers: [
      { body: 'Click the "Follow" button on any profile. Their new FAQs, answers, and accepted answers will appear in your feed.', votes: 6 },
    ],
  },
  {
    question: 'What happens to my data if I delete my account?',
    body: 'Account deletion removes your personal information but preserves community content under an anonymous placeholder.',
    category: 'policy',
    tags: ['privacy', 'gdpr', 'account-deletion'],
    status: 'pending',
    answers: [],
  },
  {
    question: 'How do I request a refund for my subscription?',
    body: 'Refund requests can be made within 14 days of purchase through the billing section of your account settings.',
    category: 'billing',
    tags: ['refund', 'billing', 'subscription'],
    status: 'approved',
    answers: [
      { body: 'Go to Account > Billing > Request Refund. Processing takes 5-7 business days. Refunds are issued to the original payment method.', votes: 10 },
    ],
  },
  {
    question: 'Is there a mobile app available for the FAQ portal?',
    body: 'Currently the platform is mobile-optimized web only. Native iOS and Android apps are on the roadmap for Q3.',
    category: 'general',
    tags: ['mobile', 'app', 'ios', 'android'],
    status: 'pending',
    answers: [
      { body: 'The website is fully responsive and works like a native app on mobile browsers. Install it to your home screen for the best experience.', votes: 2 },
    ],
  },
  {
    question: 'How do I mark an answer as accepted on my own FAQ?',
    body: 'The FAQ author can accept one answer by clicking the checkmark icon next to any answer.',
    category: 'general',
    tags: ['accepted-answer', 'faq', 'answer'],
    status: 'approved',
    answers: [
      { body: 'Only the FAQ author can accept an answer. Accepted answers earn the answerer +10 reputation and appear first.', votes: 14 },
      { body: 'You can change the accepted answer at any time by clicking a different checkmark.', votes: 5 },
    ],
  },
];

// ── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  if (!process.env.MONGO_URI) {
    console.error('Error: MONGO_URI is not set in .env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected.\n');

  // ── 1. Clear collections ──────────────────────────────────────────────────
  console.log('Clearing User, FAQ, Notification, Report collections...');
  await Promise.all([
    User.deleteMany({}),
    FAQ.deleteMany({}),
    Notification.deleteMany({}),
    Report.deleteMany({}),
  ]);
  console.log('Cleared.\n');

  // ── 2. Create users ───────────────────────────────────────────────────────
  console.log('Creating users...');

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@test.com',
    passwordHash: 'password123',   // pre-save hook hashes this
    role: 'admin',
    reputation: 0,
    badges: [],
    emailVerified: true,
  });

  const mod = await User.create({
    name: 'Moderator User',
    email: 'mod@test.com',
    passwordHash: 'password123',
    role: 'moderator',
    reputation: 0,
    badges: [],
    emailVerified: true,
  });

  const user1 = await User.create({
    name: 'Alice Johnson',
    email: 'user1@test.com',
    passwordHash: 'password123',
    role: 'user',
    reputation: 150,
    badges: [{ name: 'Contributor', awardedAt: new Date() }],
    emailVerified: true,
  });

  const user2 = await User.create({
    name: 'Bob Smith',
    email: 'user2@test.com',
    passwordHash: 'password123',
    role: 'user',
    reputation: 45,
    badges: [],
    emailVerified: true,
  });

  const allUsers = [admin, mod, user1, user2];
  console.log(`  admin: ${admin.email} (admin)`);
  console.log(`  mod:   ${mod.email} (moderator)`);
  console.log(`  user1: ${user1.email} (user, rep=150, badge=Contributor)`);
  console.log(`  user2: ${user2.email} (user, rep=45)\n`);

  // ── 3. Create FAQs ────────────────────────────────────────────────────────
  console.log('Creating 15 FAQs...');

  const faqs = [];

  for (let i = 0; i < FAQ_DATA.length; i++) {
    const data = FAQ_DATA[i];

    // Pick 1-3 random voters from the 3 non-admin users (admin doesn't vote)
    const voterPool = [mod, user1, user2];
    const numVoters = randInt(1, 3);
    const shuffled = voterPool.sort(() => 0.5 - Math.random()).slice(0, numVoters);

    const voters = shuffled.map((u) => ({ user: u._id, vote: 1 }));
    const votes = numVoters; // all votes are +1 for simplicity

    // Random createdAt within last 14 days
    const createdAt = hoursAgo(randInt(1, 14 * 24));
    const views = randInt(5, 200);

    const faqAnswers = data.answers.map((aData, ai) => {
      // Pick a random author (not the FAQ author, pick from remaining users)
      const answerAuthor = pickRandom(
        allUsers.filter((u) => u._id.toString() !== admin._id.toString())
      );

      const answerVoters = voterPool
        .filter(() => Math.random() > 0.4)
        .slice(0, randInt(0, 2))
        .map((u) => ({ user: u._id, vote: 1 }));

      return {
        body: aData.body,
        author: answerAuthor._id,
        votes: aData.votes,
        voters: answerVoters,
        isAccepted: ai === 0 && data.status === 'approved' && Math.random() > 0.5,
        createdAt: hoursAgo(randInt(1, 13 * 24)),
      };
    });

    const faq = await FAQ.create({
      question: data.question,
      body: data.body,
      author: pickRandom([user1, user2]), // user1/user2 are the community authors
      tags: data.tags,
      category: data.category,
      status: data.status,
      votes,
      voters,
      views,
      answers: faqAnswers,
      createdAt,
    });

    faqs.push(faq);
    process.stdout.write(`  [${i + 1}/15] "${data.question.slice(0, 50)}..." status=${data.status} votes=${votes} answers=${faqAnswers.length}\n`);
  }

  console.log(`\n${faqs.length} FAQs created.\n`);

  // ── 4. Create 3 pending reports ──────────────────────────────────────────
  console.log('Creating 3 pending reports...');

  const REPORT_REASONS = ['spam', 'offensive', 'misleading', 'duplicate'];

  const reportTargets = [
    { faq: faqs[6],  reason: 'misleading', details: 'This FAQ contains outdated information about account suspension appeals.' },
    { faq: faqs[11], reason: 'offensive',  details: 'The privacy policy section is incomplete and potentially misleading.' },
    { faq: faqs[13], reason: 'duplicate',  details: 'This question has already been answered in FAQ #1 about account management.' },
  ];

  const reporters = [user1, user2, mod];

  for (let i = 0; i < reportTargets.length; i++) {
    const { faq, reason, details } = reportTargets[i];
    const report = await Report.create({
      reporter: reporters[i % reporters.length]._id,
      targetType: 'faq',
      targetId: faq._id,
      reason,
      details,
      status: 'pending',
    });
    process.stdout.write(`  [${i + 1}/3] reason=${reason} target="${faq.question.slice(0, 40)}..."\n`);
  }

  console.log('\nSeeded successfully');

  await mongoose.disconnect();
  console.log('Disconnected.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});