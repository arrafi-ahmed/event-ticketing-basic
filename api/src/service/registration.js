const CustomError = require("../model/CustomError");
const { sql } = require("../db");
const { v4: uuidv4 } = require("uuid");
const exceljs = require("exceljs");
const { formatTime } = require("../others/util");
const emailContentService = require("../service/emailContent");
const sendMailService = require("../service/sendMail");
const formService = require("../service/form");

exports.save = async ({ body: { registration } }) => {
  registration.registrationTime = new Date();
  registration.qrUuid = uuidv4();

  const [insertedRegistration] = await sql`
        INSERT INTO registration ${sql(registration)}
            returning *;
    `;

  //increase registration_count in event
  const [updatedEvent] = await sql`
        update event
        set registration_count = registration_count + 1
        where id = ${registration.eventId}
        returning *;`;

  //send to email
  if (registration.registrationData.email) {
    const { attachment, emailBody } =
      await emailContentService.generateTicketContent(
        insertedRegistration,
        updatedEvent
      );

    sendMailService.sendMailWAttachment(
      registration.registrationData.email,
      `Ticket for ${updatedEvent.name}`,
      emailBody,
      attachment
    );
  }
  return insertedRegistration;
};

exports.sendTicket = async ({ registrationId }) => {
  const [result] = await sql`select *, r.id as r_id, e.id as e_id
                               from registration r
                                        join event e on r.event_id = e.id
                               where r.id = ${registrationId}`;

  const registration = {
    id: result.rId,
    registrationData: result.registrationData,
    registrationTime: result.registrationTime,
    qrUuid: result.qrUuid,
  };
  const event = {
    id: result.eId,
    name: result.name,
  };

  const { attachment, emailBody } =
    await emailContentService.generateTicketContent(registration, event);

  sendMailService.sendMailWAttachment(
    result.registrationData.email,
    `Ticket for ${event.name}`,
    emailBody,
    attachment
  );
};

exports.searchAttendees = async ({ searchKeyword, eventId }) => {
  const attendees = await sql`
        select *, r.id as r_id, c.id as c_id
        from registration r
                 left join checkin c
                           on r.id = c.registration_id
        where event_id = ${eventId}
          and (r.registration_data ->> 'name' ilike concat('%', ${searchKeyword}::text, '%')
            or r.registration_data ->> 'email' ilike concat('%', ${searchKeyword}::text, '%')
            or r.registration_data ->> 'phone' ilike concat('%', ${searchKeyword}::text, '%'))`;

  return attendees;
};

exports.getAttendeesWcheckin = async ({ eventId }) => {
  const attendees = await sql`
        select *, r.id as r_id, c.id as c_id
        from registration r
                 left join checkin c
                           on r.id = c.registration_id
        where event_id = ${eventId}
        order by r.registration_time desc `;

  return attendees;
};

exports.removeRegistration = async ({ eventId, registrationId }) => {
  const [deletedEvent] = await sql`
        delete
        from registration
        where id = ${registrationId}
          and event_id = ${eventId}
        returning *;`;

  return deletedEvent;
};

exports.downloadAttendees = async ({ eventId }) => {
  const attendees = await exports.getAttendeesWcheckin({ eventId });
  const formQuestions = await formService.getFormQuestions(eventId);

  if (attendees.length === 0)
    throw new CustomError("No data available for report!", 404);

  const workbook = new exceljs.Workbook();
  const worksheet = workbook.addWorksheet("Attendee Report");

  sheet_columns = [
    { header: "Id", key: "id", width: 10 },
    { header: "Name", key: "name", width: 30 },
    { header: "Email", key: "email", width: 30 },
    { header: "Phone", key: "phone", width: 30 },
    { header: "Registration Time", key: "registration_time", width: 30 },
    { header: "Checkin Time", key: "checkin_time", width: 30 },
    { header: "Checkin Status", key: "checkin_status", width: 30 },
  ];

  if (formQuestions.length > 0) {
    // Add excel headers for others data while iterating the first user
    formQuestions?.forEach((item, index) => {
      sheet_columns.push({
        header: item.text,
        key: `qId_${item.id}`,
        width: 30,
      });
    });
  }

  worksheet.columns = sheet_columns;

  attendees.forEach((item) => {
    // Create a row data object with common fields
    let rowData = {
      id: item.rId,
      name: item.registrationData?.name,
      email: item.registrationData?.email,
      phone: item.registrationData?.phone,
      registration_time: item.registrationTime
        ? formatTime(item.registrationTime)
        : "",
      checkin_time: item.checkinTime ? formatTime(item.checkinTime) : "",
      checkin_status: item.checkinStatus ? "Checked-in" : "Pending",
    };

    // Add other_x fields to the row data
    item.registrationData?.others?.forEach((childItem) => {
      if (childItem.qId) {
        rowData[`qId_${childItem.qId}`] = childItem.answer?.toString() || "";
      }
    });

    // Add the row to the worksheet
    worksheet.addRow(rowData);
  });

  return workbook;
};
