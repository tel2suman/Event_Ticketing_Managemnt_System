const User = require("../../models/User");

const Cart = require("../../models/Cart");

const Event = require("../../models/Event");

const HttpStatusCode = require("../../utils/httpStatusCode");

const mongoose = require("mongoose");

class CartController {
  // added  to cart
  async addToCart(req, res) {
    try {
      const { eventId, quantity } = req.body;

      const event = await Event.findById(eventId);

      if (!event) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Event not found",
        });
      }

      let cart = await Cart.findOne({
        userId: req.user._id,
        eventId,
      });

      if (cart) {
        cart.quantity += quantity || 1;

        await cart.save();
      } else {
        cart = await Cart.create({
          userId: req.user._id,
          eventId,
          quantity: quantity || 1,
        });
      }

      return res.status(HttpStatusCode.CREATED).json({
        success: true,
        message: "Event added to cart",
        data: cart,
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // get user cart
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
          },
        },
      ]);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        count: cart.length,
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



