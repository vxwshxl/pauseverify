// One place for the facts search engines, answer engines and link previews read about us.
export const SITE = {
  url: "https://pauseverify.vercel.app",
  name: "Pause & Verify",
  tagline: "Pause before you pay.",
  description:
    "Pause & Verify is a free anti-scam assistant for India. It spots scam warning signs in messages, links, screenshots and UPI QR codes, explains them in plain language in English, Hindi and seven Northeast languages, and shows a safe way to check — right where the message is.",
  repo: "https://github.com/vxwshxl/pauseverify",
  team: "Team Commit&Run",
  members: ["Veeshal D Bodosa", "Mrinmoy Banikya", "Deepjyoti Dey"],
  languages: ["English", "Hindi", "Assamese", "Bodo", "Bengali", "Manipuri (Meitei)", "Nepali", "Khasi", "Mizo"],
};

export const FAQ: { q: string; a: string }[] = [
  {
    q: "What is Pause & Verify?",
    a: "A calm second opinion on suspicious messages. A browser extension and website that spots scam warning signs — fake bank links, KYC and OTP requests, ‘digital arrest’ threats, UPI QR tricks — underlines them where you read, and tells you a safe way to check.",
  },
  {
    q: "Is it free?",
    a: "Yes. The extension and the website checker are free for everyone, forever. Banks, fintechs, campuses and governments pay to offer it to the people they protect — that is how it is funded.",
  },
  {
    q: "If it’s free, how does it make money?",
    a: "Business-to-business. Banks and fintechs pay about ₹2 per active user a month to put it inside their own apps (cheaper than one fraud claim); colleges and companies pay ₹99 a seat a year for a dashboard and scam drills; districts and CSR programmes fund training and kiosks. Families never pay, and nobody’s data is sold.",
  },
  {
    q: "Does it read or store my messages?",
    a: "Every message is checked on your own device. Nothing is stored — no accounts, no database. Only if you ask the AI a question is the message sent, with OTPs, phone, card and account numbers and emails masked first, over HTTPS.",
  },
  {
    q: "Does it work offline?",
    a: "Yes, the important part does. Scam detection, fake-link and look-alike checks, the .bank.in rule, UPI QR decoding, underlining, alerts, pausing fake links and ready answers to common questions all run in the browser without internet. Translation, read-aloud, free-form AI answers and reading text in pictures need a connection.",
  },
  {
    q: "Can it read screenshots, posters and QR codes?",
    a: "Yes. Drag ‘Look’ over any part of the screen, right-click an image, or upload a screenshot. QR codes are decoded on the device and show exactly whom a UPI QR pays and how much. The words in the picture are read by an AI vision model (Gemma 3), then our own engine decides whether it is a scam.",
  },
  {
    q: "Which languages does it speak?",
    a: "English, Hindi and seven Northeast languages through Bhashini: Assamese, Bodo, Bengali, Manipuri (Meitei Mayek), Nepali, Khasi and Mizo — including low-resource ones. Read-aloud works in English, Hindi, Assamese, Bodo, Bengali and Nepali.",
  },
  {
    q: "I already clicked, shared my OTP or paid. What now?",
    a: "Call 1930, the national cyber-crime helpline, immediately, or report at cybercrime.gov.in. Block your cards and UPI from your bank’s app, and change any password you shared. Reporting in the first hours gives the best chance of stopping the money.",
  },
];
