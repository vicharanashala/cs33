const FAQ = require('../models/FAQ');
const User = require('../models/User');
const Report = require('../models/Report');
const AppError = require('../utils/AppError');
const createNotification = require('../utils/createNotification');
const awardBadges = require('../utils/awardBadges');
const mongoose = require('mongoose');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);
const { sendEmail } = require('../utils/sendEmail');
const { newAnswerEmail } = require('../utils/emailTemplates');

// io is attached to req.io by server.js middleware — import server to emit directly
const { io } = require('../server');

// In-memory trending cache — 10-minute TTL
let trendingCache = { data: null, fetchedAt: 0 };
const TRENDING_TTL_MS = 10 * 60 * 1000;

const getAll = async (req, res, next) => {
  try {
    const {
      search,
      tag,
      category,
      sort,
      page: rawPage,
      limit: rawLimit,
    } = req.query;

    const page  = Math.max(1,  parseInt(rawPage,  10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(rawLimit, 10) || 10));

    const SORT_WHITELIST = ['newest', 'votes', 'views', 'unanswered'];
    const safeSort = SORT_WHITELIST.includes(sort) ? sort : 'newest';

    const query = {};

    if (!req.user || req.user.role === 'user') {
      query.status = 'approved';
    }

    if (search) {
      query.$text = { $search: search };
    }

    if (tag) {
      query.tags = tag.toLowerCase().trim();
    }

    if (category) {
      query.category = category.toLowerCase().trim();
    }

    let sortOption = { createdAt: -1 };
    let projection = null;

    if (search) {
      sortOption = { score: { $meta: 'textScore' }, createdAt: -1 };
      projection = { score: { $meta: 'textScore' } };
    } else if (safeSort === 'votes') {
      sortOption = { votes: -1 };
    } else if (safeSort === 'views') {
      sortOption = { views: -1 };
    } else if (safeSort === 'unanswered') {
      query.answers = { $size: 0 };
    }

    const options = {
      page,
      limit,
      sort: sortOption,
      projection,
      populate: 'author',
      select: 'question body tags category status votes views answers comments author slug createdAt isPinned',
    };

    const result = await FAQ.paginate(query, options);

    let data = result.docs;
    if (search) {
      const terms = search.toLowerCase().split(/\s+/).filter(Boolean);
      data = data.map((faq) => {
        let highlights = [];
        if (faq.body) {
          const sentences = faq.body.split(/(?<=[.!?])\s+/);
          highlights = sentences
            .filter((s) => terms.some((t) => s.toLowerCase().includes(t)))
            .slice(0, 2)
            .map((s) => s.replace(/[#*`_~]/g, '').trim())
            .filter(Boolean);
        }
        return { ...faq.toObject(), highlights };
      });
    }

    return res.json({
      success: true,
      data,
      pagination: {
        currentPage: result.page,
        totalPages: result.totalPages,
        totalItems: result.totalDocs,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      },
    });
  } catch (err) {
    return next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;

    if (
      typeof idOrSlug !== 'string' ||
      idOrSlug.length < 1 ||
      idOrSlug.length > 200
    ) {
      return next(new AppError('Invalid FAQ identifier', 400));
    }

    const query = {};
    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
      query._id = idOrSlug;
    }
    if (/^[a-zA-Z0-9_-]{1,200}$/.test(idOrSlug)) {
      query.slug = idOrSlug;
    }
    if (Object.keys(query).length === 0) {
      return next(new AppError('Invalid FAQ identifier', 400));
    }
    if (!req.user || req.user.role === 'user') {
      query.status = 'approved';
    }

    const faq = await FAQ.findOne(query)
      .populate('author', 'name avatar reputation')
      .populate('answers.author', 'name avatar reputation')
      .populate('comments.author', 'name avatar')
      .populate('relatedFAQs', 'question')
      .populate('revisionHistory.editedBy', 'name avatar');

    if (!faq) return next(new AppError('FAQ not found', 404));

    await FAQ.findByIdAndUpdate(faq._id, { $inc: { views: 1 } });

    return res.json({ success: true, data: faq });
  } catch (err) {
    return next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { question, body, tags, category } = req.body;
    const cleanBody = body ? DOMPurify.sanitize(body, { ALLOWED_TAGS: [] }) : '';

    if (!question) return next(new AppError('Question is required', 400));
    if (question.trim().length < 15) {
      return next(new AppError('Question must be at least 15 characters', 400));
    }
    if (!category) return next(new AppError('Category is required', 400));

    const faq = await FAQ.create({
      question,
      body: cleanBody,
      tags: tags ? tags.map((t) => t.toLowerCase().trim()).slice(0, 5) : [],
      category: category.toLowerCase(),
      author: req.user._id,
      status: 'pending',
    });

    await faq.populate('author', 'name avatar reputation');

    return res.status(201).json({ success: true, data: faq });
  } catch (err) {
    return next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { question, body, tags, category } = req.body;
    const cleanBody = body ? DOMPurify.sanitize(body, { ALLOWED_TAGS: [] }) : '';

    const faq = await FAQ.findById(id);
    if (!faq) return next(new AppError('FAQ not found', 404));

    const isAuthor = faq.author.equals(req.user._id);
    const isModOrAdmin = ['moderator', 'admin'].includes(req.user.role);

    if (!isAuthor && !isModOrAdmin) {
      return next(new AppError('Not authorized to update this FAQ', 403));
    }

    if (isAuthor && faq.status !== 'pending') {
      return next(new AppError('Cannot edit FAQ after it has been reviewed', 403));
    }

    if (question) {
      if (question.trim().length < 15) {
        return next(new AppError('Question must be at least 15 characters', 400));
      }
      faq.question = question;
    }

    if (body !== undefined) {
      faq.revisionHistory.push({ body: faq.body, editedBy: req.user._id });
      faq.body = cleanBody;
    }

    if (tags) faq.tags = tags.map((t) => t.toLowerCase().trim()).slice(0, 5);
    if (category) faq.category = category.toLowerCase();

    await faq.save();
    await faq.populate('author', 'name avatar reputation');

    return res.json({ success: true, data: faq });
  } catch (err) {
    return next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const faq = await FAQ.findById(id);
    if (!faq) return next(new AppError('FAQ not found', 404));

    const isAuthor = faq.author.equals(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return next(new AppError('Not authorized to delete this FAQ', 403));
    }

    if (isAuthor && faq.answers.length > 0) {
      return next(new AppError('Cannot delete FAQ with answers', 403));
    }

    await FAQ.findByIdAndDelete(id);

    return res.json({ success: true, message: 'FAQ deleted' });
  } catch (err) {
    return next(err);
  }
};

const togglePin = async (req, res, next) => {
  try {
    const { id } = req.params;

    const faq = await FAQ.findById(id);
    if (!faq) return next(new AppError('FAQ not found', 404));

    faq.isPinned = !faq.isPinned;
    await faq.save();

    return res.json({ success: true, data: { isPinned: faq.isPinned } });
  } catch (err) {
    return next(err);
  }
};

const toggleWiki = async (req, res, next) => {
  try {
    const { id } = req.params;

    const faq = await FAQ.findById(id);
    if (!faq) return next(new AppError('FAQ not found', 404));

    faq.isCommunityWiki = !faq.isCommunityWiki;
    await faq.save();

    return res.json({ success: true, data: { isCommunityWiki: faq.isCommunityWiki } });
  } catch (err) {
    return next(err);
  }
};

const voteFAQ = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { vote } = req.body;

    if (vote !== 1 && vote !== -1) {
      return next(new AppError('Vote must be 1 or -1', 400));
    }

    const faq = await FAQ.findById(id);
    if (!faq) return next(new AppError('FAQ not found', 404));

    const existingIndex = faq.voters.findIndex(
      (v) => v.user.equals(req.user._id)
    );

    let voteDelta = 0;

    if (existingIndex !== -1) {
      const existingVote = faq.voters[existingIndex].vote;
      if (existingVote === vote) {
        faq.voters.splice(existingIndex, 1);
        voteDelta = -vote;
      } else {
        faq.voters[existingIndex].vote = vote;
        voteDelta = vote * 2;
      }
    } else {
      faq.voters.push({ user: req.user._id, vote });
      voteDelta = vote;
    }

    faq.votes += voteDelta;
    await faq.save();

    if (faq.author.equals(req.user._id)) {
      return res.json({ success: true, data: { votes: faq.votes } });
    }

    const repDelta = voteDelta === 1 ? 10 : voteDelta === -1 ? -2 : 0;
    if (repDelta !== 0) {
      await User.findByIdAndUpdate(faq.author, { $inc: { reputation: repDelta } });
      await awardBadges(faq.author);
    }

    io.to(`faq:${id}`).emit('faq:voted', { faqId: id, votes: faq.votes });

    return res.json({ success: true, data: { votes: faq.votes } });
  } catch (err) {
    return next(err);
  }
};

const voteAnswer = async (req, res, next) => {
  try {
    const { id, answerId } = req.params;
    const { vote } = req.body;

    if (vote !== 1 && vote !== -1) {
      return next(new AppError('Vote must be 1 or -1', 400));
    }

    const faq = await FAQ.findById(id);
    if (!faq) return next(new AppError('FAQ not found', 404));

    const answer = faq.answers.id(answerId);
    if (!answer) return next(new AppError('Answer not found', 404));

    const existingIndex = answer.voters.findIndex((v) => v.user.equals(req.user._id));
    let voteDelta = 0;

    if (existingIndex !== -1) {
      const existingVote = answer.voters[existingIndex].vote;
      if (existingVote === vote) {
        answer.voters.splice(existingIndex, 1);
        voteDelta = -vote;
      } else {
        answer.voters[existingIndex].vote = vote;
        voteDelta = vote * 2;
      }
    } else {
      answer.voters.push({ user: req.user._id, vote });
      voteDelta = vote;
    }

    answer.votes += voteDelta;
    await faq.save();

    if (!answer.author.equals(req.user._id)) {
      const repDelta = voteDelta === 1 ? 5 : voteDelta === -1 ? -1 : 0;
      if (repDelta !== 0) {
        await User.findByIdAndUpdate(answer.author, { $inc: { reputation: repDelta } });
        await awardBadges(answer.author);
      }
    }

    io.to(`faq:${id}`).emit('faq:answerVoted', { faqId: id, answerId, votes: answer.votes });

    return res.json({ success: true, data: { votes: answer.votes } });
  } catch (err) {
    return next(err);
  }
};

const addAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { body } = req.body;

    if (!body) return next(new AppError('Answer body is required', 400));

    const faq = await FAQ.findById(id);
    if (!faq) return next(new AppError('FAQ not found', 404));

    faq.answers.push({ body, author: req.user._id });
    await faq.save();

    const newAnswer = faq.answers[faq.answers.length - 1];
    await newAnswer.populate('author', 'name avatar reputation');

    // Award FAQ author +5 reputation (only if answerer is not the author)
    if (!faq.author.equals(req.user._id)) {
      const faqAuthor = await User.findById(faq.author);
      if (faqAuthor && !faqAuthor.isSuspended) {
        await User.findByIdAndUpdate(faq.author, { $inc: { reputation: 5 } });
        await awardBadges(faq.author);
      }
    }

    io.to(`faq:${id}`).emit('faq:newAnswer', { faqId: id, answer: newAnswer });

    // In-app notification to FAQ author
    if (!faq.author.equals(req.user._id)) {
      await createNotification({
        recipient: faq.author,
        sender: req.user._id,
        type: 'answer',
        faqId: faq._id,
        message: `${req.user.name} answered your FAQ: "${faq.question}"`,
        io,
      });
    }

    // Email notification to FAQ author (opt-in)
    const faqAuthor = await User.findById(faq.author);
    if (faqAuthor?.notifyOnAnswer !== false && faqAuthor?.email && faqAuthor?.emailVerified) {
      sendEmail({
        to:      faqAuthor.email,
        subject: `New answer on: "${faq.question}"`,
        html:    newAnswerEmail({
          userName:       faqAuthor.name,
          questionTitle:  faq.question,
          answerPreview:  body,
          faqUrl:         `${process.env.CLIENT_URL || 'http://localhost:5173'}/faqs/${faq._id}`,
        }),
      }).catch((err) => console.error('Failed to send new-answer email:', err.message));
    }

    return res.status(201).json({ success: true, data: newAnswer });
  } catch (err) {
    return next(err);
  }
};

const updateAnswer = async (req, res, next) => {
  try {
    const { id, answerId } = req.params;
    const { body } = req.body;

    if (!body) return next(new AppError('Answer body is required', 400));

    const faq = await FAQ.findById(id);
    if (!faq) return next(new AppError('FAQ not found', 404));

    const answer = faq.answers.id(answerId);
    if (!answer) return next(new AppError('Answer not found', 404));

    const isAuthor = answer.author.equals(req.user._id);
    const isWikiMod = faq.isCommunityWiki && ['moderator', 'admin'].includes(req.user.role);

    if (!isAuthor && !isWikiMod) {
      return next(new AppError('Not authorized to edit this answer', 403));
    }

    answer.editHistory.push({ body: answer.body, editedAt: new Date() });
    answer.body = body;
    await faq.save();

    await answer.populate('author', 'name avatar reputation');

    return res.json({ success: true, data: answer });
  } catch (err) {
    return next(err);
  }
};

const deleteAnswer = async (req, res, next) => {
  try {
    const { id, answerId } = req.params;

    const faq = await FAQ.findById(id);
    if (!faq) return next(new AppError('FAQ not found', 404));

    const answer = faq.answers.id(answerId);
    if (!answer) return next(new AppError('Answer not found', 404));

    const isAuthor = answer.author.equals(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return next(new AppError('Not authorized to delete this answer', 403));
    }

    faq.answers.pull({ _id: answerId });
    await faq.save();

    return res.json({ success: true, message: 'Answer deleted' });
  } catch (err) {
    return next(err);
  }
};

const acceptAnswer = async (req, res, next) => {
  try {
    const { id, answerId } = req.params;

    const faq = await FAQ.findById(id);
    if (!faq) return next(new AppError('FAQ not found', 404));

    if (!faq.author.equals(req.user._id)) {
      return next(new AppError('Only FAQ author can accept an answer', 403));
    }

    const answer = faq.answers.id(answerId);
    if (!answer) return next(new AppError('Answer not found', 404));

    // Persist to DB: unaccept all others, accept this one
    faq.answers.forEach((a) => {
      a.isAccepted = a._id.equals(answer._id);
    });
    await faq.save();

    // Award answer author +15 reputation (only if not self-accept and not suspended)
    if (!answer.author.equals(req.user._id)) {
      const answerAuthor = await User.findById(answer.author);
      if (answerAuthor && !answerAuthor.isSuspended) {
        await User.findByIdAndUpdate(answer.author, { $inc: { reputation: 15 } });
        await awardBadges(answer.author);
      }
    }

    io.to(`faq:${id}`).emit('faq:answerAccepted', { faqId: id, answerId });

    return res.json({ success: true, data: { answerId, isAccepted: true } });
  } catch (err) {
    return next(err);
  }
};

const addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { body, answerId } = req.body;

    if (!body || body.trim().length < 2) {
      return next(new AppError('Comment must be at least 2 characters', 400));
    }

    const faq = await FAQ.findById(id);
    if (!faq) return next(new AppError('FAQ not found', 404));

    let targetAuthor;
    if (answerId) {
      const answer = faq.answers.id(answerId);
      if (!answer) return next(new AppError('Answer not found', 404));
      answer.comments.push({ body: body.trim(), author: req.user._id });
      targetAuthor = answer.author;
    } else {
      faq.comments.push({ body: body.trim(), author: req.user._id });
      targetAuthor = faq.author;
    }

    await faq.save();

    // Notification to content author
    if (!targetAuthor.equals(req.user._id)) {
      await createNotification({
        recipient: targetAuthor,
        sender: req.user._id,
        type: 'comment',
        faqId: faq._id,
        message: `${req.user.name} commented on your ${answerId ? 'answer' : 'FAQ'}: "${faq.question}"`,
        io,
      });
    }

    return res.status(201).json({ success: true, message: 'Comment added' });
  } catch (err) {
    return next(err);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const { id, commentId } = req.params;
    const { answerId } = req.query;

    const faq = await FAQ.findById(id);
    if (!faq) return next(new AppError('FAQ not found', 404));

    let comment;
    let isModeratorOrAdmin = ['moderator', 'admin'].includes(req.user.role);

    if (answerId) {
      const answer = faq.answers.id(answerId);
      if (!answer) return next(new AppError('Answer not found', 404));
      comment = answer.comments.id(commentId);
      if (!comment) return next(new AppError('Comment not found', 404));
      if (!comment.author.equals(req.user._id) && !isModeratorOrAdmin) {
        return next(new AppError('Not authorized to delete this comment', 403));
      }
      answer.comments.pull({ _id: commentId });
    } else {
      comment = faq.comments.id(commentId);
      if (!comment) return next(new AppError('Comment not found', 404));
      if (!comment.author.equals(req.user._id) && !isModeratorOrAdmin) {
        return next(new AppError('Not authorized to delete this comment', 403));
      }
      faq.comments.pull({ _id: commentId });
    }

    await faq.save();

    return res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    return next(err);
  }
};

const reportContent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, targetType = 'faq', details } = req.body;

    if (!reason || reason.trim().length < 10) {
      return next(new AppError('Reason must be at least 10 characters', 400));
    }

    const faq = await FAQ.findById(id);
    if (!faq) return next(new AppError('FAQ not found', 404));

    await Report.create({
      reporter: req.user._id,
      targetType,
      targetId: id,
      reason: reason.trim(),
      details,
    });

    // Flag FAQ after 3+ pending reports
    const pendingCount = await Report.countDocuments({
      targetId: id,
      status: 'pending',
    });

    if (pendingCount >= 3) {
      await FAQ.findByIdAndUpdate(faq._id, { status: 'flagged' });
    }

    return res.status(201).json({ success: true, message: 'Report submitted' });
  } catch (err) {
    return next(err);
  }
};

// Update FAQ status (approve / reject / close) — moderator+ only
const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const valid = ['approved', 'rejected', 'closed'];
    if (!valid.includes(status)) {
      return next(new AppError(`Invalid status. Must be one of: ${valid.join(', ')}`, 400));
    }

    const faq = await FAQ.findById(id);
    if (!faq) return next(new AppError('FAQ not found', 404));

    faq.status = status;
    if (status === 'rejected' && reason) faq.rejectionReason = reason;
    if (status === 'approved') faq.reviewedAt = new Date();
    await faq.save();

    if (io) io.to(`faq:${id}`).emit('faq:statusChanged', { id, status });

    return res.json({ success: true, data: { _id: faq._id, status } });
  } catch (err) {
    return next(err);
  }
};

const search = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ success: true, data: [] });
    }

    const results = await FAQ.find(
      { $text: { $search: q }, status: 'approved' },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(5)
      .select('_id question slug');

    return res.json({ success: true, data: results });
  } catch (err) {
    return next(err);
  }
};

const getTrending = async (req, res, next) => {
  try {
    const now = Date.now();
    if (trendingCache.data && now - trendingCache.fetchedAt < TRENDING_TTL_MS) {
      return res.json({ success: true, data: trendingCache.data });
    }

    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const faqs = await FAQ.find({
      status: 'approved',
      createdAt: { $gte: sevenDaysAgo },
    })
      .populate('author', 'name avatar')
      .select('question votes views answers createdAt author');

    const scored = faqs.map((f) => {
      const hoursOld = (now - new Date(f.createdAt).getTime()) / 3600000;
      const hotScore = (f.votes * 3 + f.answers.length * 2 + f.views * 0.1) /
        Math.pow(hoursOld + 2, 1.5);
      return { ...f.toObject(), hotScore };
    });

    scored.sort((a, b) => b.hotScore - a.hotScore);
    const result = scored.slice(0, 10);

    trendingCache = { data: result, fetchedAt: now };
    return res.json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
};

const getMeta = async (req, res, next) => {
  try {
    const faq = await FAQ.findById(req.params.id)
      .select('question body author')
      .populate('author', 'name');
    if (!faq) return next(new AppError('FAQ not found', 404));

    const plainBody = faq.body || '';
    const plainText = plainBody
      .replace(/[#*`_~\[\]()!>-]/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    return res.json({
      success: true,
      data: {
        question:   faq.question,
        description: plainText.slice(0, 200),
        authorName:  faq.author?.name,
      },
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getAll,
  getOne,
  create,
  update,
  remove,
  togglePin,
  toggleWiki,
  voteFAQ,
  voteAnswer,
  addAnswer,
  updateAnswer,
  deleteAnswer,
  acceptAnswer,
  addComment,
  deleteComment,
  reportContent,
  updateStatus,
  search,
  getTrending,
  getMeta,
};