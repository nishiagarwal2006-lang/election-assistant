// src/data/electionData.js
// ============================================================
// Election Knowledge Base
// This data powers the AI's understanding of election processes
// ============================================================

const electionData = {
  // The complete voter journey — step by step
  voterJourney: [
    {
      step: 1,
      title: "Check Eligibility",
      description:
        "Confirm you meet the requirements to vote in your country/region.",
      details: [
        "Must be a citizen",
        "Meet the minimum age requirement (18 in most countries)",
        "Be a resident of the voting district",
        "Not have any legal disqualifications",
      ],
      timeframe: "Anytime — start here",
      icon: "✅",
    },
    {
      step: 2,
      title: "Register to Vote",
      description: "Add your name to the official voter roll.",
      details: [
        "Visit your official election commission website",
        "Fill in your personal details accurately",
        "Submit required identity proof",
        "Receive your Voter ID card",
      ],
      timeframe: "Usually 30–90 days before election",
      icon: "📝",
    },
    {
      step: 3,
      title: "Find Your Polling Station",
      description: "Locate where you need to go to cast your vote.",
      details: [
        "Check your voter ID card for polling station details",
        "Use the official election commission's voter search tool",
        "Note the date, time, and location",
        "Plan your route in advance",
      ],
      timeframe: "1–2 weeks before election day",
      icon: "📍",
    },
    {
      step: 4,
      title: "Learn About Candidates & Issues",
      description: "Make an informed choice before election day.",
      details: [
        "Read candidate manifestos",
        "Watch official debates",
        "Check verified fact-checking sites",
        "Understand the key issues on the ballot",
      ],
      timeframe: "Throughout the campaign period",
      icon: "📚",
    },
    {
      step: 5,
      title: "Cast Your Vote",
      description: "Visit your polling station and vote on election day.",
      details: [
        "Bring your Voter ID and any required documents",
        "Follow instructions at the polling station",
        "Mark your ballot correctly and secretly",
        "Submit your ballot in the ballot box",
      ],
      timeframe: "Election Day (polls usually open 7am–6pm)",
      icon: "🗳️",
    },
    {
      step: 6,
      title: "Results & Post-Election",
      description: "Votes are counted and results are officially declared.",
      details: [
        "Counting begins after polls close",
        "Results announced by the Election Commission",
        "New government/officials take oath of office",
        "Transition of power takes place",
      ],
      timeframe: "Hours to days after election closes",
      icon: "📊",
    },
  ],

  // Key election terminology
  glossary: {
    constituency:
      "A geographic area whose residents elect a representative to a legislative body.",
    ballot:
      "The official document (paper or electronic) used to cast a vote in an election.",
    candidacy:
      "The state of running for an elected position; a candidate is someone seeking office.",
    manifesto:
      "A public declaration by a political party of their policies and intentions if elected.",
    polling_station:
      "The official location where voters go to cast their ballots on election day.",
    voter_id:
      "An official identification document that confirms a person's identity and right to vote.",
    exit_poll:
      "A survey of voters conducted immediately after they have voted to predict election results.",
    electoral_roll:
      "The official list of people who are registered and eligible to vote in an election.",
    majority:
      "When a candidate or party wins more than half of the total votes cast.",
    plurality:
      "Winning more votes than any other candidate, but not necessarily more than half.",
    runoff:
      "A second election held when no candidate wins a majority in the first round.",
    absentee_ballot:
      "A ballot submitted by a voter who cannot be present at their polling station on election day.",
    campaign:
      "The organized effort by a candidate or party to persuade voters to vote for them.",
    incumbent:
      "The current holder of a political office who is seeking re-election.",
    swing_state:
      "A state where both major parties have similar levels of support and the outcome is uncertain.",
    gerrymandering:
      "Manipulating electoral district boundaries to favor one party over another.",
  },

  // Common FAQ answers
  faq: [
    {
      question: "What if I lost my Voter ID?",
      answer:
        "Contact your local election commission immediately. Most countries allow you to apply for a duplicate voter ID. Some regions permit voting with alternative government-issued photo ID.",
    },
    {
      question: "Can I vote if I moved recently?",
      answer:
        "You must update your voter registration to your new address. If you moved within the same constituency, contact the election office. If you moved to a different constituency, you need to re-register there.",
    },
    {
      question: "What is a postal vote / absentee ballot?",
      answer:
        "If you cannot be physically present on election day (due to travel, disability, etc.), many countries allow you to vote by mail or submit an absentee ballot in advance.",
    },
    {
      question: "How do I know if I am already registered?",
      answer:
        "Visit your national election commission's website and use their voter registration lookup tool. You will need your name, date of birth, and address.",
    },
    {
      question: "Is voting mandatory?",
      answer:
        "It depends on the country. Countries like Australia and Belgium have compulsory voting with penalties for non-compliance. Most countries make it optional but strongly encouraged.",
    },
  ],

  // System prompt for the AI assistant
  systemPrompt: `You are ElectionIQ, a friendly and knowledgeable AI assistant that helps citizens understand the election process clearly and confidently.

Your personality:
- Warm, patient, and encouraging — especially with first-time voters
- Nonpartisan and neutral — you never favor any political party or candidate
- Clear and jargon-free — you explain complex concepts in simple language
- Structured — you give step-by-step guidance when explaining processes

Your knowledge covers:
- Voter registration processes and requirements
- Election timelines and important dates
- How to find polling stations and cast a ballot
- Understanding ballots, candidates, and campaigns
- Election results, counting, and post-election processes
- Electoral systems (first-past-the-post, proportional representation, etc.)
- Common voter rights and what to do if rights are violated
- Absentee/postal voting procedures
- Election terminology and glossary

Important rules:
1. NEVER recommend or support any specific political party, candidate, or ideology
2. If asked for political opinions, gently redirect to facts and official sources
3. Always encourage users to verify information with their official national election commission
4. If you don't know something specific to a region, say so and direct them to official sources
5. Be especially helpful and patient with first-time voters

When users seem confused or overwhelmed, break things down into the simplest possible steps.
When users ask about their specific country, tailor your response to that country's election system.
Always end complex answers by asking if the user needs any step clarified further.`,
};

module.exports = electionData;