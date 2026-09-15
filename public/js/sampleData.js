/**
 * LexiClarity AI - Real-world Sample Legal Documents
 * Realistic datasets demonstrating leases, NDAs, SaaS agreements, and contractor terms.
 */

const SAMPLE_DOCUMENTS = {
  lease: {
    title: "Residential Lease Agreement (High-Risk Sample)",
    type: "Lease",
    description: "Contains auto-renewal traps, unilateral indemnification, liquidated damages, and tenant PII.",
    text: `RESIDENTIAL LEASE AGREEMENT
THIS RESIDENTIAL LEASE AGREEMENT is entered into on September 1, 2024, by and between Apex Property Management LLC ("Landlord"), and Johnathan Doe, SSN: 123-45-6789, Phone: (555) 234-5678, Email: john.doe@example.com ("Tenant"), for the real property located at 742 Evergreen Terrace, Suite 4B, Springfield, OR 97477.

1. TERM AND AUTOMATIC EVERGREEN RENEWAL
The initial term of this Lease shall commence on October 1, 2024, and end on September 30, 2025. This agreement shall automatically renew for successive 12-month periods at a 15% rent escalation unless Tenant delivers written notice of termination strictly via certified postal mail at least 60 days prior to the expiration date.

2. RENT AND LATE PENALTIES
Tenant agrees to pay monthly rent of $2,400.00, due on or before the 1st calendar day of each month. If rent is not received by 11:59 PM on the 2nd day of the month, Tenant shall pay an immediate late fee of $150.00 plus $25.00 per additional day delinquent.

3. SECURITY DEPOSIT AND LIQUIDATED DAMAGES
Tenant has deposited $4,800.00 as a security deposit. If Tenant vacates prior to the expiration of the full lease term, Tenant shall forfeit the entire deposit and agrees to pay $3,500.00 as liquidated damages for administrative re-letting costs, in addition to remaining monthly rent.

4. UNILATERAL INDEMNIFICATION AND LIABILITY
Tenant agrees to indemnify, defend, and hold harmless Landlord, its agents, and contractors from any and all claims, damages, lawsuits, and attorney's fees arising from any occurrence within the premises, regardless of Landlord's comparative negligence.

5. MAINTENANCE AND REPAIRS
Tenant shall be solely responsible for all maintenance, repairs, and appliance replacements costing under $500.00 per incident. Landlord shall have no liability for temporary loss of heating, air conditioning, plumbing, or electrical service.

6. MANDATORY BINDING ARBITRATION AND JURY WAIVER
Tenant irrevocably agrees that any dispute or controversy arising out of this Lease shall be resolved solely by mandatory binding arbitration administered by the private arbitration firm selected by Landlord. Tenant waives all rights to a jury trial and agrees to a class action waiver.

7. LANDLORD ENTRY AND ACCESS
Landlord reserves the right to enter the leased premises at any time without prior notice for inspection, showing to prospective tenants, or general assessment.`
  },

  ndaStandard: {
    title: "Mutual Non-Disclosure Agreement (Standard Fair)",
    type: "NDA",
    description: "Balanced mutual confidentiality agreement with reciprocal protections.",
    text: `MUTUAL NON-DISCLOSURE AGREEMENT
This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of January 15, 2025, between Alpha Tech Innovations Inc. ("Disclosing Party") and Beta Solutions LLC ("Receiving Party").

1. PURPOSE AND DEFINITION OF CONFIDENTIAL INFORMATION
Confidential Information includes all non-public technical, business, financial, and operational information disclosed by either party to the other that is marked as confidential or should reasonably be understood to be confidential.

2. MUTUAL OBLIGATIONS AND DUTY OF CARE
Each party agrees to protect the Confidential Information of the other party with the same degree of care it uses for its own confidential information, but in no event less than reasonable care.

3. EXCLUSIONS FROM CONFIDENTIALITY
Confidential Information shall not include information that: (a) is or becomes publicly known without breach; (b) was already known prior to disclosure; (c) is independently developed without reference to the disclosed information; or (d) is required to be disclosed by law or court order with prompt written notice.

4. TERM AND SURVIVAL
This Agreement shall remain in effect for a period of two (2) years from the effective date. Confidentiality obligations regarding trade secrets shall survive termination.

5. GOVERNING LAW AND JURISDICTION
This Agreement shall be governed by the laws of the State of California, without regard to conflict of law principles. Any dispute shall be brought before courts of competent jurisdiction in San Francisco County.`
  },

  ndaVendor: {
    title: "Vendor One-Sided Non-Disclosure Agreement (High-Risk Counter)",
    type: "NDA",
    description: "Aggressive vendor counter-proposal with unilateral confidentiality, perpetual survival, and broad indemnification.",
    text: `NON-DISCLOSURE AND PROPRIETARY RIGHTS AGREEMENT
This Agreement is made effective January 15, 2025, by and between Alpha Tech Innovations Inc. and Titan Global Vendor Corp.

1. UNILATERAL CONFIDENTIALITY OBLIGATIONS
Receiving Party strictly agrees to protect all information, trade secrets, business concepts, customer lists, and pricing disclosed by Titan Global Vendor Corp. No reciprocal confidentiality is provided by Titan Global.

2. PERPETUAL SURVIVAL AND NON-CIRCUMVENT
The confidentiality obligations under this Agreement shall survive in perpetuity and never expire. Receiving Party shall not directly or indirectly contact or do business with any client of Titan Global for a period of 5 years.

3. UNILATERAL INDEMNIFICATION AND INJUNCTIVE RELIEF
Receiving Party shall indemnify and hold Titan Global harmless from all legal expenses and attorney's fees incurred in enforcing this Agreement. Titan Global shall be entitled to immediate injunctive relief without the requirement of posting a bond.

4. BINDING ARBITRATION AND CHOICE OF VENUE
Any dispute shall be submitted to confidential binding arbitration held exclusively in New York, NY under expedited commercial rules, with all costs assessed against Receiving Party in the event of any breach.`
  },

  freelanceContract: {
    title: "Freelancer Work-for-Hire Agreement",
    type: "Contractor",
    description: "Freelance agreement with broad IP assignment, net-60 payment terms, and non-solicitation.",
    text: `INDEPENDENT CONTRACTOR SERVICES AGREEMENT
This Agreement is entered into on March 1, 2025, between Horizon Media Group ("Company") and Jane Alex Smith, SSN: 987-65-4321, Address: 100 Main St, Austin, TX 78701 ("Contractor").

1. SCOPE OF SERVICES AND DELIVERABLES
Contractor agrees to perform graphic design and software development services described in Exhibit A in a professional and timely manner.

2. COMPENSATION AND NET-60 PAYMENT TERMS
Company agrees to pay Contractor an hourly rate of $85.00. Invoices submitted by Contractor on the last day of each month shall be payable within Net-60 days following full inspection and written approval of deliverables.

3. COMPREHENSIVE INTELLECTUAL PROPERTY ASSIGNMENT
Contractor agrees that all deliverables, inventions, code, designs, and derivative works created during the term of this Agreement, whether created during working hours or on personal time, shall constitute "work made for hire" and are the sole and exclusive property of Company. Contractor irrevocably assigns all worldwide copyright and patent rights.

4. NON-SOLICITATION OF CLIENTS AND EMPLOYEES
For a period of 24 months following the termination of this Agreement, Contractor shall not directly or indirectly solicit, provide services to, or hire any client, vendor, or contractor of Company.

5. TERMINATION AT WILL
Company may terminate this Agreement at any time with 24 hours written notice without penalty. Contractor may terminate only with 30 days prior written notice.`
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SAMPLE_DOCUMENTS;
}
