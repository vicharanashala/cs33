with open(r'C:\Users\cheru\Documents\faq-portal\server\controllers\faqController.js', 'r') as f:
    lines = f.readlines()

new_getone = [
    'const getOne = async (req, res, next) => {\n',
    '  try {\n',
    "    const { idOrSlug } = req.params;\n",
    '\n',
    '    const query = { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] };\n',
    "    if (!req.user || req.user.role === 'user') {\n",
    "      query.status = 'approved';\n",
    '    }\n',
    '\n',
    '    const faq = await FAQ.findOne(query)\n',
    "      .populate('author', 'name avatar reputation')\n",
    "      .populate('answers.author', 'name avatar reputation')\n",
    "      .populate('comments.author', 'name avatar')\n",
    "      .populate('relatedFAQs', 'question')\n",
    "      .populate('revisionHistory.editedBy', 'name avatar')\n",
    '\n',
    "    if (!faq) return next(new AppError('FAQ not found', 404));\n",
    '\n',
    '    await FAQ.findByIdAndUpdate(faq._id, { $inc: { views: 1 } });\n',
    '\n',
    '    res.json({ success: true, data: faq });\n',
    '  } catch (err) {\n',
    '    next(err);\n',
    '  }\n',
    '};\n',
]

start = None
end = None
for i, l in enumerate(lines):
    if 'const getOne = async' in l:
        start = i
    if start is not None and 'const create = async' in l:
        end = i - 1
        break

print(f'Replacing lines {start+1} to {end+1}')
fixed = lines[:start] + new_getone + lines[end+1:]
with open(r'C:\Users\cheru\Documents\faq-portal\server\controllers\faqController.js', 'w') as f:
    f.writelines(fixed)
print(f'Done. New line count: {len(fixed)}')