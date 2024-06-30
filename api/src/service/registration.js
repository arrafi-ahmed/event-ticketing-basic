const CustomError = require("../model/CustomError");
const { sql } = require("../db");
const { v4: uuidv4 } = require("uuid");
const exceljs = require("exceljs");
const { formatTime } = require("../others/util");

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

  return insertedRegistration;
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
      id: item.id,
      name: item.registrationData?.name,
      email: item.registrationData?.email,
      phone: item.registrationData?.phone,
      registration_time: formatTime(item.registrationTime),
      checkin_time: formatTime(item.checkinTime),
      checkin_status: item.checkinStatus ? "Checked-in" : "Pending",
    });
  });

  return workbook;
};
