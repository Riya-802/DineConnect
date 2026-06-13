import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Restaurant from './src/models/Restaurant.js';
import User from './src/models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dineconnect';

const restaurantsData = [
  {
    name: 'The Spice Symphony',
    description: 'Authentic Indian cuisine with a modern twist, featuring vibrant flavors and rich curries.',
    cuisineTypes: ['Indian', 'Healthy'],
    address: { street: '123 MG Road', city: 'Mumbai', lat: 19.0760, lng: 72.8777 },
    coverImage: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=800',
    avgRating: 4.8,
    totalRatings: 320,
    estimatedDeliveryTime: 35,
    minOrderAmount: 200,
  },
  {
    name: 'Dragon Wok',
    description: 'Fresh and fiery Chinese delicacies cooked to perfection in traditional woks.',
    cuisineTypes: ['Chinese'],
    address: { street: '45 Linking Road', city: 'Mumbai', lat: 19.0645, lng: 72.8360 },
    coverImage: 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&q=80&w=800',
    avgRating: 4.5,
    totalRatings: 185,
    estimatedDeliveryTime: 25,
    minOrderAmount: 150,
  },
  {
    name: 'Luigi\'s Pizzeria',
    description: 'Hand-tossed, wood-fired pizzas and homemade pasta, bringing a slice of Italy to your table.',
    cuisineTypes: ['Italian', 'Desserts'],
    address: { street: '88 Juhu Tara Road', city: 'Mumbai', lat: 19.1045, lng: 72.8273 },
    coverImage: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&q=80&w=800',
    avgRating: 4.9,
    totalRatings: 540,
    estimatedDeliveryTime: 45,
    minOrderAmount: 400,
  },
  {
    name: 'Sakura Sushi House',
    description: 'Premium sushi, sashimi, and Japanese street food made from the freshest ingredients.',
    cuisineTypes: ['Japanese', 'Healthy'],
    address: { street: 'Bandra Kurla Complex', city: 'Mumbai', lat: 19.0658, lng: 72.8631 },
    coverImage: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=800',
    avgRating: 4.7,
    totalRatings: 210,
    estimatedDeliveryTime: 50,
    minOrderAmount: 600,
  },
  {
    name: 'El Camino Tacos',
    description: 'Authentic Mexican street food, featuring loaded nachos, zesty burritos, and killer tacos.',
    cuisineTypes: ['Mexican'],
    address: { street: 'Colaba Causeway', city: 'Mumbai', lat: 18.9163, lng: 72.8197 },
    coverImage: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&q=80&w=800',
    avgRating: 4.6,
    totalRatings: 150,
    estimatedDeliveryTime: 30,
    minOrderAmount: 250,
  },
  {
    name: 'Smash Burger Bar',
    description: 'Juicy, cheesy smash burgers with crispy fries and thick milkshakes.',
    cuisineTypes: ['Burgers', 'Desserts'],
    address: { street: 'Andheri West', city: 'Mumbai', lat: 19.1363, lng: 72.8277 },
    coverImage: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800',
    avgRating: 4.4,
    totalRatings: 420,
    estimatedDeliveryTime: 20,
    minOrderAmount: 200,
  }
];

const seedDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    // Check if a dummy owner exists, otherwise create one
    let owner = await User.findOne({ email: 'owner@dineconnect.com' });
    if (!owner) {
      owner = new User({
        name: 'Master Chef',
        email: 'owner@dineconnect.com',
        phone: '1234567890',
        passwordHash: 'dummyhash',
        role: 'owner',
        isVerified: true
      });
      await owner.save();
      console.log('Dummy owner created.');
    }

    console.log('Clearing old restaurants...');
    await Restaurant.deleteMany({});

    console.log('Seeding new restaurants...');
    const defaultHours = [
      { day: 'Monday', open: '09:00', close: '22:00' },
      { day: 'Tuesday', open: '09:00', close: '22:00' },
      { day: 'Wednesday', open: '09:00', close: '22:00' },
      { day: 'Thursday', open: '09:00', close: '22:00' },
      { day: 'Friday', open: '09:00', close: '23:00' },
      { day: 'Saturday', open: '10:00', close: '23:00' },
      { day: 'Sunday', open: '10:00', close: '21:00' },
    ];

    const seededData = restaurantsData.map(r => ({
      ...r,
      ownerId: owner._id,
      openingHours: defaultHours
    }));

    await Restaurant.insertMany(seededData);
    console.log(`Successfully seeded ${seededData.length} restaurants!`);

    mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding DB:', error);
    mongoose.disconnect();
  }
};

seedDB();
