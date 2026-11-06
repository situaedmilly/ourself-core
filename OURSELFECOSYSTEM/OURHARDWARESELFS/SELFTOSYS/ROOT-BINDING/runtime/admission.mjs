export const PREDICATES = Object.freeze(Array.from({length:12}, (_,i) => 'H'+String(i+1).padStart(2,'0')));
export const ROLES = Object.freeze(['custodianAId','custodianBId','approverAId','approverBId','independentWitnessId','rootHardwareAdminId','rootEndpointAdminId','portalSignerId']);
const present = v => typeof v === 'string' && v.trim().length > 0;
export function evaluateRootBinding(b) {
  const blockers=[];
  if (!b || typeof b !== 'object' || Array.isArray(b)) return {decision:'BLOCKED',state:'UNBOUND',blockers:['binding:not_an_object']};
  if (b.state !== 'QUALIFICATION') blockers.push('state:not_qualification');
  if (!present(b.hardware?.assetId)) blockers.push('hardware:asset_identity_missing');
  if (!present(b.hardware?.protectedBoundaryRef)) blockers.push('hardware:protected_boundary_evidence_missing');
  if (b.hardware?.ownershipStatus !== 'VERIFIED') blockers.push('hardware:ownership_not_verified');
  const ps=Array.isArray(b.qualification?.predicates)?b.qualification.predicates:[];
  const byId=new Map(ps.map(p=>[p?.predicateId,p]));
  for (const id of PREDICATES) {
    const p=byId.get(id);
    if (!p) { blockers.push('predicate:'+id+':missing'); continue; }
    if (p.status !== 'PASS') blockers.push('predicate:'+id+':not_pass');
    if (!Array.isArray(p.evidenceRefs)||!p.evidenceRefs.length||!p.evidenceRefs.every(present)) blockers.push('predicate:'+id+':evidence_missing');
    for (const k of ['method','observedAt','observerId','independentReviewerId','contentDigest']) if (!present(p[k])) blockers.push('predicate:'+id+':'+k+'_missing');
    if (present(p.observerId)&&p.observerId===p.independentReviewerId) blockers.push('predicate:'+id+':reviewer_not_independent');
  }
  if (ps.length!==12||byId.size!==12) blockers.push('predicates:cardinality_or_uniqueness_invalid');
  if (b.qualification?.allPredicatesPassed!==true) blockers.push('qualification:all_predicates_not_attested');
  if (b.qualification?.independentReviewComplete!==true) blockers.push('qualification:independent_review_incomplete');
  const rv=ROLES.map(k=>b.roles?.[k]);
  if (rv.some(v=>!present(v))) blockers.push('roles:required_principal_missing');
  if (rv.every(present)&&new Set(rv).size!==ROLES.length) blockers.push('roles:separation_collision');
  if (b.roles?.separationEvidenceStatus!=='VERIFIED') blockers.push('roles:separation_evidence_not_verified');
  if (b.quorum?.status!=='ENFORCED'||!present(b.quorum?.evidenceRef)) blockers.push('quorum:not_enforced_or_unproven');
  if (b.recovery?.status!=='INDEPENDENTLY_TESTED'||!present(b.recovery?.evidenceRef)) blockers.push('recovery:not_independently_tested');
  const t=b.transport||{};
  if (t.status!=='VERIFIED') blockers.push('transport:not_verified');
  for (const k of ['exactEndpoint','protocol','rootTrustAnchorRef','clientIdentityRef','evidenceRef']) if (!present(t[k])) blockers.push('transport:'+k+'_missing');
  if (t.mutualAuthentication!==true) blockers.push('transport:mutual_authentication_not_verified');
  const c=b.liveChallenge||{};
  if (c.status!=='VERIFIED'||c.signatureVerified!==true||c.independentVerification!==true) blockers.push('challenge:not_independently_verified');
  for (const k of ['challengeId','nonce','rootIdentity','verifierIdentity','signatureRef','independentVerificationRef','evidenceDigest']) if (!present(c[k])) blockers.push('challenge:'+k+'_missing');
  if (c.nonceConsumed!==true) blockers.push('challenge:nonce_not_single_use');
  const expiry=Date.parse(c.expiresAt), verified=Date.parse(c.verifiedAt);
  if (!Number.isFinite(expiry)||!Number.isFinite(verified)||verified>expiry) blockers.push('challenge:invalid_or_expired_time_window');
  return blockers.length ? {decision:'BLOCKED',state:b.state,blockers:[...new Set(blockers)]} : {decision:'ADMITTED',state:'ADMITTED',blockers:[]};
}
export function transitionRootBinding(state,event) {
  const table={UNBOUND:{OPEN_INTAKE:'EVIDENCE_INTAKE'},EVIDENCE_INTAKE:{SUBMIT_FOR_QUALIFICATION:'QUALIFICATION',REJECT_EVIDENCE:'REJECTED'},QUALIFICATION:{REJECT_EVIDENCE:'REJECTED'},REJECTED:{OPEN_NEW_INTAKE:'EVIDENCE_INTAKE'},ADMITTED:{}};
  const next=table[state]?.[event];
  return next ? {accepted:true,state:next} : {accepted:false,state,reason:'transition_not_permitted'};
}
