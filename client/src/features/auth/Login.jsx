import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../api/auth";
import FormField from "../../components/FormField";
import Spinner from "../../components/Spinner";
import { STORE_NAME } from "../../lib/constants";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await login({ email: email.trim(), password });
      navigate("/");
    } catch (err) {
      setError(err.message || "Wrong email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-card p-8 shadow-sm">
      {/* Brand Wordmark & Mark */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-chip bg-kraft flex items-center justify-center shrink-0 text-white font-mono font-bold text-lg">
          <span className="border border-white/40 w-5 h-5 flex items-center justify-center rounded-[2px]">
            S
          </span>
        </div>
        <div>
          <div className="text-[18px] font-semibold tracking-tight text-text leading-tight">
            StockSense
          </div>
          <div className="text-[12px] text-text-muted">{STORE_NAME}</div>
        </div>
      </div>

      <h1 className="text-[20px] font-semibold text-text mb-1">Sign in</h1>
      <p className="text-[13px] text-text-muted mb-6">
        Enter your store credentials to continue.
      </p>

      {error && (
        <div
          role="alert"
          className="mb-5 p-3 rounded-card bg-status-danger-bg text-status-danger border border-status-danger/30 text-[14px]"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Email" name="email" required>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="w-full h-10 px-3 text-[14px] bg-surface border border-border-strong rounded-input outline-none focus:border-primary transition-colors"
          />
        </FormField>

        <FormField label="Password" name="password" required>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="w-full h-10 px-3 text-[14px] bg-surface border border-border-strong rounded-input outline-none focus:border-primary transition-colors"
          />
        </FormField>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 px-4 text-[14px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-btn transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoading && <Spinner size="sm" />}
            <span>Sign in</span>
          </button>
        </div>
      </form>
    </div>
  );
}
