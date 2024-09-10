'use client';
import { useState, useEffect } from 'react';
import { SignedIn, SignedOut, UserButton, useAuth } from '@clerk/nextjs';
import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from "firebase/firestore"; // Include deleteDoc, doc
import Head from 'next/head';
import { Container, TextField, Button, Table, TableBody, TableCell, TableHead, TableRow, Typography, AppBar, Toolbar, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export default function Home() {
  const [input, setInput] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [error, setError] = useState('');
  const { isSignedIn, userId } = useAuth();  // Get userId from Clerk

  // Fetch expenses when the user logs in and clear them on logout
  useEffect(() => {
    if (isSignedIn) {
      const fetchExpenses = async () => {
        const q = query(collection(db, "expenses"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        const fetchedExpenses = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })); // Include document ID
        setExpenses(fetchedExpenses); // Set the fetched expenses
      };
      fetchExpenses();
    } else {
      // Clear expenses when user logs out
      setExpenses([]);
    }
  }, [isSignedIn, userId]);

  const handleAddExpense = async () => {
    setError(''); // Clear any previous errors
    if (input.trim() === '') return;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch');
      }

      const data = await response.json();

      if (data.success) {
        const newExpense = data.expense;
        setExpenses([...expenses, newExpense]);

        // Save the expense data to Firebase only if the user is signed in
        if (isSignedIn) {
          try {
            const docRef = await addDoc(collection(db, "expenses"), {
              userId: userId,  // Save the expense under the logged-in user's ID
              ...newExpense,   // Add the generated expense data
              timestamp: new Date()  // Optionally, add a timestamp
            });
            console.log("Expense saved to Firestore.");
            newExpense.id = docRef.id; // Add the document ID to the new expense
            setExpenses([...expenses, newExpense]);
          } catch (firebaseError) {
            console.error('Error saving expense to Firestore:', firebaseError);
            setError('Error saving expense to Firestore.');
          }
        } else {
          console.error("User is not signed in");
        }
      } else {
        setError(data.error || 'Unknown error occurred');
      }

    } catch (error) {
      console.error('Error adding expense:', error);
      setError('An error occurred while processing your request.');
    } finally {
      setInput(''); // Clear input after the request
    }
  };

  // Handle deleting an expense
  const handleDeleteExpense = async (expenseId) => {
    try {
      // Delete the document from Firestore
      await deleteDoc(doc(db, "expenses", expenseId));
      // Remove the expense from the state
      setExpenses(expenses.filter(expense => expense.id !== expenseId));
      console.log("Expense deleted.");
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };

  return (
    <Container maxWidth >
      <Head>
        <title>Expense Tracker</title>
        <meta name="description" content="Keep track of your expenses with AI help" />
      </Head>

      <AppBar position="static" sx={{ mb: 5 }}>
        <Toolbar>
          <Typography variant="h6" style={{flexGrow: 1}}>
            Expense Tracker
          </Typography>
          <SignedOut>
            <Button color="inherit" href="/sign-in">Login</Button>
            <Button color="inherit" href="/sign-up">Sign Up</Button>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </Toolbar>
      </AppBar>

      <Typography variant="h4" gutterBottom>Simple Expense Splitter</Typography>

      <TextField
        label="Enter expense details"
        fullWidth
        variant="outlined"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        sx={{ mb: 3 }}
      />
      <Button variant="contained" color="primary" onClick={handleAddExpense}>
        Add Expense
      </Button>

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}

      <Table sx={{ mt: 5 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Paid By</TableCell>
            <TableCell>Participants</TableCell>
            <TableCell>Balance</TableCell>
            <TableCell>Actions</TableCell> {/* New column for actions */}
          </TableRow>
        </TableHead>
        <TableBody>
          {expenses.map((expense, index) => (
            <TableRow key={index}>
              <TableCell>{expense.date}</TableCell>
              <TableCell>{expense.description}</TableCell>
              <TableCell>{expense.amount}</TableCell>
              <TableCell>{expense.paidBy}</TableCell>
              <TableCell>{expense.participants.join(', ')}</TableCell>
              <TableCell>
                {Object.entries(expense.balance).map(([participant, balance]) => (
                  <div key={participant}>{`${participant}: $${balance}`}</div>
                ))}
              </TableCell>
              <TableCell>
                {/* Icon button for deleting an expense */}
                <IconButton onClick={() => handleDeleteExpense(expense.id)}>
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Container>
  );
}
