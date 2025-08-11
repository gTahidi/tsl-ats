import { ServerClient } from 'postmark';

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

  const emailBody = `Hi ${candidateName},<br/><br/>We were very impressed with your background and would like to invite you for an interview for the ${jobTitle} position.<br/><br/>Please use the following link to join the meeting at the scheduled time:<br/><a href="${meetingUrl}">${meetingUrl}</a><br/><br/>We look forward to speaking with you.<br/><br/>Best regards,<br/>The Hiring Team`;

  try {
    const response = await client.sendEmail({
      From: POSTMARK_FROM_EMAIL,
      To: to,
      Subject: `Invitation to Interview for ${jobTitle}`,
      HtmlBody: emailBody,
    });
    console.log(`Interview invitation sent to ${to}. Postmark response:`, response);
  } catch (error) {
    console.error('Failed to send interview invitation email:', error);
  }
};
