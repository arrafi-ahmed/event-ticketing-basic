const router = require("express").Router();
const registrationService = require("../service/registration");
const ApiResponse = require("../model/ApiResponse");
const { auth, isAdminEventAuthor } = require("../middleware/auth");

router.post("/save", (req, res, next) => {
  registrationService
    .save({ body: req.body })
    .then((results) => {
      res
        .status(200)
        .json(new ApiResponse("Registration successful!", results));
    })
    .catch((err) => next(err));
});

router.get(
  "/getAttendeesWcheckin",
  auth,
  isAdminEventAuthor,
  (req, res, next) => {
    registrationService
      .getAttendeesWcheckin({ eventId: req.query.eventId })
      .then((results) => res.status(200).json(new ApiResponse(null, results)))
      .catch((err) => next(err));
  }
);

router.get("/downloadAttendees", auth, isAdminEventAuthor, (req, res, next) => {
  registrationService
    .downloadAttendees({ eventId: req.query.eventId })
    .then(async (workbook) => {
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=" + "attendee-report.xlsx"
      );
      await workbook.xlsx.write(res);
      res.end();
    })
    .catch((err) => next(err));
});

router.get("/searchAttendees", auth, isAdminEventAuthor, (req, res, next) => {
  registrationService
    .searchAttendees({
      searchKeyword: req.query.searchKeyword,
      eventId: req.query.eventId,
    })
    .then((results) => res.status(200).json(new ApiResponse(null, results)))
    .catch((err) => next(err));
});

router.get("/sendTicket", auth, isAdminEventAuthor, (req, res, next) => {
  registrationService
    .sendTicket({
      registrationId: req.query.registrationId,
    })
    .then((results) =>
      res.status(200).json(new ApiResponse("Ticket sent to email!", results))
    )
    .catch((err) => next(err));
});

module.exports = router;
