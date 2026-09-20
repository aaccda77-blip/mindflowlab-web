import json
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

# Import router from evaluate-golden-router
import importlib.util
spec = importlib.util.spec_from_file_location("eval_mod", "scripts/evaluate-golden-router.py")
eval_mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(eval_mod)

with open('data/mind-cards.json', 'r', encoding='utf-8') as f:
    cards = json.load(f)
with open('data/search/synonyms.json', 'r', encoding='utf-8') as f:
    synonyms = json.load(f)

router = eval_mod.TunedRuleBasedRouter(cards, synonyms)

test_queries = [
    "상대방을 좋아할수록 상처받기 싫어서 먼저 도망치고 싶어요", # GOLDEN-103
    "완벽하게 시작할 준비가 안 돼서 계속 계획만 미루고 있어요", # GOLDEN-068
    "어릴 때부터 착한 아이 콤플렉스에 갇혀 살아온 것 같아요", # GOLDEN-075
    "어릴 때 나를 차별하고 학대한 부모가 용서가 안 돼요" # GOLDEN-086
]

for q in test_queries:
    print("=" * 60)
    print("Q:", q)
    norm = router.normalize(q)
    tokens = router.tokenize(norm)
    contexts = router.detect_contexts(q)
    safety = router.check_safety(q)
    print("Safety:", safety)
    print("Detected Contexts:", contexts)
    print("Tokens:", tokens[:10])
    
    scored = []
    for c in cards:
        res = router.score_card(c, tokens, contexts, q)
        if res["final"] > 0:
            scored.append(res)
    scored.sort(key=lambda x: x["final"], reverse=True)
    print("Top 5 Scored:")
    for s in scored[:5]:
        c = s["card"]
        print(f"  [{c['id']}] {c.get('cardTitle')} ({c.get('packId')}) -> final: {s['final']} (kw: {s['kw']}, tag: {s['tag']}, ctx: {s['ctx']}, pen: {s['pen']})")
