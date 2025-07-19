import Pusher from "pusher";

if (!process.env.PUSHER_APP_ID || !process.env.PUSHER_KEY || !process.env.PUSHER_SECRET || !process.env.PUSHER_CLUSTER) {
  console.error("Missing Pusher environment variables:");
  console.error("PUSHER_APP_ID:", !!process.env.PUSHER_APP_ID);
  console.error("PUSHER_KEY:", !!process.env.PUSHER_KEY);
  console.error("PUSHER_SECRET:", !!process.env.PUSHER_SECRET);
  console.error("PUSHER_CLUSTER:", !!process.env.PUSHER_CLUSTER);
}

console.log("Pusher config:", {
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY ? `${process.env.PUSHER_KEY.substring(0, 8)}...` : "missing",
  cluster: process.env.PUSHER_CLUSTER,
});

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true
});