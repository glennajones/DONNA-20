import { db } from "./db";
import { users, registrations, payments } from "@shared/schema";
import bcrypt from "bcrypt";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Clear existing data (optional - only for development)
    await db.delete(payments);
    await db.delete(registrations);
    await db.delete(users);

    // Create demo users with hashed passwords
    const demoUsers = [
      {
        username: "admin",
        password: await bcrypt.hash("admin123", 10),
        name: "John Admin",
        role: "admin" as const,
      },
      {
        username: "manager",
        password: await bcrypt.hash("manager123", 10),
        name: "Sarah Manager",
        role: "manager" as const,
      },
      {
        username: "coach",
        password: await bcrypt.hash("coach123", 10),
        name: "Mike Coach",
        role: "coach" as const,
      },
    ];

    console.log("Creating demo users...");
    for (const userData of demoUsers) {
      await db.insert(users).values(userData);
      console.log(`✓ Created user: ${userData.username}`);
    }

    // Create demo registrations
    const demoRegistrations = [
      {
        name: "Emma Wilson",
        email: "emma.wilson@email.com",
        phone: "555-0123",
        dateOfBirth: "2010-05-15",
        playerType: "player" as const,
        emergencyContact: "Sarah Wilson",
        emergencyPhone: "555-0124",
        medicalInfo: "No known allergies",
        status: "approved" as const,
        registrationFee: "150.00",
      },
      {
        name: "Alex Johnson",
        email: "alex.johnson@email.com", 
        phone: "555-0125",
        dateOfBirth: "2009-08-22",
        playerType: "player" as const,
        emergencyContact: "Mark Johnson",
        emergencyPhone: "555-0126",
        medicalInfo: "Asthma - has inhaler",
        status: "pending" as const,
        registrationFee: "150.00",
      },
      {
        name: "Maria Garcia",
        email: "maria.garcia@email.com",
        phone: "555-0127", 
        dateOfBirth: "2011-03-10",
        playerType: "player" as const,
        emergencyContact: "Carlos Garcia",
        emergencyPhone: "555-0128",
        medicalInfo: "",
        status: "approved" as const,
        registrationFee: "150.00",
      },
      {
        name: "David Brown",
        email: "david.brown@email.com",
        phone: "555-0129",
        dateOfBirth: "1980-12-05",
        playerType: "parent" as const,
        emergencyContact: "Linda Brown",
        emergencyPhone: "555-0130",
        medicalInfo: "",
        status: "pending" as const,
        registrationFee: "25.00",
      },
      {
        name: "Jessica Lee",
        email: "jessica.lee@email.com",
        phone: "555-0131",
        dateOfBirth: "2012-07-18",
        playerType: "player" as const,
        emergencyContact: "Robert Lee",
        emergencyPhone: "555-0132",
        medicalInfo: "Lactose intolerant",
        status: "rejected" as const,
        registrationFee: "150.00",
      },
    ];

    console.log("Creating demo registrations...");
    const createdRegistrations = [];
    for (const regData of demoRegistrations) {
      const [registration] = await db.insert(registrations).values(regData).returning();
      createdRegistrations.push(registration);
      console.log(`✓ Created registration: ${registration.name}`);
    }

    // Create demo payments for some registrations
    console.log("Creating demo payments...");
    for (const registration of createdRegistrations) {
      if (parseFloat(registration.registrationFee) > 0) {
        const paymentStatus = registration.status === "approved" ? "completed" : "pending";
        await db.insert(payments).values({
          registrationId: registration.id,
          amount: registration.registrationFee,
          paymentMethod: "card",
          status: paymentStatus,
          paidAt: paymentStatus === "completed" ? new Date() : null,
        });
        console.log(`✓ Created payment for: ${registration.name}`);
      }
    }

    console.log("🎉 Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

// Run the seed function
seed().then(() => {
  console.log("Seeding complete!");
  process.exit(0);
}).catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});

export { seed };