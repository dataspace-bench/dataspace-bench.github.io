# DataSpace Leaderboard Submission Guidelines

DataSpace evaluates data agents on 410 analytical tasks over heterogeneous, task-local workspaces. This guide describes the required package and disclosure requirements for adding a result to the public leaderboard.

## 1. Before you submit

- Run your system on the complete DataSpace benchmark release without accessing private reference outputs or evaluator configurations.
- Produce **one `prediction.csv` and one execution trace for each of the 410 tasks**.
- Preserve an auditable trace for each task, including model usage and cost records, retries, and the final-result selection process when applicable.
- Calculate costs using the **official public list prices** published by the corresponding model providers.
- Remove API keys, credentials, private URLs, and personal data from all submitted files.
- Verify the 60 public-reference tasks with the official evaluator before packaging your run.

## 2. Prediction format

Use the directory structure documented in the DataSpace repository:

```text
predictions/
└── task_N/
    └── prediction.csv
```

Each task directory must contain **exactly one final `prediction.csv`** with the complete table returned by the system. Prediction headers and column order are not scored, but row associations and values must be preserved. Missing or malformed predictions count as incorrect for the affected task.

## 3. Submission package

**Required package:** The ZIP archive must contain at least `metadata.json`, `predictions/`, and `traces/`:

```text
method-name.zip
├── metadata.json
├── predictions/
│   └── task_N/prediction.csv
└── traces/
    └── task_N/trace.json
```

Every task ID under `predictions/` **must have a matching task ID** under `traces/`. Additional supporting files may be included but do not replace any of the three required components.

### `metadata.json`

Use the following structure. The values below are illustrative:

```json
{
  "schema_version": "1.0",
  "method_name": "ExampleAgent + Backbone-Model",
  "organization": "Example Organization",
  "submission_date": "2026-08-09",
  "contact": {
    "name": "First Last",
    "email": "name@example.org"
  },
  "backbone_models": [
    {
      "provider": "Provider Name",
      "model": "model-name",
      "version": "exact-version-or-snapshot"
    }
  ],
  "cost": {
    "currency": "USD",
    "task_count": 410,
    "total_usd": 69.29,
    "average_per_task_usd": 0.169,
    "pricing_date": "2026-08-09",
    "pricing_sources": [
      {
        "provider": "Provider Name",
        "url": "https://provider.example/official-pricing",
        "accessed_date": "2026-08-09"
      }
    ]
  },
  "paper_url": null,
  "code_url": null
}
```

Metadata requirements:

- We recommend the display format **`<Method Name> + <Backbone Model>`**, for example, `ExampleAgent + Backbone-Model`. For systems using multiple backbone models, name the primary backbone in the method name and list every model under `backbone_models`.
- Use the **exact provider, model identifier, and version or dated snapshot** used in the submitted run.
- Use ISO 8601 dates in `YYYY-MM-DD` format.
- **`cost.total_usd` must equal the sum of the task-level cost totals** reported across all 410 traces. `cost.average_per_task_usd` must equal `cost.total_usd / 410`, including failed tasks and all retries. Submit unrounded values where possible; the leaderboard may round them for display.
- `paper_url` and `code_url` must be **publicly accessible without authentication**. Use `null` when a resource is not public.
- Additional metadata fields may be included, but the required fields and types above must remain unchanged.

### Execution traces

**Flexible format:** The internal structure of `trace.json` is not prescribed, and field names and nesting are up to the submitting team. **Required evidence:** Every trace must still contain enough information to review the run and verify its token usage and cost.

Across each task trace, include:

- the task ID and the exact provider and model version used;
- token usage or other provider-native billable units for model calls, including applicable input, output, cached, reasoning, image, audio, video, or other usage categories;
- cost records for the model calls and retries, together with a task-level cost total that can be reconciled with `metadata.json`;
- the model and tool interactions needed to understand how the final prediction was produced; and
- when multiple candidate runs are used, sufficient evidence of the autonomous selection or aggregation process.

Timestamps are **strongly recommended** because they make a trace easier to verify. When available, use ISO 8601 UTC timestamps for task start and end, model and tool calls, retries, candidate generation, and final selection. Provider-native logs may be submitted directly if they contain the required usage and cost information. Do not invent token equivalents for non-token billing units, and do not double-count overlapping usage fields.

### Cost calculation policy

- Price every hosted model call using the **official public list price** published by its provider, such as OpenAI, Google, Anthropic, or DeepSeek, and applicable on `cost.pricing_date`.
- Use the rate for the **exact model and request mode** used, including any applicable context-length tier, cache rate, batch rate, or multimodal billing unit.
- Calculate leaderboard cost from official list prices even when the submitter used free credits, enterprise discounts, promotional pricing, or a reseller rate.
- Include all model calls made during the 410-task run, including failed calls and retries. Itemize other paid APIs or services separately and include them in the task-level cost total.
- Every provider used in the traces must have an official pricing URL in `cost.pricing_sources`. If no official public price exists, contact the DataSpace team before submitting rather than using a third-party estimate.
- The task-level cost totals across all 410 traces **must reconcile with `metadata.json`**.

Do not include secrets. Redact credentials and private service details while preserving the information needed to review the run.

## 4. Multiple runs and final-result selection

Participants may conduct multiple runs for the same task using different prompts, methods, frameworks, tools, or models. Multiple runs are permitted only under the following conditions:

- Submit **exactly one final `prediction.csv`** for each task. The official evaluator considers only this final file.
- When multiple candidate results are generated, the final result must be selected or aggregated **autonomously by the submitted system** using a predefined protocol, such as majority voting, self-consistency, or a fixed model-based selection procedure.
- Declare the selection protocol before evaluation and describe it in the submitted trace. The protocol **must not depend on reference answers, evaluator feedback, or task-specific human judgment**.
- **Do not manually select, edit, replace, or retain a candidate** because it appears closer to a known or expected answer.
- Preserve sufficient trace evidence for every candidate run considered by the selection procedure, including its usage and cost and how the autonomous final selection was made. Candidate identifiers and timestamps are strongly recommended. Logs should be generated during execution rather than reconstructed after evaluation.
- **Post-hoc replacement** of a submitted prediction after inspecting evaluator output is not permitted.

**Eligibility rule:** A submission that uses manual answer-informed selection, omits relevant candidate runs, or submits multiple final results for a task is ineligible for the leaderboard and may be removed if the violation is discovered after publication.

## 5. Evaluation and review

1. The organizers check that the archive is complete and readable.
2. Predictions are evaluated against the private 410-task reference set with the frozen official evaluator.
3. Trace evidence for final-result selection is checked for compliance with the autonomous-selection policy.
4. The metadata summary is reconciled against the token and cost records in all 410 traces; representative full traces may also be manually reviewed.
5. The team may contact the submitter to resolve missing information or reproducibility questions.
6. After confirmation, the result is added to the public leaderboard.

The primary ranking metric is **Task Accuracy**. Ties may be displayed with the same rank; cost is reported for context and is not currently a ranking metric.

## 6. Leaderboard entry

The public entry is expected to include:

- method and backbone;
- organization;
- Task Accuracy;
- average cost per task;
- paper or technical report;
- code or reproducibility materials;
- evaluation month.

The DataSpace team may add a note when a field is unavailable or when a result uses a materially different evaluation setting.

## 7. Fair-use and disclosure rules

- **Do not use private reference outputs, leaked answers, or private evaluator configurations.**
- **Do not manually select or edit final results.** Disclose any other human operational intervention, external retrieval, proprietary tools, and retries.
- Submit one clearly identified configuration per entry; materially different configurations should use separate entries.
- Results must be attributable to a real team or organization with a working contact address.
- The organizers may request additional evidence when a result cannot be interpreted from the package.

## 8. Submission checklist

- [ ] Exactly one final prediction is included for each of the 410 tasks
- [ ] 410 matching end-to-end traces included
- [ ] Trace timestamps are included where available (strongly recommended)
- [ ] Sufficient evidence for all candidate runs and autonomous final selection is retained when multiple runs are used
- [ ] Final-selection protocol is predefined and disclosed
- [ ] Public 60-task evaluation completed successfully
- [ ] Metadata follows the required JSON structure
- [ ] Recommended method naming format includes the backbone model
- [ ] Provider and exact model versions are pinned
- [ ] Average cost is calculated across all 410 tasks
- [ ] Official provider pricing sources and dates are included
- [ ] Traces contain sufficient token or billable-usage and cost records for review
- [ ] Secrets and credentials removed
- [ ] Paper and code links are publicly accessible or set to `null`
- [ ] Archive opens correctly

## 9. How to submit

Email the completed submission package to **[dataspace.bench@gmail.com](mailto:dataspace.bench@gmail.com)**.

Use the subject line **`[DataSpace Leaderboard Submission] <Method Name> + <Backbone Model>`**. Attach the ZIP archive directly when possible. If it exceeds the email attachment limit, include a stable download link and ensure that the DataSpace team can access it throughout the review period.

For questions about the dataset, evaluator, or submission process, open an issue in the [DataSpace repository](https://github.com/HKUSTDial/DataSpace/issues).

## Document version

- **Version 1.0 — August 2026.**
