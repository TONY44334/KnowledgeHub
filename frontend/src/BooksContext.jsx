// BooksContext.jsx
import { createContext, useState, useContext } from "react";

const BooksContext = createContext();

export function BooksProvider({ children }) {
  const [books, setBooks] = useState([]);
  const [query, setQuery] = useState("");

  return (
    <BooksContext.Provider value={{ books, setBooks, query, setQuery }}>
      {children}
    </BooksContext.Provider>
  );
}

export const useBooks = () => useContext(BooksContext);
