const templates = [
  // Template 1
  (name) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Event Ticketing System</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">

<div style="max-width:650px;margin:auto;background:#ffffff;padding:40px;">

<h1 style="color:#2563eb;text-align:center;">
Event Ticketing System
</h1>

<h2>Hello ${name},</h2>

<p>
Discover amazing concerts, sports, comedy shows and festivals happening near you.
</p>

<div style="text-align:center;margin:35px 0;">
<a href="#" style="
background:#2563eb;
color:white;
padding:14px 28px;
text-decoration:none;
border-radius:6px;
font-weight:bold;">
Book Your Next Event
</a>
</div>

<p>
Stay connected for exciting experiences every day.
</p>

<hr>

<p style="font-size:13px;color:gray;text-align:center;">
© Event Ticketing System
</p>

</div>

</body>
</html>
`,

  // Template 2
  (name) => `
<!DOCTYPE html>
<html>
<body style="background:#f4f4f4;font-family:Arial;padding:40px;">

<div style="background:white;padding:35px;border-radius:10px;max-width:650px;margin:auto;">

<h1 style="color:#dc2626;">Today's Featured Events</h1>

<p>Hello ${name},</p>

<p>
Your next unforgettable experience is waiting.
Don't miss today's hottest events.
</p>

<ul>
<li>Live Concerts</li>
<li>Theatre Shows</li>
<li>Sports Events</li>
<li>Stand-up Comedy</li>
</ul>

<p>Book now before tickets sell out!</p>

</div>

</body>
</html>
`,

  // Template 3
  (name) => `
<!DOCTYPE html>
<html>
<body style="background:#fafafa;font-family:Arial;padding:40px;">

<div style="background:white;padding:35px;max-width:650px;margin:auto;">

<h1 style="color:#059669;">
Special Offers
</h1>

<p>Hello ${name},</p>

<p>
This week brings exclusive event experiences and exciting entertainment.
Stay tuned for more updates from Event Ticketing System.
</p>

<p>
Thank you for being part of our community.
</p>

</div>

</body>
</html>
`,

  // Template 4
  (name) => `
<!DOCTYPE html>
<html>
<body style="background:#f7f7f7;font-family:Arial;padding:40px;">

<div style="background:white;padding:35px;max-width:650px;margin:auto;">

<h1 style="color:#7c3aed;">
Why Choose Event Ticketing System?
</h1>

<p>Hello ${name},</p>

<ul>
<li>Secure Payments</li>
<li>Instant Booking</li>
<li>Easy Cancellation</li>
<li>Trusted Platform</li>
</ul>

<p>
Thank you for choosing us.
</p>

</div>

</body>
</html>
`,

  // Template 5
  (name) => `
<!DOCTYPE html>
<html>
<body style="background:#f8fafc;font-family:Arial;padding:40px;">

<div style="background:white;padding:35px;max-width:650px;margin:auto;">

<h1 style="color:#f59e0b;">
Have You Checked Our Latest Events?
</h1>

<p>Hello ${name},</p>

<p>
Entertainment never stops!
Check out concerts, workshops, festivals and much more.
</p>

<p>
We look forward to seeing you at your next event.
</p>

</div>

</body>
</html>
`,
];

module.exports = (name = "Subscriber") => {
  const index = new Date().getDate() % templates.length;
  return templates[index](name);
};
