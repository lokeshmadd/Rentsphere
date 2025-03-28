require('dotenv').config();
const { put } = require('@vercel/blob');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const storage = multer.memoryStorage(); // Store file in memory
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const PORT = 5000;


const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(cors());

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

/////////////////////////////////////////////////
// MongoDB Atlas Connection
/////////////////////////////////////////////////
const MONGO_URI  = 'mongodb+srv://lokeshcu48:dSzTjaEFdbORNcz0@rentsphere.jg4gk.mongodb.net/?retryWrites=true&w=majority&appName=Rentsphere';
mongoose.connect(MONGO_URI).then(() => console.log("✅ MongoDB Atlas Connected Successfully"))
.catch(err => console.error("❌ MongoDB Atlas Connection Error:", err));

/////////////////////////////////////////////////
// Razorpay Initialization (Replace with your keys)
/////////////////////////////////////////////////
const razorpay = new Razorpay({
  key_id: 'YOUR_KEY_ID',     // Replace with Razorpay Key ID
  key_secret: 'YOUR_KEY_SECRET'  // Replace with Razorpay Key Secret
});

// Signup Route
app.post("/signup", async (req, res) => {
    try {
        const { name, email, dateOfBirth, password } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: "Email already in use" 
            });
        }
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user
        const newUser = new User({ 
            name, 
            email, 
            dateOfBirth, 
            password: hashedPassword,
            profilePicture: '/uploads/default-profile.png' // Default profile picture
        });
        
        await newUser.save();
        
        res.json({ 
            success: true, 
            message: "Signup successful!",
            userId: newUser._id 
        });
    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Signup failed, try again later" 
        });
    }
});

app.put('/api/update-user', async (req, res) => {
  try {
      const token = req.cookies.token; // Get JWT token
      const secretKey = process.env.JWT_SECRET || 'sjdflkjkjk4jrlj234jrh23kh4kh23k4kl23hjjk234';

      if (!token) {
          return res.status(401).json({ success: false, message: 'Unauthorized: No token found' });
      }

      // Decode JWT token
      const decodedToken = jwt.verify(token, secretKey);
      const userId = decodedToken.userId;

      // Log incoming request body to check format
      console.log("Received body:", JSON.stringify(req.body, null, 2));

      // Extract name and email
      let { name, email } = req.body;

      if (!name && !email) {
          return res.status(400).json({ success: false, message: 'No data provided to update' });
      }

      // Regular Expressions for validation
      const nameRegex = /^(?![0-9])[a-zA-Z0-9 ]{3,30}$/; // Only letters & spaces, 3 to 30 chars
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // Standard email format

      // Validate Name
      if (name && (typeof name !== 'string' || !nameRegex.test(name))) {
          console.error("Invalid name format received:", name);
          return res.status(400).json({ success: false, message: 'Invalid name. Only letters & spaces (3-30 chars) allowed.' });
      }

      // Validate Email
      if (email && (typeof email !== 'string' || !emailRegex.test(email))) {
          console.error("Invalid email format received:", email);
          return res.status(400).json({ success: false, message: 'Invalid email format.' });
      }

      const updateFields = {};
      if (name) updateFields.name = name;
      if (email) updateFields.email = email;

      const updatedUser = await User.findByIdAndUpdate(
          userId,
          { $set: updateFields },
          { new: true, select: '-_id -password' }
      );

      if (!updatedUser) {
          return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.json({ success: true, user: updatedUser });

  } catch (error) {
      console.error('Update User Error:', error);
      res.status(500).json({ success: false, message: 'Error updating user details' });
  }
});






// Login Route
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: "Email and password are required" 
            });
        }
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ 
                success: false, 
                message: "User not found" 
            });
        }
        
        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid credentials" 
            });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id }, 
            process.env.JWT_SECRET || 'sjdflkjkjk4jrlj234jrh23kh4kh23k4kl23hjjk234', 
            { expiresIn: '1h' }
        );
        
        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
        res.json({ 
            success: true, 
            message: "Login successful", 
            token, 
            userId: user._id 
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Login failed, try again later" 
        });
    }
});

app.post('/api/logout', (req, res) => {
  try {
      // Clear the authentication token by setting an expired cookie
      res.cookie('token', '', {
          httpOnly: true,
          expires: new Date(0), // Expire immediately
          secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
          sameSite: 'Strict'
      });

      res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
      console.error('Logout Error:', error);
      res.status(500).json({ success: false, message: 'Error logging out' });
  }
});


// Get User Profile Route
// this one is working
app.get('/api/get-user', async (req, res) => {
  try {
      const token = req.cookies?.token; // Safe way to access cookies

      if (!token) {
          return res.status(401).json({ success: false, message: 'Token not found in cookies' });
      }

      const secretKey = process.env.JWT_SECRET || 'sjdflkjkjk4jrlj234jrh23kh4kh23k4kl23hjjk234';

      let decodedToken;
      try {
          decodedToken = jwt.verify(token, secretKey);
      } catch (error) {
          return res.status(403).json({ success: false, message: 'Invalid or expired token' });
      }

      const user = await User.findById(decodedToken.userId).select('-_id -password');
      if (!user) {
          return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.json({ success: true, user });
  } catch (error) {
      console.error('Get User Error:', error);
      res.status(500).json({ success: false, message: 'Error retrieving user profile' });
  }
});



// Update User Profile Route
app.put('/api/user/:userId', async (req, res) => {
    try {
        const { name, email, profilePicture } = req.body;
        
        const updatedUser = await User.findByIdAndUpdate(
            req.params.userId, 
            { name, email, profilePicture }, 
            { new: true, select: '-password' }
        );
        
        if (!updatedUser) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }
        
        res.json(updatedUser);
    } catch (error) {
        console.error("Update User Error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error updating user profile" 
        });
    }
});

// Profile Picture Upload Route
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, 'uploads/');
        },
        filename: (req, file, cb) => {
            cb(null, `${Date.now()}-${file.originalname}`);
        }
    }),
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.gif') {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'), false);
        }
    }
});

app.post('/api/upload', upload.single('profilePicture'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ 
            success: false, 
            message: "No file uploaded" 
        });
    }
    
    res.json({ 
        success: true, 
        filePath: `/uploads/${req.file.filename}` 
    });
});



/////////////////////////////////////////////////
// Multer Storage Config for File Uploads
/////////////////////////////////////////////////
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const uploadsDir = path.join(__dirname, 'uploads');
//     if (!fs.existsSync(uploadsDir)) {
//       fs.mkdirSync(uploadsDir, { recursive: true });
//     }
//     cb(null, uploadsDir);
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + '-' + file.originalname);
//   }
// });
// const upload = multer({ storage: storage });


/////////////////////////////////////////////////
// SCHEMAS & MODELS
/////////////////////////////////////////////////

// User Schema (from your first code)

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },  // ✅ Added password field
  profilePicture: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });
// const User = mongoose.model('User', userSchema);
const User = mongoose.models.User || mongoose.model("User", userSchema);


// Profile Schema (extra details)
const profileSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  username: String,
  email: String,
  phoneNumber: String,
  birthDate: String,
  gender: String
});
const Profile = mongoose.models.Profile || mongoose.model('Profile', profileSchema);


// Ad Schema
const adSchema = new mongoose.Schema({
  category: String,
  description: String,
  images: [String],
  brand: String,
  fuel_type: { type: String, default: 'Not provided' },
  title: { type: String, default: 'Not provided' },
  price: { type: Number, default: 0 },
  isRented: { type: Boolean, default: false },
  location: String,
});
// const Ad = mongoose.model('Ad', adSchema);
const Ad = mongoose.models.Ad || mongoose.model('Ad', adSchema);


// Cart Schema
const cartSchema = new mongoose.Schema({
  items: [{
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ad' },
    quantity: { type: Number, default: 1 }
  }]
});
// const Cart = mongoose.model('Cart', cartSchema);
const Cart = mongoose.models.Cart || mongoose.model('Cart', cartSchema);


/////////////////////////////////////////////////
// USER ROUTES
/////////////////////////////////////////////////

// Get user by ID
app.get('/api/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create user
app.post('/api/user', async (req, res) => {
  try {
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      profilePicture: req.body.profilePicture || ''
    });
    const newUser = await user.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update user
app.put('/api/user/:id', async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        email: req.body.email,
        profilePicture: req.body.profilePicture,
        updatedAt: Date.now()
      },
      { new: true }
    );
    if (!updatedUser) return res.status(404).json({ message: 'User not found' });
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Upload profile picture
// app.post('/api/upload', upload.single('profilePicture'), (req, res) => {
//   if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
//   const filePath = `/uploads/${req.file.filename}`;
//   res.json({ filePath });
// });

app.post("/api/upload", upload.single("profilePicture"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Upload file to Vercel Blob Storage
    const blob = await put(`ProfilePictures/${Date.now()}-${req.file.originalname}`, req.file.buffer, {
      access: "public", // Use "private" for restricted access
    });

    res.json({ success: true, filePath: blob.url });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ success: false, message: "File upload failed" });
  }
});

/////////////////////////////////////////////////
// PROFILE ROUTES
/////////////////////////////////////////////////

app.post('/api/profile', async (req, res) => {
  try {
    const newProfile = new Profile(req.body);
    await newProfile.save();
    res.status(201).json({ message: 'Profile saved successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error while saving profile' });
  }
});

app.get('/api/profile', async (req, res) => {
  try {
    const profiles = await Profile.find();
    res.status(200).json(profiles);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching profiles' });
  }
});

/////////////////////////////////////////////////
// AD ROUTES
/////////////////////////////////////////////////

app.get('/home', async (req, res) => {
  try {
    const searchQuery = req.query.query || '';
    const ads = await Ad.find({ title: { $regex: searchQuery, $options: 'i' } });
    res.json(ads);
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});

app.post("/post-ad", upload.array("images", 5), async (req, res) => {
  try {
    const { category, description, brand, fuel_type, title, price, location } = req.body;

    // Upload each image to Vercel Blob
    const images = await Promise.all(
      req.files.map(async (file) => {
        const blob = await put(`Images/${file.originalname}`, file.buffer, {
          access: "public", // or "private"
        });
        return blob.url; // Save Blob URL
      })
    );

    // Save ad with image URLs in MongoDB
    const newAd = new Ad({ category, description, images, brand, fuel_type, title, price, location });
    await newAd.save();

    res.json({ success: true, message: "Ad posted successfully", ad: newAd });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ success: false, message: "Error posting ad" });
  }
});

app.get('/get-ads', async (req, res) => {
  try {
    const ads = await Ad.find();
    res.json(ads);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching ads' });
  }
});

app.get('/get-ad/:id', async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.status(404).json({ message: 'Ad not found' });
    res.json(ad);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching ad' });
  }
});

app.post('/rent/:id', async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.status(404).json({ message: 'Ad not found' });
    if (ad.isRented) return res.status(400).json({ message: 'Item already rented' });
    ad.isRented = true;
    await ad.save();
    res.json({ message: 'Item rented successfully', ad });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

/////////////////////////////////////////////////
// CART ROUTES
/////////////////////////////////////////////////

app.post('/cart/add', async (req, res) => {
  try {
    const { itemId } = req.body;
    let cart = await Cart.findOne() || new Cart({ items: [] });

    const existingItem = cart.items.find(item => item.itemId.equals(itemId));
    if (existingItem) existingItem.quantity += 1;
    else cart.items.push({ itemId, quantity: 1 });

    await cart.save();
    res.json({ message: 'Item added to cart!', cart });
  } catch (error) {
    res.status(500).json({ message: 'Error adding to cart' });
  }
});

app.get('/cart', async (req, res) => {
  try {
    const cart = await Cart.findOne().populate('items.itemId');
    if (!cart) return res.json({ message: 'Cart is empty' });
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cart' });
  }
});

app.post('/cart/remove', async (req, res) => {
  try {
    const { itemId } = req.body;
    const cart = await Cart.findOne();
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const prevLength = cart.items.length;
    cart.items = cart.items.filter(item => item.itemId.toString() !== itemId);

    if (cart.items.length === prevLength) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    await cart.save();
    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing item' });
  }
});

app.post('/cart/checkout', async (req, res) => {
  try {
    await Cart.deleteMany();
    res.json({ message: 'Checkout successful! Cart cleared.' });
  } catch (error) {
    res.status(500).json({ message: 'Checkout failed!' });
  }
});

/////////////////////////////////////////////////
// RAZORPAY PAYMENT ROUTES
/////////////////////////////////////////////////

app.post('/create-order', async (req, res) => {
  try {
    const { amount } = req.body;

    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    res.json({ success: true, order_id: order.id, amount: order.amount, currency: order.currency });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to create order' });
  }
});

app.post('/verify-payment', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  try {
    const generated_signature = crypto.createHmac('sha256', razorpay.key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Payment verification failed' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

/////////////////////////////////////////////////
// DEFAULT ROUTE
/////////////////////////////////////////////////

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "home.html")); // Change from index.html to home.html
});
/////////////////////////////////////////////////
// START SERVER
/////////////////////////////////////////////////

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
