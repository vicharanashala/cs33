const PORTAL_NAME = process.env.FROM_NAME || 'FAQ Portal';
const BASE_URL    = process.env.CLIENT_URL || 'http://localhost:5173';

// ── Shared shell ──────────────────────────────────────────────────────────────
const shell = (title, bodyContent) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:30px 10px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:8px;overflow:hidden;
                 box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#3b82f6;padding:24px 32px;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:bold;color:#ffffff;
                         letter-spacing:0.5px;">
                ${PORTAL_NAME}
              </p>
            </td>
          </tr>

          <!-- Title bar -->
          <tr>
            <td style="padding:24px 32px 16px;border-bottom:1px solid #e5e7eb;">
              <h2 style="margin:0;font-size:20px;color:#111827;">${title}</h2>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:24px 32px;">${bodyContent}</td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                You're receiving this because you have email notifications enabled on ${PORTAL_NAME}.<br/>
                <a href="${BASE_URL}/settings" style="color:#3b82f6;">Manage preferences</a>
                &nbsp;·&nbsp;
                <a href="${BASE_URL}" style="color:#3b82f6;">Visit portal</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// ── New answer notification ───────────────────────────────────────────────────
const newAnswerEmail = ({ userName, questionTitle, answerPreview, faqUrl }) => {
  const preview = answerPreview.length > 200
    ? answerPreview.slice(0, 197) + '…'
    : answerPreview;

  const body = `
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      Hi <strong>${userName}</strong>,
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
      Your question
      <span style="font-weight:600;color:#111827;">&ldquo;${questionTitle}&rdquo;</span>
      just received a new answer:
    </p>

    <!-- Answer preview box -->
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#f9fafb;border-left:4px solid #3b82f6;
             border-radius:4px;margin:0 0 24px;">
      <tr>
        <td style="padding:14px 16px;">
          <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.6;
                     font-style:italic;">
            &ldquo;${preview}&rdquo;
          </p>
        </td>
      </tr>
    </table>

    <!-- CTA button -->
    <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      <tr>
        <td align="center">
          <a href="${faqUrl}"
            style="display:inline-block;background:#3b82f6;color:#ffffff;
                   text-decoration:none;font-size:15px;font-weight:600;
                   padding:12px 28px;border-radius:6px;">
            View Answer
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
      Visit your question page to read the full answer and mark it as accepted
      if it solves your problem.
    </p>`;

  return shell('New Answer to Your Question', body);
};

// ── Weekly digest ─────────────────────────────────────────────────────────────
const weeklyDigestEmail = ({ userName, topFAQs }) => {
  const faqRows = topFAQs.map((faq, i) => `
    <tr style="border-bottom:1px solid #f3f4f6;">
      <td style="padding:14px 0 14px 12px;vertical-align:middle;width:36px;">
        <span style="display:inline-block;width:28px;height:28px;background:${
          i === 0 ? '#f59e0b' : i === 1 ? '#9ca3af' : i === 2 ? '#d97706' : '#e5e7eb'
        };color:#fff;font-size:13px;font-weight:700;border-radius:50%;
           text-align:center;line-height:28px;">${i + 1}</span>
      </td>
      <td style="padding:14px 16px;vertical-align:middle;">
        <a href="${BASE_URL}/faqs/${faq._id}"
          style="font-size:14px;font-weight:600;color:#1d4ed8;
                 text-decoration:none;line-height:1.5;display:block;">
          ${faq.question}
        </a>
        <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">
          ${faq.votes} votes &nbsp;·&nbsp; ${faq.answerCount} answers
        </p>
      </td>
      <td style="padding:14px 12px 14px 0;vertical-align:middle;text-align:right;">
        <a href="${BASE_URL}/faqs/${faq._id}"
          style="font-size:13px;color:#3b82f6;text-decoration:none;
                 font-weight:600;white-space:nowrap;">
          View →
        </a>
      </td>
    </tr>`).join('');

  const body = `
    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
      Hi <strong>${userName}</strong>,
    </p>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
      Here's what the community was talking about this week — the top
      ${topFAQs.length} FAQs by upvotes:
    </p>

    <!-- FAQ table -->
    <table width="100%" cellpadding="0" cellspacing="0"
      style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin:0 0 24px;">
      ${faqRows}
    </table>

    <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
      Keep contributing and you might make next week's list!
    </p>`;

  return shell("Your Weekly FAQ Digest", body);
};

module.exports = { newAnswerEmail, weeklyDigestEmail };