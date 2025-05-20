const { generateQrCode, formatTime } = require("../others/util");
const { jsPDF } = require("jspdf");

exports.generateTicketContent = async ({
  registration,
  event,
  extrasPurchase,
}) => {
  const doc = new jsPDF();

  doc.setFont("courier", "normal");
  doc.setFontSize(14);

  // Event + Registration Info
  doc.text(`Event: ${event.name}`, 20, 20);
  doc.text(`Name: ${registration.registrationData.name}`, 20, 30);
  doc.text(`Email: ${registration.registrationData.email}`, 20, 40);
  doc.text(`Phone: ${registration.registrationData.phone}`, 20, 50);
  doc.text(
    `Registration Time: ${formatTime(registration.registrationTime)}`,
    20,
    60,
  );

  // Main QR (Entry Ticket)
  const mainQr = await generateQrCode({
    id: registration.id,
    qrUuid: registration.qrUuid,
  });
  doc.text("Biglietto Ingresso", 20, 70);
  doc.addImage(mainQr, "JPEG", 20, 75, 80, 80);

  if (extrasPurchase?.id) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text(`QR Code For Voucher`, 20, 20);
    doc.setFontSize(12);

    extrasPurchase.extrasData?.forEach((item, idx) => {
      doc.text(`• ${item.name}`, 25, 30 + idx * 10);
    });

    const extrasQr = await generateQrCode({
      id: extrasPurchase.id,
      qrUuid: extrasPurchase.qrUuid,
    });
    const posY = 40 + (extrasPurchase.extrasData.length - 1) * 10;
    doc.addImage(extrasQr, "JPEG", 20, posY, 80, 80);
  }

  const emailBody = `Grazie per la registrazione!

In allegato trovi il tuo biglietto d’ingresso all’evento.

Se hai acquistato voucher (come bevande o cibo), troverai anche QR code separati per riscattarli.

Ci vediamo all’evento!

Saluti,  
Click Event
`;

  return { attachment: doc, emailBody };
};
