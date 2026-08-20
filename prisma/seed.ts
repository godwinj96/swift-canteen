import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = "Admin123!";
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@swiftcanteen.dev" },
    update: {},
    create: {
      fullName: "Canteen Admin",
      email: "admin@swiftcanteen.dev",
      passwordHash: adminPasswordHash,
      role: "SUPERUSER",
    },
  });

  const categories = await Promise.all(
    [
      { name: "Meals", description: "Hearty mains to fuel your day" },
      { name: "Snacks", description: "Quick bites between classes" },
      { name: "Drinks", description: "Cold and hot beverages" },
      { name: "Desserts", description: "Something sweet to finish" },
    ].map((c) =>
      prisma.category.upsert({
        where: { id: c.name },
        update: {},
        create: { id: c.name, ...c },
      })
    )
  );

  const [meals, snacks, drinks, desserts] = categories;

  const items = [
    {
      categoryId: meals.id,
      name: "Jollof Rice & Chicken",
      description: "Classic jollof with grilled chicken",
      price: 2500,
      imageUrl: "/images/menu/jollof-rice.jpg",
    },
    {
      categoryId: meals.id,
      name: "Fried Rice & Beef",
      description: "Fried rice with seasoned beef",
      price: 2500,
      imageUrl: "/images/menu/fried-rice-beef.jpg",
    },
    {
      categoryId: meals.id,
      name: "Vegetable Stew & Rice",
      description: "Rich vegetable stew over white rice",
      price: 2000,
      imageUrl: "/images/menu/vegetable-stew.jpg",
    },
    {
      categoryId: snacks.id,
      name: "Meat Pie",
      description: "Flaky pastry with spiced minced meat",
      price: 800,
      imageUrl: "/images/menu/meat-pie.jpg",
    },
    {
      categoryId: snacks.id,
      name: "Puff Puff (6pc)",
      description: "Sweet fried dough balls",
      price: 600,
      imageUrl: "/images/menu/puff-puff.jpg",
    },
    {
      categoryId: snacks.id,
      name: "Samosa (4pc)",
      description: "Crispy vegetable samosas",
      price: 900,
      imageUrl: "/images/menu/samosa.jpg",
    },
    {
      categoryId: drinks.id,
      name: "Chapman",
      description: "Refreshing house cocktail (non-alcoholic)",
      price: 1200,
      imageUrl: "/images/menu/chapman.jpg",
    },
    {
      categoryId: drinks.id,
      name: "Zobo",
      description: "Hibiscus iced tea",
      price: 700,
      imageUrl: "/images/menu/zobo.jpg",
    },
    {
      categoryId: drinks.id,
      name: "Bottled Water",
      description: "500ml still water",
      price: 300,
      imageUrl: null,
    },
    {
      categoryId: desserts.id,
      name: "Chin Chin",
      description: "Crunchy sweet fried snack",
      price: 500,
      imageUrl: "/images/menu/chin-chin.jpg",
    },
  ];

  for (const item of items) {
    const existing = await prisma.menuItem.findFirst({ where: { name: item.name } });
    if (existing) {
      await prisma.menuItem.update({ where: { id: existing.id }, data: item });
    } else {
      await prisma.menuItem.create({ data: item });
    }
  }

  console.log("Seed complete.");
  console.log(`Admin login -> email: ${admin.email}  password: ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
