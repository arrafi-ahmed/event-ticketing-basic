const { generateQrCode, formatTime } = require("../others/util");
const { jsPDF } = require("jspdf");

exports.generateTicketContent = async (registration, event) => {
  const doc = new jsPDF();

  doc.setFont("courier", "normal");
  doc.setFontSize(14);

  doc.text(`Event: ${event.name}`, 20, 20, {
    align: "left",
    maxWidth: 130,
  });
  doc.text(`Name: ${registration.registrationData.name}`, 20, 30, {
    align: "left",
    maxWidth: 130,
  });
  doc.text(`Email: ${registration.registrationData.email}`, 20, 40, {
    align: "left",
    maxWidth: 130,
  });
  doc.text(`Phone: ${registration.registrationData.phone}`, 20, 50, {
    align: "left",
    maxWidth: 130,
  });
  doc.text(
    `Registration Time: ${formatTime(registration.registrationTime)}`,
    20,
    60,
    {
      align: "left",
      maxWidth: 130,
    }
  );

  console.log(33, registration);
  // QR Code
  const qrCode = await generateQrCode({
    id: registration.id,
    qrUuid: registration.qrUuid,
  });
  doc.addImage(qrCode, "JPEG", 15, 65, 90, 90);

  const emailBody = `Thanks for registration, please check the attached ticket!

Regards,
Click Event`;
  return { attachment: doc, emailBody };
};
