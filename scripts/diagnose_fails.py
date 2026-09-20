import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('data/eval/evaluation-summary.json', 'r', encoding='utf-8') as f:
    summary = json.load(f)

with open('data/eval/golden-rule-200.json', 'r', encoding='utf-8') as f:
    golden = json.load(f)

golden_map = {c['testId']: c for c in golden}
fails = [c for c in summary['golden']['cases'] if c['verdict'] == 'FAIL']

print(f"Total Fails: {len(fails)}")
for c in fails[:20]:
    t_id = c['testId']
    orig = golden_map.get(t_id, {})
    print(f"[{t_id}] Q: {c['input']}")
    print(f"  - Exp: {orig.get('expectedCardIds')}")
    print(f"  - Acc: {orig.get('acceptableCardIds')}")
    print(f"  - Rec: {c['recIds']}")
    print(f"  - Top1Match: {c['top1Match']}, Top3AccMatch: {c['top3AccMatch']}")
    print("-" * 50)
