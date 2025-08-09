import { ServerClient } from 'postmark';

const POSTMARK_API_KEY = process.env.POSTMARK_API_KEY;
const POSTMARK_FROM_EMAIL = process.env.POSTMARK_FROM_EMAIL;

if (!POSTMARK_API_KEY || !POSTMARK_FROM_EMAIL) {
  console.warn('Postmark API key or from_email not set. Email functionality will be disabled.');
}

const client = POSTMARK_API_KEY ? new ServerClient(POSTMARK_API_KEY) : null;

export const sendCvReceivedEmail = async (to: string, candidateName: string, jobTitle: string) => {
  if (!client || !POSTMARK_FROM_EMAIL) return;

  const emailBody = `Hi ${candidateName},<br/><br/>Thank you for your interest in the ${jobTitle} position. We have successfully received your CV and our team will review it shortly.<br/><br/>We appreciate your patience and will be in touch if your profile matches our requirements.<br/><br/>Best regards,<br/>The Hiring Team`;

  try {
    await client.sendEmail({
      From: POSTMARK_FROM_EMAIL,
      To: to,
      Subject: `We've Received Your Application for ${jobTitle}`,
      HtmlBody: emailBody,
    });
    console.log(`CV received confirmation sent to ${to}`);
  } catch (error) {
    console.error('Failed to send CV received email:', error);
  }
};

export const sendInterviewInvitationEmail = async (to: string, candidateName: string, jobTitle: string, meetingUrl: string) => {
  if (!client || !POSTMARK_FROM_EMAIL) return;

  const emailBody = `Hi ${candidateName},<br/><br/>We were very impressed with your background and would like to invite you for an interview for the ${jobTitle} position.<br/><br/>Please use the following link to join the meeting at the scheduled time:<br/><a href="${meetingUrl}">${meetingUrl}</a><br/><br/>We look forward to speaking with you.<br/><br/>Best regards,<br/>The Hiring Team`;

  try {
    await client.sendEmail({
      From: POSTMARK_FROM_EMAIL,
      To: to,
      Subject: `Invitation to Interview for ${jobTitle}`,
      HtmlBody: emailBody,
    });
    console.log(`Interview invitation sent to ${to}`);
  } catch (error) {
    console.error('Failed to send interview invitation email:', error);
  }
};
