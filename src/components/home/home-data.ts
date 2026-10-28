import type { IconName } from "@/components/home/icon";

type Feature = {
  icon: IconName;
  label: string;
  title: string;
  description: string;
  detail: string;
};
export const features: Feature[] = [
  {
    icon: "calendar",
    label: "Rituals, organized",
    title: "Plan every ceremony",
    description:
      "Make room for every ritual. Keep dates, venues, and details together, from the first Mehendi to the final reception.",
    detail: "Many events. One beautiful plan.",
  },
  {
    icon: "people",
    label: "Better together",
    title: "Bring your family together",
    description:
      "Share the planning with your people. Give everyone a clear role and assign tasks so the little things are taken care of.",
    detail: "Your people, with a shared purpose.",
  },
  {
    icon: "wallet",
    label: "Financial clarity",
    title: "Stay on top of your budget",
    description:
      "Set your wedding budget, record expenses, and see where things stand across events and categories.",
    detail: "Less guesswork. More peace of mind.",
  },
  {
    icon: "mail",
    label: "Thoughtful invitations",
    title: "Manage guests & RSVPs",
    description:
      "Organize guest households, invite them to the right events, and collect attendance counts through a simple link.",
    detail: "No guest accounts. No extra steps.",
  },
  {
    icon: "vendor",
    label: "The right people",
    title: "Discover & organize vendors",
    description:
      "Explore vendors, compare your options, and keep your shortlist, contacts, and notes close to your wedding plans.",
    detail: "From a promising find to your own list.",
  },
  {
    icon: "website",
    label: "Your story, shared",
    title: "Create your wedding website",
    description:
      "Choose a theme, share your celebrations, and bring loved ones closer with event details and YouTube livestreams.",
    detail: "A little corner of the internet, yours.",
  },
];
export const celebrations = [
  {
    day: "12 DEC · 4:00 PM",
    title: "Mehendi",
    description: "Henna, happy stories, and a little anticipation.",
    venue: "The Mango Orchard",
    theme: "Sage & marigold",
    symbol: "✳",
  },
  {
    day: "13 DEC · 10:00 AM",
    title: "Haldi",
    description: "A splash of sunshine. A whole lot of love.",
    venue: "Poolside Courtyard",
    theme: "Sunshine yellow",
    symbol: "☀",
  },
  {
    day: "13 DEC · 7:00 PM",
    title: "Sangeet",
    description: "Your favourite people. Their best dance moves.",
    venue: "Grand Crystal Ballroom",
    theme: "Midnight blue",
    symbol: "♫",
  },
  {
    day: "14 DEC · 5:00 PM",
    title: "The wedding",
    description: "The promises at the heart of it all.",
    venue: "Lakeside Mandap",
    theme: "Ivory & rose",
    symbol: "❋",
  },
  {
    day: "15 DEC · 6:00 PM",
    title: "Reception",
    description: "One more evening to make it unforgettable.",
    venue: "Palace Terrace",
    theme: "Champagne gold",
    symbol: "✧",
  },
];
export const members = [
  {
    initials: "AS",
    name: "Ananya Sharma",
    detail: "Bride · Wedding details",
    role: "Owner",
  },
  {
    initials: "AV",
    name: "Aarav Verma",
    detail: "Groom · Guest invitations",
    role: "Owner",
  },
  {
    initials: "RS",
    name: "Rajiv Sharma",
    detail: "Father of the bride · Vendors",
    role: "Admin",
  },
  {
    initials: "KV",
    name: "Kavita Verma",
    detail: "Sister of the groom · Sangeet",
    role: "Manager",
  },
];
export const guestFeatures: {
  icon: IconName;
  title: string;
  text: string;
  note: string;
}[] = [
  {
    icon: "mail",
    title: "An invitation that feels personal",
    text: "Invite each household to its own set of events, with the details they need in one personalized link.",
    note: "The right events, for the right people.",
  },
  {
    icon: "check",
    title: "A simpler way to RSVP",
    text: "One representative responds for the household, with a separate answer and attendance count for each event.",
    note: "A clear picture of who’s joining you.",
  },
  {
    icon: "camera",
    title: "Memories, gathered together",
    text: "Guests share photos through a QR link. You approve the moments before sharing them in a link-private gallery.",
    note: "Shared with love. Reviewed with care.",
  },
];
export const steps = [
  {
    title: "Create your wedding space",
    text: "Start with your wedding details, then add the events and traditions that make your celebration yours.",
  },
  {
    title: "Bring everyone together",
    text: "Invite family to help, share tasks, organize expenses, and bring your guest list into the picture.",
  },
  {
    title: "Celebrate, fully present",
    text: "Share invitations, collect RSVPs, and keep your plans close as the celebrations come together.",
  },
];
export const faqs = [
  {
    question: "Is Make My Marriage free to use?",
    answer:
      "Yes. Make My Marriage V1 is designed to be free for couples and families, with shared tools for planning your wedding celebrations.",
  },
  {
    question: "Can parents and relatives help with the planning?",
    answer:
      "Absolutely. Wedding Owners can invite family members as Admins or Managers. Everyone can help with planning, while permissions keep ownership and photo moderation protected.",
  },
  {
    question: "Do our guests need an account to RSVP?",
    answer:
      "No. Each household receives a personalized invitation link showing its invited events. A representative can accept or decline each event and enter the total number attending.",
  },
  {
    question: "Can we plan different ceremonies and traditions?",
    answer:
      "Yes. A wedding can include multiple events, each with its own schedule, venue, and details. Use familiar celebrations or add an event for your own traditions.",
  },
  {
    question: "How do photo sharing and the private gallery work?",
    answer:
      "Guests can contribute photos using an upload link or QR code. Photos stay pending until an Owner or Admin approves them. The gallery uses a separate private link; anyone who has that link can view approved photos.",
  },
  {
    question: "Can we book or pay vendors through the platform?",
    answer:
      "V1 helps you discover, compare, and organize vendors and record expenses. Vendor bookings, payment processing, and payment schedules are outside V1.",
  },
];
