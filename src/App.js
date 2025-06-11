import React, { useState, useRef, useEffect } from "react";
import "./App.css";

const requiredParams = [
  "nonce",
  "state",
  "client_id",
  "redirect_uri",
  "scope",
  "response_type",
  "acr_values",
  "claims",
  "claims_locales",
  "display",
  "ui_locales",
];

function validateQueryParams(searchParams) {
  const missing = requiredParams.filter((param) => !searchParams.has(param));
  return missing;
}


function App() {
  const [fydaNumber, setFydaNumber] = useState("");
  const [step, setStep] = useState("enterNumber");
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [urlError, setUrlError] = useState(null);
  const inputRefs = useRef([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const missingParams = validateQueryParams(params);
    if (missingParams.length > 0) {
      setUrlError(`Missing URL parameter(s): ${missingParams.join(", ")}`);
    }
  }, []);

  const handleGetOtp = async () => {
    if (fydaNumber.trim().length !== 12 || isNaN(fydaNumber.trim())) {
      setMessage("Fyda number is required and should be 12 digits. ");
      return;
    }

    setLoading(true);
    setMessage("");

    setTimeout(() => {
      setStep("enterOtp");
      setMessage("OTP sent successfully.");
      setLoading(false);
    }, 1000);
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((digit) => digit !== "")) {
      handleVerify(newOtp);
    }
  };

  const handleVerify = (overrideOtp = null) => {
    const otpToVerify = overrideOtp ? overrideOtp.join("") : otp.join("");

    setLoading(true);
    setMessage("");

    setTimeout(async () => {
      if (otpToVerify === "123456") {
        setStep("verified");
        setMessage("✅ OTP verified successfully.");
        const params = new URLSearchParams(window.location.search);
        // const url = `https://api-in-uat.anbesabank.et/api/nid2/2.0.0/callback?code=abc123&state=${params.get(
        //   "state"
        // )}`;
        const url = `http://localhost:8290/api/nid/callback?code=abc123&state=${params.get(
          "state"
        )}`;
        await fetch(url, {
          method: "GET",
        });
      } else {
        setMessage("❌ Invalid OTP.");
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="container">
      <div className="card">
        <h2 className="title">Fyda OTP Verification</h2>

        {urlError && <div className="message error">⚠️ {urlError}</div>}

        {!urlError && step === "enterNumber" && (
          <>
            <input
              type="text"
              className="input"
              placeholder="Enter Fyda number"
              value={fydaNumber}
              onChange={(e) => setFydaNumber(e.target.value)}
              disabled={loading}
            />
            <button className="btn" onClick={handleGetOtp} disabled={loading}>
              {loading ? "Sending..." : "Get OTP"}
            </button>
          </>
        )}

        {!urlError && step === "enterOtp" && (
          <>
            <div className="otp-box">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  className="otp-input"
                  disabled={loading}
                />
              ))}
            </div>
            <button
              className="btn verify"
              onClick={() => handleVerify()}
              disabled={loading || otp.some((d) => d === "")}
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
          </>
        )}

        {!urlError && step === "verified" && (
          <div className="success">🎉 You're verified!</div>
        )}

        {message && !urlError && <div className="message">{message}</div>}
      </div>
    </div>
  );
}

export default App;
