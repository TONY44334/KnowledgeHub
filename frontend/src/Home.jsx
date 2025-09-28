// Home.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import placeholderImg from "./assets/Wabi Sabi Pattern.jpg";
import { useBooks } from "./BooksContext";
import { useAuth } from "./AuthContext";

function Home() {
  const { books, setBooks, query, setQuery } = useBooks();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [booksPerPage, setBooksPerPage] = useState(6);

  // Dynamically set cards per page based on screen width
  useEffect(() => {
    const updateBooksPerPage = () => {
      const width = window.innerWidth;
      if (width >= 1280) setBooksPerPage(12);
      else if (width >= 1024) setBooksPerPage(9);
      else if (width >= 768) setBooksPerPage(6);
      else setBooksPerPage(4);
    };
    updateBooksPerPage();
    window.addEventListener("resize", updateBooksPerPage);
    return () => window.removeEventListener("resize", updateBooksPerPage);
  }, []);

  const searchBooks = async () => {
    setLoading(true);
    setCurrentPage(1);

    try {
      const url = `http://localhost:8080/api/search?query=${encodeURIComponent(
        query
      )}`;
      const res = await fetch(url);
      const data = await res.json();
      const rawBooks = Array.isArray(data.books) ? data.books : [];

      const normalized = rawBooks.map((b, i) => ({
        id: b.id || i,
        title: b.title || "Untitled",
        author: b.author || "Unknown",
        publisher: b.publisher || "Unknown Publisher",
        year: b.year || "N/A",
        descr: b.descr || "",
        size: b.size || "N/A",
        format: b.format || "Unknown",
        imgUrl: b.imgUrl
          ? b.imgUrl.startsWith("http")
            ? b.imgUrl
            : `https://libgen.li/covers/${b.coverurl}`
          : placeholderImg,
        ipfsCid: b.ipfs_cid || null,
      }));

      setBooks(normalized);
    } catch (err) {
      console.error("Error fetching books:", err);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const indexOfLastBook = currentPage * booksPerPage;
  const indexOfFirstBook = indexOfLastBook - booksPerPage;
  const currentBooks = books.slice(indexOfFirstBook, indexOfLastBook);
  const totalPages = Math.ceil(books.length / booksPerPage);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <header className="bg-[#004d40] shadow sticky top-0 z-10">
  <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    {/* Logo / Title */}
    <div className="flex items-center gap-3">
      <h1 className="text-3xl font-extrabold text-white tracking-wide drop-shadow-md">
        Knowledge HUB
      </h1>
      <span className="hidden sm:inline-block text-[#26a69a] font-semibold text-lg">
        📚 Your Digital Library
      </span>
    </div>

    {/* Search Bar */}
    <div className="flex flex-1 sm:flex-auto gap-2 items-center">
      <input
        type="text"
        placeholder="Search books..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="flex-1 px-4 py-2 rounded-lg border-2 border-white/30 focus:border-[#26a69a] focus:ring-2 focus:ring-[#26a69a] bg-white/10 text-white placeholder-white/70 transition"
      />
      <button
        onClick={searchBooks}
        className="px-4 py-2 rounded-lg bg-[#26a69a] text-white font-semibold hover:bg-[#2bbbad] transition-shadow shadow-md hover:shadow-lg"
      >
        Search
      </button>
    </div>

    {/* Logout Button */}
    {user && (
      <button
        onClick={logout}
        className="ml-0 sm:ml-4 px-4 py-2 rounded-lg bg-white/20 border border-white/40 text-white font-medium hover:bg-white/30 transition"
      >
        Logout
      </button>
    )}
  </div>
</header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6">
        {loading && (
          <div className="text-center text-gray-500 py-10 animate-pulse">
            ⏳ Searching...
          </div>
        )}

        {currentBooks.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {currentBooks.map((book) => (
              <Link
                key={book.id}
                to={`/book/${book.id}`}
                state={{ book }}
                className="relative group rounded-xl overflow-hidden shadow-lg transform hover:scale-105 transition"
              >
                <img
                  src={book.imgUrl}
                  alt={book.title}
                  className="w-full h-64 object-cover"
                  onError={(e) => (e.currentTarget.src = placeholderImg)}
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-4 text-white">
                  <h3 className="font-bold text-lg truncate">{book.title}</h3>
                  <p className="text-sm truncate">👤 {book.author}</p>
                  <p className="text-xs truncate">
                    {book.publisher} ({book.year})
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && books.length === 0 && (
          <div className="text-center text-gray-500 py-20 text-lg animate-pulse">
            No books found. Try another search.
          </div>
        )}

        {/* Pagination */}
        {books.length > booksPerPage && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="px-4 py-2 rounded-lg bg-[#004d40] text-white hover:bg-[#00695c] disabled:bg-gray-300 transition"
            >
              ◀ Prev
            </button>
            <span className="font-medium text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="px-4 py-2 rounded-lg bg-[#004d40] text-white hover:bg-[#00695c] disabled:bg-gray-300 transition"
            >
              Next ▶
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#004d40] text-white shadow-inner p-4 text-center font-medium">
        ⚜ Digital Library © {new Date().getFullYear()} ⚜
      </footer>
    </div>
  );
}

export default Home;
