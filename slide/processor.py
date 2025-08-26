import requests
import sseclient
from collections import deque
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import threading
import json
import time
import os

app = FastAPI()

# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sliding window (last 10 readings)
window_temp = deque(maxlen=10)
window_hum = deque(maxlen=10)

latest_data = {"temperature": 0, "humidity": 0, "avg_temp": 0, "avg_hum": 0}

def consume_stream():
    while True:
        try:
            # ✅ Use deployed Express API (falls back to localhost if not set)
            url = os.getenv("EXPRESS_URL", "https://stream-processing.onrender.com") + "/stream"
            print(f"Connecting to stream at {url}...")

            session = requests.Session()
            response = session.get(url, stream=True)

            client = sseclient.SSEClient(response)

            for event in client.events():
                data = json.loads(event.data)
                temp = float(data["temperature"])
                hum = float(data["humidity"])

                window_temp.append(temp)
                window_hum.append(hum)

                avg_temp = sum(window_temp) / len(window_temp)
                avg_hum = sum(window_hum) / len(window_hum)

                global latest_data
                latest_data = {
                    "latest": data,
                    "avg_temp": round(avg_temp, 2),
                    "avg_hum": round(avg_hum, 2)
                }
                
                print(
                    f"Processed: Temp={temp}°C, Hum={hum}% | "
                    f"Avg Temp={round(avg_temp, 2)}°C, Avg Hum={round(avg_hum, 2)}% "
                    f"| Window size={len(window_temp)}"
                )

        except Exception as e:
            print(f"Stream connection error: {e}")
            time.sleep(5)  # Retry after 5s

@app.get("/")
def root():
    return {"message": "Python Sliding Window API is running. Use /processed to get data."}

@app.get("/processed")
def get_processed_data():
    return latest_data

# Start the stream consumer in a background thread
@app.on_event("startup")
def startup_event():
    thread = threading.Thread(target=consume_stream, daemon=True)
    thread.start()
