/**
 * Legal Dictionary & Plain-English Glossary
 * Provides plain-English translations, risk implications, and practical tips for complex legal terms.
 */

const LEGAL_DICTIONARY = [
  {
    term: "Indemnification",
    latin: null,
    category: "Liability",
    plainMeaning: "An agreement where you promise to pay for the other person's losses, legal fees, or damages if someone sues them over something related to your work or conduct.",
    riskLevel: "High",
    tip: "Look for 'mutual indemnification' instead of unilateral. Ensure it only covers your direct gross negligence, not broad third-party claims.",
    example: "The Consultant shall indemnify and hold harmless the Client against any and all claims, damages, and legal expenses."
  },
  {
    term: "Liquidated Damages",
    latin: null,
    category: "Financial / Penalties",
    plainMeaning: "A pre-agreed fixed amount of money one party must pay if they break a specific part of the contract, even before actual damages are measured.",
    riskLevel: "High",
    tip: "Make sure the amount is a reasonable estimate of actual harm and not an excessive punitive penalty.",
    example: "If the tenant vacates prior to the lease expiration, tenant agrees to pay $3,500 as liquidated damages."
  },
  {
    term: "Force Majeure",
    latin: "Superior Force",
    category: "Performance / Termination",
    plainMeaning: "An 'unforeseeable catastrophe' clause that excuses parties from performing their contractual duties during disasters, wars, pandemics, or government shutdowns.",
    riskLevel: "Medium",
    tip: "Verify if pandemics, supply chain interruptions, or cyber incidents are explicitly included or excluded.",
    example: "Neither party shall be liable for failure to perform due to acts of God, strikes, or governmental orders."
  },
  {
    term: "Severability",
    latin: null,
    category: "Contract Structure",
    plainMeaning: "If a court finds one clause invalid or illegal, the rest of the contract remains active and enforceable rather than destroying the entire agreement.",
    riskLevel: "Low",
    tip: "Standard boilerplate clause that protects both parties from complete contract invalidation.",
    example: "If any provision of this Agreement is held invalid, the remainder shall continue in full force and effect."
  },
  {
    term: "Mandatory Binding Arbitration",
    latin: null,
    category: "Dispute Resolution",
    plainMeaning: "You waive your constitutional right to sue in court before a jury. Disputes are decided in private by a hired arbitrator whose decision is almost impossible to appeal.",
    riskLevel: "High",
    tip: "Check who pays the arbitration fees and where the hearings take place (could be an inconvenient jurisdiction).",
    example: "All claims arising under this Agreement shall be settled by binding arbitration in accordance with AAA rules."
  },
  {
    term: "Class Action Waiver",
    latin: null,
    category: "Dispute Resolution",
    plainMeaning: "You agree that any dispute can only be brought on an individual basis, preventing you from joining other affected consumers or employees in a collective lawsuit.",
    riskLevel: "High",
    tip: "Common in consumer and employment agreements to limit group legal action against corporations.",
    example: "You agree to resolve disputes solely on an individual basis and waive any right to bring a class action."
  },
  {
    term: "Evergreen / Auto-Renewal Clause",
    latin: null,
    category: "Term & Renewal",
    plainMeaning: "The contract automatically renews for another full term (e.g. 1 year) unless you give written notice within a specific narrow window before expiration.",
    riskLevel: "High",
    tip: "Set a calendar reminder at least 60 days before the notice deadline so you do not get trapped in an unwanted renewal.",
    example: "This agreement shall automatically renew for successive 12-month periods unless canceled 45 days prior."
  },
  {
    term: "Joint and Several Liability",
    latin: null,
    category: "Liability",
    plainMeaning: "If multiple people sign together (e.g. roommates or co-founders), the landlord or creditor can demand 100% of the payment or damages from any single person.",
    riskLevel: "High",
    tip: "If your roommate skips rent, the landlord can legally demand the entire amount from you alone.",
    example: "All co-tenants shall be jointly and severally liable for all rent and repair obligations."
  },
  {
    term: "Non-Compete Covenant",
    latin: null,
    category: "Employment & IP",
    plainMeaning: "A restriction preventing you from working for competitors, starting a similar business, or serving existing clients for a designated period after leaving.",
    riskLevel: "High",
    tip: "Check geographic scope and duration (under 12 months is standard; broad restrictions may be unenforceable in several jurisdictions).",
    example: "Employee shall not engage in any competing enterprise within 50 miles for 24 months post-employment."
  },
  {
    term: "Work Made for Hire",
    latin: null,
    category: "Intellectual Property",
    plainMeaning: "Any software, design, writing, or invention you create is automatically owned completely by the hiring company from the moment of creation.",
    riskLevel: "Medium",
    tip: "Ensure pre-existing intellectual property and personal side projects created on your own time are explicitly excluded.",
    example: "All deliverables created under this Statement of Work shall constitute 'work made for hire' owned by Client."
  },
  {
    term: "Right of First Refusal (ROFR)",
    latin: null,
    category: "Real Estate & Commerce",
    plainMeaning: "A contractual right giving a specific party the first opportunity to purchase or lease an asset before the owner can sell it to a third party.",
    riskLevel: "Medium",
    tip: "Ensure tight response timeframes (e.g., 5-10 business days) so sales opportunities are not stalled.",
    example: "Owner grants Tenant a right of first refusal to purchase the premises upon receipt of a bona fide offer."
  },
  {
    term: "Choice of Law / Governing Law",
    latin: "Lex Loci",
    category: "Jurisdiction",
    plainMeaning: "Determines which state or country's laws will govern the contract and which courts have jurisdiction in case of a lawsuit.",
    riskLevel: "Medium",
    tip: "Avoid agreeing to distant foreign jurisdictions which will make defending yourself prohibitively expensive.",
    example: "This Agreement shall be construed in accordance with the laws of the State of Delaware."
  },
  {
    term: "Survival Clause",
    latin: null,
    category: "Contract Structure",
    plainMeaning: "Specifies which contractual promises (like confidentiality, non-disclosure, or indemnification) continue to bind you even after the contract is terminated.",
    riskLevel: "Medium",
    tip: "Check the duration of survival clauses (e.g. 2-5 years vs perpetual confidentiality).",
    example: "Sections 5 (Confidentiality) and 8 (Indemnification) shall survive the termination or expiration of this Agreement."
  },
  {
    term: "Integration / Merger Clause (Entire Agreement)",
    latin: "Four Corners",
    category: "Contract Structure",
    plainMeaning: "Declares that the written document is the complete and final agreement, superseding all prior oral promises, email chats, or negotiations.",
    riskLevel: "Medium",
    tip: "If a salesperson promised you something verbally or via email, make sure it is written in this document before signing.",
    example: "This Agreement contains the entire understanding of the parties and supersedes all prior agreements."
  },
  {
    term: "Warranty of Habitability",
    latin: null,
    category: "Tenant Rights",
    plainMeaning: "A landlord's legal duty to maintain rental property in a condition fit for human living (working heat, plumbing, hot water, structural integrity, and no pest infestations).",
    riskLevel: "Low",
    tip: "In most states, a lease clause attempting to waive habitability is void and illegal under statutory law.",
    example: "Landlord covenants to maintain the premises in compliance with all applicable housing and building codes."
  }
];

class LegalDictionaryService {
  static getAll() {
    return LEGAL_DICTIONARY;
  }

  static search(query) {
    if (!query) return LEGAL_DICTIONARY;
    const q = query.toLowerCase().trim();
    return LEGAL_DICTIONARY.filter(item => 
      item.term.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.plainMeaning.toLowerCase().includes(q) ||
      (item.latin && item.latin.toLowerCase().includes(q))
    );
  }

  static getByTerm(term) {
    if (!term) return null;
    const q = term.toLowerCase().trim();
    return LEGAL_DICTIONARY.find(item => item.term.toLowerCase() === q) || null;
  }
}

module.exports = { LegalDictionaryService, LEGAL_DICTIONARY };
