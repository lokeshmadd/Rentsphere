const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

/////////////////////////////////////////////////
// MongoDB Connection
/////////////////////////////////////////////////
mongoose.connect('mongodb://127.0.0.1:27017/rentsphere', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB Connected Successfully"))
.catch(err => console.error("❌ MongoDB Connection Error:", err));

/////////////////////////////////////////////////
// Razorpay Initialization (Replace with your keys)
/////////////////////////////////////////////////
const razorpay = new Razorpay({
  key_id: 'YOUR_KEY_ID',     // Replace with Razorpay Key ID
  key_secret: 'YOUR_KEY_SECRET'  // Replace with Razorpay Key Secret
});

/////////////////////////////////////////////////
// Multer Storage Config for File Uploads
/////////////////////////////////////////////////
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

/////////////////////////////////////////////////
// SCHEMAS & MODELS
/////////////////////////////////////////////////

// User Schema (from your first code)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  profilePicture: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

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
const Profile = mongoose.model('Profile', profileSchema);

// Ad Schema
const adSchema = new mongoose.Schema({
  category: String,
  description: String,
  images: [String],
  brand: String,
  fuel_type: { type: String, default: 'Not provided' },
  title: { type: String, default: 'Not provided' },
  price: { type: Number, default: 0 },
  isRented: { type: Boolean, default: false }
});
const Ad = mongoose.model('Ad', adSchema);

// Cart Schema
const cartSchema = new mongoose.Schema({
  items: [{
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ad' },
    quantity: { type: Number, default: 1 }
  }]
});
const Cart = mongoose.model('Cart', cartSchema);

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
app.post('/api/upload', upload.single('profilePicture'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const filePath = `/uploads/${req.file.filename}`;
  res.json({ filePath });
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

app.post('/post-ad', upload.array('images', 5), async (req, res) => {
  try {
    const { category, description, brand, fuel_type, title, price } = req.body;
    const images = req.files.map(file => file.filename);
    const newAd = new Ad({ category, description, images, brand, fuel_type, title, price });
    await newAd.save();
    res.json({ success: true, message: 'Ad posted successfully', ad: newAd });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error posting ad' });
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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

/////////////////////////////////////////////////
// START SERVER
/////////////////////////////////////////////////

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
