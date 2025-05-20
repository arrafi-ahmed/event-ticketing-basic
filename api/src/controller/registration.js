const router = require("express").Router();
const registrationService = require("../service/registration");
const eventService = require("../service/event");
const stripeService = require("../service/stripe");
const ApiResponse = require("../model/ApiResponse");
const {
  auth,
  isAdminEventAuthor,
  isAuthenticated,
} = require("../middleware/auth");

router.post("/initRegistration", async (req, res, next) => {
  try {
    const savedRegistration = await registrationService.defaultSave({
      payload: req.body.newRegistration,
    });

    let savedExtrasPurchase = null;
    if (req.body.extrasIds?.length) {
      savedExtrasPurchase = await eventService.saveExtrasPurchase({
        extrasIds: req.body.extrasIds,
        registrationId: savedRegistration.id,
      });
    }

    const { clientSecret } = await stripeService.createStripeCheckoutIfNeeded({
      payload: {
        savedRegistration,
        savedExtrasPurchase,
        extrasIds: req.body.extrasIds,
      },
    });
    let responseMsg = null;
    if (clientSecret === "no-stripe") {
      // increase registration_count in event
      await eventService.increaseRegistrationCount({
        eventId: savedRegistration.eventId,
      });
      // send email
      await registrationService.sendTicket({
        registrationId: savedRegistration.id,
      });
      responseMsg = "Registration Successful!";
    }

    res.status(200).json(
      new ApiResponse(responseMsg, {
        savedRegistration,
        clientSecret,
      }),
    );
  } catch (err) {
    next(err);
  }
});

router.post("/save", (req, res, next) => {
  registrationService
    .defaultSave({ payload: req.body })
    .then((results) => {
      res.status(200).json(new ApiResponse(null, results));
    })
    .catch((err) => next(err));
});

router.post("/updateStatus", (req, res, next) => {
  registrationService
    .updateStatus({ payload: req.body })
    .then((results) => {
      res.status(200).json(new ApiResponse(null, results));
    })
    .catch((err) => next(err));
});

router.get("/getRegistration", isAuthenticated, (req, res, next) => {
  registrationService
    .getRegistration({
      registrationId: req.query.registrationId,
      uuid: req.query.uuid,
      isLoggedIn: req.isLoggedIn,
    })
    .then((results) => res.status(200).json(new ApiResponse(null, results)))
    .catch((err) => next(err));
});

router.get("/getAttendees", auth, isAdminEventAuthor, (req, res, next) => {
  registrationService
    .getAttendees({
      eventId: req.query.eventId,
      searchKeyword: req.query.searchKeyword,
      sortBy: req.query.sortBy,
    })
    .then((results) => res.status(200).json(new ApiResponse(null, results)))
    .catch((err) => next(err));
});

router.get(
  "/removeRegistration",
  auth,
  isAdminEventAuthor,
  (req, res, next) => {
    registrationService
      .removeRegistration({
        registrationId: req.query.registrationId,
        eventId: req.query.eventId,
      })
      .then((results) =>
        res.status(200).json(new ApiResponse("Registration deleted!", results)),
      )
      .catch((err) => next(err));
  },
);

router.get("/downloadAttendees", auth, isAdminEventAuthor, (req, res, next) => {
  registrationService
    .downloadAttendees({ eventId: req.query.eventId })
    .then(async (workbook) => {
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=" + "attendee-report.xlsx",
      );
      await workbook.xlsx.write(res);
      res.end();
    })
    .catch((err) => next(err));
});

router.get("/sendTicket", auth, isAdminEventAuthor, (req, res, next) => {
  registrationService
    .sendTicket({
      registrationId: req.query.registrationId,
    })
    .then((results) =>
      res.status(200).json(new ApiResponse("Ticket sent to email!", results)),
    )
    .catch((err) => next(err));
});

router.post(
  "/scanByExtrasPurchaseId",
  auth,
  isAdminEventAuthor,
  (req, res, next) => {
    registrationService
      .scanByExtrasPurchaseId({
        ...req.body.payload,
      })
      .then((results) =>
        res.status(200).json(new ApiResponse("Ticket sent to email!", results)),
      )
      .catch((err) => next(err));
  },
);

module.exports = router;
