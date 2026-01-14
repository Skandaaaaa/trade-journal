'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

type Trade = {
  id: string;
  date: string;
  symbol: string;
  direction: 'Buy' | 'Sell';
  entry: number;
  exit: number;
  lot: number;
  notes: string;
  pnl: number;
};

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [trade, setTrade] = useState({
    date: '',
    symbol: '',
    direction: 'Buy' as 'Buy' | 'Sell',
    entry: 0,
    exit: 0,
    lot: 0,
    notes: '',
  });

  /* ───────────────── AUTH ───────────────── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        window.location.href = '/login';
      } else {
        setUser(u);
        loadTrades(u.uid);
      }
    });
    return () => unsub();
  }, []);

  /* ───────────────── DATA ───────────────── */
  const loadTrades = async (uid: string) => {
    const q = query(collection(db, 'trades'), where('uid', '==', uid));
    const snap = await getDocs(q);
    setTrades(
      snap.docs.map((d) => ({ id: d.id, ...(d.data() as Trade) }))
    );
  };

  const pnl =
    ((trade.exit - trade.entry) * trade.lot) *
      (trade.direction === 'Buy' ? 1 : -1) || 0;

  const equityCurve = trades.reduce((acc: number[], t, i) => {
    acc.push((acc[i - 1] || 0) + (t.pnl || 0));
    return acc;
  }, []);

  /* ───────────────── ACTIONS ───────────────── */
  const saveTrade = async () => {
    if (!user) return;

    if (editingId) {
      await updateDoc(doc(db, 'trades', editingId), {
        ...trade,
        pnl,
      });
      setEditingId(null);
    } else {
      await addDoc(collection(db, 'trades'), {
        ...trade,
        pnl,
        uid: user.uid,
      });
    }

    setTrade({
      date: '',
      symbol: '',
      direction: 'Buy',
      entry: 0,
      exit: 0,
      lot: 0,
      notes: '',
    });

    loadTrades(user.uid);
  };

  const deleteTrade = async (id: string) => {
    await deleteDoc(doc(db, 'trades', id));
    if (user) loadTrades(user.uid);
  };

  const exportCSV = () => {
    if (trades.length === 0) return;

    const headers = [
      'Date',
      'Symbol',
      'Direction',
      'Entry',
      'Exit',
      'Lot',
      'PnL',
      'Notes',
    ];

    const rows = trades.map((t) => [
      t.date,
      t.symbol,
      t.direction,
      t.entry,
      t.exit,
      t.lot,
      t.pnl,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csv =
      [headers, ...rows].map((r) => r.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'trade-journal.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* ───────────────── UI ───────────────── */
  return (
    <main className="p-8 max-w-6xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Equity Curve */}
      <div className="border rounded-xl p-4 bg-white dark:bg-gray-900">
        <h2 className="text-lg font-semibold mb-3">Equity Curve</h2>
        {trades.length === 0 ? (
          <p className="text-sm text-gray-500">No trades yet.</p>
        ) : (
          <Line
            data={{
              labels: trades.map((t) => t.date),
              datasets: [
                {
                  label: 'Equity',
                  data: equityCurve,
                  borderWidth: 2,
                },
              ],
            }}
          />
        )}
      </div>

      {/* Trade Form */}
      <div className="grid grid-cols-2 gap-3 border rounded-xl p-4 bg-white dark:bg-gray-900">
        <input
          placeholder="Date"
          value={trade.date}
          onChange={(e) => setTrade({ ...trade, date: e.target.value })}
        />
        <input
          placeholder="Symbol"
          value={trade.symbol}
          onChange={(e) =>
            setTrade({ ...trade, symbol: e.target.value })
          }
        />
        <select
          value={trade.direction}
          onChange={(e) =>
            setTrade({
              ...trade,
              direction: e.target.value as 'Buy' | 'Sell',
            })
          }
        >
          <option>Buy</option>
          <option>Sell</option>
        </select>
        <input
          type="number"
          placeholder="Entry"
          value={trade.entry}
          onChange={(e) =>
            setTrade({ ...trade, entry: +e.target.value })
          }
        />
        <input
          type="number"
          placeholder="Exit"
          value={trade.exit}
          onChange={(e) =>
            setTrade({ ...trade, exit: +e.target.value })
          }
        />
        <input
          type="number"
          placeholder="Lot"
          value={trade.lot}
          onChange={(e) =>
            setTrade({ ...trade, lot: +e.target.value })
          }
        />
        <textarea
          className="col-span-2"
          placeholder="Notes"
          value={trade.notes}
          onChange={(e) =>
            setTrade({ ...trade, notes: e.target.value })
          }
        />

        <div className="col-span-2 font-semibold">
          P&amp;L:{' '}
          <span className={pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
            {pnl.toFixed(2)}
          </span>
        </div>

        <button
          onClick={saveTrade}
          className="col-span-2 bg-black text-white py-2 rounded"
        >
          {editingId ? 'Update Trade' : 'Save Trade'}
        </button>
      </div>

      {/* Trades Table */}
      <div className="bg-white dark:bg-gray-900 border rounded-xl overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Your Trades</h2>
          <button
            onClick={exportCSV}
            className="text-sm bg-black text-white px-3 py-1 rounded"
          >
            Export CSV
          </button>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Symbol</th>
              <th className="p-3 text-left">Side</th>
              <th className="p-3 text-left">P&amp;L</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="p-3">{t.date}</td>
                <td className="p-3">{t.symbol}</td>
                <td className="p-3">{t.direction}</td>
                <td
                  className={`p-3 font-semibold ${
                    t.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {t.pnl.toFixed(2)}
                </td>
                <td className="p-3 text-right space-x-3">
                  <button
                    className="text-blue-600"
                    onClick={() => {
                      setTrade(t);
                      setEditingId(t.id);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600"
                    onClick={() => deleteTrade(t.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
