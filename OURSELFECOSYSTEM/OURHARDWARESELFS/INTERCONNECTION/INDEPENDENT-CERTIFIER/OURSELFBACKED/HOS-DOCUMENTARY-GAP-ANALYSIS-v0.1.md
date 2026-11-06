# OURSELFBACKED HOS Documentary Gap Analysis v0.1

**Assessment date:** 2026-11-06  
**Authority:** OURSELF founder-authorized vendor qualification  
**Disposition:** DOCUMENTARY_REVIEW_COMPLETE / VENDOR_EVIDENCE_PENDING / NOT_ADMITTED

## 1. Sources reviewed

1. Securosys HOS overview: https://docs.securosys.com/cloudhsm/Packages/hos/
2. Securosys CloudHSM Service Description, Appendix II, Edition June 2026: https://docs.securosys.com/cloudhsm/terms-and-conditions/TC_CloudHSM_Appendix-II_ServiceDescription_HSM-TSB-RESTaaS/
3. Securosys CloudHSM Terms & Conditions, Edition June 2026: https://docs.securosys.com/cloudhsm/terms-and-conditions/Terms_and_Conditions_for_Securosys_CloudHSM/
4. Primus HSM Backup and Restore: https://docs.securosys.com/primus-hsm/Concepts/backup_restore/
5. Securosys migration guide: https://docs.securosys.com/cloudhsm/Tutorial/migration_guide/

## 2. Positive documented capabilities

- HOS is described as a service for customers who acquire and own Securosys HSMs while Securosys installs and operates them in Securosys data centers.
- HOS may include required options, Decanus devices, and selected maintenance/support.
- The CloudHSM service description documents a subscriber-side PSO option requiring Decanus and licensing.
- PSO can control partition security configuration and access-credential generation.
- PSO can disable device-level SO intervention on the subscriber partition, including password reset. The documented residual risk is that lost PSO credentials then prevent further user-configuration changes.
- PSO activation can be one-person or one-out-of-m persons, according to the service description.
- PKCS#11 is listed among supported API providers, subject to service activation.
- The service description states that key export depends on key attributes and partition policy; keys can be configured non-exportable.
- The service description documents customer migration options to an on-premises Primus HSM, including partition transfer subject to the required roles, backup artifacts, and device compatibility.

## 3. Critical limitations and unresolved points

### 3.1 Provider-side privileged roles remain part of the service model

The June 2026 service description identifies Securosys CloudHSM Operation personnel, including system administrators, device Security Officer (SO), and Genesis role. It states that the device SO and Genesis roles are held by Securosys personnel. PSO can block device SO intervention on the subscriber partition, but this does not establish that provider personnel have no device-level operational power or no ability to affect availability, service, or physical hardware.

OURSELF must obtain a written, HOS-specific control matrix describing all provider privileges and the exact effect of the PSO exclusion setting.

### 3.2 Backup and restore are not equivalent to independent custody

The Primus backup documentation states:
- Full device backup includes partitions, user keys/objects, user credentials, PSO operators, SO operators, device security and configuration.
- Device backup creation requires SO and Genesis roles.
- Device backup restore to a different device requires Genesis role on the new device, original-device Restore Encryption PIN, backup file and restore password.
- A Decanus partition backup can be restored to another HSM using 2FA, partition backup file, restore password and a Partition Backup Card; the documentation says that card can be created by the source device SO.
- PSO access exclusion does not itself prove independent recovery or independent ability to restore onto replacement hardware.

Therefore OURSELF requires a written failure/replacement/insolvency recovery procedure that does not silently reintroduce unbounded provider control. The precise role and custody of Partition Backup Cards, Restore Encryption PINs, backup passwords, SO/Genesis actions, and replacement hardware must be contractually and operationally mapped.

### 3.3 Exit rights require a bespoke HOS order form

The standard CloudHSM service description lists partition transfer to an on-premises Primus HSM, export of keys depending on flags, migration, or deletion. The June 2026 Terms & Conditions also say portability depends on technical capability and key configuration; upon termination, partition data is deleted under the cancellation process and backup data is removed on the normal backup cycle.

The general terms and service description do not by themselves establish that every HOS customer-owned device can be physically transferred to OURSELF, that title is unencumbered, or that a provider-independent exit can be completed within a guaranteed time. These points require explicit HOS order-form terms.

### 3.4 Jurisdiction and data-center placement are not yet bound

The service description lists several CloudHSM location options and says locations depend on cluster definition and can be subject to change within the advertised country; the business-continuity site may be in Switzerland. This does not establish the location or jurisdiction of a specific proposed HOS deployment. OURSELF requires the exact physical site(s), subcontractors, backup locations, and jurisdiction to be named in the order form.

### 3.5 Independent custody remains a separate admission requirement

A PSO is a technical role, not proof that its holder is independent from endpoint administrators, founder-controlled local devices, the PORTAL signer, or the vendor. OURSELF must separately appoint and qualify an independent custodian/reviewer with documented identity, authority, separation, recontact, and recovery responsibilities.

## 4. Mandatory written vendor answers before admission

1. Confirm whether HOS is a customer-owned dedicated physical HSM purchase, with title and serial numbers vested in OURSELF's contracting entity.
2. Identify exact model, firmware, certification mode, number of devices, cluster topology, active and disaster-recovery locations.
3. Provide an HOS-specific privileged-role matrix for SO, Genesis, PSO, system administrators, datacenter operators, support staff, and subcontractors.
4. Explain exactly which device-level and partition-level operations remain possible after OURSELF disables device SO access, including all backup, restore, replacement, firmware, reset, recovery, and emergency paths.
5. Confirm whether PSO exclusion can be enforced for every device in the proposed cluster and how it is evidenced/audited.
6. Define a recovery ceremony for loss of all PSO credentials and loss/failure of the original HSM. Identify every actor, card, PIN, password, device role, and provider intervention required.
7. Confirm how OURSELF can independently back up partition data, safeguard it outside the service, and restore it to OURSELF-owned replacement hardware without provider-controlled secrets.
8. State whether partition transfer requires a source device SO, provider Genesis, provider-created Partition Backup Card, or any provider-held secret. Identify exact steps and fees.
9. Confirm key generation inside HSM, non-exportability enforcement, attestation of key origin/attributes, and audit-log availability.
10. Confirm the exact PKCS#11 API and client integration supported under HOS.
11. Bind physical sites, backup sites, subcontractors, jurisdiction, and data residency in the order form.
12. Provide contractual title, RMA/replacement, insurance, insolvency, termination, physical device retrieval, and transition rights.
13. Provide itemized pricing and lead times for one-device and redundant configurations, including Decanus and PSO licensing.
14. Confirm whether one-out-of-m PSO means independently controlled named persons and describe the supported quorum and recovery semantics.

## 5. OURSELF admission decision

**Current status: NOT_ADMITTED**

No order, purchase, service subscription, HSM provisioning, PSO ceremony, production key generation, trust-bundle signing, or production activation is authorized by this analysis.

The vendor's documented PSO exclusion is a promising technical control, but it is not sufficient by itself. OURSELF admission requires HOS-specific written evidence and an independent custodian who is not an endpoint administrator, vendor operator, or PORTAL decision signer.

## 6. Authority invariant

OURSELF authorizes its own root authority. A vendor may host and operate customer-owned hardware within a bounded service contract. A PSO may control partition security. Neither vendor operation nor possession of a PSO role automatically establishes OURSELF's independent root authority.
