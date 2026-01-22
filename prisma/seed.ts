import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper to generate dates
function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function main() {
  console.log("🌱 Seeding database with Carsa mock data...");

  // Clear existing data
  await prisma.message.deleteMany();
  await prisma.complaintAction.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();

  // Create customers with realistic scenarios
  const customers = await Promise.all([
    // Customer 1: Missing accessories (AI-resolvable)
    prisma.customer.create({
      data: {
        name: "James Wilson",
        email: "james.wilson@email.com",
        phone: "07700 900123",
        orders: {
          create: {
            orderNumber: "ORD-2024-00001",
            vehicleReg: "YN23 XYZ",
            vehicleMake: "BMW",
            vehicleModel: "3 Series",
            vehicleYear: 2022,
            purchaseDate: daysAgo(21),
            purchasePrice: 24995,
            depositPaid: 500,
            financeAmount: 24495,
            deliveryDate: daysAgo(14),
            deliveryAddress: "42 Oak Street, Manchester, M1 2AB",
            deliveryStatus: "DELIVERED",
            warrantyExpiry: daysFromNow(76), // 90 days from purchase
            warrantyType: "STANDARD_90",
            accessories: JSON.stringify(["charging_cable", "floor_mats"]),
            accessoriesDelivered: false,
          },
        },
      },
    }),

    // Customer 2: Delivery in transit
    prisma.customer.create({
      data: {
        name: "Sarah Chen",
        email: "sarah.chen@email.com",
        phone: "07700 900456",
        orders: {
          create: {
            orderNumber: "ORD-2024-00002",
            vehicleReg: "WR24 ABC",
            vehicleMake: "Mercedes-Benz",
            vehicleModel: "A-Class",
            vehicleYear: 2023,
            purchaseDate: daysAgo(7),
            purchasePrice: 28500,
            depositPaid: 1000,
            financeAmount: 27500,
            deliveryDate: daysFromNow(3),
            deliveryAddress: "15 Elm Road, Southampton, SO14 5GH",
            deliveryStatus: "IN_TRANSIT",
            warrantyExpiry: daysFromNow(83),
            warrantyType: "CARSA_COVER_12",
            accessories: JSON.stringify(["cleaning_kit"]),
            accessoriesDelivered: false,
          },
        },
      },
    }),

    // Customer 3: Vehicle defect (escalation scenario)
    prisma.customer.create({
      data: {
        name: "Michael Brown",
        email: "michael.brown@email.com",
        phone: "07700 900789",
        orders: {
          create: {
            orderNumber: "ORD-2024-00003",
            vehicleReg: "AB12 CDE",
            vehicleMake: "Audi",
            vehicleModel: "A4",
            vehicleYear: 2021,
            purchaseDate: daysAgo(30),
            purchasePrice: 22000,
            depositPaid: 2000,
            financeAmount: 20000,
            deliveryDate: daysAgo(25),
            deliveryAddress: "8 Park Lane, Bolton, BL1 2RQ",
            deliveryStatus: "DELIVERED",
            warrantyExpiry: daysFromNow(60),
            warrantyType: "STANDARD_90",
            accessories: JSON.stringify([]),
            accessoriesDelivered: true,
          },
        },
      },
    }),

    // Customer 4: Refund request (under limit)
    prisma.customer.create({
      data: {
        name: "Emma Thompson",
        email: "emma.thompson@email.com",
        phone: "07700 900234",
        orders: {
          create: {
            orderNumber: "ORD-2024-00004",
            vehicleReg: "FG67 HIJ",
            vehicleMake: "Volkswagen",
            vehicleModel: "Golf",
            vehicleYear: 2022,
            purchaseDate: daysAgo(45),
            purchasePrice: 19500,
            depositPaid: 500,
            financeAmount: 19000,
            deliveryDate: daysAgo(40),
            deliveryAddress: "27 High Street, Durham, DH1 3AP",
            deliveryStatus: "DELIVERED",
            warrantyExpiry: daysFromNow(45),
            warrantyType: "STANDARD_90",
            accessories: JSON.stringify(["cleaning_kit", "floor_mats"]),
            accessoriesDelivered: false,
          },
        },
      },
    }),

    // Customer 5: Repeat complainant (escalation scenario)
    prisma.customer.create({
      data: {
        name: "David Miller",
        email: "david.miller@email.com",
        phone: "07700 900567",
        orders: {
          create: {
            orderNumber: "ORD-2024-00005",
            vehicleReg: "KL34 MNO",
            vehicleMake: "Ford",
            vehicleModel: "Focus",
            vehicleYear: 2021,
            purchaseDate: daysAgo(60),
            purchasePrice: 14995,
            depositPaid: 500,
            financeAmount: 14495,
            deliveryDate: daysAgo(55),
            deliveryAddress: "3 River Close, Shrewsbury, SY1 2JP",
            deliveryStatus: "DELIVERED",
            warrantyExpiry: daysFromNow(30),
            warrantyType: "STANDARD_90",
            accessories: JSON.stringify(["charging_cable"]),
            accessoriesDelivered: true,
          },
        },
      },
    }),

    // Customer 6: Admin/finance issue
    prisma.customer.create({
      data: {
        name: "Lisa Anderson",
        email: "lisa.anderson@email.com",
        phone: "07700 900890",
        orders: {
          create: {
            orderNumber: "ORD-2024-00006",
            vehicleReg: "PQ56 RST",
            vehicleMake: "Toyota",
            vehicleModel: "Yaris",
            vehicleYear: 2023,
            purchaseDate: daysAgo(35),
            purchasePrice: 16500,
            depositPaid: 1500,
            financeAmount: 15000,
            deliveryDate: daysAgo(30),
            deliveryAddress: "91 Queens Road, Portsmouth, PO2 7NG",
            deliveryStatus: "DELIVERED",
            warrantyExpiry: daysFromNow(55),
            warrantyType: "CARSA_COVER_24",
            accessories: JSON.stringify([]),
            accessoriesDelivered: true,
          },
        },
      },
    }),

    // Customer 7: Pending delivery
    prisma.customer.create({
      data: {
        name: "Robert Taylor",
        email: "robert.taylor@email.com",
        phone: "07700 900321",
        orders: {
          create: {
            orderNumber: "ORD-2024-00007",
            vehicleReg: "UV78 WXY",
            vehicleMake: "Nissan",
            vehicleModel: "Qashqai",
            vehicleYear: 2022,
            purchaseDate: daysAgo(5),
            purchasePrice: 21000,
            depositPaid: 2000,
            financeAmount: 19000,
            deliveryDate: null,
            deliveryAddress: "55 Castle View, Gloucester, GL1 2JK",
            deliveryStatus: "PREPARING",
            warrantyExpiry: daysFromNow(85),
            warrantyType: "STANDARD_90",
            accessories: JSON.stringify(["floor_mats", "cleaning_kit"]),
            accessoriesDelivered: false,
          },
        },
      },
    }),

    // Customer 8: High value vehicle (escalation for large refunds)
    prisma.customer.create({
      data: {
        name: "Jennifer White",
        email: "jennifer.white@email.com",
        phone: "07700 900654",
        orders: {
          create: {
            orderNumber: "ORD-2024-00008",
            vehicleReg: "ZA89 BCD",
            vehicleMake: "BMW",
            vehicleModel: "X5",
            vehicleYear: 2023,
            purchaseDate: daysAgo(20),
            purchasePrice: 45000,
            depositPaid: 5000,
            financeAmount: 40000,
            deliveryDate: daysAgo(15),
            deliveryAddress: "12 Manor Drive, Bradford, BD1 5TH",
            deliveryStatus: "DELIVERED",
            warrantyExpiry: daysFromNow(70),
            warrantyType: "CARSA_COVER_48",
            accessories: JSON.stringify(["charging_cable", "cleaning_kit", "floor_mats"]),
            accessoriesDelivered: true,
          },
        },
      },
    }),

    // Customer 9: Warranty query
    prisma.customer.create({
      data: {
        name: "Thomas Harris",
        email: "thomas.harris@email.com",
        phone: "07700 900987",
        orders: {
          create: {
            orderNumber: "ORD-2024-00009",
            vehicleReg: "EF12 GHI",
            vehicleMake: "Honda",
            vehicleModel: "Civic",
            vehicleYear: 2022,
            purchaseDate: daysAgo(80),
            purchasePrice: 18000,
            depositPaid: 1000,
            financeAmount: 17000,
            deliveryDate: daysAgo(75),
            deliveryAddress: "7 Mill Lane, Halesowen, B63 3JQ",
            deliveryStatus: "DELIVERED",
            warrantyExpiry: daysFromNow(10), // Warranty almost expired
            warrantyType: "STANDARD_90",
            accessories: JSON.stringify([]),
            accessoriesDelivered: true,
          },
        },
      },
    }),

    // Customer 10: New customer, no issues yet
    prisma.customer.create({
      data: {
        name: "Sophie Clark",
        email: "sophie.clark@email.com",
        phone: "07700 900111",
        orders: {
          create: {
            orderNumber: "ORD-2024-00010",
            vehicleReg: "JK34 LMN",
            vehicleMake: "Mini",
            vehicleModel: "Cooper",
            vehicleYear: 2023,
            purchaseDate: daysAgo(3),
            purchasePrice: 22500,
            depositPaid: 2500,
            financeAmount: 20000,
            deliveryDate: daysAgo(1),
            deliveryAddress: "29 Station Road, Cannock, WS11 1AB",
            deliveryStatus: "DELIVERED",
            warrantyExpiry: daysFromNow(87),
            warrantyType: "CARSA_COVER_12",
            accessories: JSON.stringify(["charging_cable"]),
            accessoriesDelivered: true,
          },
        },
      },
    }),
  ]);

  console.log(`✅ Created ${customers.length} customers with orders`);

  // Create some existing complaints for David Miller (repeat complainant)
  const davidMiller = customers[4];
  const davidOrder = await prisma.order.findFirst({
    where: { customerId: davidMiller.id },
  });

  if (davidOrder) {
    await Promise.all([
      prisma.complaint.create({
        data: {
          referenceNumber: "CMP-2024-00001",
          customerId: davidMiller.id,
          orderId: davidOrder.id,
          category: "DELIVERY",
          status: "RESOLVED",
          priority: "NORMAL",
          aiHandled: true,
          aiResolution: "Provided delivery status update",
          aiConfidence: 0.95,
          resolvedAt: daysAgo(50),
          resolutionType: "INFORMATION",
          createdAt: daysAgo(52),
        },
      }),
      prisma.complaint.create({
        data: {
          referenceNumber: "CMP-2024-00002",
          customerId: davidMiller.id,
          orderId: davidOrder.id,
          category: "MISSING_ITEMS",
          status: "RESOLVED",
          priority: "NORMAL",
          aiHandled: true,
          aiResolution: "Reshipped charging cable",
          aiConfidence: 0.92,
          resolvedAt: daysAgo(40),
          resolutionType: "REPLACEMENT",
          createdAt: daysAgo(45),
        },
      }),
      prisma.complaint.create({
        data: {
          referenceNumber: "CMP-2024-00003",
          customerId: davidMiller.id,
          orderId: davidOrder.id,
          category: "VEHICLE_CONDITION",
          status: "RESOLVED",
          priority: "HIGH",
          aiHandled: false,
          escalatedReason: "Repeat complainant - 3rd complaint",
          resolvedAt: daysAgo(20),
          resolutionType: "REPAIR",
          resolutionNotes: "Minor scratch repaired at no cost",
          createdAt: daysAgo(30),
        },
      }),
    ]);

    console.log("✅ Created 3 historical complaints for David Miller");
  }

  // Create a sample resolved complaint with conversation
  const jamesWilson = customers[0];
  const jamesOrder = await prisma.order.findFirst({
    where: { customerId: jamesWilson.id },
  });

  if (jamesOrder) {
    const sampleComplaint = await prisma.complaint.create({
      data: {
        referenceNumber: "CMP-2024-00004",
        customerId: jamesWilson.id,
        orderId: jamesOrder.id,
        category: "DELIVERY",
        status: "RESOLVED",
        priority: "NORMAL",
        aiHandled: true,
        aiResolution: "Provided delivery tracking information",
        aiConfidence: 0.97,
        resolvedAt: daysAgo(10),
        resolutionType: "INFORMATION",
        csatScore: 5,
        csatFeedback: "Very helpful, got my answer quickly!",
        createdAt: daysAgo(12),
      },
    });

    // Create conversation for this complaint
    const conversation = await prisma.conversation.create({
      data: {
        customerId: jamesWilson.id,
        complaintId: sampleComplaint.id,
        channel: "WEBCHAT",
        status: "CLOSED",
        startedAt: daysAgo(12),
        endedAt: daysAgo(12),
      },
    });

    await prisma.message.createMany({
      data: [
        {
          conversationId: conversation.id,
          role: "ASSISTANT",
          content:
            "Hello! I'm Carsa's customer support assistant. How can I help you today?",
          createdAt: daysAgo(12),
        },
        {
          conversationId: conversation.id,
          role: "USER",
          content: "Hi, when will my BMW 3 Series be delivered?",
          intent: "DELIVERY_STATUS",
          confidence: 0.95,
          createdAt: daysAgo(12),
        },
        {
          conversationId: conversation.id,
          role: "ASSISTANT",
          content:
            "I'd be happy to check on your delivery status. I can see your BMW 3 Series (order ORD-2024-00001) was delivered on 8th January to 42 Oak Street, Manchester. The vehicle registration is YN23 XYZ. Is there anything else I can help you with?",
          createdAt: daysAgo(12),
        },
        {
          conversationId: conversation.id,
          role: "USER",
          content: "Oh perfect, I forgot it already arrived! Thanks!",
          intent: "GENERAL_QUESTION",
          confidence: 0.8,
          sentiment: 0.8,
          createdAt: daysAgo(12),
        },
        {
          conversationId: conversation.id,
          role: "ASSISTANT",
          content:
            "You're welcome, James! Enjoy your BMW. If you have any questions about your vehicle or warranty, feel free to reach out. Have a great day!",
          createdAt: daysAgo(12),
        },
      ],
    });

    console.log("✅ Created sample complaint with conversation history");
  }

  console.log("\n🎉 Database seeding completed!");
  console.log("\nTest scenarios available:");
  console.log("  - james.wilson@email.com: Missing accessories (AI-resolvable)");
  console.log("  - sarah.chen@email.com: Delivery in transit");
  console.log("  - michael.brown@email.com: Vehicle defect (escalation)");
  console.log("  - emma.thompson@email.com: Refund request under £100");
  console.log("  - david.miller@email.com: Repeat complainant (escalation)");
  console.log("  - lisa.anderson@email.com: Admin/finance issue");
  console.log("  - robert.taylor@email.com: Pending delivery");
  console.log("  - jennifer.white@email.com: High value vehicle");
  console.log("  - thomas.harris@email.com: Warranty almost expired");
  console.log("  - sophie.clark@email.com: New customer, no issues");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
