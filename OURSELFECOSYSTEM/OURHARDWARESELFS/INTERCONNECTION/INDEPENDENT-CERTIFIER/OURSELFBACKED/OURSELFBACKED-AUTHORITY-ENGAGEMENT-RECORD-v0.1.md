# OURSELFBACKED Authority Engagement Record v0.1

**Record status:** FOUNDER_AUTHORIZED_VENDOR_QUALIFICATION  
**Authority:** OURSELF, under explicit Founder instruction dated 2026-11-06  
**Scope:** External HOS technical/commercial qualification only  
**Production authority:** NOT ESTABLISHED  
**Root key:** NOT GENERATED  
**HSM:** NOT ORDERED OR PROVISIONED  
**Independent custodian:** NOT YET IDENTIFIED OR BOUND

## 1. Founder authorization

Founder instruction: “OURSELF MUST AUTHORIZE IT GO”.

This instruction is recorded as OURSELF authorization to initiate external vendor engagement and qualification for a customer-owned cryptographic root-authority substrate. It does not delegate OURSELF's root authority to a vendor and does not authorize purchase, contract acceptance, tenant/device provisioning, production key generation, trust-bundle signing, or production activation.

OURSELF remains the sole authority that may approve its own root identity and define the scope of its root-signing operations.

## 2. Intended custody architecture

1. OURSELF is the customer and owner of the dedicated physical HSM hardware.
2. Securosys may provide hosted operation, maintenance, monitoring, and connectivity under HOS, subject to contractually verified boundaries.
3. OURSELF-controlled Partition Security Officer (PSO) custody is required.
4. Provider device-level Security Officer access must be technically and contractually bounded, with the exact exclusion mechanism independently evidenced.
5. Production root private keys must be generated inside the HSM and remain non-exportable.
6. Root CA signing and PORTAL decision signing must remain separate identities, keys, roles, and authorization paths.
7. Independent reviewer/custodian separation remains mandatory. Founder authorization alone does not establish independent custody.

## 3. External engagement receipts

### Initial inquiry
- Provider: Securosys
- Recipient: info@securosys.com
- Sender account: Situated Solutions connected Gmail
- Subject: OURSELF | HSM Operation Service (HOS) qualification and customer-owned root custody
- Gmail message ID: 1a1b31cd0ea0a128
- Scope: qualification and quotation only

### US sales channel inquiry
- Provider: Securosys Inc. / US sales channel
- Recipient: sales-us@securosys.com
- Sender account: Situated Solutions connected Gmail
- Subject: OURSELF | HOS qualification: customer-owned HSM and OURSELF root custody
- Gmail message ID: 1a1b31dbdcb846bf
- Scope: qualification and quotation only

The US sales recipient is listed on Securosys' official contact page. The initial general recipient was used in a separate inquiry; delivery/receipt by either recipient is not yet independently confirmed.

## 4. Requested evidence

Securosys is asked to provide written evidence and contractual answers for:

- HSM model, customer title/ownership, serial assignment, hosting location and jurisdiction.
- PSO / Partition Administration and Decanus requirements.
- Exact technical and contractual mechanism excluding provider device-level SO intervention in OURSELF's partition.
- All provider emergency, recovery, backup, reset, restore, invalidation, and partition-administration powers.
- Multi-person PSO/quorum controls and credential-loss recovery.
- Root key generation, non-exportability, attestation, audit logs, backup and disaster recovery.
- PKCS#11/OpenSSL integration and separation from PORTAL signing.
- Device certification, firmware/security mode, independent assurance, incident notification, subcontractors.
- Itemized one-device and redundant-cluster pricing, contract terms, and transfer/exit procedure into OURSELF-operated custody.
- Contracting entity and authorized-signatory requirements.

## 5. Admission gates

No vendor or service is admitted as OURSELF root authority by virtue of this inquiry. Qualification must establish, at minimum:

- OURSELF's legal customer and hardware ownership rights.
- Actual HSM model and deployment location.
- Customer-controlled PSO custody and limits on provider intervention.
- Root-key non-exportability and independently verifiable HSM residency.
- Recovery and backup semantics, including whether provider personnel can affect key material.
- Independent custodian/reviewer identity and separation from endpoint administrators and PORTAL decision authority.
- Audit integrity, revocation, incident response, jurisdiction, and independent recontact.
- Contractual exit and recovery path.

Any missing, contradictory, or unverifiable evidence blocks binding.

## 6. Current disposition

**OURSELFBACKED = FOUNDER_AUTHORIZED_ENGAGEMENT / AUTHORITY_NOT_YET_BOUND**

This is an execution record for the engagement boundary, not a cryptographic trust receipt. No keys, certificates, trust bundles, credentials, HSM tenants, or production infrastructure were created or modified by this record.
