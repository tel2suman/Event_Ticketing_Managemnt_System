const transporter = require("../config/emailConfig");

class EmailUtility {
  async sendVerificationEmail(user, verificationUrl) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: "Verify Your Email Address",

        text: `
Welcome to Event Ticketing, ${user.name}!

Please verify your email address using the link below:

${verificationUrl}

This verification link expires in 1 hour.

If you did not create this account, please ignore this email.
        `,

        html: `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
              />
              <title>Verify Email Address</title>
            </head>

            <body
              style="
                margin: 0;
                padding: 0;
                background-color: #f4f6f8;
                font-family: Arial, Helvetica, sans-serif;
              "
            >
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                role="presentation"
              >
                <tr>
                  <td align="center" style="padding: 40px 15px">
                    <table
                      width="600"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="
                        width: 100%;
                        max-width: 600px;
                        background-color: #ffffff;
                        border-radius: 12px;
                        overflow: hidden;
                      "
                    >
                      <tr>
                        <td
                          align="center"
                          style="
                            background-color: #111827;
                            padding: 32px;
                          "
                        >
                          <h1
                            style="
                              margin: 0;
                              color: #ffffff;
                              font-size: 28px;
                            "
                          >
                            Event Ticketing
                          </h1>

                          <p
                            style="
                              margin: 10px 0 0;
                              color: #d1d5db;
                              font-size: 14px;
                            "
                          >
                            Discover. Book. Experience.
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding: 40px">
                          <h2
                            style="
                              margin-top: 0;
                              color: #111827;
                            "
                          >
                            Welcome, ${user.name}!
                          </h2>

                          <p
                            style="
                              color: #4b5563;
                              font-size: 16px;
                              line-height: 1.7;
                            "
                          >
                            Thank you for creating your Event Ticketing
                            account. Please verify your email address
                            before signing in.
                          </p>

                          <table
                            width="100%"
                            cellpadding="0"
                            cellspacing="0"
                            role="presentation"
                          >
                            <tr>
                              <td
                                align="center"
                                style="padding: 25px 0"
                              >
                                <a
                                  href="${verificationUrl}"
                                  style="
                                    display: inline-block;
                                    background-color: #2563eb;
                                    color: #ffffff;
                                    text-decoration: none;
                                    padding: 14px 30px;
                                    border-radius: 8px;
                                    font-size: 16px;
                                    font-weight: bold;
                                  "
                                >
                                  Verify Email Address
                                </a>
                              </td>
                            </tr>
                          </table>

                          <p
                            style="
                              color: #6b7280;
                              font-size: 14px;
                              line-height: 1.6;
                            "
                          >
                            This verification link expires in
                            <strong>1 hour</strong>.
                          </p>

                          <p
                            style="
                              color: #6b7280;
                              font-size: 14px;
                              line-height: 1.6;
                            "
                          >
                            If the button does not work, copy and paste
                            the following URL into your browser:
                          </p>

                          <div
                            style="
                              padding: 15px;
                              background-color: #f3f4f6;
                              border-radius: 8px;
                              color: #2563eb;
                              font-size: 13px;
                              line-height: 1.6;
                              word-break: break-all;
                            "
                          >
                            ${verificationUrl}
                          </div>

                          <p
                            style="
                              margin-top: 30px;
                              color: #9ca3af;
                              font-size: 12px;
                              line-height: 1.6;
                            "
                          >
                            If you did not create this account, you can
                            safely ignore this email.
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td
                          align="center"
                          style="
                            padding: 20px;
                            background-color: #f9fafb;
                            color: #9ca3af;
                            font-size: 12px;
                          "
                        >
                          Event Ticketing & Management System
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
      };

      return await transporter.sendMail(mailOptions);
    } catch (error) {
      throw error;
    }
  }

  async sendPasswordResetEmail(user, resetUrl) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: "Reset Your Password",

        text: `
Hello ${user.name},

We received a request to reset your Event Ticketing account password.

Reset your password using the link below:

${resetUrl}

This password reset link expires in 15 minutes.

If you did not request this password reset, please ignore this email.
        `,

        html: `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
              />
              <title>Reset Password</title>
            </head>

            <body
              style="
                margin: 0;
                padding: 0;
                background-color: #f4f6f8;
                font-family: Arial, Helvetica, sans-serif;
              "
            >
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                role="presentation"
              >
                <tr>
                  <td align="center" style="padding: 40px 15px">
                    <table
                      width="600"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="
                        width: 100%;
                        max-width: 600px;
                        background-color: #ffffff;
                        border-radius: 12px;
                        overflow: hidden;
                      "
                    >
                      <tr>
                        <td
                          align="center"
                          style="
                            background-color: #111827;
                            padding: 32px;
                          "
                        >
                          <h1
                            style="
                              margin: 0;
                              color: #ffffff;
                              font-size: 28px;
                            "
                          >
                            Event Ticketing
                          </h1>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding: 40px">
                          <h2
                            style="
                              margin-top: 0;
                              color: #111827;
                            "
                          >
                            Reset Your Password
                          </h2>

                          <p
                            style="
                              color: #4b5563;
                              font-size: 16px;
                              line-height: 1.7;
                            "
                          >
                            Hello ${user.name},
                          </p>

                          <p
                            style="
                              color: #4b5563;
                              font-size: 16px;
                              line-height: 1.7;
                            "
                          >
                            We received a request to reset your Event
                            Ticketing account password.
                          </p>

                          <table
                            width="100%"
                            cellpadding="0"
                            cellspacing="0"
                            role="presentation"
                          >
                            <tr>
                              <td
                                align="center"
                                style="padding: 25px 0"
                              >
                                <a
                                  href="${resetUrl}"
                                  style="
                                    display: inline-block;
                                    background-color: #2563eb;
                                    color: #ffffff;
                                    text-decoration: none;
                                    padding: 14px 30px;
                                    border-radius: 8px;
                                    font-size: 16px;
                                    font-weight: bold;
                                  "
                                >
                                  Reset Password
                                </a>
                              </td>
                            </tr>
                          </table>

                          <p
                            style="
                              color: #6b7280;
                              font-size: 14px;
                              line-height: 1.6;
                            "
                          >
                            This password reset link expires in
                            <strong>15 minutes</strong>.
                          </p>

                          <p
                            style="
                              color: #6b7280;
                              font-size: 14px;
                              line-height: 1.6;
                            "
                          >
                            If the button does not work, copy and paste
                            the following URL into your browser:
                          </p>

                          <div
                            style="
                              padding: 15px;
                              background-color: #f3f4f6;
                              border-radius: 8px;
                              color: #2563eb;
                              font-size: 13px;
                              line-height: 1.6;
                              word-break: break-all;
                            "
                          >
                            ${resetUrl}
                          </div>

                          <p
                            style="
                              margin-top: 30px;
                              color: #9ca3af;
                              font-size: 12px;
                              line-height: 1.6;
                            "
                          >
                            If you did not request a password reset,
                            you can safely ignore this email.
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td
                          align="center"
                          style="
                            padding: 20px;
                            background-color: #f9fafb;
                            color: #9ca3af;
                            font-size: 12px;
                          "
                        >
                          Event Ticketing & Management System
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
      };

      return await transporter.sendMail(mailOptions);
    } catch (error) {
      throw error;
    }
  }

  async sendTicketConfirmationEmail(user, event, tickets) {
    try {
      const eventDate = new Date(event.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const totalPaid = tickets.reduce(
        (sum, ticket) => sum + ticket.priceAtPurchase,
        0,
      );

      const ticketCardsHtml = tickets
        .map(
          (ticket) => `
        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          role="presentation"
          style="
            margin-bottom: 20px;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            overflow: hidden;
          "
        >
          <tr>
            <td style="padding: 20px; background-color: #f9fafb;">
              <p style="margin: 0 0 4px; color: #6b7280; font-size: 13px;">
                ${ticket.tierId?.name || "Ticket"}
              </p>
              <p
                style="
                  margin: 0 0 12px;
                  color: #111827;
                  font-size: 18px;
                  font-weight: bold;
                "
              >
                Ticket Code: ${ticket.ticketCode}
              </p>
              <img
                src="${ticket.qrCodeUrl}"
                alt="Ticket QR Code"
                width="160"
                height="160"
                style="display: block; margin: 0 auto 12px; border-radius: 8px;"
              />
              <p style="margin: 0; text-align: center; color: #6b7280; font-size: 13px;">
                Show this QR code at entry. Price paid: ₹${ticket.priceAtPurchase}
              </p>
            </td>
          </tr>
        </table>
      `,
        )
        .join("");

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: `Your Ticket${tickets.length > 1 ? "s" : ""} for ${event.title}`,

        text: `
Hi ${user.name},

Your payment was successful! Here are your ticket details for ${event.title}:

Date: ${eventDate}
Time: ${event.time}
Location: ${event.location}

Total tickets: ${tickets.length}
Total paid: ₹${totalPaid}

Ticket codes: ${tickets.map((t) => t.ticketCode).join(", ")}

Please view this email in an HTML-compatible client to see your QR code(s),
or log in to your account to view/download your tickets.

See you at the event!
        `,

        html: `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
              />
              <title>Your Event Ticket</title>
            </head>

            <body
              style="
                margin: 0;
                padding: 0;
                background-color: #f4f6f8;
                font-family: Arial, Helvetica, sans-serif;
              "
            >
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                role="presentation"
              >
                <tr>
                  <td align="center" style="padding: 40px 15px">
                    <table
                      width="600"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="
                        width: 100%;
                        max-width: 600px;
                        background-color: #ffffff;
                        border-radius: 12px;
                        overflow: hidden;
                      "
                    >
                      <tr>
                        <td
                          align="center"
                          style="
                            background-color: #111827;
                            padding: 32px;
                          "
                        >
                          <h1
                            style="
                              margin: 0;
                              color: #ffffff;
                              font-size: 28px;
                            "
                          >
                            🎉 Payment Successful
                          </h1>

                          <p
                            style="
                              margin: 10px 0 0;
                              color: #d1d5db;
                              font-size: 14px;
                            "
                          >
                            Your ticket${tickets.length > 1 ? "s are" : " is"} ready
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding: 40px 40px 20px">
                          <h2 style="margin-top: 0; color: #111827;">
                            ${event.title}
                          </h2>

                          <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0;">
                            📅 ${eventDate} &nbsp;|&nbsp; 🕒 ${event.time}<br/>
                            📍 ${event.location}
                          </p>

                          <p style="color: #4b5563; font-size: 15px; margin-top: 16px;">
                            Hi ${user.name}, thanks for your purchase! You paid
                            <strong>₹${totalPaid}</strong> for
                            <strong>${tickets.length} ticket${tickets.length > 1 ? "s" : ""}</strong>.
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding: 0 40px 20px">
                          ${ticketCardsHtml}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding: 0 40px 30px">
                          <p style="color: #6b7280; font-size: 13px; line-height: 1.6;">
                            Please arrive a little early and have your QR
                            code${tickets.length > 1 ? "s" : ""} ready at the entrance.
                            Each ticket can only be scanned once.
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td
                          align="center"
                          style="
                            padding: 20px;
                            background-color: #f9fafb;
                            color: #9ca3af;
                            font-size: 12px;
                          "
                        >
                          Event Ticketing & Management System
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
      };

      return await transporter.sendMail(mailOptions);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new EmailUtility();
