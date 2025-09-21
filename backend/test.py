from transformers import AutoTokenizer, AutoModelForTokenClassification, pipeline

class RobustMedicalAnalyzer:
    def __init__(self, model_name="SungJoo/medical-ner-koelectra"):
        """
        분석기 초기화 시 모델과 지식 베이스, 폴백 키워드를 로드합니다.
        """
        # 1. NER 파이프라인 (AutoModelForTokenClassification 수정 적용)
        self.ner_pipeline = pipeline(
            "ner",
            model=AutoModelForTokenClassification.from_pretrained(model_name),
            tokenizer=AutoTokenizer.from_pretrained(model_name)
        )

        # 2. 지식 베이스
        self.knowledge_base = {
            "두통": {"possible_diseases": ["긴장성 두통", "편두통"], "kcd_code": "R51", "recommendation": "신경과 또는 내과"},
            "기침": {"possible_diseases": ["감기", "기관지염"], "kcd_code": "R05", "recommendation": "이비인후과 또는 내과"},
            "콧물": {"possible_diseases": ["감기", "알레르기 비염"], "kcd_code": "R06.0", "recommendation": "이비인후과"},
            "배": {"possible_diseases": ["급성 위장염", "소화불량"], "kcd_code": "R10.4", "recommendation": "내과"},
            "가슴": {"possible_diseases": ["협심증", "역류성 식도염"], "kcd_code": "R07.4", "recommendation": "순환기내과 또는 소화기내과"},
            "아프다": {"possible_diseases": ["통증"], "kcd_code": "R52.9", "recommendation": "통증의학과 또는 관련과"}
        }

        # 3. AI가 실패했을 때를 위한 폴백(Fallback) 키워드
        # 지식 베이스의 키워드들을 기반으로 생성
        self.fallback_keywords = list(self.knowledge_base.keys())
        print("Robust Medical Analyzer가 준비되었습니다. (하이브리드 방식)")

    def _parse_ner_results(self, ner_results):
        # NER 결과를 파싱하는 내부 함수 (이전과 동일)
        entities = {'Body': [], 'Disease': [], 'Symptom': []}
        # ... (이전과 동일한 파싱 로직) ...
        current_entity = None
        current_word = ""

        for token in ner_results:
            entity_label = token['entity']
            word = token['word']

            if entity_label.startswith('B-'):
                if current_entity:
                    entity_type = current_entity.split('-')[1]
                    if entity_type in entities: entities[entity_type].append(current_word)
                current_word = word.replace('##', '')
                current_entity = entity_label
            elif entity_label.startswith('I-') and current_entity and current_entity.split('-')[1] == entity_label.split('-')[1]:
                current_word += word.replace('##', '')
            else:
                if current_entity:
                    entity_type = current_entity.split('-')[1]
                    if entity_type in entities: entities[entity_type].append(current_word)
                current_entity = None
                current_word = ""
        if current_entity:
            entity_type = current_entity.split('-')[1]
            if entity_type in entities: entities[entity_type].append(current_word)
        return entities


    def analyze(self, text):
        """
        하이브리드 방식으로 문장을 분석합니다.
        """
        # 1단계: AI NER로 정보 추출 시도
        ner_results = self.ner_pipeline(text)
        extracted_entities = self._parse_ner_results(ner_results)
        
        symptoms = extracted_entities.get('Symptom', [])
        body_parts = extracted_entities.get('Body', [])

        # 2단계: AI가 실패했는지 확인하고, 실패했다면 키워드 검색으로 보완
        if not symptoms and not body_parts:
            print("[알림] AI NER 모델이 개체를 찾지 못했습니다. 키워드 기반 폴백을 실행합니다.")
            for keyword in self.fallback_keywords:
                if keyword in text:
                    # '아프다'는 증상, 나머지는 신체 부위로 간주 (단순화된 규칙)
                    if keyword == '아프다':
                        symptoms.append(keyword)
                    else:
                        body_parts.append(keyword)
        
        is_sick = bool(symptoms or body_parts)
        
        report = {
            "input_text": text,
            "is_sick": is_sick,
            "detected_symptoms": symptoms,
            "detected_body_parts": body_parts,
            "analysis": []
        }

        if not is_sick:
            report["summary"] = "문장에서 특별한 질병 관련 정보가 발견되지 않았습니다."
            return report

        # 3단계: 추출된 정보로 지식 베이스 조회
        search_keys = symptoms + body_parts
        found_info = False
        for key in search_keys:
            if key in self.knowledge_base:
                report["analysis"].append(self.knowledge_base[key])
                found_info = True
        
        if found_info:
            report["summary"] = f"'{', '.join(search_keys)}' 관련 증상/부위가 감지되었습니다. 전문의와 상담하세요."
        else:
            report["summary"] = f"감지된 '{', '.join(search_keys)}'에 대한 정보가 지식 베이스에 없습니다."
            
        return report

    def display_report(self, report):
        # 리포트 출력 함수 (이전과 동일)
        print("\n--- 의료 문장 분석 리포트 (하이브리드) ---")
        print(f"입력 문장: {report['input_text']}")
        print(f"아픈 상태로 판단되는가? {'예' if report['is_sick'] else '아니오'}")
        
        if report['is_sick']:
            print(f"감지된 증상: {report['detected_symptoms']}")
            print(f"감지된 신체 부위: {report['detected_body_parts']}")
            print("\n[상세 분석 결과]")
            if report['analysis']:
                for item in report['analysis']:
                    print(f"  - 예상 질병: {', '.join(item['possible_diseases'])}")
                    print(f"  - 관련 질병코드 (KCD): {item['kcd_code']}")
                    print(f"  - 추천 진료과: {item['recommendation']}")
            else:
                print("  - 상세 분석 정보가 지식 베이스에 없습니다.")
        
        print(f"\n[종합 요약]\n{report['summary']}")
        print("---------------------------------------")
        print("\n⚠️ 경고: 이 분석은 의료적 진단이 아니며, 참고용으로만 사용해야 합니다.")


# --- 시스템 사용 예시 ---
# 1. 분석기 생성
analyzer = RobustMedicalAnalyzer()

# 2. 문제가 되었던 문장 다시 테스트
print("\n" + "="*50 + "\n")
text_problem = "오늘 날씨가 좋아요"
report = analyzer.analyze(text_problem)
analyzer.display_report(report)

# 3. 다른 문장 테스트
print("\n" + "="*50 + "\n")
text_ner_success = "머리가 아프고 기침이 계속 나."
report2 = analyzer.analyze(text_ner_success)
analyzer.display_report(report2)