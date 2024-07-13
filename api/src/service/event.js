const CustomError = require("../model/CustomError");
const { sql } = require("../db");
const { removeImages } = require("../others/util");

exports.save = async ({ payload, files, currentUser }) => {
  const newEvent = {
    ...payload,
    clubId: currentUser.clubId,
    createdBy: currentUser.id,
  };
  if (!newEvent.id) {
    newEvent.registrationCount = 0;
  } else if (currentUser.role != "sudo") {
    //if updating event make sure user is authorized
    const [event] = await exports.getEventByEventIdnClubId({
      eventId: newEvent.id,
      clubId: currentUser.clubId,
    });
    if (!event || !event.id) throw new CustomError("Access denied", 401);
  }
  //add banner
  if (files && files.length > 0) {
    newEvent.banner = files[0].filename;
  }
  //remove banner
  if (payload.rmImage) {
    await removeImages([payload.rmImage]);
    delete newEvent.rmImage;

    if (!newEvent.banner) newEvent.banner = null;
  }
  const [insertedEvent] = await sql`
        insert into event ${sql(newEvent)}
        on conflict (id)
        do update set ${sql(newEvent)} returning *`;

  return insertedEvent;
};

exports.removeEvent = async ({ eventId, clubId }) => {
  const [deletedEvent] = await sql`
        delete
        from event
        where id = ${eventId}
          and club_id = ${clubId}
        returning *;`;

  if (deletedEvent.banner) {
    await removeImages([deletedEvent.banner]);
  }
  return deletedEvent;
};
exports.getEventByEventIdnClubId = async ({ clubId, eventId }) => {
  return sql`
        select *
        from event
        where id = ${eventId}
          and club_id = ${clubId}
        order by id desc`;
};
exports.getAllEvents = async ({ clubId }) => {
  return sql`
        select *
        from event
        where club_id = ${clubId}
        order by id desc`;
};

exports.getAllActiveEvents = async ({ clubId, currentDate }) => {
  // const currentDate = new Date().toISOString().split("T")[0]; // Format the date as YYYY-MM-DD

  const results = await sql`
        SELECT *
        FROM event
        WHERE club_id = ${clubId}
          AND ${currentDate}::date < end_date
          AND registration_count < max_attendees
        ORDER BY id DESC;
    `;
  return results;
};
