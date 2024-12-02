import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./Style/Recovery.css";
import { IoArrowBack } from "react-icons/io5";
import { MdMarkEmailRead } from "react-icons/md";
import { FaLock, FaCheckCircle } from "react-icons/fa";
import Popup from "../Components/Popup";
import Popups from "../Components/PopupS";
import { useNavigate } from "react-router-dom";
import Layout from '../Components/Layout.jsx'

export default function Recovery() {
  const [countdown, setCountdown] = useState(0);
  const [isDisabled, setIsDisabled] = useState(false);
  const [email, setEmail] = useState("");
  const [requestError, setRequestError] = useState("");
  const [otpError, setOTPError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [otp, setOTP] = useState(Array(6).fill(""));
  const [open, setOpen] = useState(false);
  const [openChangePass, setOpenChangePass] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notify, setNotify] = useState(false);
  const [seePassword, setSeePassword] = useState(false)
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setRequestError("");
    setIsDisabled(true);
    setOpen(true);
    setCountdown(60);

    const timer = setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown <= 1) {
          clearInterval(timer);
          setIsDisabled(false);
          return 0;
        }
        return prevCountdown - 1;
      });
    }, 1000);

    try {
      await requestOTP();
    } catch (error) {
      console.error("Error requesting OTP:", error);
      clearInterval(timer);
      setIsDisabled(false);
      setRequestError(
        error.response?.data?.message || "An error occurred while sending OTP."
      );
    }
  };

  const requestOTP = async () => {
    try {
      const response = await axios.post("http://192.168.1.185:8800/otp/request", { email });
      if (response.status === 404) {
        setRequestError("Email not found. Please check and try again.");
        throw new Error("Email not found");
      }
      setRequestError("");
    } catch (error) {
      console.error("Error requesting OTP:", error);
      throw error;
    }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    const otpCode = otp.join(""); // Combine OTP array into a single string
    try {
      const response = await axios.post("http://192.168.1.185:8800/otp/verify", { otp: otpCode, email });
      if (response.status === 400) {
        setOTPError("OTP has expired");
      } else if (response.status === 402) {
        setOTPError("Invalid OTP");
      } else {
        setOTPError("");
      }
      setOpenChangePass(true);
      setOpen(false);
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setOTPError(error.response?.data?.message || "An error occurred while verifying OTP.");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setNewPasswordError("Passwords do not match.");
      return;
    }

    try {
      const response = await axios.post("http://192.168.1.185:8800/change-password", {
        email,
        newPassword,
      });
      console.log("Password changed successfully:", response.data);
      setOpenChangePass(false);
      setNotify(true);
    } catch (error) {
      console.error("Error changing password:", error);
      setNewPasswordError(error.response?.data?.message || "An error occurred while changing password.");
    }
  };

  const handleOTPChange = (e, index) => {
    const value = e.target.value;
    if (/^\d$/.test(value) || value === "") {
      const newOTP = [...otp];
      newOTP[index] = value;
      setOTP(newOTP);

      // Move focus to next input if value is entered
      if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`).focus();
      }

      // Move focus to previous input on backspace
      if (value === "" && index > 0) {
        document.getElementById(`otp-${index - 1}`).focus();
      }
    }
  };

  return (
    <Layout>
          <div className="recovery__layout">
      <Link to={"/"}>
        <button className="btn__back"><IoArrowBack />BACK</button>
      </Link>

      <div className="recovery__container">
        <h2>Request OTP</h2>
        <MdMarkEmailRead />
        <form className="request__otp">
          {requestError && <p style={{ color: "red" }}>{requestError}</p>}
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            onClick={handleRequestOtp}
            disabled={isDisabled}
          >
            {isDisabled ? `Resend in ${countdown} seconds` : "REQUEST OTP"}
          </button>
        </form>
      </div>

      {open && (
        <Popup trigger={open} setTrigger={setOpen}>
          <form className="verify__otp" onSubmit={verifyOTP}>
            <h2>VERIFY OTP</h2>
            <FaLock />
            {otpError && <p style={{ color: "red" }}>{otpError}</p>}
            <div className="otp__inputs">
              {otp.map((value, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  value={value}
                  onChange={(e) => handleOTPChange(e, index)}
                  maxLength={1}
                  style={value ? { border: "3px solid #5e83bb" } : {}}
                  required
                />
              ))}
            </div>
            <button type="submit">VERIFY OTP</button>
            <p style={{display: "flex", gap: "5px", fontSize: ".9rem", textAlign: "center"}}>Didnt receive the code? 
                <span 
                style={ isDisabled ? {} : {
                    textDecoration: "underline",
                    cursor: "pointer",
                    color: "blue"
                }}
                onClick={handleRequestOtp}
                >{isDisabled ? `Resend in ${countdown} seconds` : "Resend"}</span>
            </p>
          </form>
        </Popup>
      )}

      <Popup trigger={openChangePass} setTrigger={setOpenChangePass}>
        <form className="change__password" onSubmit={handleChangePassword}>
          <h2>CHANGE PASSWORD</h2>
          <FaLock />
          {newPasswordError && <p style={{ color: "red" }}>{newPasswordError}</p>}
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            disabled
            required
          />
          <input
            type={seePassword ? "text" : "password"}
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <input
            type={seePassword ? "text" : "password"}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
            <div className="show__pass">
                <input  onClick={()=>setSeePassword(prev => !prev)} type="checkbox"/>
                <label>Show Password</label>
            </div>
          <button type="submit">CHANGE PASSWORD</button>
        </form>
      </Popup>

      <Popups trigger={notify} setTrigger={setNotify}>
        <div className="notify__container">
          <FaCheckCircle />
          <h4>Password Successfully Changed</h4>
          <button
            onClick={() => navigate("/")}
          >Login here</button>
        </div>
      </Popups>
    </div>
    </Layout>
  );
}
