$lines = [System.IO.File]::ReadAllLines('C:\Users\cheru\Documents\faq-portal\server\controllers\faqController.js')

$newFn = @"
const getOne = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;

    const query = { $$or: [{ $$_id: idOrSlug }, { slug: idOrSlug }] };
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

    await FAQ.findByIdAndUpdate(faq._id, { $$inc: { views: 1 } });

    res.json({ success: true, data: faq });
  } catch (err) {
    next(err);
  }
};
"@

# Replace lines 73-90 with new getOne (0-indexed: 72-90)
$start = 72
$end = 90
$newLines = $newFn -replace '\$\$', '$' -split "`n"
$fixed = $lines[0..($start-1)] + $newLines + $lines[($end+1)..($lines.Length-1)]
[System.IO.File]::WriteAllLines('C:\Users\cheru\Documents\faq-portal\server\controllers\faqController.js', $fixed)
Write-Host "Done. New line count: $($fixed.Length)"