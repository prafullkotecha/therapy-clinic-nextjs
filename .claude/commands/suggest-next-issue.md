---
description: Analyze project status and suggest next issue to work on
---

# Suggest Next Issue

Analyze the current project state and recommend the best next issue to work on.

## Instructions

1. **Query project board**:
   ```bash
   gh project item-list 1 --owner prafullkotecha --format json --limit 100
   ```

2. **Categorize issues by status**:
   - ✅ Done: Completed issues
   - 🎯 Sprint Ready: Issues ready to start (dependencies satisfied)
   - 📋 Backlog: Future work
   - 🚧 In Progress: Currently being worked on

3. **Analyze "Sprint Ready" issues**:
   - Check if dependencies are in "Done" status
   - Consider phase progression (Phase 1 → 2 → 3 → 4 → 5 → 6)
   - Evaluate foundational vs feature work
   - Consider HIPAA compliance priorities

4. **Recommendation criteria** (in order):
   - **Dependencies satisfied**: All prerequisite issues must be Done
   - **Foundational first**: Infrastructure before features
   - **Phase order**: Complete lower phases before higher ones
   - **Critical path**: Issues blocking other work
   - **HIPAA compliance**: Security/compliance issues are high priority

5. **Output format**:
   ```
   ## Recommended Next Issue: #X - Issue Title

   **Phase:** Phase N
   **Status:** Sprint Ready
   **Priority:** Critical/High/Medium

   **Why this issue:**
   - [Dependency satisfaction explanation]
   - [Strategic importance]
   - [What it enables next]

   **Dependencies:**
   - ✅ #A: Dependency Name (Done)
   - ✅ #B: Another Dependency (Done)

   **What this unlocks:**
   - Issue #X (description)
   - Issue #Y (description)

   **Alternatives:**
   - #Z: Alternative Title (reasoning if this might be better)

   **Estimated effort:** X days/weeks
   ```

6. **Provide context**:
   - Show current phase completion status
   - List other Sprint Ready issues
   - Explain why alternatives weren't chosen

## Decision Tree

```
Are there Sprint Ready issues?
├─ YES → Check Phase 2 issues first (foundational)
│   ├─ #26 Multi-Tenancy? → Recommend (blocks most other work)
│   ├─ #9 PHI Encryption? → Recommend (needed for PHI storage)
│   └─ #6/#7 Models? → Recommend only if #26 done
├─ NO Sprint Ready → Check Backlog for issues with satisfied deps
    └─ Suggest moving to Sprint Ready

Current phase priority order:
1. Phase 2: Database foundation (multi-tenancy, encryption, models)
2. Phase 3: Auth/RBAC (hooks, middleware, audit logging)
3. Phase 4: Core features (profiles, matching, scheduling, notes)
4. Phase 5: HIPAA compliance (comprehensive audit, encryption at rest, security)
5. Phase 6: Launch prep (UAT, testing, documentation, deployment)
```

## Remember

- **Foundation first**: Multi-tenancy (#26) and PHI encryption (#9) are critical
- **Phase order matters**: Don't jump ahead to Phase 4 if Phase 2 isn't complete
- **Dependencies block work**: Don't recommend issues with unmet dependencies
- **Be specific**: Explain exactly why this issue is the right choice now
