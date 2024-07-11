const CustomError = require("../model/CustomError");
const { sql } = require("../db");
const { v4: uuidv4 } = require("uuid");
const exceljs = require("exceljs");
const { formatTime } = require("../others/util");
const emailContentService = require("../service/emailContent");
const sendMailService = require("../service/sendMail");

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
  console.log(22, insertedRegistration);
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

  await sendMailService.sendMailWAttachment(
    result.registrationData.email,
    `Ticket for ${event.name}`,
    emailBody,
    attachment
  );
};

exports.getAttendeesWcheckin = async ({ eventId }) => {
  const attendees = await sql`
        select *, r.id as r_id, c.id as c_id
        from registration r
                 left join checkin c
                           on r.id = c.registration_id
        where event_id = ${eventId}`;

  return attendees;
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

exports.saveCheckin = async ({ newCheckin }) => {
  newCheckin = {
    ...newCheckin,
    checkinTime: new Date(),
  };
  if (!newCheckin.id) {
    delete newCheckin.id;
  }
  const [savedCheckin] = await sql`
        insert into checkin ${sql(newCheckin)}
        on conflict (id)
        do update set ${sql(newCheckin)}
        returning *;`;

  return savedCheckin;
};

exports.validateQrCode = async ({ id, qrUuid, eventId }) => {
  const [registration] = await sql`
        select *, r.id as r_id, c.id as c_id
        from registration r
                 left join checkin c on r.id = c.registration_id
        where r.id = ${id}
          and r.event_id = ${eventId}`;

  if (!registration || registration.qrUuid != qrUuid) {
    throw new CustomError("Invalid QR Code", 401, registration);
  } else if (registration.cId !== null) {
    throw new CustomError("Already checked-in", 401, registration);
  }
  return registration;
};

exports.scanByRegistrationId = async ({ qrCodeData, eventId, userId }) => {
  const { id, qrUuid } = JSON.parse(qrCodeData);
  const registration = await exports.validateQrCode({ id, qrUuid, eventId });

  const newCheckin = {
    checkinStatus: true,
    registrationId: id,
    checkedinBy: userId,
  };
  const updatedCheckin = await exports.saveCheckin({ newCheckin });
  return registration;
};

exports.downloadAttendees = async ({ eventId }) => {
  const attendees = await exports.getAttendeesWcheckin({ eventId });

  if (attendees.length === 0)
    throw new CustomError("No data available for report!", 404);

  const workbook = new exceljs.Workbook();
  const worksheet = workbook.addWorksheet("Attendee Report");

  worksheet.columns = [
    { header: "Id", key: "id", width: 10 },
    { header: "Name", key: "name", width: 30 },
    { header: "Email", key: "email", width: 30 },
    { header: "Phone", key: "phone", width: 30 },
    { header: "Registration Time", key: "registration_time", width: 30 },
    { header: "Checkin Time", key: "checkin_time", width: 30 },
    { header: "Checkin Status", key: "checkin_status", width: 30 },
  ];

  attendees.forEach((item) => {
    worksheet.addRow({
      id: item.rId,
      name: item.registrationData?.name,
      email: item.registrationData?.email,
      phone: item.registrationData?.phone,
      registration_time: item.registrationTime
        ? formatTime(item.registrationTime)
        : "",
      checkin_time: item.checkinTime ? formatTime(item.checkinTime) : "",
      checkin_status: item.checkinStatus ? "Checked-in" : "Pending",
    });
  });

  return workbook;
};

exports.getFormQuestions = async (eventId) => {
  return await sql`
        select *
        from form_question
        where event_id = ${eventId}`;
};

exports.saveForm = async ({ payload: { formQuestions, rmQIds, eventId } }) => {
  console.log(44, formQuestions, rmQIds);
  // Delete old questions
  if (rmQIds?.length > 0)
    await sql`
            delete
            from form_question
            where id in ${sql(rmQIds)}`;

  let insertedQuestions = [];
  if (formQuestions.length > 0) {
    const formattedQuestions = formQuestions.map((item) => {
      if (!item.options) delete item.options;
      if (!item.id) delete item.id;
      item.eventId = eventId;
      return item;
    });

    for (const item of formattedQuestions) {
      insertedQuestions = await sql`
                insert into form_question ${sql(item)}
                on conflict (id)
                do update set ${sql(item)}
                returning *`;
    }
  }
  return insertedQuestions;
};
