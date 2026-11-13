import type { RiskLevel } from "./types.ts";

export interface Sample {
  id: string;
  channel: "sms" | "whatsapp" | "email";
  from: string;
  /** Sender detail line: phone number, SMS header or email address. */
  handle: string;
  time: string;
  subject?: string;
  text: string;
  /** Contents of a QR image attached to the message. */
  qr?: string;
  expected: RiskLevel;
}

// Written to mirror real scam patterns reported in India. Every name, number and domain
// here is invented; numbers use the reserved-looking 9XXXX 0XXXX shape on purpose.
export const SAMPLES: Sample[] = [
  {
    id: "sbi-kyc",
    channel: "sms",
    from: "VM-SBIBNK",
    handle: "SMS · +91 98230 01452",
    time: "9:41 AM",
    text: "Dear Customer, your SBI account will be BLOCKED in 10 minutes due to pending KYC. Update KYC immediately: http://sbi-kyc-verify.xyz/update to avoid suspension.",
    expected: "high",
  },
  {
    id: "sbi-otp",
    channel: "sms",
    from: "AD-SBIOTP",
    handle: "SMS · bank sender ID",
    time: "9:12 AM",
    text: "482913 is your OTP for login to SBI YONO. Valid for 3 minutes. Do not share this OTP with anyone. -SBI",
    expected: "safe",
  },
  {
    id: "power-cut",
    channel: "sms",
    from: "+91 70021 04419",
    handle: "SMS · personal mobile number",
    time: "Yesterday",
    text: "Dear consumer, your electricity power will be disconnected tonight at 9:30 pm because previous month bill was not updated. Please immediately contact our electricity officer on 70021 04419.",
    expected: "high",
  },
  {
    id: "new-number",
    channel: "whatsapp",
    from: "+91 93120 55871",
    handle: "WhatsApp · not in your contacts",
    time: "8:03 PM",
    text: "Hi Maa, it's me. My phone is broken, this is my new number, save it. I need ₹18,000 urgently for my hostel fees, can you send it now? Will return tomorrow.",
    expected: "high",
  },
  {
    id: "digital-arrest",
    channel: "whatsapp",
    from: "Mumbai Cyber Cell",
    handle: "WhatsApp · +91 88106 30092",
    time: "Mon",
    text: "This is Inspector Rathore, Mumbai Police. A FedEx parcel in your name was seized with illegal items and your Aadhaar is linked to money laundering. You are under digital arrest. Stay on the video call and do not tell anyone. Pay the verification amount to clear your name.",
    expected: "high",
  },
  {
    id: "refund-qr",
    channel: "whatsapp",
    from: "Refund Desk",
    handle: "WhatsApp · +91 76398 11207",
    time: "Sun",
    text: "Congratulations! Your Flipkart cashback of ₹5,000 is approved. Scan the QR below to receive the refund in your account within 5 minutes.",
    qr: "upi://pay?pa=refund.desk7@okaxis&pn=Refund%20Desk&am=5000&cu=INR&tn=Cashback",
    expected: "high",
  },
  {
    id: "job-task",
    channel: "whatsapp",
    from: "HR Priya",
    handle: "WhatsApp · +91 63051 72298",
    time: "Sat",
    text: "Hello! We are hiring for a part-time job. Earn ₹3,000 daily by liking YouTube videos from home. Join our Telegram group to start: bit.ly/earn-daily-in",
    expected: "high",
  },
  {
    id: "amazon-delivery",
    channel: "email",
    from: "Amazon.in",
    handle: "shipment-tracking@amazon.in",
    time: "Fri",
    subject: "Your package arrives today",
    text: "Your order of 1 item will arrive today by 9 PM. Track your package at https://www.amazon.in/progress-tracker. Our delivery agent will never ask for an OTP over the phone.",
    expected: "safe",
  },
  {
    id: "income-tax",
    channel: "email",
    from: "Income Tax Dept",
    handle: "refunds@incometax-gov-refund.top",
    time: "Thu",
    subject: "Tax refund of ₹24,850 approved",
    text: "You are eligible for an income tax refund of ₹24,850. Your refund will expire today. Verify your PAN and card details here to receive it: https://incometax-gov-refund.top/claim",
    expected: "high",
  },
];
