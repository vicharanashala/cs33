const User = require('../models/User');
const FAQ = require('../models/FAQ');
const AppError = require('../utils/AppError');

const getProfile = async (req, res, next) => {
  try {
    const { idOrUsername } = req.params;

    const user = await User.findOne({
      $or: [{ _id: idOrUsername }, { username: idOrUsername }],
    }).select('name avatar bio reputation badges createdAt role following followerCount notifyOnAnswer notifyOnComment');

    if (!user) return next(new AppError('User not found', 404));

    const [faqs, answerCount] = await Promise.all([
      FAQ.find({ author: user._id }).sort({ createdAt: -1 }).limit(20).select('question tags votes createdAt status answerCount isPinned'),
      FAQ.countDocuments({ 'answers.author': user._id, status: 'approved' }),
    ]);

    // Count accepted answers (answers where isAccepted === true on approved FAQs)
    const acceptedCount = await FAQ.countDocuments({
      'answers.author': user._id,
      'answers.isAccepted': true,
      status: 'approved',
    });

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        questionCount: faqs.length,
        answerCount,
        acceptedCount,
        faqs,
      },
    });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.user._id.equals(id)) {
      return next(new AppError('Not authorized to update this profile', 403));
    }

    const { name, bio, avatar, notifyOnAnswer, notifyOnComment } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;
    if (notifyOnAnswer !== undefined) updates.notifyOnAnswer = notifyOnAnswer;
    if (notifyOnComment !== undefined) updates.notifyOnComment = notifyOnComment;

    const user = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).select(
      'name avatar bio reputation badges email role notifyOnAnswer notifyOnComment createdAt lastActive'
    );

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!req.user._id.equals(id)) {
      return next(new AppError('Not authorized to change this password', 403));
    }

    if (!newPassword || newPassword.length < 8) {
      return next(new AppError('New password must be at least 8 characters', 400));
    }

    const user = await User.findById(id).select('+passwordHash');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) return next(new AppError('Current password is incorrect', 401));

    user.passwordHash = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};

const followUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user._id.equals(id)) {
      return next(new AppError('Cannot follow yourself', 400));
    }

    const targetUser = await User.findById(id);
    if (!targetUser) return next(new AppError('User not found', 404));

    if (req.user.following.includes(id)) {
      return res.json({ success: true, message: 'Already following' });
    }

    req.user.following.push(id);
    await req.user.save();

    res.json({ success: true, message: 'User followed' });
  } catch (err) {
    next(err);
  }
};

const unfollowUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.user.following.includes(id)) {
      return next(new AppError('Not following this user', 400));
    }

    req.user.following = req.user.following.filter((uid) => !uid.equals(id));
    await req.user.save();

    res.json({ success: true, message: 'User unfollowed' });
  } catch (err) {
    next(err);
  }
};

const saveFAQ = async (req, res, next) => {
  try {
    const { faqId } = req.params;

    const faq = await FAQ.findById(faqId);
    if (!faq) return next(new AppError('FAQ not found', 404));

    const alreadySaved = req.user.savedFAQs.includes(faqId);

    if (alreadySaved) {
      req.user.savedFAQs = req.user.savedFAQs.filter((id) => !id.equals(faqId));
      await req.user.save();
      return res.json({ success: true, message: 'FAQ removed from saved', saved: false });
    } else {
      req.user.savedFAQs.push(faqId);
      await req.user.save();
      return res.json({ success: true, message: 'FAQ saved', saved: true });
    }
  } catch (err) {
    next(err);
  }
};

const getSavedFAQs = async (req, res, next) => {
  try {
    const faqs = await FAQ.find({ _id: { $in: req.user.savedFAQs }, status: 'approved' })
      .sort({ createdAt: -1 })
      .select('question tags votes createdAt');

    res.json({ success: true, data: faqs });
  } catch (err) {
    next(err);
  }
};

const getActivityFeed = async (req, res, next) => {
  try {
    const followingIds = req.user.following;

    if (followingIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const faqs = await FAQ.find({
      author: { $in: followingIds },
      status: 'approved',
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('author', 'name avatar');

    
    res.json({ success: true, data: faqs });

  } catch (err) {
    next(err);
  }
};

// Get answers by a specific user
const getUserAnswers = async (req, res, next) => {
  try {
    const { idOrUsername } = req.params;
    const user = await User.findOne({
      $or: [{ _id: idOrUsername }, { username: idOrUsername }],
    }).select('_id');
    if (!user) return next(new AppError('User not found', 404));

    const faqs = await FAQ.find(
      { 'answers.author': user._id, status: 'approved' },
      { question: 1, answers: 1 }
    )
      .sort({ createdAt: -1 })
      .populate('answers.author', 'name avatar reputation');

    // Flatten + shape answers
    const answers = faqs.flatMap((f) =>
      f.answers
        .filter((a) => a.author && a.author._id.equals(user._id))
        .map((a) => ({
          _id: a._id,
          body: a.body,
          votes: a.votes,
          isAccepted: a.isAccepted,
          createdAt: a.createdAt,
          faq: { _id: f._id, question: f.question },
          author: a.author,
        }))
    );

    res.json({ success: true, data: answers });
  } catch (err) {
    next(err);
  }
};

// Get activity for a specific user (used on profile page Activity tab)
const getUserActivity = async (req, res, next) => {
  try {
    const { idOrUsername } = req.params;
    const user = await User.findOne({
      $or: [{ _id: idOrUsername }, { username: idOrUsername }],
    }).select('_id');
    if (!user) return next(new AppError('User not found', 404));

    const [faqs, answers] = await Promise.all([
      FAQ.find({ author: user._id }).sort({ createdAt: -1 }).limit(20).select('question createdAt'),
      FAQ.find({ 'answers.author': user._id, status: 'approved' })
        .sort({ 'answers.createdAt': -1 })
        .limit(20)
        .select('question answers.createdAt'),
    ]);

    const activity = [
      ...faqs.map((f) => ({
        type: 'faq_created',
        icon: '❓',
        text: 'asked a new question',
        faq: { _id: f._id, question: f.question },
        createdAt: f.createdAt,
      })),
      ...answers.flatMap((f) =>
        f.answers
          .filter((a) => a.author.equals(user._id))
          .map((a) => ({
            type: 'answer_added',
            icon: '💬',
            text: 'answered',
            faq: { _id: f._id, question: f.question },
            createdAt: a.createdAt,
          }))
      ),
    ];

    activity.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, data: activity.slice(0, 30) });
  } catch (err) {
    next(err);
  }
};

const getLeaderboard = async (req, res, next) => {
  try {
    const topUsers = await User.find()
      .sort({ reputation: -1 })
      .limit(10)
      .select('name avatar reputation badges');

    const enriched = await Promise.all(
      topUsers.map(async (user) => {
        const faqCount = await FAQ.countDocuments({ author: user._id, status: 'approved' });
        return {
          _id: user._id,
          name: user.name,
          avatar: user.avatar,
          reputation: user.reputation,
          badges: user.badges,
          faqCount,
        };
      })
    );

    res.json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  followUser,
  unfollowUser,
  saveFAQ,
  getSavedFAQs,
  getActivityFeed, getUserActivity, getUserAnswers,
  getLeaderboard,
};