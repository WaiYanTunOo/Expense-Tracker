import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
} from 'firebase/firestore';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { auth, db } from './firebase';

const CATEGORIES = ['Food', 'Salary', 'Transport', 'Bills', 'Shopping', 'Entertainment', 'Health', 'Other'];
const PIE_CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1943', '#19D4FF'];

const Summary = ({ totalIncome, totalExpenses, balance }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg">
    <h2 className="text-xl font-semibold mb-4 text-gray-800">Summary</h2>
    <div className="space-y-3">
      <div className="flex justify-between items-center text-lg">
        <span className="text-gray-600">Total Income:</span>
        <span className="font-bold text-green-600">+${totalIncome.toFixed(2)}</span>
      </div>
      <div className="flex justify-between items-center text-lg">
        <span className="text-gray-600">Total Expenses:</span>
        <span className="font-bold text-red-600">-${totalExpenses.toFixed(2)}</span>
      </div>
      <div className="flex justify-between items-center text-xl border-t pt-3 mt-3">
        <span className="font-bold text-gray-800">Balance:</span>
        <span className={`font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>${balance.toFixed(2)}</span>
      </div>
    </div>
  </div>
);

const AddTransactionForm = ({ onAddTransaction }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [transactionType, setTransactionType] = useState('Expense');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddTransaction({
      description,
      amount: parseFloat(amount),
      category,
      type: transactionType,
    });
    setDescription('');
    setAmount('');
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Add New Transaction</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Transaction Type</label>
          <div className="mt-1 grid grid-cols-2 gap-2 rounded-md bg-gray-200 p-1">
            <button type="button" onClick={() => setTransactionType('Income')} className={`px-3 py-1 text-sm font-medium rounded ${transactionType === 'Income' ? 'bg-white shadow' : 'text-gray-600'}`}>Income</button>
            <button type="button" onClick={() => setTransactionType('Expense')} className={`px-3 py-1 text-sm font-medium rounded ${transactionType === 'Expense' ? 'bg-white shadow' : 'text-gray-600'}`}>Expense</button>
          </div>
        </div>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          required
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          required
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
          {CATEGORIES.map((cat) => (
            <option key={cat}>{cat}</option>
          ))}
        </select>
        <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Add Transaction
        </button>
      </form>
    </div>
  );
};
const TransactionList = ({ transactions, onDeleteTransaction }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Recent Transactions</h2>
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {transactions.map((t) => (
          <div key={t.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div>
              <p className="font-semibold text-gray-800">{t.description}</p>
              <p className="text-sm text-gray-500">{t.category}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`font-bold ${t.type === 'Income' ? 'text-green-500' : 'text-red-500'}`}>
                {t.type === 'Income' ? '+' : '-'}${t.amount.toFixed(2)}
              </span>
              <button onClick={() => onDeleteTransaction(t.id)} className="text-gray-400 hover:text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  
  const ExpenseChart = ({ data }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Expense Breakdown</h2>
      <div style={{ width: '100%', height: 250 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
  
  export default function App() {
    const [transactions, setTransactions] = useState([]);
    const [user, setUser] = useState(null);
  
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setUser(user);
        } else {
          signInAnonymously(auth).catch((error) => console.error('Error signing in anonymously:', error));
        }
      });
      return () => unsubscribe();
    }, []);
  
    useEffect(() => {
      if (user) {
        const q = query(collection(db, `users/${user.uid}/transactions`));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const transactionsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setTransactions(transactionsData);
        });
        return () => unsubscribe();
      }
    }, [user]);
  
    const handleAddTransaction = async (transaction) => {
      if (user) {
        await addDoc(collection(db, `users/${user.uid}/transactions`), {
          ...transaction,
          createdAt: serverTimestamp(),
        });
      }
    };
  
    const handleDeleteTransaction = async (id) => {
      if (user) {
        await deleteDoc(doc(db, `users/${user.uid}/transactions`, id));
      }
    };
  
    const { totalIncome, totalExpenses, balance, expenseChartData } = useMemo(() => {
      const income = transactions.filter((t) => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
      const expenses = transactions.filter((t) => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
      const expenseData = transactions
        .filter((t) => t.type === 'Expense')
        .reduce((acc, { category, amount }) => {
          acc[category] = (acc[category] || 0) + amount;
          return acc;
        }, {});
  
      return {
        totalIncome: income,
        totalExpenses: expenses,
        balance: income - expenses,
        expenseChartData: Object.entries(expenseData).map(([name, value]) => ({ name, value })),
      };
    }, [transactions]);
  
    return (
      <div className="font-sans bg-gray-100 min-h-screen">
        <header className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Income & Expense Tracker</h1>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-8">
              <Summary totalIncome={totalIncome} totalExpenses={totalExpenses} balance={balance} />
              <AddTransactionForm onAddTransaction={handleAddTransaction} />
            </div>
            <div className="lg:col-span-2 space-y-8">
              <ExpenseChart data={expenseChartData} />
              <TransactionList transactions={transactions} onDeleteTransaction={handleDeleteTransaction} />
            </div>
          </div>
        </main>
      </div>
    );
  }