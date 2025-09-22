import csv
import json

def csv_to_json(csv_file_path, json_file_path):
    """
    CSV 파일을 JSON 파일로 변환하는 함수

    Args:
        csv_file_path (str): 입력 CSV 파일 경로
        json_file_path (str): 출력 JSON 파일 경로
    """
    data = []
    with open(csv_file_path, 'r', encoding='utf-8') as csv_file:
        # CSV 파일을 딕셔너리 형태로 읽기
        csv_reader = csv.DictReader(csv_file)
        for row in csv_reader:
            data.append(row)

    with open(json_file_path, 'w', encoding='utf-8') as json_file:
        # JSON 파일로 저장 (ensure_ascii=False로 한글 깨짐 방지, indent로 가독성 높임)
        json.dump(data, json_file, ensure_ascii=False, indent=4)

# --- 실행 예시 ---
csv_input_path = 'TEST/hospital.csv'
json_output_path = 'hospital.json'

# 함수 호출하여 변환 실행
csv_to_json(csv_input_path, json_output_path)

print(f"'{csv_input_path}' 파일이 '{json_output_path}' 파일로 성공적으로 변환되었습니다.")