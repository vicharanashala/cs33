const User = require('../models/User');

const awardBadges = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return;

  const reputation = user.reputation || 0;

  const badgeThresholds = [
    { threshold: 10,   name: 'Newcomer' },
    { threshold: 50,   name: 'Contributor' },
    { threshold: 200,  name: 'Trusted' },
    { threshold: 500,  name: 'Expert' },
    { threshold: 1000, name: 'Legend' },
  ];

  const newBadges = badgeThresholds
    .filter((b) => reputation >= b.threshold)
    .map((b) => ({ name: b.name, awardedAt: new Date() }));

  if (newBadges.length > 0) {
    // FIX: $addToSet with $each on array of { name, awardedAt } objects
    // Each object must match exactly — this is safe from duplicates
    await User.findByIdAndUpdate(userId, {
      $addToSet: { badges: { $each: newBadges } },
    });
  }
};

module.exports = awardBadges;