# REPRESENTATION_WITNESS v0.1

Purpose: prove only what a serialized artifact actually carries. No inference from source, schema, execution context, or implementation convention.

Constitutional properties:
IDENTITY, HIERARCHY, TYPE, CARDINALITY, AUTHORITY, JURISDICTION, RELATION, VALUE.

For each property record source_present, source_value, artifact_present, observable_value, status, loss_classification.

Statuses:
PRESERVED = represented and equal.
DRIFT = represented and different.
PROPERTY_LOSS = source has property but artifact does not represent it.

Global status:
REPRESENTATION_INCOMPLETE = one or more required properties absent.
ADMIT requires complete coverage and no drift.
REJECT is used when all required properties are represented but one or more differ.

Observation doctrine:
OBSERVE != INFER
PARSE != RECONSTITUTE
SCHEMA KNOWLEDGE != ARTIFACT EVIDENCE

Ordinary parsed structure can establish observable TYPE and VALUE. Constitutional metadata is represented only through an explicit __ourself metadata envelope. The witness never copies missing source metadata into the observation.

Hashes:
semantic_hash = canonical source tree including all eight properties.
structural_hash = canonical source tree with VALUE removed.
serialization_hash = exact UTF-8 artifact bytes.

v0.1 supports JSON and a bounded YAML subset used by tests. It is not full YAML 1.2.

Required tests:
- complete preservation
- property loss
- property drift
- anti-inference
- syntax success does not imply admission
- parse-back never silently restores source-only metadata.
