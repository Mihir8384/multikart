import nodemailer from "nodemailer";

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  // Get email settings from API or env
  const emailSettings = {
    host: process.env.MAIL_HOST || "template.co.in",
    port: process.env.MAIL_PORT || 465,
    secure: process.env.MAIL_ENCRYPTION === "ssl",
    auth: {
      user: process.env.MAIL_USERNAME || "multikart-v2@template.co.in",
      pass: process.env.MAIL_PASSWORD || "multikart@123",
    },
  };

  transporter = nodemailer.createTransport(emailSettings);
  return transporter;
}

export async function sendEmail({ to, subject, html, text }) {
  try {
    const mailTransporter = await getTransporter();

    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME || "Multikart"}" <${
        process.env.MAIL_FROM_ADDRESS || "multikart-v2@template.co.in"
      }>`,
      to,
      subject,
      html: html || text,
      text: text || html,
    };

    const info = await mailTransporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Email sending failed:", error);
    return { success: false, error: error.message };
  }
}

export async function sendVendorRegistrationEmail(
  vendorEmail,
  vendorName,
  vendorId
) {
  const html = `
    <h2>Vendor Registration Received</h2>
    <p>Dear ${vendorName},</p>
    <p>Thank you for registering as a vendor on Multikart!</p>
    <p>Your Vendor ID: <strong>${vendorId}</strong></p>
    <p>Your application is currently under review. We will notify you once your application is approved.</p>
    <p>Best regards,<br>Multikart Team</p>
  `;

  return await sendEmail({
    to: vendorEmail,
    subject: "Vendor Registration - Application Received",
    html,
  });
}

export async function sendVendorApprovalEmail(
  vendorEmail,
  vendorName,
  status,
  vendorId
) {
  const statusMessages = {
    Approved: "Congratulations! Your vendor application has been approved.",
    Rejected:
      "We regret to inform you that your vendor application has been rejected.",
    Resubmission:
      "Your vendor application requires additional information. Please review and resubmit.",
  };

  const html = `
    <h2>Vendor Application Update</h2>
    <p>Dear ${vendorName},</p>
    <p>${
      statusMessages[status] ||
      "Your vendor application status has been updated."
    }</p>
    <p>Vendor ID: <strong>${vendorId}</strong></p>
    <p>Status: <strong>${status}</strong></p>
    ${
      status === "Approved"
        ? "<p>You can now log in to your vendor portal and start adding products.</p>"
        : ""
    }
    <p>Best regards,<br>Multikart Team</p>
  `;

  return await sendEmail({
    to: vendorEmail,
    subject: `Vendor Application ${status}`,
    html,
  });
}
