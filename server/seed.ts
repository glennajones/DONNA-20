import { db } from "./db";
import { users, registrations, payments, scheduleEvents } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Clear existing data (optional - only for development)
    await db.delete(scheduleEvents);
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

    // Create demo schedule events
    console.log("Creating demo schedule events...");
    
    // Get the admin user ID for creating events
    const [adminUser] = await db.select().from(users).where(eq(users.username, "admin"));
    const [managerUser] = await db.select().from(users).where(eq(users.username, "manager"));
    
    if (!adminUser || !managerUser) {
      console.log("⚠️ Users not found, skipping schedule events");
      return;
    }
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const demoEvents = [
      {
        title: "Junior Training Session",
        court: "Indoor Court 1",
        date: today.toISOString().split("T")[0],
        time: "16:00",
        duration: 120,
        eventType: "training" as const,
        participants: ["Emma Wilson", "Alex Johnson", "Maria Garcia"],
        coach: "Coach Sarah",
        description: "Basic skills training for junior players",
        status: "scheduled" as const,
        createdBy: adminUser.id,
      },
      {
        title: "Advanced Training",
        court: "Indoor Court 2", 
        date: tomorrow.toISOString().split("T")[0],
        time: "18:00",
        duration: 150,
        eventType: "training" as const,
        participants: ["David Brown", "Jessica Lee"],
        coach: "Coach Mike",
        description: "Advanced techniques and tactics",
        status: "scheduled" as const,
        createdBy: adminUser.id,
      },
      {
        title: "Beach Volleyball Practice",
        court: "Beach Court 1",
        date: nextWeek.toISOString().split("T")[0],
        time: "10:00",
        duration: 180,
        eventType: "practice" as const,
        participants: ["Team A players"],
        coach: "Coach Alex",
        description: "Beach volleyball practice session",
        status: "scheduled" as const,
        createdBy: managerUser.id,
      },
    ];

    for (const eventData of demoEvents) {
      await db.insert(scheduleEvents).values(eventData);
      console.log(`✓ Created schedule event: ${eventData.title}`);
    }

    // Add July 2025 test events for calendar testing
    const julyEvents = [
      // Week 1 - July 1-6
      {
        title: "Junior Training Session",
        court: "Court 1",
        date: "2025-07-01",
        time: "09:00",
        duration: 120,
        eventType: "training" as const,
        participants: ["Emma Wilson", "Jake Thompson"],
        coach: "Coach Sarah",
        description: "Basic skills training for junior players",
        status: "scheduled" as const,
        createdBy: adminUser.id,
      },
      {
        title: "Advanced Skills Workshop",
        court: "Court 3",
        date: "2025-07-02",
        time: "14:30",
        duration: 90,
        eventType: "training" as const,
        participants: ["Alex Chen", "Maria Garcia"],
        coach: "Coach Mike",
        description: "Advanced spiking and blocking techniques",
        status: "scheduled" as const,
        createdBy: adminUser.id,
      },
      {
        title: "Beach Volleyball Practice",
        court: "Beach 1",
        date: "2025-07-03",
        time: "10:00",
        duration: 90,
        eventType: "practice" as const,
        participants: ["Sam Rodriguez", "Taylor Kim"],
        coach: "Coach Lisa",
        description: "Beach volleyball fundamentals",
        status: "scheduled" as const,
        createdBy: managerUser.id,
      },
      
      // Week 2 - July 7-13
      {
        title: "Team Scrimmage",
        court: "Court 2",
        date: "2025-07-08",
        time: "18:00",
        duration: 150,
        eventType: "match" as const,
        participants: ["Team A vs Team B"],
        coach: "Coach Sarah",
        description: "Internal team scrimmage",
        status: "scheduled" as const,
        createdBy: adminUser.id,
      },
      {
        title: "Serving Clinic",
        court: "Court 5",
        date: "2025-07-10",
        time: "16:00",
        duration: 60,
        eventType: "training" as const,
        participants: ["Beginner Group"],
        coach: "Coach Mike",
        description: "Focus on serving techniques",
        status: "scheduled" as const,
        createdBy: adminUser.id,
      },
      {
        title: "Beach Tournament Prep",
        court: "Beach 2",
        date: "2025-07-12",
        time: "08:00",
        duration: 180,
        eventType: "training" as const,
        participants: ["Tournament Team"],
        coach: "Coach Lisa",
        description: "Preparation for upcoming beach tournament",
        status: "scheduled" as const,
        createdBy: managerUser.id,
      },
      
      // Week 3 - July 14-20
      {
        title: "Youth Development",
        court: "Court 4",
        date: "2025-07-15",
        time: "15:00",
        duration: 90,
        eventType: "training" as const,
        participants: ["Youth Team"],
        coach: "Coach Sarah",
        description: "Youth development program",
        status: "scheduled" as const,
        createdBy: adminUser.id,
      },
      {
        title: "Setting Workshop",
        court: "Court 6",
        date: "2025-07-17",
        time: "19:00",
        duration: 120,
        eventType: "training" as const,
        participants: ["Intermediate Players"],
        coach: "Coach Mike",
        description: "Advanced setting techniques",
        status: "scheduled" as const,
        createdBy: adminUser.id,
      },
      {
        title: "Mixed Doubles Practice",
        court: "Beach 1",
        date: "2025-07-19",
        time: "11:30",
        duration: 120,
        eventType: "practice" as const,
        participants: ["Mixed Teams"],
        coach: "Coach Lisa",
        description: "Mixed doubles strategy and play",
        status: "scheduled" as const,
        createdBy: managerUser.id,
      },
      
      // Week 4 - July 21-27
      {
        title: "Competition Prep",
        court: "Court 7",
        date: "2025-07-22",
        time: "17:30",
        duration: 150,
        eventType: "training" as const,
        participants: ["Competition Team"],
        coach: "Coach Sarah",
        description: "Final preparation for regional competition",
        status: "scheduled" as const,
        createdBy: adminUser.id,
      },
      {
        title: "Defensive Drills",
        court: "Court 1",
        date: "2025-07-24",
        time: "13:00",
        duration: 90,
        eventType: "training" as const,
        participants: ["Defense Squad"],
        coach: "Coach Mike",
        description: "Intensive defensive training",
        status: "scheduled" as const,
        createdBy: adminUser.id,
      },
      {
        title: "Beach Skills Session",
        court: "Beach 2",
        date: "2025-07-26",
        time: "09:30",
        duration: 120,
        eventType: "training" as const,
        participants: ["Beach Team"],
        coach: "Coach Lisa",
        description: "Beach-specific skills development",
        status: "scheduled" as const,
        createdBy: managerUser.id,
      },
      
      // Week 5 - July 28-31
      {
        title: "Monthly Evaluation",
        court: "Court 3",
        date: "2025-07-29",
        time: "16:30",
        duration: 120,
        eventType: "practice" as const,
        participants: ["All Teams"],
        coach: "Coach Sarah",
        description: "Monthly skill evaluation and feedback",
        status: "scheduled" as const,
        createdBy: adminUser.id,
      },
      {
        title: "Summer Camp Session",
        court: "Court 2",
        date: "2025-07-31",
        time: "10:00",
        duration: 180,
        eventType: "training" as const,
        participants: ["Summer Camp Kids"],
        coach: "Coach Mike",
        description: "Final summer camp training session",
        status: "scheduled" as const,
        createdBy: adminUser.id,
      },
      
      // Multi-court events
      {
        title: "Regional Tournament",
        court: "Court 1, Court 2, Court 3",
        date: "2025-07-05",
        time: "09:00",
        duration: 240,
        eventType: "tournament" as const,
        participants: ["All Teams"],
        coach: "All Coaches",
        description: "Regional volleyball tournament - multiple courts",
        status: "scheduled" as const,
        createdBy: adminUser.id,
      },
      {
        title: "Skills Assessment Day",
        court: "Court 4, Court 5, Court 6",
        date: "2025-07-14",
        time: "10:00",
        duration: 180,
        eventType: "practice" as const,
        participants: ["All Players"],
        coach: "Coach Sarah, Coach Mike",
        description: "Annual skills assessment across multiple courts",
        status: "scheduled" as const,
        createdBy: adminUser.id,
      },
      {
        title: "Beach Championships",
        court: "Beach 1, Beach 2",
        date: "2025-07-20",
        time: "08:30",
        duration: 300,
        eventType: "tournament" as const,
        participants: ["Beach Teams"],
        coach: "Coach Lisa",
        description: "Beach volleyball championships on both courts",
        status: "scheduled" as const,
        createdBy: managerUser.id,
      },
    ];

    console.log("Creating July test events...");
    for (const eventData of julyEvents) {
      await db.insert(scheduleEvents).values(eventData);
      console.log(`✓ Created July event: ${eventData.title} on ${eventData.date}`);
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