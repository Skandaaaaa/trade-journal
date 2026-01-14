'use client';

import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} 
from 'chart.js';
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

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

export default function DashboardPage() {
  // ─────────────── STATE ───────────────
  const [user, setUser] = useState<any>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [trade, setTrade] = useState({
    date: '',
    symbol: '',
    direction: 'Buy',
    entry: 0,
    exit: 0,
    lot: 0,
    notes: '',
  });

  // ─────────────── AUTH ───────────────
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

  // ─────────────── LOAD TRADES ───────────────
  const loadTrades = async (uid: string) => {
    const q = query(collection(db, 'trades'), where('uid', '==', uid));
    const snap = await getDocs(q);
    setTrades(snap.docs.map((d) => ({ id: d.id, ...d.data() })));

  };
  // ─────────────── CALCULATIONS ───────────────
  const pnl =
    ((trade.exit - trade.entry) * trade.lot) *
      (trade.direction === 'Buy' ? 1 : -1) || 0;

  const equityCurve = trades.reduce((acc: number[], t: any, i: number) => {
    acc.push((acc[i - 1] || 0) + (t.pnl || 0));
    return acc;
  }, []);

  const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const wins = trades.filter((t) => t.pnl > 0).length;
  const winRate = trades.length
    ? ((wins / trades.length) * 100).toFixed(1)
    : '0';

  const maxDrawdown = equityCurve.reduce(
    (acc, value) => {
      const peak = Math.max(acc.peak, value);
      return {
        peak,
        max: Math.max(acc.max, peak - value),
      };
    },
    { peak: 0, max: 0 }
  ).max;

  // ─────────────── SAVE / UPDATE ───────────────
  const saveTrade = async () => {
    if (!user) return;

    if (editingId) {
      await updateDoc(doc(db, 'trades', editingId), {
        ...trade,
        pnl,
        uid: user.uid,
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

  // ─────────────── DELETE ───────────────
  const deleteTrade = async (id: string) => {
    await deleteDoc(doc(db, 'trades', id));
    if (user) loadTrades(user.uid);
  };

  // ─────────────── UI ───────────────
  return (
    <main className="p-8 max-w-5xl mx-auto bg-gray-50 min-h-screen">
      <div className="space-y-8">

        {/* Header */}
        <h1 className="text-3xl font-bold">Dashboard</h1>

        {/* Analytics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">Total P&amp;L</p>
            <p
              className={`text-2xl font-bold ${
                totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {totalPnL.toFixed(2)}
            </p>
          </div>

          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">Win Rate</p>
            <p className="text-2xl font-bold">{winRate}%</p>
          </div>

          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">Max Drawdown</p>
            <p className="text-2xl font-bold text-red-600">
              -{maxDrawdown.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Equity Curve */}
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Equity Curve</h2>

          {trades.length === 0 ? (
            <p>No trades yet.</p>
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
        <div className="bg-white border rounded-xl p-5 shadow-sm grid grid-cols-2 gap-3">
          <input
            placeholder="Date"
            value={trade.date}
            onChange={(e) => setTrade({ ...trade, date: e.target.value })}
          />
          <input
            placeholder="Symbol"
            value={trade.symbol}
            onChange={(e) => setTrade({ ...trade, symbol: e.target.value })}
          />
          <select
            value={trade.direction}
            onChange={(e) => setTrade({ ...trade, direction: e.target.value })}
          >
            <option>Buy</option>
            <option>Sell</option>
          </select>
          <input
            type="number"
            placeholder="Entry"
            value={trade.entry}
            onChange={(e) => setTrade({ ...trade, entry: +e.target.value })}
          />
          <input
            type="number"
            placeholder="Exit"
            value={trade.exit}
            onChange={(e) => setTrade({ ...trade, exit: +e.target.value })}
          />
          <input
            type="number"
            placeholder="Lot"
            value={trade.lot}
            onChange={(e) => setTrade({ ...trade, lot: +e.target.value })}
          />
          <textarea
            className="col-span-2"
            placeholder="Notes"
            value={trade.notes}
            onChange={(e) => setTrade({ ...trade, notes: e.target.value })}
          />

          <div className="col-span-2 font-semibold">
            P&amp;L:{' '}
            <span className={pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
              {pnl.toFixed(2)}
            </span>
          </div>

          <button
            onClick={saveTrade}
            className="bg-black text-white py-2 col-span-2 hover:bg-gray-800 transition"
          >
            {editingId ? 'Update Trade' : 'Save Trade'}
          </button>
        </div>

        {/* Trade Table */}
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <h2 className="text-xl font-semibold p-4 border-b">Your Trades</h2>

          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Symbol</th>
                <th className="px-3 py-2 text-left">Side</th>
                <th className="px-3 py-2 text-right">P&amp;L</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {trades.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-500">
                    No trades yet
                  </td>
                </tr>
              )}

              {trades.map((t: any) => (
                <tr key={t.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2">{t.date}</td>
                  <td className="px-3 py-2 font-medium">{t.symbol}</td>
                  <td
                    className={`px-3 py-2 ${
                      t.direction === 'Buy'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {t.direction}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-semibold ${
                      t.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {t.pnl.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right space-x-3">
                    <button
                      onClick={() => {
                        setTrade({
                          date: t.date,
                          symbol: t.symbol,
                          direction: t.direction,
                          entry: t.entry,
                          exit: t.exit,
                          lot: t.lot,
                          notes: t.notes,
                        });
                        setEditingId(t.id);
                      }}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteTrade(t.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </main>
  );
}
