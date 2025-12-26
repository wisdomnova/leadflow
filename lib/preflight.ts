export type PreflightIssue = {
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  hint?: string;
};

export type PreflightReport = {
  status: 'pass' | 'caution' | 'fail';
  issues: PreflightIssue[];
  meta: {
    subjectLength: number;
    bodyLength: number;
    linkCount: number;
    imageCount: number;
  };
};

const SPAM_WORDS = [
  'free', 'winner', 'guarantee', 'act now', 'limited-time', 'urgent', 'risk-free',
  'credit', 'loan', 'celebrity', 'deal', 'click here', 'open now', 'buy', 'order now'
];

const subjectTooShort = (len: number) => len < 5;
const subjectTooLong = (len: number) => len > 78; // common recommendation

function countLinks(text: string): number {
  const urlRegex = /(https?:\/\/|www\.)[\w\-]+(\.[\w\-]+)+[^\s]*/gi;
  const hrefRegex = /href=\"[^\"]+\"/gi;
  return (text.match(urlRegex)?.length || 0) + (text.match(hrefRegex)?.length || 0);
}

function countImages(text: string): number {
  const imgRegex = /<img\b[^>]*>/gi;
  return text.match(imgRegex)?.length || 0;
}

function hasUnsubscribe(text: string): boolean {
  return /(unsubscribe|\{\{unsubscribe_url\}\}|\/unsubscribe)/i.test(text);
}

function hasPhysicalAddress(text: string): boolean {
  // Allow placeholder tag or visible address-like pattern
  if (/\{\{physical_address\}\}/i.test(text)) return true;
  const addressRegex = /(\d+\s+\w+\s+(street|st\.|avenue|ave\.|road|rd\.|boulevard|blvd\.|lane|ln\.|drive|dr\.|way))/i;
  return addressRegex.test(text);
}

function spamWordHits(text: string): number {
  const lower = text.toLowerCase();
  return SPAM_WORDS.reduce((acc, w) => acc + (lower.includes(w) ? 1 : 0), 0);
}

function imagesMissingAlt(text: string): boolean {
  const imgs = text.match(/<img\b[^>]*>/gi) || [];
  return imgs.some((img) => !/\balt=\"[^\"]*\"/i.test(img));
}

function suspiciousMergeTags(text: string): boolean {
  const tags = text.match(/\{\{[^}]+\}\}/g) || [];
  if (tags.length === 0) return false;
  const allowed = new Set([
    'first_name','last_name','email','company','phone','job_title','website','city','country','unsubscribe_url','physical_address'
  ]);
  return tags.some((t) => {
    const name = t.replace(/\{\{|\}\}/g, '').split('|')[0].trim();
    return !allowed.has(name);
  });
}

export function runPreflight({ subject, body, fromEmail, replyTo }: { subject: string; body: string; fromEmail?: string; replyTo?: string; }): PreflightReport {
  const issues: PreflightIssue[] = [];

  const subjectLen = (subject || '').trim().length;
  const bodyLen = (body || '').trim().length;
  const linkCount = countLinks(body || '');
  const imageCount = countImages(body || '');

  if (!subjectLen) {
    issues.push({ type: 'error', code: 'SUBJECT_EMPTY', message: 'Subject is empty.', hint: 'Add a concise, descriptive subject (35–55 chars).' });
  } else {
    if (subjectTooShort(subjectLen)) {
      issues.push({ type: 'warning', code: 'SUBJECT_SHORT', message: `Subject is short (${subjectLen} chars).`, hint: 'Aim for 35–55 characters.' });
    }
    if (subjectTooLong(subjectLen)) {
      issues.push({ type: 'warning', code: 'SUBJECT_LONG', message: `Subject is long (${subjectLen} chars).`, hint: 'Keep under ~78 characters to avoid truncation.' });
    }
  }

  const spamHits = spamWordHits(subject + ' ' + body);
  if (spamHits >= 3) {
    issues.push({ type: 'warning', code: 'SPAM_PHRASES', message: `Content contains multiple spam trigger phrases (${spamHits}).`, hint: 'Reduce urgency/marketing clichés; prefer plain language.' });
  }

  if (!hasUnsubscribe(body || '')) {
    issues.push({ type: 'error', code: 'MISSING_UNSUBSCRIBE', message: 'Unsubscribe link missing.', hint: 'Include {{unsubscribe_url}} or an explicit unsubscribe link.' });
  }

  if (!hasPhysicalAddress(body || '')) {
    issues.push({ type: 'warning', code: 'MISSING_ADDRESS', message: 'Physical sender address not detected.', hint: 'Add {{physical_address}} or a clear postal address.' });
  }

  if (imagesMissingAlt(body || '')) {
    issues.push({ type: 'warning', code: 'IMG_NO_ALT', message: 'One or more images lack alt text.', hint: 'Add alt="..." to all images for accessibility.' });
  }

  if (linkCount > 20) {
    issues.push({ type: 'warning', code: 'LINK_DENSE', message: `High link density (${linkCount}).`, hint: 'Reduce links to improve deliverability and clarity.' });
  }

  if (suspiciousMergeTags(body || '')) {
    issues.push({ type: 'warning', code: 'UNKNOWN_TAGS', message: 'Unknown merge tags detected.', hint: 'Verify merge tags or add fallbacks, e.g., {{first_name|there}}.' });
  }

  if (fromEmail && !/^[^@]+@[^@]+\.[^@]+$/.test(fromEmail)) {
    issues.push({ type: 'warning', code: 'SENDER_FORMAT', message: 'Sender email looks invalid.', hint: 'Use a valid, verified domain address.' });
  }

  if (replyTo && !/^[^@]+@[^@]+\.[^@]+$/.test(replyTo)) {
    issues.push({ type: 'warning', code: 'REPLYTO_FORMAT', message: 'Reply-To email looks invalid.', hint: 'Use a valid support address or omit.' });
  }

  const status: PreflightReport['status'] = issues.some(i => i.type === 'error')
    ? 'fail'
    : issues.some(i => i.type === 'warning')
      ? 'caution'
      : 'pass';

  return {
    status,
    issues,
    meta: {
      subjectLength: subjectLen,
      bodyLength: bodyLen,
      linkCount,
      imageCount,
    },
  };
}
