import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

export default function Dashboard() {
  const [rawData, setRawData] = useState([]);
  const [slidingData, setSlidingData] = useState([]);

  // API URLs (use env vars if possible)
  const RAW_API_URL = "https://stream-processing.onrender.com/stream";
  const SLIDE_API_URL = "https://stream-slide-9rqv.onrender.com/processed";

  // Update functions
  const updateRawData = useCallback((newData) => {
    setRawData((prev) => {
      if (
        prev.length === 0 ||
        prev[prev.length - 1]?.temp !== newData.temp ||
        prev[prev.length - 1]?.humidity !== newData.humidity
      ) {
        return [...prev.slice(-19), newData];
      }
      return prev;
    });
  }, []);

  const updateSlidingData = useCallback((newData) => {
    setSlidingData((prev) => {
      if (
        prev.length === 0 ||
        prev[prev.length - 1]?.avgTemp !== newData.avgTemp ||
        prev[prev.length - 1]?.avgHumidity !== newData.avgHumidity
      ) {
        return [...prev.slice(-19), newData];
      }
      return prev;
    });
  }, []);

  // Memoized chart data
  const memoizedRawData = useMemo(() => rawData, [rawData]);
  const memoizedSlidingData = useMemo(() => slidingData, [slidingData]);

  // Raw stream (SSE)
  useEffect(() => {
    const eventSource = new EventSource(RAW_API_URL);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const timeData = {
          time: new Date().toLocaleTimeString(),
          temp: data.temperature,
          humidity: data.humidity,
        };
        updateRawData(timeData);
      } catch (err) {
        console.error("Error parsing stream data:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("EventSource error:", err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [updateRawData]);

  // Sliding window API (poll every 5s)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(SLIDE_API_URL);
        const data = await res.json();
        const timeData = {
          time: new Date().toLocaleTimeString(),
          avgTemp: data.avg_temp,
          avgHumidity: data.avg_hum,
        };
        updateSlidingData(timeData);
      } catch (err) {
        console.error("Error fetching processed data:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [updateSlidingData]);

  return (
    <div className="p-6">
      {/* Values Display */}
      <div className="mb-6">
        <div className="flex space-x-4">
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500 flex-1">
            <h3 className="text-sm font-medium text-gray-600">Current Temperature</h3>
            <p className="text-2xl font-bold text-blue-600">
              {rawData.length > 0 ? `${rawData[rawData.length - 1]?.temp}°C` : "--°C"}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500 flex-1">
            <h3 className="text-sm font-medium text-gray-600">Current Humidity</h3>
            <p className="text-2xl font-bold text-green-600">
              {rawData.length > 0 ? `${rawData[rawData.length - 1]?.humidity}%` : "--%"}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-purple-500 flex-1">
            <h3 className="text-sm font-medium text-gray-600">Avg Temperature</h3>
            <p className="text-2xl font-bold text-purple-600">
              {slidingData.length > 0 ? `${slidingData[slidingData.length - 1]?.avgTemp}°C` : "--°C"}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-teal-500 flex-1">
            <h3 className="text-sm font-medium text-gray-600">Avg Humidity</h3>
            <p className="text-2xl font-bold text-teal-600">
              {slidingData.length > 0 ? `${slidingData[slidingData.length - 1]?.avgHumidity}%` : "--%"}
            </p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Raw API Stream */}
        <div className="shadow-lg p-4 rounded-2xl bg-white">
          <h2 className="text-xl font-semibold mb-4">Raw API Stream</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={memoizedRawData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="temp" stroke="#ff7300" name="Temperature" />
              <Line type="monotone" dataKey="humidity" stroke="#387908" name="Humidity" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Sliding Window Processed */}
        <div className="shadow-lg p-4 rounded-2xl bg-white">
          <h2 className="text-xl font-semibold mb-4">Sliding Window Processed</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={memoizedSlidingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="avgTemp" stroke="#8884d8" name="Avg Temperature" />
              <Line type="monotone" dataKey="avgHumidity" stroke="#82ca9d" name="Avg Humidity" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
