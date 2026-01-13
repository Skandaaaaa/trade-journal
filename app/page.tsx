'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

export default function PublicSummary() {
  const [trades, setTrades] = useState<any[]>([]);

  useEffect(() => {
    const loadTrades = async () => {
      const snap = await getDocs(collection(db, 'trades'));
      setTrades(snap.docs.map((d) => d.data()));
    };
    loadTrades();
  }, []);

  const equity = trades.reduce((acc: number[], t: any, i: number) => {
    acc.push((acc[i - 1] || 0) + (t.pnl || 0));
    return acc;
  }, []);

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Public Trading Summary</h1>

      {trades.length === 0 ? (
        <p>No trades yet.</p>
      ) : (
        <Line
          data={{
            labels: trades.map((t) => t.date),
            datasets: [
              {
                label: 'Equity Curve',
                data: equity,
                borderWidth: 2,
              },
            ],
          }}
        />
      )}
    </main>
  );
}
