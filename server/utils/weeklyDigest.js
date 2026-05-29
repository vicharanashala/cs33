const FAQ    = require('../models/FAQ');
const User   = require('../models/User');
const { sendEmail }              = require('./sendEmail');
const { weeklyDigestEmail }      = require('./emailTemplates');

const sendWeeklyDigest = async () => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Top 5 approved FAQs from the past 7 days, sorted by votes
  const topFAQs = await FAQ.find({
    status:     'approved',
    createdAt:  { $gte: sevenDaysAgo },
  })
    .sort({ votes: -1 })
    .limit(5)
    .select('_id question votes');

  if (topFAQs.length === 0) {
    console.log('Weekly digest: no FAQs to report this week.');
    return;
  }

  // Enrich with answer counts
  const enriched = await FAQ.find({ _id: { $in: topFAQs.map((f) => f._id) } })
    .select('_id question votes')
    .then((docs) => docs.map((f) => ({
      _id:         f._id,
      question:    f.question,
      votes:       f.votes,
      answerCount: f.answers?.length || 0,
    })));

  // All users with verified email
  const users = await User.find({ emailVerified: true }).select('_id name email');

  let sent = 0;
  await Promise.allSettled(
    users.map((u) =>
      sendEmail({
        to:      u.email,
        subject: 'Your Weekly FAQ Digest',
        html:    weeklyDigestEmail({ userName: u.name, topFAQs: enriched }),
      }).then(() => { sent++; })
    )
  );

  console.log(`Weekly digest sent to ${sent} users`);
};

module.exports = { sendWeeklyDigest };