// ./lib/email-templates/campaign-template.ts
interface CampaignEmailProps {
  subject: string
  content: string
  recipientName?: string
  unsubscribeUrl?: string
  companyName?: string
}

export const generateCampaignEmailHTML = ({
  content,
  recipientName,
  unsubscribeUrl,
  companyName = 'LeadFlow'
}: CampaignEmailProps): string => { 
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Campaign</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f8f9fa;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    .email-header {
      background-color: #ffffff;
      padding: 20px;
      border-bottom: 1px solid #e9ecef;
    }
    .email-body {
      padding: 30px 20px;
    }
    .email-footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #6c757d;
      border-top: 1px solid #e9ecef;
    }
    .content {
      margin-bottom: 20px;
    }
    .content p {
      margin: 0 0 16px 0;
    }
    .content h1, .content h2, .content h3 {
      margin: 0 0 16px 0;
      color: #212529;
    }
    .content a {
      color: #0066cc;
      text-decoration: none;
    }
    .content a:hover {
      text-decoration: underline;
    }
    .unsubscribe-link {
      color: #6c757d !important;
      text-decoration: none;
      font-size: 11px;
    }
    .unsubscribe-link:hover {
      text-decoration: underline;
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        border-radius: 0 !important;
      }
      .email-body {
        padding: 20px 15px !important;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <div style="color: #666; font-size: 14px;">
        ${recipientName ? `Hi ${recipientName},` : 'Hello,'}
      </div>
    </div>
    
    <div class="email-body">
      <div class="content">
        ${content}
      </div>
    </div>
    
    <div class="email-footer">
      <p>
        Best regards,<br>
        <strong>${companyName}</strong>
      </p>
      
      ${unsubscribeUrl ? `
      <p style="margin-top: 20px;">
        <a href="${unsubscribeUrl}" class="unsubscribe-link">Unsubscribe from this list</a>
      </p>
      ` : ''}
      
      <p style="margin-top: 15px; color: #999;">
        This email was sent as part of an automated campaign. 
        If you believe this was sent in error, please contact us.
      </p>
    </div>
  </div>
</body>
</html>
  `
}

export const generatePlainTextFromHTML = (html: string): string => {
  // Simple HTML to text conversion
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&amp;/g, '&') // Replace &amp; with & 
    .replace(/&lt;/g, '<') // Replace &lt; with <
    .replace(/&gt;/g, '>') // Replace &gt; with >
    .replace(/&quot;/g, '"') // Replace &quot; with "
    .replace(/&#39;/g, "'") // Replace &#39; with '
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim()
}