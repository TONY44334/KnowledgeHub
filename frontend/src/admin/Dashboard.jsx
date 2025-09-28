import { useAuth } from "../AuthContext";
import { useState, useEffect } from "react";
import ManageUsers from "./ManageUsers";

const Dashboard = () => {
  const { logout } = useAuth();
  const [menu, setMenu] = useState("overview");

  // Form state for upload
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [publisher, setPublisher] = useState("");
  const [year, setYear] = useState("");
  const [format, setFormat] = useState("pdf");
  const [language, setLanguage] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Admin books
  const [books, setBooks] = useState([]);

  // Edit book state
  const [editingBook, setEditingBook] = useState(null);
  const [editFile, setEditFile] = useState(null);

  // Fetch admin books
  const fetchAdminBooks = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/search?query=`);
      const data = await res.json();
      if (res.ok) {
        const adminOnly = data.books.filter((b) => b.isAdminBook);
        setBooks(adminOnly);
      }
    } catch (err) {
      console.error("Failed to fetch admin books:", err);
    }
  };

  useEffect(() => {
    fetchAdminBooks();
  }, []);

  // Upload book
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return setMessage("Please select a file.");
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("author", author);
    formData.append("publisher", publisher);
    formData.append("year", year);
    formData.append("format", format);
    if (language) formData.append("language", language);
    if (description) formData.append("description", description);

    try {
      const res = await fetch("http://localhost:8080/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ Uploaded: ${data.message}`);
        fetchAdminBooks();
        setTitle(""); setAuthor(""); setPublisher(""); setYear("");
        setFormat("pdf"); setLanguage(""); setDescription(""); setFile(null);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      setMessage(`❌ Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Delete book
  const handleDelete = async (bookId) => {
    if (!window.confirm("Are you sure you want to delete this book?")) return;
    try {
      const res = await fetch(`http://localhost:8080/api/admin/delete?bookId=${bookId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ Deleted book`);
        fetchAdminBooks();
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      setMessage(`❌ Failed: ${err.message}`);
    }
  };

  // Edit book
  const handleEditClick = (book) => {
    setEditingBook({ ...book });
    setEditFile(null);
  };

  const handleUpdate = async () => {
    if (!editingBook) return;
    const formData = new FormData();
    formData.append("bookId", editingBook.id);
    formData.append("title", editingBook.title);
    formData.append("author", editingBook.author);
    formData.append("publisher", editingBook.publisher);
    formData.append("year", editingBook.year);
    formData.append("format", editingBook.format);
    formData.append("language", editingBook.language);
    formData.append("description", editingBook.description);
    if (editFile) formData.append("file", editFile);

    try {
      const res = await fetch("http://localhost:8080/api/admin/update", {
        method: "PUT",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ Updated book successfully`);
        setEditingBook(null);
        fetchAdminBooks();
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      setMessage(`❌ Failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen flex font-[Poppins]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#004d40] text-white p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-8">Admin Panel</h1>
        {["overview", "addBook", "manageUsers"].map((item) => (
          <button
            key={item}
            className={`mb-4 text-left capitalize p-2 rounded hover:bg-[#00695c] ${menu === item ? "bg-[#00695c]" : ""}`}
            onClick={() => setMenu(item)}
          >
            {item}
          </button>
        ))}
        <button
          onClick={logout}
          className="mt-auto p-2 rounded bg-red-600 hover:bg-red-700"
        >
          Logout
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 bg-gray-100 overflow-auto">
        {/* Overview */}
        {menu === "overview" && (
          <div>
            <h2 className="text-xl font-bold mb-4">📊 Uploaded Books</h2>
            {books.length === 0 ? (
              <p>No books uploaded yet.</p>
            ) : (
              <ul className="space-y-4">
                {books.map((b) => (
                  <li key={b.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
                    <div>
                      <p className="font-bold">{b.title}</p>
                      <p className="text-sm text-gray-600">{b.author} | {b.format}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
  onClick={async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/admin/download?bookId=${b.id}`);
      const data = await res.json();
      if (data.downloadUrl) {
        window.open(data.downloadUrl, "_blank"); // open the presigned URL in new tab
      } else {
        alert("Download link not found");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to fetch download link");
    }
  }}
  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
>
  Download
</button>
                      <button
                        onClick={() => handleEditClick(b)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Add Book */}
        {menu === "addBook" && (
          <div>
            <h2 className="text-xl font-bold mb-4">➕ Add Book</h2>
            <form
              className="grid grid-cols-2 gap-4 bg-white p-6 rounded shadow-md"
              onSubmit={handleUpload}
            >
              <input type="text" placeholder="Title" className="border p-2 rounded" value={title} onChange={e => setTitle(e.target.value)} required />
              <input type="text" placeholder="Author" className="border p-2 rounded" value={author} onChange={e => setAuthor(e.target.value)} required />
              <input type="text" placeholder="Publisher" className="border p-2 rounded" value={publisher} onChange={e => setPublisher(e.target.value)} />
              <input type="text" placeholder="Year" className="border p-2 rounded" value={year} onChange={e => setYear(e.target.value)} />
              <select className="border p-2 rounded" value={format} onChange={e => setFormat(e.target.value)}>
                <option value="pdf">PDF</option>
                <option value="epub">EPUB</option>
                <option value="mobi">MOBI</option>
              </select>
              <input type="text" placeholder="Language" className="border p-2 rounded" value={language} onChange={e => setLanguage(e.target.value)} />
              <textarea placeholder="Description" className="col-span-2 border p-2 rounded" value={description} onChange={e => setDescription(e.target.value)} />
              <input type="file" className="col-span-2 border p-2 rounded" onChange={e => setFile(e.target.files[0])} required />
              <button type="submit" className="col-span-2 bg-green-600 text-white py-2 rounded hover:bg-green-700">
                {loading ? "Uploading..." : "Upload Book"}
              </button>
            </form>
            {message && (
              <p className={`mt-4 text-sm font-medium ${message.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>{message}</p>
            )}
          </div>
        )}

        {/* Manage Users */}
        {menu === "manageUsers" && <ManageUsers />}
      </main>

      {/* Edit Modal */}
      {editingBook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-lg">
            <h3 className="text-xl font-semibold mb-4">Edit Book</h3>
            <input type="text" placeholder="Title" className="border p-2 rounded w-full mb-2"
              value={editingBook.title} onChange={e => setEditingBook({...editingBook, title: e.target.value})} />
            <input type="text" placeholder="Author" className="border p-2 rounded w-full mb-2"
              value={editingBook.author} onChange={e => setEditingBook({...editingBook, author: e.target.value})} />
            <input type="text" placeholder="Publisher" className="border p-2 rounded w-full mb-2"
              value={editingBook.publisher} onChange={e => setEditingBook({...editingBook, publisher: e.target.value})} />
            <input type="text" placeholder="Year" className="border p-2 rounded w-full mb-2"
              value={editingBook.year} onChange={e => setEditingBook({...editingBook, year: e.target.value})} />
            <select className="border p-2 rounded w-full mb-2"
              value={editingBook.format} onChange={e => setEditingBook({...editingBook, format: e.target.value})}>
              <option value="pdf">PDF</option>
              <option value="epub">EPUB</option>
              <option value="mobi">MOBI</option>
            </select>
            <input type="text" placeholder="Language" className="border p-2 rounded w-full mb-2"
              value={editingBook.language} onChange={e => setEditingBook({...editingBook, language: e.target.value})} />
            <textarea placeholder="Description" className="border p-2 rounded w-full mb-2"
              value={editingBook.description} onChange={e => setEditingBook({...editingBook, description: e.target.value})} />
            <input type="file" className="border p-2 rounded w-full mb-4" onChange={e => setEditFile(e.target.files[0])} />

            <div className="flex justify-end space-x-2">
              <button onClick={() => setEditingBook(null)} className="px-4 py-2 rounded-lg bg-gray-400 hover:bg-gray-500 text-white">
                Cancel
              </button>
              <button onClick={handleUpdate} className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
