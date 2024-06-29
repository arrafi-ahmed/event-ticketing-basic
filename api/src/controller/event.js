const router = require("express").Router();
const eventService = require("../service/event");
const ApiResponse = require("../model/ApiResponse");
const { auth, isAdmin } = require("../middleware/auth");
const { uploadEventBanner } = require("../middleware/upload");
const compressImages = require("../middleware/compress");
const { ifSudo } = require("../others/util");

router.post(
  "/save",
  auth,
  isAdmin,
  uploadEventBanner,
  compressImages,
  (req, res, next) => {
    eventService
      .save({ body: req.body, files: req.files, currentUser: req.currentUser })
      .then((result) => {
        res.status(200).json(new ApiResponse("Event saved!", result));
      })
      .catch((err) => next(err));
  }
);

router.get("/getAllEvents", (req, res, next) => {
  eventService
    .getAllEvents({ clubId: req.query.clubId })
    .then((results) => res.status(200).json(new ApiResponse(null, results)))
    .catch((err) => next(err));
});

router.get("/getEventByEventIdnClubId", auth, (req, res, next) => {
  const isRoleSudo = ifSudo(req.currentUser.role);
  eventService
    .getEventByEventIdnClubId({
      clubId: isRoleSudo ? req.query.clubId : req.currentUser.clubId,
      eventId: req.query.eventId,
    })
    .then((results) => res.status(200).json(new ApiResponse(null, results[0])))
    .catch((err) => next(err));
});

router.get("/removeEvent", auth, (req, res, next) => {
  const isRoleSudo = ifSudo(req.currentUser.role);
  eventService
    .removeEvent({
      clubId: isRoleSudo ? req.query.clubId : req.currentUser.clubId,
      eventId: req.query.eventId,
    })
    .then((results) =>
      res.status(200).json(new ApiResponse("Event deleted!", results))
    )
    .catch((err) => next(err));
});

router.get("/getAllActiveEvents", (req, res, next) => {
  eventService
    .getAllActiveEvents({ clubId: req.query.clubId })
    .then((results) => res.status(200).json(new ApiResponse(null, results)))
    .catch((err) => next(err));
});

module.exports = router;
