// Login.jsx
import { useState } from "react";
import { useAuth } from "./AuthContext";

const Login = () => {
  const { login } = useAuth();
  const [isSignup, setIsSignup] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState(""); // For signup
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Strict Regex patterns
    const usernameRegex = /^[A-Za-z_]{3,16}$/; // Only letters & underscores, 3–16 chars
    const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/; // Must end with proper domain (.com, .net, .org etc.)
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (isSignup) {
      // Validate fields before signup
      if (!usernameRegex.test(username)) {
        setMessage(
          "❌ Username must be 3–16 letters or underscores (no numbers allowed)."
        );
        return;
      }
      if (!emailRegex.test(email)) {
        setMessage("❌ Enter a valid email address (e.g., name@example.com).");
        return;
      }
      if (!passwordRegex.test(password)) {
        setMessage(
          "❌ Password must be at least 8 chars with uppercase, lowercase, number & special character."
        );
        return;
      }

      // Proceed with signup
      try {
        const res = await fetch("http://localhost:8080/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            email,
            password,
            role: "USER",
          }),
        });

        const data = await res.json();
        if (res.ok) {
          setMessage("✅ Account created successfully! Please login.");
          setIsSignup(false);
        } else {
          setMessage(`❌ Error: ${data.error || "Failed to create account"}`);
        }
      } catch (err) {
        setMessage(`❌ Failed: ${err.message}`);
      }
    } else {
      // Login logic
      login(username, password);
    }
  };

  return (
    <div
      className="h-screen w-screen flex flex-col items-center justify-center 
      bg-[url('./assets/Knpic.jpg')] bg-cover bg-center font-[Poppins] text-white"
    >
      {/* Project Title */}
      <header className="absolute top-6 text-center">
        <h1 className="text-4xl font-bold tracking-wide drop-shadow-md">
          KnowledgeHub
        </h1>
        <p className="text-sm text-white/80 mt-1">
          Your digital library, simplified
        </p>
      </header>

      {/* Glass Card */}
      <div
        className="relative flex flex-col items-center p-8 w-[90%] max-w-md
        bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20"
      >
        <h2 className="text-2xl font-semibold mb-6">
          {isSignup ? "Sign Up" : "Login"}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col w-full gap-4 text-base"
        >
          {/* Username */}
          <div className="flex flex-col">
            <label htmlFor="username" className="ml-2 text-sm text-white/80">
              Username
            </label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 px-4 py-3 rounded-lg bg-white/20 border border-white/30
                text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
          </div>

          {/* Email (Signup only) */}
          {isSignup && (
            <div className="flex flex-col">
              <label htmlFor="email" className="ml-2 text-sm text-white/80">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 px-4 py-3 rounded-lg bg-white/20 border border-white/30
                  text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
            </div>
          )}

          {/* Password */}
          <div className="flex flex-col">
            <label htmlFor="password" className="ml-2 text-sm text-white/80">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 px-4 py-3 rounded-lg bg-white/20 border border-white/30
                text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="mt-4 py-3 rounded-lg w-full bg-indigo-600/80 hover:bg-indigo-500
              transition text-white font-semibold tracking-wide active:scale-95"
          >
            {isSignup ? "Sign Up" : "Login"}
          </button>
        </form>

        {/* Toggle */}
        <p className="mt-4 text-sm text-white/70">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => {
              setIsSignup(!isSignup);
              setMessage("");
            }}
            className="underline font-medium"
          >
            {isSignup ? "Login" : "Sign Up"}
          </button>
        </p>

        {/* Message */}
        {message && <p className="mt-2 text-sm text-yellow-400">{message}</p>}
      </div>
    </div>
  );
};

export default Login;
