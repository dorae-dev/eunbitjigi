import requests
import math
import json

API_KEY = "4c7ff25c7e3785bdc94dd5c72ade2dc7"

def get_coords_from_address(address, api_key):
    url = "https://dapi.kakao.com/v2/local/search/address.json"
    headers = {"Authorization": f"KakaoAK {api_key}"}
    params = {"query": address}

    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        result = response.json()

        if result.get('documents'):
            x = result['documents'][0]['x']  # 경도(Longitude)
            y = result['documents'][0]['y']  # 위도(Latitude)
            return float(y), float(x)
        else:
            return None, None
            
    except requests.exceptions.RequestException as e:
        print(f"API 요청 중 오류 발생: {e}")
        return None, None
    
def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # 지구 반지름 (km)
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def find_nearest_center(user_lat, user_lon, fire_stations):
    nearest = None
    min_distance = float("inf")

    for center in fire_stations:
        if center["decimalLatitude"] == '' :
            continue
        lat = float(center["decimalLatitude"])
        lon = float(center["decimalLongitude"])
        distance = haversine(user_lat, user_lon, lat, lon)

        if distance < min_distance:
            min_distance = distance
            nearest = center

    return nearest, min_distance

def find_nearest_hospital(user_lat, user_lon, hospitals):
    nearest = None
    min_distance = float("inf")

    for hospital in hospitals:
        # 좌표 값이 없는 경우 건너뜀
        if not hospital.get("좌표(Y)") or not hospital.get("좌표(X)"):
            continue

        try:
            lat = float(hospital["좌표(Y)"])  # 위도
            lon = float(hospital["좌표(X)"])  # 경도
        except ValueError:
            continue  # 좌표 값이 숫자가 아니면 건너뜀

        distance = haversine(user_lat, user_lon, lat, lon)

        if distance < min_distance:
            min_distance = distance
            nearest = hospital

    return nearest, min_distance

with open("nearby_find/fire.json", "r", encoding="utf-8") as f:
    fire_data = json.load(f)
with open("nearby_find/hospital.json", "r", encoding="utf-8") as f:
    hospital_data = json.load(f)


def nearby_find(now_addr) :
    now_position = get_coords_from_address(now_addr,API_KEY)
    nearby_fire = find_nearest_center(now_position[0],now_position[1],fire_data)
    nearby_hospital = find_nearest_hospital(now_position[0],now_position[1],hospital_data)

    return {
        "hospital": nearby_hospital,
        "firehouse": nearby_fire
    }



