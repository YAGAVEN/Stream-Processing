import requests
import time

def test_processor():
    """Test the Python processor API endpoints"""
    
    # Test root endpoint
    try:
        response = requests.get("http://localhost:8000/")
        print(f"Root endpoint: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"Root endpoint error: {e}")
    
    # Test processed data endpoint
    try:
        response = requests.get("http://localhost:8000/processed")
        print(f"Processed endpoint: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"Processed endpoint error: {e}")

if __name__ == "__main__":
    print("Testing Python Processor API...")
    test_processor()
