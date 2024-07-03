const router = require("express").Router();
const clubService = require("../service/club");
const ApiResponse = require("../model/ApiResponse");
const { auth, isSudo } = require("../middleware/auth");
const compressImages = require("../middleware/compress");
const { uploadClubLogo } = require("../middleware/upload");
const { log } = require("qrcode/lib/core/galois-field");
const eventService = require("../service/event");
const { ifSudo } = require("../others/util");

router.post("/save", auth, uploadClubLogo, compressImages, (req, res, next) => {
  clubService
    .save({ body: req.body, files: req.files, userId: req.currentUser.id })
    .then((results) => {
      res.status(200).json(new ApiResponse("Club saved!", results));
    })
    .catch((err) => next(err));
});

router.get("/getAllClubs", auth, (req, res, next) => {
  clubService
    .getAllClubs()
    .then((results) => res.status(200).json(new ApiResponse(null, results)))
    .catch((err) => next(err));
});

router.get("/getClub", (req, res, next) => {
  clubService
    .getClub({ clubId: req.query.clubId })
    .then((results) => res.status(200).json(new ApiResponse(null, results[0])))
    .catch((err) => next(err));
});

router.get("/removeClub", auth, isSudo, (req, res, next) => {
  clubService
    .removeClub({
      clubId: req.query.clubId,
    })
    .then((results) =>
      res.status(200).json(new ApiResponse("Club deleted!", results))
    )
    .catch((err) => next(err));
});

module.exports = router;
