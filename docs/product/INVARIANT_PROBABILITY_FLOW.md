# Invariant Probability Flow Protocol

Status: implemented local research harness, protocol `0.1.0`

## Nucleus

Invariant Probability Flow (IPF) is a distributional extension of Admissible
Transition Calculus. It forecasts uncertain state, measures probability flux
across protected boundaries, applies authority and invariant gates, authorizes
only a dependency-closed subset of effects, and receipts the complete lineage
needed for deterministic replay.

The protocol governs a forecast; it does not treat a forecast as authority. It
is not a PDE for love, a fifth force, a retrocausal channel, a consciousness
claim, or validated psychology.

The separate
[`Three-Principal Invariant Topologies`](./THREE_PRINCIPAL_INVARIANT_TOPOLOGIES.md)
research note uses multipartite quantum information only as formal inspiration
for dependency, locality, and revocation questions. It does not change protocol
`0.1.0`, import quantum semantics, or authorize a three-principal runtime.

## State and flow equations

Let the uncertain state be

```math
x_t = (i_t, a_t, \ell_t, m_t, r_t),
```

where the coordinates denote identity, affect, liability, memory, and
relationship state. A future runtime may estimate a density $\rho(x,t)$. The
governed controlled Fokker--Planck form is

```math
\frac{\partial \rho}{\partial t}
= -\nabla \cdot ((f(x,t)+G(x,t)u_t)\rho)
+ \frac{1}{2}\sum_{j,k}\partial_{jk}(D_{jk}(x,t)\rho).
```

The probability current is

```math
J_i(x,t;u)= (f_i+(Gu)_i)\rho
- \frac{1}{2}\sum_j\partial_j(D_{ij}\rho),
\qquad
\frac{\partial\rho}{\partial t}=-\nabla\cdot J.
```

For a protected set $B_q$ with outward normal $n$, the outward flux and
first-passage exposure are

```math
\Phi_q(u,H)=\int_0^H\int_{\partial B_q}\max(0,J\cdot n)\,dS\,dt,
\qquad
F_q(u,H)=\Pr(\tau_{B_q}\le H).
```

An effect is boundary-admissible only when

```math
\Phi_q \le \bar\Phi_q,
\quad F_q \le \bar F_q,
\quad \operatorname{Authority}_q=1.
```

for every boundary it touches. Protocol `0.1.0` accepts calibrated flux and
first-passage summaries as input; it does not yet estimate them from time
series.

## Distributional TET resolve

For candidate effect $e$, the local risk score is

```math
R(e)=w_T T_e+w_F F_e+w_I\Delta I_e+w_R(1-\operatorname{rev}_e)
+w_U U_t,
```

where $T_e$ is tail risk, $F_e$ is first-passage exposure, $\Delta I_e$ is
identity drift, $\operatorname{rev}_e$ is reversibility, and $U_t$ is current
uncertainty. Utility is displayed but deliberately does
not subtract from risk.

Let $D(e)$ be action dependencies and $N(e)$ evidence, plan, certificate, or
lease dependencies. The authorized set $A$ must satisfy

```math
e\in A \Rightarrow
D(e)\subseteq A
\land N(e)\cap V_t=\varnothing
\land R(e)\le\bar R
\land \bigwedge_q \operatorname{BoundaryOK}_q(e)
\land \operatorname{Authority}(e).
```

The resolver evaluates dependencies recursively, rejects cycles, and returns
`allow_all`, `allow_partial`, or `hold`. This is what permits a reversible repair
draft while holding an unauthorized identity rewrite in the same forecast.

Every dependency, boundary, reduction, principal, and action reference is
validated before resolution. Observer and dependency-node identifiers share one
addressable namespace, duplicate references are rejected, and a relationship
effect must name both principals. Dependency-node evidence chains must also be
acyclic. A malformed, dangling, or circular reference therefore cannot become
an accidental authorization path.

## Liability-gated identity promotion

Canonical identity promotion is allowed only if

```math
P_I =
\operatorname{requested}
\land \neg\operatorname{transientSource}
\land \operatorname{explicitAuthority}
\land C_t=0
\land L_t=0,
```

where $C_t$ counts unresolved contradictions and $L_t$ counts unresolved
trust liabilities. Transient affect may become evidence; it cannot directly
rewrite canonical identity.

## Witness-preserving reduction

For reduction $z=Qx$ and reconstruction $\hat x=Rz$, a certificate requires

```math
\lVert x-\hat x\rVert_W\le\varepsilon,
```

plus explicit retention of dissent, negative evidence, and every required
rights coordinate. Missing any witness or exceeding $\varepsilon$ fails the
certificate.

The two 144-cardinality systems are separate protocol namespaces:

- `personality_interaction_144` is the personality interaction factor system.
- `identity_bloom_12x12` is Identity Bloom's 12 by 12 behavioral graph.

They have separate semantic roles, witness sets, error certificates, and
adapters. Equal cardinality never permits merging or translating coordinates.
All current weights and thresholds are research scaffolding, not validated
psychology.

## Observer-lag revocation

For observer $o$ with expiry $t_o^{\mathrm{exp}}$, lag contributes uncertainty

```math
U_t=\min\left(1,U_0+\sum_o \omega_o
\mathbf 1[t\ge t_o^{\mathrm{exp}}]\right).
```

Let the dependency graph contain edge $a\rightarrow b$ when $a$ depends on
$b$. The invalidation closure is

```math
V_t=\operatorname{TC}^{-1}
\left(\{o:t\ge t_o^{\mathrm{exp}}\}\right).
```

Therefore stale evidence invalidates every dependent evidence item, plan,
certificate, lease, and effect. No dependent can remain authorized by copying
an earlier decision.

## Autonomy-preserving care flow

Care is modeled over immediate, repair, and commitment horizons. It is a causal
continuity record: durable care, commitments, repair, and memory may shape a
present proposal. It is not a reward for maximizing attachment.

For distinct principals $p_1\ne p_2$, every authorized relationship effect
must satisfy

```math
\operatorname{consent}(p_j)=1,
\quad \operatorname{exit}(p_j)=1,
\quad h_k\le\bar h,
\quad b_k\ge\underline b
```

for both principals and every timescale $k$. Care, commitment, or repair
scores cannot compensate for missing consent, agency, safety, truthfulness, or
the right to exit.

Historical events are immutable. Each event carries an immutable fact digest.
Its interpretation may advance through numbered revisions, but changing the
fact digest changes the replay input and invalidates the earlier receipt.

## Proof-carrying receipt

Each local receipt contains:

- input replay digest and resolution time;
- base and observer-adjusted uncertainty;
- expired observers and the transitive invalidation closure;
- identity-promotion decision and liabilities;
- protected-boundary flux decisions;
- separate reduction certificates and errors;
- two-principal autonomy decision;
- authorized effects and blocked effects with machine-readable reasons;
- observer, dependency, boundary, reduction, principal, memory-fact, and action
  lineage.

The current browser harness uses a deterministic FNV-1a 64-bit replay digest.
It detects ordinary input drift and supports exact local replay; it is not a
cryptographic signature. Canonical input uses `ipf-json-sorted-v1`: recursively
sort object keys by Unicode code-unit order, preserve array order, use JSON
number/string encoding, and omit only the top-level receipt history. The Lyzt
adoption phase must carry the complete proof bundle in its SHA-256 receipt
chain and signing boundary. See
[`IPF_LYZT_INTEROP.md`](../architecture/IPF_LYZT_INTEROP.md).

## Ranked claim surface

From strongest and most defensible to most speculative:

1. Governed composition of distributional forecasting, protected-boundary
   flux, authority, partial execution, dependency closure, and replay receipts.
2. Liability-gated promotion preventing transient state from silently becoming
   canonical identity.
3. Observer-expiry uncertainty plus transitive revocation of dependent
   certificates and leases.
4. Witness-preserving reduction with rights coordinates and a reconstruction
   error certificate.
5. Two-principal care constraints that preserve consent, agency, and exit over
   several timescales.
6. Domain-specific predictive usefulness of any current coefficient or 144
   weight. This remains unvalidated and must not be marketed as established.

The underlying Fokker--Planck representation, distribution-valued traits,
stochastic affect, and nonlinear relationship dynamics are prior-art context.
The proposed novelty is the governed composition and transition lineage, not
the existence of those mathematical tools.

## Theorem targets

These are proof targets, not claims already proved by the TypeScript harness:

1. **Authority non-expansion:** resolution never grants authority absent from
   the input envelope.
2. **Dependency closure:** every authorized effect contains all authorized
   action dependencies.
3. **Boundary soundness:** no authorized effect references a boundary whose
   flux, first-passage, or authority limit fails.
4. **Revocation soundness:** every transitive dependent of an expired observer
   is excluded from authorization.
5. **Identity non-promotion:** transient affect, contradiction, liability, or
   missing authority is sufficient to prevent canonical promotion.
6. **Reduction witness preservation:** a certified reduction retains all named
   witness classes and rights coordinates within its error bound.
7. **Principal separability:** care flow cannot collapse two principals or
   remove either exit right.
8. **Replay determinism:** identical canonical input and resolution time
   produce an identical complete receipt.
9. **Referential integrity:** no effect or dependency node reaches resolution
   with a dangling, duplicated, or cross-namespace reference.

## Falsification surface

The implementation must fail closed when any of these tests succeeds:

- high utility overrides excess tail or first-passage risk;
- a transient emotion directly rewrites canonical identity;
- a reduction drops dissent, negative evidence, or a rights coordinate;
- the personality and Identity Bloom 144 systems share a namespace;
- an expired observer leaves a dependent lease usable;
- a dangling dependency node, boundary, reduction, principal, or action
  reference reaches the resolver;
- a relationship effect omits either principal and bypasses autonomy checks;
- an action-dependency cycle is reported only as a generic held dependency;
- strong care or attachment overrides missing consent or exit;
- editing an input still replays an old receipt;
- editing historical fact identity preserves the old receipt;
- a dependent effect is allowed while its prerequisite is held;
- a boundary is crossed without the required authority.

`src/lib/probability-flow.test.ts` exercises these cases at the local protocol
layer. Formal-model and signed-runtime tests remain adoption gates.

## Patent-style nucleus

A computer-implemented transition protocol comprising:

1. receiving a distributional forecast over plural protected state domains;
2. computing or receiving probability-current and first-passage summaries for
   protected boundaries;
3. binding those summaries to evidence freshness, identity liabilities,
   reduction witnesses, principal autonomy, and an authority envelope;
4. selecting an authorized dependency-closed proper subset of proposed effects
   according to tail risk, identity drift, reversibility, and boundary limits;
5. transitively revoking dependent plans, certificates, leases, and effects
   when an observation expires or contradicts the forecast; and
6. emitting a replayable lineage receipt that identifies both authorized and
   withheld effects and all material dependencies.

Patent review must distinguish this composition from the underlying stochastic
models and must not claim validated psychological inference.

## Adoption phases

### Phase 0 — boundary and contract

- Preserve TET Noesis as the authority owner.
- Preserve Lyzt's signed transition microkernel as the effect/receipt owner.
- Keep the two 144 systems in separate namespaces.

### Phase 1 — local operational harness (implemented)

- Strict Zod protocol, deterministic resolver, partial authorization, replay,
  observer revocation, reductions, care constraints, UI editing, local
  persistence, and embedded Noesis receipt.
- No model fitting, remote inference, live effect adapter, or production claim.

### Phase 2 — Lyzt microkernel adoption

- Add an optional, versioned probability-flow readout to the allow-listed
  `ip/governance-microkernel/transition-payload.ts` codec. Do not use Lyzt's
  unrelated Territory/Epoch `tet.ts` or the frozen `tet-bridge.ts`.
- Verify and gate the proof in a canonical `server/governance/probability-flow`
  module exported only through `server/governance/kernel-api`.
- Canonicalize before `buildV2Payload`; preserve byte identity when the field is
  absent. Receipt v3 then hashes the entire v2 base; this hash is not itself a
  signature.
- Bind the selected effect IDs—not merely the scenario—to the existing semantic
  lease and commit chokepoint. Selection must be a subset of the receipted,
  dependency-closed authorized effect IDs.
- Project the canonical-input and complete-bundle SHA-256 commitments into
  Lyzt's existing receipt-v2 signed-field manifest, derive the signed-fields
  hash after attachment, and use the existing Ed25519 governance signer. A
  leaf-only extension is not sufficient.
- Add tamper, rollback, and TLA+ non-expansion checks.
- Do not adopt in a concurrently edited Lyzt worktree.

### Phase 3 — domain adapters

- Current FounderLab source discovery found no canonical implementation of
  either named 144 system outside this contract. Do not fabricate dimension
  names, weights, or equivalence mappings; register each real source owner and
  calibration artifact before wiring an adapter.
- Add a personality-interaction adapter and an Identity Bloom adapter as
  separate packages with separate schemas and calibration datasets.
- Add memory-event interpretation revisions without fact mutation.
- Add human-facing liability resolution and principal consent surfaces.

### Phase 4 — estimation and validation

- Fit forecast and first-passage estimators only from consented, governed data.
- Register calibration error, subgroup failure, drift, and abstention tests.
- Validate or replace every research coefficient before psychological use.
- Preserve `HOLD` when evidence is stale, out of distribution, or not
  independently verifiable.

### Phase 5 — protected rollout

- Sandbox and shadow evaluation only.
- Independent security, rights, and scientific review.
- Human approval, canary, monitoring, rollback, and signed production receipts.
- Production publication remains a separate explicit gate.
