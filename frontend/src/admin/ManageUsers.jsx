import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";

const ManageUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editingUser, setEditingUser] = useState(null);
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user?.role === "ADMIN") fetchUsers();
  }, []);

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await fetch(`http://localhost:8080/api/users/${id}`, { method: "DELETE" });
      fetchUsers();
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  };

  const handleEditClick = (u) => {
    setEditingUser(u);
    setEditUsername(u.username);
    setEditEmail(u.email);
    setEditRole(u.role);
  };

  const handleUpdate = async () => {
    if (!editingUser) return;
    try {
      const res = await fetch(`http://localhost:8080/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: editUsername,
          email: editEmail,
          role: editRole,
        }),
      });
      if (res.ok) {
        setEditingUser(null);
        fetchUsers();
      } else {
        console.error("Failed to update user");
      }
    } catch (err) {
      console.error("Failed to update user:", err);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">👥 Manage Users</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full border">
          <thead>
            <tr>
              <th className="border px-2 py-1">Username</th>
              <th className="border px-2 py-1">Email</th>
              <th className="border px-2 py-1">Role</th>
              <th className="border px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td className="border px-2 py-1">{u.username}</td>
                <td className="border px-2 py-1">{u.email}</td>
                <td className="border px-2 py-1">{u.role}</td>
                <td className="border px-2 py-1 flex gap-2">
                  <button 
                    onClick={() => handleEditClick(u)} 
                    className="bg-yellow-500 text-white px-2 py-1 rounded"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => deleteUser(u.id)} 
                    className="bg-red-600 text-white px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md">
            <h3 className="text-xl font-semibold mb-4">Edit User</h3>
            <input
              type="text"
              placeholder="Username"
              className="border p-2 rounded w-full mb-2"
              value={editUsername}
              onChange={(e) => setEditUsername(e.target.value)}
            />
            <input
              type="email"
              placeholder="Email"
              className="border p-2 rounded w-full mb-2"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
            />
            <select
              className="border p-2 rounded w-full mb-4"
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-lg bg-gray-400 hover:bg-gray-500 text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
