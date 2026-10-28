import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Users ─────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Demo@1234', 10);

  await prisma.user.upsert({
    where: { email: 'admin@canteen.demo' },
    update: {},
    create: { name: 'Admin User', email: 'admin@canteen.demo', passwordHash, role: 'ADMIN', phone: '9000000001' },
  });
  await prisma.user.upsert({
    where: { email: 'staff@canteen.demo' },
    update: {},
    create: { name: 'Staff Member', email: 'staff@canteen.demo', passwordHash, role: 'STAFF', phone: '9000000002' },
  });
  await prisma.user.upsert({
    where: { email: 'student@canteen.demo' },
    update: {},
    create: { name: 'Aarav Singh', email: 'student@canteen.demo', passwordHash, role: 'STUDENT', phone: '9000000003' },
  });
  await prisma.user.upsert({
    where: { email: 'priya@canteen.demo' },
    update: {},
    create: { name: 'Priya Sharma', email: 'priya@canteen.demo', passwordHash, role: 'STUDENT', phone: '9000000004' },
  });
  console.log('  ✅ Users seeded');

  // ── Categories ─────────────────────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.menuCategory.upsert({ where: { name: 'Breakfast' }, update: {}, create: { name: 'Breakfast', description: 'Morning meals to start your day', sortOrder: 1 } }),
    prisma.menuCategory.upsert({ where: { name: 'Main Course' }, update: {}, create: { name: 'Main Course', description: 'Hearty meals for lunch and dinner', sortOrder: 2 } }),
    prisma.menuCategory.upsert({ where: { name: 'Snacks' }, update: {}, create: { name: 'Snacks', description: 'Light bites and quick eats', sortOrder: 3 } }),
    prisma.menuCategory.upsert({ where: { name: 'Beverages' }, update: {}, create: { name: 'Beverages', description: 'Hot and cold drinks', sortOrder: 4 } }),
    prisma.menuCategory.upsert({ where: { name: 'Desserts' }, update: {}, create: { name: 'Desserts', description: 'Sweet treats', sortOrder: 5 } }),
  ]);
  const [breakfast, mainCourse, snacks, beverages, desserts] = categories;
  console.log('  ✅ Categories seeded');

  // ── Menu Items ─────────────────────────────────────────────────────────────
  const menuItems = [
    // Breakfast
    {
      name: 'Masala Dosa',
      description: 'Crispy rice crepe with spiced potato filling, served with sambar and chutneys',
      price: 45,
      categoryId: breakfast.id,
      imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80',
      isVegetarian: true,
      stockQuantity: 50,
      preparationMins: 10,
      sortOrder: 1,
    },
    {
      name: 'Idli Sambar',
      description: '3 soft steamed rice cakes with sambar and coconut chutney',
      price: 35,
      categoryId: breakfast.id,
      imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
      isVegetarian: true,
      stockQuantity: 60,
      preparationMins: 8,
      sortOrder: 2,
    },
    {
      name: 'Poha',
      description: 'Flattened rice with mustard seeds, turmeric, onion, and fresh coriander',
      price: 30,
      categoryId: breakfast.id,
      imageUrl: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=600&auto=format&fit=crop&q=80',
      isVegetarian: true,
      stockQuantity: 40,
      preparationMins: 7,
      sortOrder: 3,
    },
    {
      name: 'Bread Omelette',
      description: 'Two-egg omelette with vegetables and toasted bread',
      price: 40,
      categoryId: breakfast.id,
      imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80',
      isVegetarian: false,
      stockQuantity: 30,
      preparationMins: 8,
      sortOrder: 4,
    },
    {
      name: 'Upma',
      description: 'Semolina cooked with vegetables and spices',
      price: 28,
      categoryId: breakfast.id,
      imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80',
      isVegetarian: true,
      stockQuantity: 45,
      preparationMins: 8,
      sortOrder: 5,
    },
    // Main Course
    {
      name: 'Veg Thali',
      description: 'Complete meal: rice, 2 rotis, dal, sabzi, raita, and pickle',
      price: 80,
      categoryId: mainCourse.id,
      imageUrl: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=600&auto=format&fit=crop&q=80',
      isVegetarian: true,
      stockQuantity: 40,
      preparationMins: 15,
      sortOrder: 1,
    },
    {
      name: 'Chicken Biryani',
      description: 'Aromatic basmati rice cooked with tender chicken pieces and whole spices',
      price: 110,
      categoryId: mainCourse.id,
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
      isVegetarian: false,
      stockQuantity: 35,
      preparationMins: 20,
      sortOrder: 2,
    },
    {
      name: 'Paneer Butter Masala + Roti',
      description: 'Rich tomato-cream based paneer curry served with 3 rotis',
      price: 90,
      categoryId: mainCourse.id,
      imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80',
      isVegetarian: true,
      stockQuantity: 30,
      preparationMins: 12,
      sortOrder: 3,
    },
    {
      name: 'Dal Rice',
      description: 'Comforting yellow dal with steamed basmati rice and papad',
      price: 60,
      categoryId: mainCourse.id,
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
      isVegetarian: true,
      stockQuantity: 50,
      preparationMins: 10,
      sortOrder: 4,
    },
    {
      name: 'Egg Fried Rice',
      description: 'Indo-Chinese style fried rice with egg, vegetables and soy sauce',
      price: 75,
      categoryId: mainCourse.id,
      imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80',
      isVegetarian: false,
      stockQuantity: 40,
      preparationMins: 15,
      sortOrder: 5,
    },
    {
      name: 'Chole Bhature',
      description: 'Spicy chickpea curry with 2 deep-fried fluffy bread',
      price: 70,
      categoryId: mainCourse.id,
      imageUrl: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=600&auto=format&fit=crop&q=80',
      isVegetarian: true,
      stockQuantity: 25,
      preparationMins: 12,
      sortOrder: 6,
    },
    // Snacks
    {
      name: 'Samosa (2 pcs)',
      description: 'Crispy pastry filled with spiced potatoes and peas',
      price: 20,
      categoryId: snacks.id,
      imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
      isVegetarian: true,
      stockQuantity: 80,
      preparationMins: 5,
      sortOrder: 1,
    },
    {
      name: 'Veg Puff',
      description: 'Flaky pastry with mixed vegetable filling',
      price: 18,
      categoryId: snacks.id,
      imageUrl: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&auto=format&fit=crop&q=80',
      isVegetarian: true,
      stockQuantity: 60,
      preparationMins: 5,
      sortOrder: 2,
    },
    {
      name: 'Bread Pakora',
      description: 'Batter-fried bread stuffed with spiced potato filling',
      price: 25,
      categoryId: snacks.id,
      imageUrl: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80',
      isVegetarian: true,
      stockQuantity: 50,
      preparationMins: 7,
      sortOrder: 3,
    },
    {
      name: 'Maggi Noodles',
      description: 'Classic quick noodles with masala, topped with vegetables',
      price: 30,
      categoryId: snacks.id,
      imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80',
      isVegetarian: true,
      stockQuantity: 40,
      preparationMins: 8,
      sortOrder: 4,
    },
    {
      name: 'French Fries',
      description: 'Crispy golden fries served with ketchup',
      price: 35,
      categoryId: snacks.id,
      imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80',
      isVegetarian: true,
      stockQuantity: 45,
      preparationMins: 8,
      sortOrder: 5,
    },
    // Beverages
    {
      name: 'Masala Chai',
      description: 'Aromatic Indian spiced tea with ginger and cardamom',
      price: 15,
      categoryId: beverages.id,
      imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
      isVegetarian: true,
      stockQuantity: 100,
      preparationMins: 5,
      sortOrder: 1,
    },
    {
      name: 'Filter Coffee',
      description: 'South Indian style strong decoction coffee with milk',
      price: 18,
      categoryId: beverages.id,
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
      isVegetarian: true,
      stockQuantity: 100,
      preparationMins: 5,
      sortOrder: 2,
    },
    {
      name: 'Fresh Lime Soda',
      description: 'Refreshing lime juice with soda, sweet or salted',
      price: 25,
      categoryId: beverages.id,
      imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
      isVegetarian: true,
      stockQuantity: 80,
      preparationMins: 3,
      sortOrder: 3,
    },
    {
      name: 'Mango Lassi',
      description: 'Thick and creamy yogurt drink blended with alphonso mangoes',
      price: 40,
      categoryId: beverages.id,
      imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=600&auto=format&fit=crop&q=80',
      isVegetarian: true,
      stockQuantity: 60,
      preparationMins: 5,
      sortOrder: 4,
    },
    {
      name: 'Cold Coffee',
      description: 'Chilled blended coffee with ice cream and milk',
      price: 45,
      categoryId: beverages.id,
      imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&auto=format&fit=crop&q=80',
      isVegetarian: true,
      stockQuantity: 50,
      preparationMins: 7,
      sortOrder: 5,
    },
    {
      name: 'Bottled Water (500ml)',
      description: 'Packaged drinking water',
      price: 20,
      categoryId: beverages.id,
      imageUrl: 'https://images.unsplash.com/photo-1560023907-5f339617ea30?w=600&auto=format&fit=crop&q=80',
      isVegetarian: true,
      stockQuantity: 200,
      preparationMins: 1,
      sortOrder: 6,
    },
    // Desserts
    {
      name: 'Gulab Jamun (2 pcs)',
      description: 'Soft milk-solid dumplings soaked in rose-flavored sugar syrup',
      price: 30,
      categoryId: desserts.id,
      imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&auto=format&fit=crop&q=80',
      isVegetarian: true,
      stockQuantity: 50,
      preparationMins: 3,
      sortOrder: 1,
    },
    {
      name: 'Kheer',
      description: 'Creamy rice pudding with cardamom, saffron, and dry fruits',
      price: 35,
      categoryId: desserts.id,
      imageUrl: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=600&auto=format&fit=crop&q=80',
      isVegetarian: true,
      stockQuantity: 40,
      preparationMins: 3,
      sortOrder: 2,
    },
    {
      name: 'Ice Cream (Vanilla/Chocolate)',
      description: 'Single scoop of your choice',
      price: 30,
      categoryId: desserts.id,
      imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&auto=format&fit=crop&q=80',
      isVegetarian: true,
      stockQuantity: 60,
      preparationMins: 2,
      sortOrder: 3,
    },
  ];

  for (const item of menuItems) {
    const existing = await prisma.menuItem.findFirst({ where: { name: item.name } });
    if (!existing) {
      await prisma.menuItem.create({ data: item });
    } else {
      await prisma.menuItem.update({ where: { id: existing.id }, data: item });
    }
  }
  console.log('  ✅ Menu items seeded');

  // ── Pickup Slots ──────────────────────────────────────────────────────────
  const slots = [
    { label: '8:00 AM - 8:30 AM', startTime: '08:00', endTime: '08:30', maxOrders: 15 },
    { label: '9:00 AM - 9:30 AM', startTime: '09:00', endTime: '09:30', maxOrders: 15 },
    { label: '10:00 AM - 10:30 AM', startTime: '10:00', endTime: '10:30', maxOrders: 10 },
    { label: '12:00 PM - 12:30 PM', startTime: '12:00', endTime: '12:30', maxOrders: 20 },
    { label: '12:30 PM - 1:00 PM', startTime: '12:30', endTime: '13:00', maxOrders: 20 },
    { label: '1:00 PM - 1:30 PM', startTime: '13:00', endTime: '13:30', maxOrders: 20 },
    { label: '2:00 PM - 2:30 PM', startTime: '14:00', endTime: '14:30', maxOrders: 10 },
    { label: '4:00 PM - 4:30 PM', startTime: '16:00', endTime: '16:30', maxOrders: 15 },
    { label: '5:00 PM - 5:30 PM', startTime: '17:00', endTime: '17:30', maxOrders: 15 },
  ];

  for (const slot of slots) {
    const existing = await prisma.pickupSlot.findFirst({ where: { label: slot.label } });
    if (!existing) {
      await prisma.pickupSlot.create({ data: slot });
    }
  }
  console.log('  ✅ Pickup slots seeded');

  console.log('\n✅ Database seeded successfully!');
  console.log('\n📋 Demo Accounts:');
  console.log('  👑 Admin:   admin@canteen.demo   / Demo@1234');
  console.log('  👷 Staff:   staff@canteen.demo   / Demo@1234');
  console.log('  🎓 Student: student@canteen.demo / Demo@1234');
}

main()
  .catch((e) => { console.error('Seed error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
