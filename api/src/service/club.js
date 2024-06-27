const CustomError = require("../model/CustomError");
const { sql } = require("../db");
const { v4: uuidv4 } = require("uuid");
const { removeImages } = require("../others/util");

exports.save = async ({ body, files, userId }) => {
  const newClub = {
    name: body.name,
    description: body.description,
    createdBy: userId,
  };
  if (files && files.length > 0) {
    newClub.logo = files[0].filename;
  }
  const [insertedClub] = await sql`
        insert into club ${sql(newClub)}
        on conflict (id)
        do update set ${sql(newClub)} returning *`;

  return insertedClub;
};

exports.getAllClubs = async () => {
  return sql`
        select *
        from club
        order by id desc `;
};

exports.getClub = async (clubId) => {
  return sql`
        select *
        from club
        where id = ${clubId}
        order by id desc `;
};

exports.removeClub = async ({ clubId }) => {
  const [deletedClub] = await sql`
        delete
        from club
        where id = ${clubId}
        returning *;`;

  if (deletedClub.logo) {
    await removeImages([deletedClub.logo]);
  }
  return deletedClub;
};
