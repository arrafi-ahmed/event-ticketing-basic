const nodeMailer = require("nodemailer");
const CustomError = require("../model/CustomError");
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

const transporter = nodeMailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: true,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

const sendMail = async (to, subject, html) => {
  return transporter.sendMail({
    from: "Click Event <noreply@clickevent.it>",
    to,
    // bcc: '',
    subject,
    html,
  });
};

const sendMailWAttachment = (to, subject, text, pdf) => {
  const pdfBuffer = Buffer.from(pdf.output(), "binary");

  return new Promise((resolve, reject) => {
    transporter.sendMail(
      {
        from: "Click Event <noreply@clickevent.it>",
        to,
        // bcc: '',
        subject,
        text,
        attachments: [
          {
            filename: "attachment.pdf",
            content: pdfBuffer,
          },
        ],
      },
      (error, info) => {
        if (error) {
          console.error("Error sending email: %s", error.message);
          return reject(new Error(error.message));
        }

        if (info.rejected.length > 0) {
          const rejectedEmails = info.rejected.join(", ");
          const errorMessage = `Error sending email for: ${rejectedEmails}`;
          console.error(errorMessage);
          return reject(new Error(errorMessage));
        }

        console.log("Email sent: %s", info.messageId);
        console.log("info", info);
        return resolve(info);
      }
    );
  });
};

module.exports = {
  sendMail,
  sendMailWAttachment,
};
