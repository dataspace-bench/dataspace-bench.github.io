# Leaderboard 本地维护

提交材料、联系人、私有答案及评测记录存放在网站根目录的
`leaderboard-private/`，该目录被 `.gitignore` 忽略。管理脚本和本说明可以随
网站仓库保存。脚本只使用 Python 标准库，评测时调用冻结的官方评测器。

以下命令均在网站仓库根目录执行。

## 档案结构

```text
leaderboard-private/
├── index.json                       # 可通过 status 重建的总索引
├── audit.jsonl                      # 接收、快照、评测和刷新事件
├── datasets/<dataset-id>/
│   ├── snapshot.json                # 原路径、版本、逐文件 SHA-256、manifest 差异
│   ├── evaluation/configs/          # 每题配置的实际文件副本
│   ├── output/task_N/gold.csv       # 每题 gold 的实际文件副本
│   ├── evaluator/                   # 官方脚本、schema、测试和说明的副本
│   └── metadata/                    # 发布元信息和公开参考任务索引（若有）
├── submissions/<submission-id>/
│   ├── source.json                  # 提交来源、下载链接、声明和预期校验值
│   ├── submission-email.txt         # 邮件文本；可在 source 中注明是否为转录
│   ├── intake.json                  # 登记时间；与邮件接收时间分开
│   ├── receipt.json                 # 原包哈希、字节数、元数据及解压清单
│   ├── original/submission.zip      # 未改动的原始提交包
│   ├── extracted/                   # 未改动的预测、trace 和其他附件
│   └── evaluations/<run-id>/
│       ├── run.json                 # 版本、命令、环境、时间、状态、汇总哈希
│       ├── evaluation_summary.json  # 官方汇总和逐题结果
│       ├── task_results.csv         # 便于筛选的逐题结果
│       ├── package_review.json      # 预测/trace 覆盖、缺失和待审项目
│       ├── comparison.json          # 与同 scope 上次成功评测的逐题变化（若有）
│       ├── manage_leaderboard.py    # 本次使用的管理脚本副本
│       ├── stdout.txt
│       └── stderr.txt
└── refreshes/<refresh-id>/refresh.json  # 同一数据版本上全部已归档提交的重测记录
```

快照包含重测所需的 gold、配置和评测器，不重复复制体积很大的任务输入
context。原始数据集路径及发布 manifest、checksums 保留，必要时另行备份完整
数据集。每个快照记录实际内容哈希，不以文件夹名称、发布日期或旧 manifest
中的声明哈希替代实际版本。声明与实际不同会写入
`source_manifest_discrepancies`。

## 冻结数据集版本

```bash
python3 scripts/manage_leaderboard.py snapshot \
  --dataset-root /home/shared/kdd_cup/private_B_phase2/datasets/DataSpace-Private \
  --evaluator /home/shared/kdd_cup/private_B_phase2/DataSpace/evaluation/evaluate.py \
  --label 'DataSpace-Private observed 2026-10-07'
```

默认检查 410 个配置和 `task_1` 至 `task_410`。输出 `dataset_id`。相同内容重复
登记会复用快照；gold、配置、评测器或发布元信息变化会生成新的 ID。
评测器始终来自维护者提供的官方路径，不运行参与者包中的脚本。

要单独复核公开 60 题，可登记公开发布版本；公共与私有成绩不会混作历史对比：

```bash
python3 scripts/manage_leaderboard.py snapshot \
  --dataset-root /home/shared/kdd_cup/private_B_phase2/datasets/DataSpace \
  --evaluator /home/shared/kdd_cup/private_B_phase2/DataSpace/evaluation/evaluate.py \
  --expected-tasks 60 --scope public --label 'Public 60 references'
```

## 接收未来提交

先准备来源记录 `source.json`，保存提交人、原始链接、方法声明及预期校验值：

```json
{
  "source_kind": "submission_email",
  "archive": {
    "filename": "submission.zip",
    "sha256": "<64-character SHA-256>",
    "bytes": 12345,
    "download_url": "<submitted link>"
  }
}
```

```bash
python3 scripts/manage_leaderboard.py intake \
  --submission-id example-method-20261007 \
  --source /path/to/source.json --email /path/to/email.txt

python3 scripts/manage_leaderboard.py ingest \
  --submission-id example-method-20261007 --archive /path/to/submission.zip
```

`intake` 可先登记尚未下载到的提交，状态为 `awaiting_archive`。`ingest` 自动
使用来源记录的 SHA-256 和字节数，也可以用 `--sha256`、`--bytes` 指定。
只有校验、ZIP 路径检查和基本包结构检查通过后才归档。相同提交 ID 的原包
不能覆盖；不同提交需分配新 ID。

原包预测不做修正。缺失或 malformed 的预测交给官方评测器计错，不能从
trace 中找回答案、移动参与者写错位置的文件或依据 gold 改写预测。
ZIP 路径穿越、重复路径、符号链接、加密文件和超出大小限制的包会被拒绝。

## 评测和审核

```bash
python3 scripts/manage_leaderboard.py evaluate \
  --submission-id example-method-20261007 --dataset-id <dataset-id>
```

每次生成新的 `run-id`，保留旧结果。执行前后核对冻结文件及预测的逐文件
哈希；分母来自完整配置集合，缺失预测也计入分母。保存官方逐题结果、失败
原因、执行命令、Python 环境、时间和脚本哈希。评测失败时保留日志并返回错误。

Trace 格式在规范中允许自由定义，通用覆盖检查不会猜测字段并声称已完成
费用审计。收到包后，在对应评测目录另存 `trace_cost_audit.json` 或
`review.json`，记录实际使用的字段、逐调用费用汇总、410 题总额和平均额、
官方价格链接和日期，以及单次尝试/重试/候选选择/遮盖内容的审查结论。
所有费用计入 410 题，包括失败任务。邮件中的四舍五入金额与包中未舍入数值
分别保留。将可核实的事实与提交方声明分开。

脚本将结果标为 `pending_review`。公开榜单条目需要完成规范要求的审核；
在 `src/data/leaderboard.ts` 只填写经核实的公开字段，并在本地 `review.json`
保存采用的 run ID、数据集 ID、审核日期和公开变更的 commit/发布记录。
本地批量重测本身不会修改或发布官网。

## 数据集修订与榜单刷新

先用修订后的官方数据目录重新执行 `snapshot`，取得新版本 ID，然后：

```bash
python3 scripts/manage_leaderboard.py refresh --dataset-id <new-dataset-id>
python3 scripts/manage_leaderboard.py status
```

`refresh` 在同一冻结版本上重测所有已有原包的提交，待下载的提交保持待处理。
逐题变化写入每个新 run 的 `comparison.json`，整批结果写入 `refreshes/`。
对比只使用同一 `scope` 的上一次成功结果。旧 gold、配置、原包和成绩保留。
某个提交失败不妨碍其他提交重测，批量返回的 `results` 会逐个标明失败。
审核所有结果后再统一更新公开榜单，避免不同数据版本的成绩混合排序。

`index.json` 只是概览，丢失后可以重建；原包、快照和每次 run 的记录是档案。

## 本地检查与备份

```bash
python3 -B -m unittest discover -s tests -v
git check-ignore leaderboard-private/index.json
git status --short
```

管理 CLI 以私有权限创建档案文件。Git 忽略不提供备份。请将整个
`leaderboard-private/` 备份到受控存储，完整保留目录与文件；该目录包含私有
gold 和联系人，勿放入 `public/`、`src/` 或网站构建输出。恢复后用 `status`
重建索引，任何重测都会重新校验快照和提交内容。
