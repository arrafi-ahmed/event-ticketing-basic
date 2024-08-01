const router = require("express").Router();
const stripeService = require("../service/stripe");
const ApiResponse = require("../model/ApiResponse");

router.post("/createCheckout", (req, res, next) => {
  stripeService
    .createCheckout({ payload: req.body })
    .then((results) => res.status(200).json(new ApiResponse(null, results)))
    .catch((err) => next(err));
});

router.get("/sessionStatus", (req, res, next) => {
  stripeService
    .sessionStatus({ sessionId: req.query.sessionId })
    .then((result) => res.status(200).json(new ApiResponse(null, result)))
    .catch((err) => next(err));
});

module.exports = router;
