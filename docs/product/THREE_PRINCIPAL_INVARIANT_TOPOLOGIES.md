# Three-Principal Invariant Topologies

Status: documentation-only research note; no runtime adoption

## Decision boundary

This note studies three-party quantum information as a formal source of
questions for three-principal governance. It does not claim that FounderLab OS,
Invariant Probability Flow (IPF), people, relationships, identity, memory, or
agent coordination are quantum systems.

The permitted inference is narrow:

> A system can require a global state description while still limiting every
> local transition through invariants that preserve remote boundaries and
> constrain how correlations are distributed.

The note must not be used as evidence for faster-than-light communication,
remote causation, retrocausality, collective consciousness, identity collapse,
or a physical theory of care. Quantum terminology never grants authority to an
IPF effect.

## Trigger claim audit

The linked
[quantum-entanglement Short](https://youtube.com/shorts/EPo0oQ4RcGA)
mixes established experiments with claims that exceed standard quantum
mechanics.

| Claim                                                                                    | Status                                         | Boundary                                                                                                                                                                                                   |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spatially separated entangled particles require a joint quantum state.                   | Verified                                       | The joint state contains correlations absent from either reduced state; "one system" does not mean one particle, person, or identity.                                                                      |
| A local spin flip makes a distant spin observably flip immediately.                      | Contradicted                                   | A trace-preserving local operation cannot change the distant marginal statistics.                                                                                                                          |
| Entanglement can provide controllable sophon-style instantaneous messaging.              | Contradicted within standard quantum mechanics | Entanglement produces nonclassical correlations, not a faster-than-light message channel. A beyond-standard-theory proposal would need independent evidence and a causality account.                       |
| Common origin in the Big Bang implies currently accessible entanglement with everything. | Unsupported                                    | Common origin alone does not prove present-day operational entanglement between arbitrary subsystems. Environment coupling, decoherence, thermalization, and entanglement-distribution constraints matter. |
| Long-distance Chinese quantum experiments demonstrate the remote-control claim.          | Contradicted                                   | Satellite experiments distribute entangled photons and quantum keys over long distances; they do not demonstrate controllable remote state changes or faster-than-light signalling.                        |

The 2022 Nobel Prize background documents Bell tests beginning with Clauser and
Freedman's 1972 experiment, followed by Aspect's tests and later quantum
information work. The relevant history therefore predates the Short's
mid-1990s starting point.

## Quantum reference model

This section records the external mathematics being used as inspiration. It is
not part of protocol `0.1.0` and is not implemented by the TypeScript harness.

### Joint state and local views

For three quantum subsystems $A$, $B$, and $C$, a density operator must
satisfy

```math
\rho_{ABC}\succeq 0,
\qquad
\operatorname{Tr}(\rho_{ABC})=1.
```

The state visible to $B$ and $C$ is the reduced state

```math
\rho_{BC}=\operatorname{Tr}_A(\rho_{ABC}).
```

The reduced states do not generally determine the complete joint state.
Closed-system unitary evolution preserves the spectrum of the full density
operator. Local unitaries also preserve the spectra of the reduced density
operators and the entanglement class.

### No-signalling

For any trace-preserving local quantum channel $\mathcal E_A$,

```math
\operatorname{Tr}_A
\left[(\mathcal E_A\otimes I_{BC})(\rho_{ABC})\right]
=\rho_{BC}.
```

A local choice at $A$ can alter conditional correlations revealed after
results are compared, but it cannot alter the statistics directly available
at $B$ or $C$. Classical communication remains necessary to compare the
outcomes.

### Three-qubit entanglement distribution

For a pure three-qubit state, the Coffman--Kundu--Wootters relation is

```math
C^2_{A|BC}=C^2_{AB}+C^2_{AC}+\tau_{ABC},
```

where $C$ is concurrence and $\tau_{ABC}$ is the residual three-tangle.
Equivalently,

```math
C^2_{AB}+C^2_{AC}\le C^2_{A|BC}.
```

This monogamy relation prevents one qubit from being maximally pairwise
entangled with multiple independent parties at once. It is a physical
resource constraint, not a psychological or governance coefficient.

### Inequivalent GHZ and W structures

Two canonical states represent inequivalent classes of genuine three-qubit
entanglement under stochastic local operations and classical communication:

```math
|\mathrm{GHZ}\rangle=
\frac{|000\rangle+|111\rangle}{\sqrt 2},
```

```math
|W\rangle=
\frac{|001\rangle+|010\rangle+|100\rangle}{\sqrt 3}.
```

For the canonical GHZ state, $\tau_{ABC}=1$ while all pairwise concurrences
vanish. Tracing out one party leaves the remaining pair unentangled. For the
canonical W state, $\tau_{ABC}=0$, each pair has nonzero concurrence, and
pairwise entanglement survives the loss of one party.

The distinction demonstrates that the same number of participants and the
same global label do not determine the dependency topology or its response to
loss. It does not justify importing GHZ or W labels into the IPF runtime.

## Governance translation contract

The software translation preserves structural questions, not quantum
semantics:

| Quantum-information question                             | Governance question                                                                                                                         | Required boundary                                                          |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| What information exists only in the joint state?         | Which authorization decision requires the complete three-principal envelope?                                                                | A global envelope cannot erase principal-local facts or rights.            |
| Which transformations preserve remote marginals?         | Which proposed effects preserve every non-target principal's protected state?                                                               | No remote write without that principal's explicit authority.               |
| Which quantities cannot increase under local operations? | Which risk, authority, or dependency budgets must not expand during resolution?                                                             | Forecasts and correlations never create authority.                         |
| How is correlation distributed among three parties?      | Which effects are global, pairwise, or principal-local, and what evidence does each require?                                                | Correlation is neither consent nor a causal signal.                        |
| What happens when one subsystem is lost?                 | Which effects must revoke, and which independently authorized effects may remain valid, when one observer or principal becomes unavailable? | Loss behavior must be declared and tested, never inferred from a metaphor. |
| Are two multipartite structures mutually convertible?    | May one dependency topology be silently promoted into another?                                                                              | Topology changes require a new proposal, evidence, authority, and receipt. |

### Neutral topology vocabulary

Any future formal model should use governance-native names rather than quantum
labels:

- `fragile_global_dependency`: the global effect requires current evidence and
  authority from all three principals; removing one required dependency holds
  that global effect.
- `loss_resilient_distributed_dependency`: a separately authorized pairwise or
  local effect may survive loss of a non-required third dependency; global
  effects still require their own complete authority envelope.

These names describe dependency and revocation behavior only. They are not
implementations of GHZ or W states and do not inherit quantum properties.

## Candidate three-principal invariants

These are formal-model targets, not runtime claims:

1. **Principal distinctness:** $p_A$, $p_B$, and $p_C$ remain separate
   principals with independent consent, protected-state, and exit coordinates.
2. **Local authority preservation:** if effect $e$ does not name principal
   $p_j$ as an authorized target, then its local projection is unchanged:

   ```math
   p_j\notin\operatorname{targets}(e)
   \Rightarrow
   \pi_j(T_e(s))=\pi_j(s).
   ```

3. **Authority non-expansion:** a joint correlation, forecast, dependency, or
   topology declaration cannot create a missing grant.
4. **Dependency closure:** every allowed effect includes all of its required
   evidence, action, lease, and principal-authority dependencies.
5. **Revocation soundness:** loss or expiry invalidates the complete transitive
   dependent closure, but not an independently authorized effect that did not
   depend on the lost node.
6. **Topology non-equivalence:** converting between fragile-global and
   loss-resilient-distributed dependency requires a new receipted transition;
   shared participant count is never sufficient.
7. **Observation non-causation:** observing correlation changes evidence, not
   remote authority or protected state.
8. **Replay determinism:** identical canonical state, topology declaration,
   dependency graph, authority envelope, and resolution time produce the same
   decision receipt.

## Falsification surface

A future formal model must fail closed if any of these cases succeeds:

- a principal-local operation changes another principal's protected state
  without an explicit authorized effect;
- a correlation or shared history is treated as consent, authority, or a
  controllable communication channel;
- a fragile-global effect remains allowed after a required principal,
  observation, lease, or dependency is revoked;
- an independently authorized pairwise effect is revoked solely because an
  unrelated third principal is unavailable;
- a topology is converted because it has the same number of principals;
- a quantum citation is attached to a receipt as proof that a governance
  effect is safe or authorized;
- a three-principal model collapses distinct identities, interpretations,
  rights, or exit paths;
- a claim about consciousness, love, retrocausality, or physical entanglement
  enters the product claim surface.

## Adoption boundary

### Phase 0 — research note (implemented)

- Preserve the current two-principal IPF `0.1.0` schema and runtime behavior.
- Preserve TET Noesis and Lyzt ownership boundaries.
- Record the physics claims, structural analogy, candidate invariants, and
  falsification tests without adding executable behavior.

### Phase 1 — formal governance model (not approved or implemented)

- Define a separate three-principal schema namespace with neutral topology
  names.
- Prove principal locality, authority non-expansion, dependency closure,
  revocation soundness, topology non-equivalence, and replay determinism.
- Add property tests for principal removal, observer expiry, and dependency
  revocation.
- Do not reuse quantum coefficients, probabilities, entanglement measures, or
  state-transition rules.

### Phase 2 — product evaluation (separate gate)

- Require an explicit user need that cannot be represented by the existing
  two-principal protocol.
- Add UI, schema, receipt, accessibility, privacy, and rights review together;
  no invisible backend-only adoption.
- Require independent scientific and governance review before describing the
  analogy in public product language.

## Primary references

- The Royal Swedish Academy of Sciences,
  [The Nobel Prize in Physics 2022: popular information](https://www.nobelprize.org/prizes/physics/2022/popular-information/).
- G. Brassard, H. Buhrman, N. Linden, A. A. Méthot, A. Tapp, and F. Unger,
  [Limit on nonlocality in any world in which communication complexity is not trivial](https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.96.250401).
- V. Coffman, J. Kundu, and W. K. Wootters,
  [Distributed entanglement](https://arxiv.org/abs/quant-ph/9907047).
- W. Dür, G. Vidal, and J. I. Cirac,
  [Three qubits can be entangled in two inequivalent ways](https://journals.aps.org/pra/pdf/10.1103/PhysRevA.62.062314).
- W. H. Zurek,
  [Decoherence, einselection, and the quantum origins of the classical](https://journals.aps.org/rmp/abstract/10.1103/RevModPhys.75.715).
- J. Yin et al.,
  [Entanglement-based secure quantum cryptography over 1,120 kilometres](https://www.nature.com/articles/s41586-020-2401-y).
