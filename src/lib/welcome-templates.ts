import type { AudienceId } from "./audiences";

export const WELCOME_SIGNATURE = "Sam\nFounder, Brandnote";

// Every welcome follows this shape, so they all read like Brandnote while each one
// is written about the customer's own business.
export const WELCOME_STRUCTURE = [
  'Greeting: "Hi {first name}," or "Hi there," when there is no first name.',
  "1. Welcome them to Brandnote warmly, and say we're glad they're here.",
  '2. Show we know them, talking to them directly: say we took a look at their business, then say what we like about what they do and who it\'s for, in your own words and as "you". For example: "We took a look at Acme, and we love that you help small clinics fill their calendars without the phone tag." Never describe them in the third person, like "Acme provides…", and never copy their site\'s wording.',
  "3. In a new paragraph, say how Brandnote helps them: {how we help}",
  "4. Say what we've already set up for them from their website: their brand profile, brand voice and customer profiles. Give the workspace link and invite them to tell us if anything needs a tweak.",
  '5. End with "Welcome aboard," on its own line.',
];

export const WELCOME_RULES = [
  'Write as the Brandnote team, using "we".',
  "Plain language. No code, no product jargon, nothing copied from the site's code.",
  "Short paragraphs. No em dashes.",
  "Up to 150 words.",
  'Subject: "Welcome to Brandnote, {first name}", or "Welcome to Brandnote" when there is no first name.',
];

export const HOW_WE_HELP: Record<AudienceId, string> = {
  founder:
    "as a founder or business owner, their time goes fast. Brandnote helps them write posts, pitches and announcements that sound like them every time, without starting from a blank page.",
  in_house:
    "Brandnote keeps everyone on their team writing in one consistent voice, whoever is writing.",
  agency:
    "Brandnote sets up each client's brand in minutes, so they can start on the client work sooner.",
  freelancer:
    "Brandnote gets each client's brand right before they write the first draft.",
  other: "Brandnote gives them a ready brand profile and voice, so everything they write sounds like them.",
};
