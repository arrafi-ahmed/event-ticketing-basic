const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const token = req.header("authorization");
  if (!token) return res.status(401).json({ message: "Access denied" });
  try {
    const { currentUser } = jwt.verify(token, process.env.TOKEN_SECRET);
    req.currentUser = currentUser;
    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid token" });
  }
};

const isSudo = (req, res, next) => {
  const currentUser = req.currentUser;
  if (!currentUser) res.status(400).json({ message: "Invalid request" });
  try {
    if (currentUser.role.toLowerCase() === "sudo") next();
  } catch (error) {
    res.status(400).json({ message: "Invalid request" });
  }
};

const isAdmin = (req, res, next) => {
  const currentUser = req.currentUser;
  if (!currentUser) res.status(400).json({ message: "Invalid request" });
  try {
    if (currentUser.role.toLowerCase() === "admin") next();
  } catch (error) {
    res.status(400).json({ message: "Invalid request" });
  }
};

module.exports = { auth, isSudo, isAdmin };
