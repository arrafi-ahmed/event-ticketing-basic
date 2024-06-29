const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const CustomError = require("../model/CustomError");
const { sql } = require("../db");
const { ifAdmin } = require("../others/util");

exports.register = (payload) => {};

const generateAuthData = async (result) => {
  let token = "";
  let currentUser = {};
  if (result) {
    currentUser = {
      id: result.aId,
      role: result.name.toLowerCase(),
      username: result.username,
      image: result.image,
    };

    if (ifAdmin(currentUser.role)) {
      const [club] = await sql`select *
                                     from club
                                     where id = ${result.clubId}`;

      currentUser.clubId = club.id;
      currentUser.clubName = club.name;
    }
    token = jwt.sign({ currentUser }, process.env.TOKEN_SECRET);
  }
  return { token, currentUser };
};

exports.signin = async ({ username, password }) => {
  const result = await sql`select *, a.id as a_id, r.id as r_id
                             from app_user a
                                      join role r on a.role = r.id
                             where username = ${username}
                               and password = ${password}`;
  if (result.length > 0) {
    return generateAuthData(result[0]);
  } else {
    throw new CustomError("Incorrect username/password!", 401);
  }
};
