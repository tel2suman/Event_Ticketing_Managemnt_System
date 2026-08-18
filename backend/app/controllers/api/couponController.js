const crypto = require("crypto");
const Coupon = require("../../models/Coupon");
const GiftCard = require("../../models/GiftCard");
const HttpStatusCode = require("../../utils/httpStatusCode");

const generateGiftCardCode = () => {
  const randomPart = crypto.randomBytes(5).toString("hex").toUpperCase().slice(0, 10);
  return `GIFT-${randomPart}`;
};

class CouponController {
  // admin: create a coupon
  async createCoupon(req, res) {
    try {
      const {
        code,
        discountType,
        discountValue,
        maxDiscountAmount,
        minOrderAmount,
        eventId,
        validFrom,
        validUntil,
        usageLimit,
      } = req.body;

      const existing = await Coupon.findOne({ code: code.toUpperCase().trim() });

      if (existing) {
        return res.status(HttpStatusCode.CONFLICT).json({
          success: false,
          message: "A coupon with this code already exists",
        });
      }

      const coupon = await Coupon.create({
        code: code.toUpperCase().trim(),
        discountType,
        discountValue,
        maxDiscountAmount: maxDiscountAmount ?? null,
        minOrderAmount: minOrderAmount ?? 0,
        eventId: eventId || null,
        validFrom: validFrom || Date.now(),
        validUntil,
        usageLimit: usageLimit ?? null,
        createdBy: req.user._id,
      });

      return res.status(HttpStatusCode.CREATED).json({
        success: true,
        message: "Coupon created successfully",
        data: coupon,
      });
    } catch (error) {
      console.error("Create Coupon Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // admin: list all coupons
  async getAllCoupons(req, res) {
    try {
      const coupons = await Coupon.find().sort({ createdAt: -1 });

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        count: coupons.length,
        data: coupons,
      });
    } catch (error) {
      console.error("Get All Coupons Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // admin: update a coupon (deactivate, extend, adjust value, etc.)
  async updateCoupon(req, res) {
    try {
      const { couponId } = req.params;

      const coupon = await Coupon.findByIdAndUpdate(
        couponId,
        { $set: req.body },
        { new: true, runValidators: true },
      );

      if (!coupon) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Coupon not found",
        });
      }

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Coupon updated successfully",
        data: coupon,
      });
    } catch (error) {
      console.error("Update Coupon Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // user: check if a coupon is valid + what it would discount, WITHOUT
  // consuming a redemption — used to show the discount at checkout
  // before the user actually commits to paying. Real redemption/
  // reservation happens in paymentController.createOrder.
  async validateCoupon(req, res) {
    try {
      const { code, orderAmount, eventId } = req.body;

      const coupon = await Coupon.findOne({
        code: code.toUpperCase().trim(),
        isActive: true,
      });

      if (!coupon) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Invalid or inactive coupon code",
        });
      }

      const now = new Date();

      if (now < coupon.validFrom || now > coupon.validUntil) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "This coupon has expired or is not yet active",
        });
      }

      if (coupon.eventId && eventId && coupon.eventId.toString() !== eventId) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "This coupon is not valid for this event",
        });
      }

      if (orderAmount < coupon.minOrderAmount) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: `This coupon requires a minimum order amount of Rs. ${coupon.minOrderAmount}`,
        });
      }

      if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "This coupon has reached its usage limit",
        });
      }

      let discountAmount =
        coupon.discountType === "percentage"
          ? (orderAmount * coupon.discountValue) / 100
          : coupon.discountValue;

      if (coupon.discountType === "percentage" && coupon.maxDiscountAmount !== null) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }

      discountAmount = Math.min(Math.round(discountAmount * 100) / 100, orderAmount);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        data: {
          code: coupon.code,
          discountType: coupon.discountType,
          discountAmount,
          estimatedTotal: orderAmount - discountAmount,
        },
      });
    } catch (error) {
      console.error("Validate Coupon Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // admin: issue a new gift card
  async createGiftCard(req, res) {
    try {
      const { initialBalance, expiresAt, issuedTo } = req.body;

      let code;
      let attempts = 0;

      do {
        code = generateGiftCardCode();
        attempts += 1;
      } while ((await GiftCard.exists({ code })) && attempts < 5);

      const giftCard = await GiftCard.create({
        code,
        initialBalance,
        balance: initialBalance,
        expiresAt: expiresAt || null,
        issuedTo: issuedTo || null,
        createdBy: req.user._id,
      });

      return res.status(HttpStatusCode.CREATED).json({
        success: true,
        message: "Gift card issued successfully",
        data: giftCard,
      });
    } catch (error) {
      console.error("Create Gift Card Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // admin: list all gift cards
  async getAllGiftCards(req, res) {
    try {
      const giftCards = await GiftCard.find().sort({ createdAt: -1 });

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        count: giftCards.length,
        data: giftCards,
      });
    } catch (error) {
      console.error("Get All Gift Cards Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // user: check a gift card's remaining balance/validity, no auth
  // restriction beyond being logged in — same "preview only" pattern as
  // validateCoupon above.
  async checkGiftCardBalance(req, res) {
    try {
      const { code } = req.params;

      const giftCard = await GiftCard.findOne({
        code: code.toUpperCase().trim(),
      });

      if (!giftCard || !giftCard.isActive) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Invalid or inactive gift card code",
        });
      }

      if (giftCard.expiresAt && new Date() > giftCard.expiresAt) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "This gift card has expired",
        });
      }

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        data: {
          code: giftCard.code,
          balance: giftCard.balance,
          expiresAt: giftCard.expiresAt,
        },
      });
    } catch (error) {
      console.error("Check Gift Card Balance Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new CouponController();
