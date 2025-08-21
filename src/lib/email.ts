import { ServerClient, TemplatedMessage } from 'postmark';

const POSTMARK_API_KEY = process.env.POSTMARK_API_KEY;
const POSTMARK_FROM_EMAIL = process.env.POSTMARK_FROM_EMAIL;

if (!POSTMARK_API_KEY || !POSTMARK_FROM_EMAIL) {
  console.warn('🔴 Postmark API key or from_email not set. Email functionality will be disabled.');
} else if (POSTMARK_API_KEY === 'POSTMARK_API_TEST') {
  console.warn('🟡 Postmark is using the TEST API key. Emails will be logged as sent but will not actually be delivered or appear in your Postmark dashboard.');
}

const client = POSTMARK_API_KEY ? new ServerClient(POSTMARK_API_KEY) : null;

if (client) {
  console.log('🟢 Postmark client initialized successfully.');
} else {
  console.error('🔴 Postmark client failed to initialize. Make sure POSTMARK_API_KEY is set correctly in your .env file.');
}

export const sendCvReceivedEmail = async (to: string, candidateName: string, jobTitle: string) => {
  if (!client || !POSTMARK_FROM_EMAIL) {
    console.error('Cannot send email: Postmark client not initialized or FROM_EMAIL is missing.');
    return;
  }

  const emailBody = `Hi ${candidateName},<br/><br/>Thank you for your interest in the ${jobTitle} position. We have successfully received your CV and our team will review it shortly.<br/><br/>We appreciate your patience and will be in touch if your profile matches our requirements.<br/><br/>Best regards,<br/>The Hiring Team`;

  try {
    const response = await client.sendEmail({
      From: POSTMARK_FROM_EMAIL,
      To: to,
      Subject: `We've Received Your Application for ${jobTitle}`,
      HtmlBody: emailBody,
    });
    console.log(`CV received confirmation sent to ${to}. Postmark response:`, response);
  } catch (error) {
    console.error('Failed to send CV received email:', error);
  }
};

export const sendInterviewInvitationEmail = async (to: string, candidateName: string, jobTitle: string, meetingUrl: string) => {
  if (!client || !POSTMARK_FROM_EMAIL) {
    console.error('Cannot send email: Postmark client not initialized or FROM_EMAIL is missing.');
    return;
  }

  try {
    const response = await client.sendEmailWithTemplate({
      From: POSTMARK_FROM_EMAIL,
      To: to,
      TemplateAlias: 'interview-invitation',
      TemplateModel: {
        candidateName,
        jobTitle,
        meetingUrl,
        companyName: 'Your Company Name', // Or make this dynamic
      },
    });
    console.log(`Interview invitation sent to ${to}. Postmark response:`, response);
  } catch (error) {
    console.error('Failed to send interview invitation email:', error);
  }
};

export const getPostmarkTemplates = async () => {
  if (!client) {
    throw new Error('Postmark client not initialized.');
  }
  try {
    // Note: Postmark's getTemplates returns a Paged response. We fetch the first page.
    // For more than 50 templates, pagination logic would be needed here.
    const templates = await client.getTemplates({ count: 50, offset: 0 });
    return templates.Templates;
  } catch (error) {
    console.error('Failed to fetch Postmark templates:', error);
    throw new Error('Failed to fetch Postmark templates.');
  }
};

export const sendBulkEmailWithTemplate = async (recipients: { email: string; name: string }[], templateAlias: string, templateModel: object) => {
  if (!client || !POSTMARK_FROM_EMAIL) {
    throw new Error('Postmark client not initialized or FROM_EMAIL is missing.');
  }

  // Postmark's bulk send expects a separate message for each recipient
  const messages = recipients.map(recipient => ({
    From: POSTMARK_FROM_EMAIL!,
    To: recipient.email,
    TemplateAlias: templateAlias,
    TemplateModel: {
      ...templateModel,
      // Common model fields can go here
      candidateName: recipient.name, // Per-recipient model fields
    },
  }));

  try {
    // Use sendEmailBatchWithTemplates for sending multiple emails based on a single template
    const response = await client.sendEmailBatchWithTemplates(messages as TemplatedMessage[]);
    console.log('Bulk email sent successfully. Postmark response:', response);
    return response;
  } catch (error) {
    console.error('Failed to send bulk email:', error);
    throw error;
  }
};

