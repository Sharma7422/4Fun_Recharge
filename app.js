require('dotenv').config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const User = require("./models/user.js");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const multer = require('multer');
const { cloudinary } = require('./cloudConfig');
const compression = require('compression');




const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
// const twilio = require('twilio');



const dbUrl = process.env.ATLASDB_URL;


// // Initialize Twilio
// const accountSid =process.env.ACCOUNT_SID;
// const authToken =process.env.TOKEN;
// const twilioPhoneNumber = '+12059906352'; // Include the '+' and country code
// const client = twilio(accountSid, authToken);

// Middleware to connect to MongoDB
async function connectToDB() {
  try {
    await mongoose.connect(dbUrl);
    // console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
  }
}
// Call the function to connect to MongoDB
connectToDB();



// Middleware to set up EJS as the view engine
app.engine('ejs', ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use(compression());


// connect mongo session
const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600,
});
store.on("error", () => {
  console.log("ERROR in MONGO SESSION STORE", err);
});


// Session middleware
app.use(session({
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true
}));

app.use(async (req, res, next) => {
  try {
    await connectToDB();

    // Set req.session.isAdmin to false for all users
    if (!req.session.isAdmin) {
      req.session.isAdmin = false;
    }

    next();
  } catch (err) {
    console.log(err);
    next(err);
  }
});

// Multer configration
const {
  storage } = require("./cloudConfig.js");
const upload = multer({ storage });


// app.get("/", (req, res) => {
//   res.send("I am root");
// });



// Admin Login Route
app.get("/admin/login", (req, res) => {
  res.render("admin/listing/login.ejs");
});

app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "adminpass") {
    req.session.isAdmin = true;
    return res.redirect("/admin/dashboard");
  } else {
    return res.redirect("/admin/login?error=1");
  }
});


// Admin Dashboard Route
app.get("/admin/dashboard", async (req, res) => {
  try {
    if (req.session.isAdmin) {
      // Assuming yourDataArray contains the data you want to display in the dashboard
      const yourDataArray = await User.find({}); // Fetch the data from the database

      res.render("admin/listing/dashboard.ejs", {
        username: req.session.username || "",
        data: yourDataArray,
      });
    } else {
      res.status(403).send("Forbidden");
    }
  } catch (error) {
    // console.error(error);
    res.status(500).send("Internal Server Error");
  }
});




// Middleware for user authentication
const authenticateUser = (req, res, next) => {
  if (req.session && req.session.isAdmin) {
    return next();
  } else {
    console.error("Authentication failed:", req.session);
    return res.status(403).send("Forbidden");
  }
};

// Index Route in Admin Panel
app.get("/admin/offlinediamond", authenticateUser, async (req, res) => {
  try {
    const allListings = await Listing.find({});
    res.render("admin/listing/index.ejs", { allListings, req }); // Pass req as a local variable
  } catch (error) {
    // console.error(error);
    res.status(500).send("Internal Server Error");
  }
});


// Index Route (accessible to all users)
app.get("/offlinediamond", async (req, res) => {
  try {
    const allListings = await Listing.find({});
    res.render("admin/listing/index.ejs", { allListings });
  } catch (error) {
    // console.error(error);
    res.status(500).send("Internal Server Error");
  }
});


// New route
app.get("/admin/offlinediamond/new", (req, res) => {
  res.render("admin/listing/new.ejs");
});

// Show Route
app.get("/offlinediamond/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
      return res.status(404).send("Listing not found");
    }

    // Pass req as a local variable to the EJS template
    res.render("admin/listing/show.ejs", { listing, req });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});




// Create route
app.post("/offlinediamond", async (req, res) => {
  try {
    const { diamond, price, extra } = req.body.listing;
    const newListing = new Listing({
      diamond,
      price,
      extra,
    });

    await newListing.save();
    res.redirect("/offlinediamond");
  } catch (error) {
    // console.error(error);
    res.status(500).send("Internal Server Error");
  }
});



// Edit Route in Admin Panel
app.get("/admin/offlinediamond/:id/edit", authenticateUser, async (req, res) => {
  try {
    let { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
      return res.status(404).send("Listing not found");
    }

    res.render("admin/listing/edit.ejs", { listing });
  } catch (error) {
    // console.error(error);
    res.status(500).send("Internal Server Error");
  }
});



// Update Route
app.put("/admin/offlinediamond/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const updatedListing = await Listing.findOneAndUpdate(
      { _id: id },
      req.body.listing,
      { new: true }
    );

    if (!updatedListing) {
      return res.status(404).send("Listing not found");
    }

    res.redirect("/admin/offlinediamond");
  } catch (error) {
    // console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Delete Route
app.delete("/admin/offlinediamond/:id", authenticateUser, async (req, res) => {
  try {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);

    if (!deletedListing) {
      return res.status(404).send("Listing not found");
    }

    console.log(deletedListing);
    res.redirect("/admin/offlinediamond");
  } catch (error) {
    // console.error(error);
    res.status(500).send("Internal Server Error");
  }
});


// Delete dashboard userData Route
app.delete("/admin/offlinediamond/delete/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedData = await User.findByIdAndDelete(id);

    if (!deletedData) {
      return res.status(404).send("Data not found");
    }

    // Extract publicId from the Cloudinary URL
    const cloudinaryUrl = deletedData.screen_shot;
    const publicIdMatch = cloudinaryUrl.match(/\/4Fun_Recharge\/([^\/.]+)\./);

    if (!publicIdMatch || publicIdMatch.length < 2) {
      return res.status(500).send("Error extracting publicId from Cloudinary URL");
    }

    const publicId = publicIdMatch[1];

    // Delete the image from Cloudinary
    const deletionResult = await cloudinary.uploader.destroy(publicId);

    if (deletionResult.result !== 'ok') {
      return res.status(500).send("Error deleting image from Cloudinary");
    }

    res.status(200).send("Data deleted successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});




// Show Form Data Access Route
app.post("/offlinediamond/upload", upload.single('screen_shot'), async (req, res) => {
  const { Id, amount } = req.body;

  try {
    // Check if a file was provided
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    // Access the Cloudinary URL from req.file
    const cloudinaryUrl = req.file.path;

    // Create a new user with the form data and Cloudinary URL
    const newUser = new User({
      Id: Id,
      amount: amount,
      screen_shot: cloudinaryUrl, // Use the Cloudinary URL directly
    });

    await newUser.save();

    // // Send SMS notification using Twilio
    // const ownerPhoneNumber = '+917357614721'; // Include the '+' and country code
    // const formattedOwnerPhoneNumber = `+${ownerPhoneNumber.substring(1)}`; // Format the phone number
    // const messageBody = `New user submitted: Id - ${Id}, Amount - ${amount}`;

    // console.log("Sending SMS to:", formattedOwnerPhoneNumber);

    // await client.messages.create({
    //   body: messageBody,
    //   from: twilioPhoneNumber,
    //   to: ownerPhoneNumber,
    // });

    res.redirect("/offlinediamond");
  } catch (err) {
    // Handle errors
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});



// Logout Route
app.get("/admin/logout", (req, res) => {
  req.session.isAdmin = false;
  res.redirect("/admin/login");
});



// Example error handling in your routes
app.get("/admin/dashboard", (req, res) => {
  try {
    if (req.session.isAdmin) {
      res.render("admin/listing/dashboard.ejs", { username: req.session.username });
    } else {
      res.status(403).send("Forbidden");
    }
  } catch (error) {
    // console.error(error);
    res.status(500).send("Internal Server Error");
  }
});




app.listen("8080", () => {
  console.log("server is listening to port 8080");
})
