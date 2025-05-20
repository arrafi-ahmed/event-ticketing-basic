const router = require("express").Router();
const clubService = require("../service/club");
const ApiResponse = require("../model/ApiResponse");
const { auth, isSudo } = require("../middleware/auth");
const compressImages = require("../middleware/compress");
const { uploadClubLogo } = require("../middleware/upload");

router.post("/save", auth, uploadClubLogo, compressImages, (req, res, next) => {
  clubService
    .save({ payload: req.body, files: req.files, currentUser: req.currentUser })
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
      res.status(200).json(new ApiResponse("Club deleted!", results)),
    )
    .catch((err) => next(err));
});

module.exports = router;
