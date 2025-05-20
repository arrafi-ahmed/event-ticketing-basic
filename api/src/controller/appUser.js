const router = require("express").Router();
const appUserService = require("../service/appUser");
const ApiResponse = require("../model/ApiResponse");
const { auth, isSudo } = require("../middleware/auth");

router.post("/save", auth, isSudo, (req, res, next) => {
  appUserService
    .save(req.body)
    .then((results) =>
      res.status(200).json(new ApiResponse("Credential saved!", results)),
    )
    .catch((err) => next(err));
});

router.get("/getAppUsers", auth, isSudo, (req, res, next) => {
  appUserService
    .getAppUsers({ clubId: req.query.clubId })
    .then((results) => res.status(200).json(new ApiResponse(null, results)))
    .catch((err) => next(err));
});

module.exports = router;
