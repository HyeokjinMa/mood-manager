import asyncio
import requests
import time
from pywizlight import wizlight, PilotBuilder, discovery

SERVER_URL = "https://moodmanager.me/api" 
POLL_INTERVAL = 1  # 서버 확인 주기 (초)
API_KEY = "mm-ll-2025-demo-EFGH-5432"

HEADERS = {
    "x-api-key": API_KEY
}

# 조명 객체 전역 변수
current_bulb = None
current_bulb_ip = None

async def flash_effect(bulb):
    """RGB illuminate"""
    colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255)] # R, G, B
    for rgb in colors:
        await bulb.turn_on(PilotBuilder(rgb=rgb, brightness=255))
        await asyncio.sleep(0.5)
    
    # 효과가 끝나면 잠시 끔
    await bulb.turn_off()

async def main_loop():
    global current_bulb, current_bulb_ip

    while True:
        try:
            # 1. 상태 확인 (Polling)
            res = requests.get(f"{SERVER_URL}/search_light", headers=HEADERS, timeout=10)
            if res.status_code != 200:
                print("Server Error")
                await asyncio.sleep(5)
                continue
                
            status_data = res.json()
            print(status_data)
            mode = status_data.get("status")     # "search" or "wait"
            light_off_flag = status_data.get("light_off", True)

            # --- [1] When server is "wait" ---
            if mode == "wait":
                if current_bulb is not None:
                    print("Connection terminated/waiting...")
                    if light_off_flag:
                        await current_bulb.turn_off()
                        print("bulb turn off.")
                    
                    # Info 
                    current_bulb = None
                    current_bulb_ip = None
                else:
                    print("Waiting...")
            # --- [2] When server is "search" ---
            elif mode == "search":
                
                # 2-1. 아직 연결된 조명이 없다면 discovery 시작
                if current_bulb is None:
                    print("\n Discovering Bulbs...")
                    bulbs = await discovery.discover_lights(broadcast_space="255.255.255.255")
                    
                    if bulbs:
                        target = bulbs[0]
                        current_bulb = target
                        current_bulb_ip = target.ip
                        print(f"Bulb Found. IP: {current_bulb_ip}")
                        
                        await flash_effect(current_bulb)
                    else:
                        print("Discovery Failed. Retry...")
                
                # 2-2. 연결된 상태
                else:
                    # Power (On/Off)
                    p_res = requests.get(f"{SERVER_URL}/light_power", headers=HEADERS, timeout=10)
                    if p_res.status_code == 200:
                        p_data = p_res.json()
                        power = p_data.get("power") # "on" or "off"
                        
                        if power == "off":
                            await current_bulb.turn_off()
                        elif power == "on":
                            # get light info when it is on-state
                            i_res = requests.get(f"{SERVER_URL}/light_info", headers=HEADERS, timeout=10)
                            if i_res.status_code == 200:
                                light_data = i_res.json()
                                
                                params = {}
                                params["brightness"] = light_data.get("brightness", 255)
                                
                                # RGB가 있으면 RGB 우선, 없으면 색온도 처리
                                if "r" in light_data:
                                    params["rgb"] = (light_data["r"], light_data["g"], light_data["b"])
                                elif "colortemp" in light_data:
                                    params["colortemp"] = light_data["colortemp"]

                                await current_bulb.turn_on(PilotBuilder(**params))
                                print(f"{power} / {params}", end="\r")

        except Exception as e:
            print(f"\nError Occured: {e}")
        
        await asyncio.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(main_loop())