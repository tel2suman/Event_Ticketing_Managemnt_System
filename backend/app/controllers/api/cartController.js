const User = require("../../models/User");

const Cart = require("../../models/Cart");

const Event = require("../../models/Event");

const TicketTier = require("../../models/TicketTier");

const HttpStatusCode = require("../../utils/httpStatusCode");

const mongoose = require("mongoose");

class CartController {
  // add a specific tier of an event to cart — merges into the existing
  // row for the same (event, tier) pair instead of creating a duplicate
  async addToCart(req, res) {
    try {
      const { eventId, tierId, quantity } = req.body;

      const event = await Event.findOne({ _id: eventId, isDeleted: false });

      if (!event) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Event not found",
        });
      }

      const tier = await TicketTier.findOne({
        _id: tierId,
        eventId,
        isActive: true,
      });

      if (!tier) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Ticket tier not found for this event",
        });
      }

      const requestedQuantity = quantity || 1;
      const remaining = tier.quantityAvailable - tier.quantitySold;

      let cart = await Cart.findOne({
        userId: req.user._id,
        eventId,
        tierId,
      });

      const totalQuantity = (cart?.quantity || 0) + requestedQuantity;

      if (totalQuantity > remaining) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: `Only ${remaining} ticket(s) left in this tier`,
        });
      }

      if (cart) {
        cart.quantity = totalQuantity;

        await cart.save();
      } else {
        cart = await Cart.create({
          userId: req.user._id,
          eventId,
          tierId,
          quantity: requestedQuantity,
        });
      }

      return res.status(HttpStatusCode.CREATED).json({
        success: true,
        message: "Ticket added to cart",
        data: cart,
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // get user cart — includes tier price/benefits and a computed line
  // total per item plus a cart-wide total, since the frontend has no
  // other way to know a tier's price/benefits without this
  async getCart(req, res) {
    try {
      const cart = await Cart.aggregate([
        {
          $match: {
            userId: req.user._id,
          },
        },
        {
          $lookup: {
            from: "events",
            localField: "eventId",
            foreignField: "_id",
            as: "event",
          },
        },
        {
          $unwind: "$event",
        },
        {
          $lookup: {
            from: "tickettiers",
            localField: "tierId",
            foreignField: "_id",
            as: "tier",
          },
        },
        {
          $unwind: "$tier",
        },
        {
          $project: {
            quantity: 1,
            createdAt: 1,
            event: {
              _id: "$event._id",
              title: "$event.title",
              banner: "$event.banner",
              location: "$event.location",
              date: "$event.date",
              time: "$event.time",
            },
            tier: {
              _id: "$tier._id",
              name: "$tier.name",
              price: "$tier.price",
              benefits: "$tier.benefits",
              quantityAvailable: "$tier.quantityAvailable",
              quantitySold: "$tier.quantitySold",
            },
            lineTotal: { $multiply: ["$quantity", "$tier.price"] },
          },
        },
      ]);

      const total = cart.reduce((sum, item) => sum + item.lineTotal, 0);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        count: cart.length,
        total,
        data: cart,
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Update Cart
  async updateQuantity(req, res) {
    try {
      const { cartId } = req.params;
      const { quantity } = req.body;

      const cart = await Cart.findById(cartId);

      if (!cart) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Cart item not found",
        });
      }

      const tier = await TicketTier.findById(cart.tierId);

      if (!tier) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Ticket tier no longer exists",
        });
      }

      const remaining = tier.quantityAvailable - tier.quantitySold;

      if (quantity > remaining) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: `Only ${remaining} ticket(s) left in this tier`,
        });
      }

      cart.quantity = quantity;

      await cart.save();

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Cart updated",
        data: cart,
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Remove Cart
  async removeFromCart(req, res) {
    try {
      const { cartId } = req.params;

      const cart = await Cart.findByIdAndDelete(cartId);

      if (!cart) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Cart item not found",
        });
      }

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Event removed from cart",
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // clear cart
  async clearCart(req, res) {

    try {
      
      await Cart.deleteMany({
        userId: req.user._id,
      });

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Cart cleared successfully",
      });

    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }
}


module.exports = new CartController();



