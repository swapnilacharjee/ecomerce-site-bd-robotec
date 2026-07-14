import React, { useState, useEffect } from "react";
import { X, User, Mail, Lock, ShieldCheck, Check, LogOut, Sparkles, ShoppingBag, Calendar, MapPin, Phone, MessageSquare } from "lucide-react";
import { UserAccount } from "../types";
import { 
  auth, 
  db, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile, 
  updatePassword,
  signInWithGoogle,
  isFirebaseMock,
  isFirebaseConfigValid,
  doc, 
  getDoc,
  setDoc, 
  updateDoc,
  getDocs,
  collection
} from "../lib/firebase";

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeUser: UserAccount | null;
  onUserChange: (user: UserAccount | null) => void;
  onNewRegister?: (userName: string) => void;
}

export default function UserAccountModal({
  isOpen,
  onClose,
  activeUser,
  onUserChange,
  onNewRegister,
}: UserAccountModalProps) {
  const [mode, setMode] = useState<"login" | "register" | "profile">(
    activeUser ? "profile" : "login"
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [error, setErrorRaw] = useState("");
  const [success, setSuccess] = useState("");

  const setError = (msg: string) => {
    if (msg && (msg.includes("email-already-in-use") || msg.toLowerCase().includes("email already use") || msg.toLowerCase().includes("email already in use"))) {
      setErrorRaw("the email already use. please try another gmail");
    } else {
      setErrorRaw(msg);
    }
  };

  const [pendingGoogleUser, setPendingGoogleUser] = useState<any | null>(null);
  const [showGoogleMockPrompt, setShowGoogleMockPrompt] = useState(false);
  const [googleMockEmail, setGoogleMockEmail] = useState("");
  const [googleMockName, setGoogleMockName] = useState("");
  const [showManualGoogleForm, setShowManualGoogleForm] = useState(false);
  const [savedGoogleAccounts, setSavedGoogleAccounts] = useState<{ email: string; name: string }[]>(() => {
    try {
      const saved = localStorage.getItem("mock_google_accounts");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return [
      { email: "bdshop4321@gmail.com", name: "BD Shop" },
      { email: "swapnilacharjee2003@gmail.com", name: "Swapnil Acharjee" }
    ];
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<"terms" | "privacy" | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [profileTab, setProfileTab] = useState<"settings" | "orders">("orders");

  useEffect(() => {
    if (isOpen && activeUser && mode === "profile") {
      setLoadingOrders(true);
      const fetchOrders = async () => {
        try {
          const querySnapshot = await getDocs(collection(db, "orders"));
          const allOrders: any[] = [];
          querySnapshot.forEach((docSnap: any) => {
            const data = docSnap.data();
            if (data && data.userId === activeUser.uid) {
              allOrders.push(data);
            }
          });
          allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setOrders(allOrders);
        } catch (err) {
          console.error("Error fetching user orders:", err);
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchOrders();
    }
  }, [isOpen, activeUser, mode]);

  const fillAdminCredentials = () => {
    setEmail("swapnilacharjee2003@gmail.com");
    setPassword("Rituraj@26541");
    setError("");
    setSuccess("");
  };

  // Sync mode if activeUser state changes externally
  useEffect(() => {
    if (activeUser) {
      setMode("profile");
      setName(activeUser.name);
      setEmail(activeUser.email);
      const emailLower = activeUser.email?.toLowerCase();
      if (emailLower === "swapnilacharjee2003@gmail.com" || emailLower === "2023100000622@seu.edu.bd") {
        setProfileTab("settings");
      } else {
        setProfileTab("orders");
      }
    } else {
      setMode("login");
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    }
    if (!isOpen) {
      setPendingGoogleUser(null);
      setAgreedToTerms(false);
      setShowGoogleMockPrompt(false);
      setGoogleMockEmail("");
      setGoogleMockName("");
      setShowManualGoogleForm(false);
    }
  }, [activeUser, isOpen]);

  useEffect(() => {
    if (isOpen && localStorage.getItem("trigger_google_simulator_on_load") === "true") {
      setShowGoogleMockPrompt(true);
      setGoogleMockEmail("");
      setGoogleMockName("");
      localStorage.removeItem("trigger_google_simulator_on_load");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!agreedToTerms) {
      setError("Please check the terms of service and privacy policy tick box to confirm.");
      return;
    }

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    
    const trimmedEmail = email.trim().toLowerCase();
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(trimmedEmail)) {
      setError("Only valid Gmail addresses (@gmail.com) are allowed.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // 2. Set display name in Auth
      await updateProfile(user, { displayName: name.trim() });

      // 3. Store additional fields in Firestore 'users' collection
      const emailLower = email.trim().toLowerCase();
      const role = (emailLower === "swapnilacharjee2003@gmail.com" || emailLower === "2023100000622@seu.edu.bd") ? "System Administrator" : "Customer";
      const userProfile: UserAccount = {
        uid: user.uid,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: role
      };

      await setDoc(doc(db, "users", user.uid), userProfile);

      setSuccess("Account created successfully! Logging you in automatically...");
      if (onNewRegister && role === "Customer") {
        onNewRegister(name.trim());
      }
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use" || (err.message && err.message.includes("email-already-in-use"))) {
        setError("the email already use. please try another gmail");
      } else if (err.code === "auth/operation-not-allowed" || (err.message && err.message.includes("operation-not-allowed"))) {
        setError("Firebase: Error (auth/operation-not-allowed). Email/Password Sign-In is disabled.");
      } else {
        setError(err.message || "Failed to create account. Please try again.");
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(trimmedEmail)) {
      setError("Only valid Gmail addresses (@gmail.com) are allowed.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    try {
      const isAdmin = (trimmedEmail === "swapnilacharjee2003@gmail.com" || trimmedEmail === "2023100000622@seu.edu.bd") && password === "Rituraj@26541";
      
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      } catch (signInErr: any) {
        if (signInErr.code === "auth/operation-not-allowed" || (signInErr.message && signInErr.message.includes("operation-not-allowed"))) {
          throw signInErr;
        }
        const isUserNotFound = 
          signInErr.message?.includes("user-not-found") || 
          signInErr.code?.includes("user-not-found") ||
          signInErr.message?.includes("invalid-credential"); // some modern firebase SDKs throw invalid-credential for both

        // If it's the admin or a new user getting user-not-found, auto-register them
        if (isAdmin || isUserNotFound) {
          console.log("User not found or admin first-time login, auto-registering...");
          try {
            userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
            const user = userCredential.user;
            const displayName = isAdmin ? "Swapnil Acharjee" : email.trim().split("@")[0];
            await updateProfile(user, { displayName });
            const userProfile: UserAccount = {
              uid: user.uid,
              name: displayName,
              email: trimmedEmail,
              role: isAdmin ? "System Administrator" : "Customer"
            };
            await setDoc(doc(db, "users", user.uid), userProfile);
          } catch (signUpErr: any) {
            console.error("Auto-registration failed:", signUpErr);
            if (signUpErr.code === "auth/operation-not-allowed" || (signUpErr.message && signUpErr.message.includes("operation-not-allowed"))) {
              throw signUpErr;
            }
            throw signInErr; // throw original login error if register also fails
          }
        } else {
          throw signInErr;
        }
      }

      const user = userCredential.user;

      const emailLower = user.email?.toLowerCase();
      setSuccess(
        (emailLower === "swapnilacharjee2003@gmail.com" || emailLower === "2023100000622@seu.edu.bd")
          ? "Logged in as System Administrator!"
          : "Logged in successfully!"
      );
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/operation-not-allowed" || (err.message && err.message.includes("operation-not-allowed"))) {
        setError("Firebase: Error (auth/operation-not-allowed). Email/Password Sign-In is disabled.");
      } else {
        setError(err.message || "Invalid email or password.");
      }
    }
  };

  const handleGoogleSignIn = async () => {
    if (isGoogleLoading) return;
    setIsGoogleLoading(true);
    setError("");
    setSuccess("");
    
    if (isFirebaseConfigValid && localStorage.getItem("force_mock_auth") === "true") {
      localStorage.removeItem("force_mock_auth");
      localStorage.setItem("open_account_modal_on_load", "true");
      window.location.reload();
      return;
    }
    
    if (isFirebaseMock) {
      setShowGoogleMockPrompt(true);
      setGoogleMockEmail("");
      setGoogleMockName("");
      setIsGoogleLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithGoogle(auth);
      const user = userCredential.user;
      const userEmail = (user.email || "").toLowerCase().trim();

      const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
      if (!userEmail || !gmailRegex.test(userEmail)) {
        await auth.signOut();
        setError("Only valid Gmail addresses (@gmail.com) are allowed to login or register.");
        setIsGoogleLoading(false);
        return;
      }

      // Save pending user to state and prompt for consent
      setPendingGoogleUser(user);
      setAgreedToTerms(false);
      setSuccess("Account selected successfully! Please agree to terms of service and privacy policy to complete registration.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      console.error(err);
      const errCode = err?.code || err?.message;
      if (errCode && (errCode.includes("cancelled-popup-request") || errCode.includes("popup-closed-by-user") || errCode.includes("popup_closed_by_user"))) {
        setError("Sign in was cancelled or closed. Please try again.");
      } else {
        setError(err.message || "Failed to sign in with Google.");
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleMockGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const emailTrimmed = googleMockEmail.trim().toLowerCase();
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailTrimmed || !gmailRegex.test(emailTrimmed)) {
      setError("Only valid Gmail addresses (@gmail.com) are allowed to login or register.");
      return;
    }

    if (!googleMockName.trim()) {
      setError("Please enter your name.");
      return;
    }

    try {
      const userCredential = await signInWithGoogle(auth, emailTrimmed, googleMockName.trim());
      const user = userCredential.user;
      
      // Save account to saved list so it appears under accounts on this device
      const exists = savedGoogleAccounts.some(acc => acc.email.toLowerCase() === emailTrimmed);
      if (!exists) {
        const updated = [...savedGoogleAccounts, { email: emailTrimmed, name: googleMockName.trim() }];
        setSavedGoogleAccounts(updated);
        localStorage.setItem("mock_google_accounts", JSON.stringify(updated));
      }

      // Save pending user to state and prompt for consent
      setPendingGoogleUser(user);
      setAgreedToTerms(false);
      setShowGoogleMockPrompt(false);
      setShowManualGoogleForm(false);
      setSuccess("Account selected successfully! Please agree to terms of service and privacy policy to complete registration.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to simulate Google sign in.");
    }
  };

  const handleSelectMockGoogleAccount = async (email: string, name: string) => {
    setError("");
    setSuccess("");
    try {
      const userCredential = await signInWithGoogle(auth, email.trim().toLowerCase(), name.trim());
      const user = userCredential.user;
      
      setPendingGoogleUser(user);
      setAgreedToTerms(false);
      setShowGoogleMockPrompt(false);
      setShowManualGoogleForm(false);
      setSuccess("Account selected successfully! Please agree to terms of service and privacy policy to complete registration.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to simulate Google account selection.");
    }
  };

  const handleConfirmGoogleSignIn = async () => {
    if (!pendingGoogleUser) return;
    if (!agreedToTerms) {
      setError("Please check the terms of service and privacy policy tick box to confirm.");
      return;
    }

    setError("");
    setSuccess("");
    try {
      const user = pendingGoogleUser;

      // Ensure user profile details exist in Firestore users collection
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);
      
      const emailLower = (user.email || "").toLowerCase().trim();
      const isAdmin = emailLower === "swapnilacharjee2003@gmail.com" || emailLower === "2023100000622@seu.edu.bd";
      const displayName = user.displayName || user.email?.split("@")[0] || "User";

      if (!userSnap.exists()) {
        const userProfile: UserAccount = {
          uid: user.uid,
          name: displayName,
          email: emailLower,
          role: isAdmin ? "System Administrator" : "Customer"
        };
        await setDoc(userDocRef, userProfile);
      }

      setSuccess(`Signed in with Google as ${displayName}! Welcome to RoboBD.`);
      setTimeout(() => {
        setPendingGoogleUser(null);
        setAgreedToTerms(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to finalize registration.");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Name cannot be empty.");
      return;
    }
    if (!email.trim()) {
      setError("Email cannot be empty.");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError("No authenticated session found.");
      return;
    }

    try {
      // 1. Update displayName in auth
      await updateProfile(currentUser, { displayName: name.trim() });

      // 2. If password is provided, update password
      if (password) {
        if (password.length < 6) {
          setError("Password must be at least 6 characters.");
          return;
        }
        await updatePassword(currentUser, password);
      }

      // 3. Update Firestore users collection
      const userDocRef = doc(db, "users", currentUser.uid);
      const updatedFields = {
        name: name.trim(),
        email: email.trim().toLowerCase()
      };
      await updateDoc(userDocRef, updatedFields);

      setSuccess("Profile settings updated successfully!");
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update profile settings.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMode("login");
      onClose();
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Dark backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-[#040e1f]/85 backdrop-blur-md transition-opacity duration-300" 
      />

      {/* Auth Container Box */}
      <div className="relative bg-[#111c2d] border border-[#00dbe7]/35 w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#1f2a3c] border-b border-[#00dbe7]/20 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#00dbe7]" />
            <h3 className="font-space text-sm font-bold text-white tracking-wide uppercase">
              {showGoogleMockPrompt ? "Google Sign-In Simulator" : pendingGoogleUser ? "Google Confirmation" : (
                <>
                  {mode === "register" && "Create Core Account"}
                  {mode === "login" && "Authorize Access"}
                  {mode === "profile" && "Customer Profile"}
                </>
              )}
            </h3>
          </div>
          <button 
            onClick={() => {
              if (showGoogleMockPrompt) {
                setShowGoogleMockPrompt(false);
                setError("");
              } else if (pendingGoogleUser) {
                setPendingGoogleUser(null);
                setAgreedToTerms(false);
              } else {
                onClose();
              }
            }}
            className="p-1 text-[#d8e3fb]/60 hover:text-white transition-colors cursor-pointer rounded-full hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {error && (
            <div className="p-3 mb-4 bg-[#93000a]/35 border border-[#ffb4ab]/30 rounded text-xs text-[#ffb4ab] leading-relaxed">
              {error.includes("operation-not-allowed") || error.includes("Email/Password Sign-In is disabled") ? (
                <div>
                  <p className="font-bold mb-1 text-sm text-[#ffb4ab]">Email/Password Sign-In is Disabled</p>
                  <p className="mb-2">
                    To fix this error, you need to enable <strong>Email/Password</strong> authentication in your Firebase project.
                  </p>
                  <p className="mb-2">
                    Please click the link below to open your Firebase Console, toggle <strong>Email/Password</strong> to enabled, and try again:
                  </p>
                  <a
                    href="https://console.firebase.google.com/project/gen-lang-client-0347750588/authentication/providers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-1 px-3 py-1.5 bg-[#00dbe7] text-[#081425] hover:bg-[#00dbe7]/80 rounded font-space font-bold uppercase text-[10px] tracking-wider transition-all cursor-pointer"
                  >
                    Open Firebase Console Auth Providers
                  </a>
                </div>
              ) : error.toLowerCase().includes("popup") || error.toLowerCase().includes("cancelled") || error.toLowerCase().includes("closed") ? (
                <div>
                  <p className="font-bold mb-1 text-sm text-[#ffb4ab]">Google Sign-In Blocked or Cancelled</p>
                  <p className="mb-2">
                    Browsers inside sandboxed preview iframes often block Google Auth popup windows automatically.
                  </p>
                  <p className="mb-2">
                    You can completely bypass this popup constraint by using the built-in <strong>Google Sign-In Simulator</strong>:
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem("force_mock_auth", "true");
                      localStorage.setItem("open_account_modal_on_load", "true");
                      localStorage.setItem("trigger_google_simulator_on_load", "true");
                      window.location.reload();
                    }}
                    className="inline-block mt-1.5 px-3 py-1.5 bg-[#00dbe7] text-[#081425] hover:bg-[#00dbe7]/80 rounded font-space font-bold uppercase text-[10px] tracking-wider transition-all cursor-pointer"
                  >
                    Bypass & Use Google Sign-In Simulator
                  </button>
                </div>
              ) : (
                error
              )}
            </div>
          )}

          {success && (
            <div className="p-3 mb-4 bg-[#113812]/70 border border-[#4caf50]/40 rounded text-xs text-[#81c784] flex items-center gap-2">
              <Check className="w-4 h-4 text-[#81c784]" />
              {success}
            </div>
          )}

          {showGoogleMockPrompt ? (
            <div className="space-y-4 py-2">
              {!showManualGoogleForm ? (
                <div className="space-y-4">
                  <div className="p-3 bg-[#081425]/40 border border-white/5 rounded-lg">
                    <p className="text-xs text-white leading-relaxed font-sans font-semibold text-center">
                      Google Account Chooser
                    </p>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {savedGoogleAccounts.map((acc, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectMockGoogleAccount(acc.email, acc.name)}
                        className="w-full p-3 bg-[#081425]/50 hover:bg-[#00dbe7]/5 border border-white/5 hover:border-[#00dbe7]/30 rounded-xl transition-all cursor-pointer flex items-center gap-3 text-left group"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#00dbe7]/10 group-hover:bg-[#00dbe7]/20 flex items-center justify-center text-[#00dbe7] text-xs font-bold shrink-0">
                          {acc.name ? acc.name.charAt(0).toUpperCase() : "G"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate group-hover:text-[#00dbe7] transition-colors">
                            {acc.name}
                          </p>
                          <p className="text-[10px] text-[#d8e3fb]/55 font-mono truncate">
                            {acc.email}
                          </p>
                        </div>
                        <span className="text-[10px] text-[#d8e3fb]/40 group-hover:text-white shrink-0 font-mono">
                          Saved
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setShowManualGoogleForm(true)}
                      className="w-full py-2 bg-[#00dbe7]/10 hover:bg-[#00dbe7]/15 border border-[#00dbe7]/20 text-[#00dbe7] hover:text-white text-xs font-space font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>+ Use Another Gmail Account</span>
                    </button>

                    {isFirebaseConfigValid && localStorage.getItem("force_mock_auth") === "true" && (
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.removeItem("force_mock_auth");
                          localStorage.setItem("open_account_modal_on_load", "true");
                          window.location.reload();
                        }}
                        className="w-full py-2 bg-[#0266ff]/20 hover:bg-[#0266ff]/35 border border-[#0266ff]/50 text-white text-xs font-space font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        🔄 Use Real Google Login
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setShowGoogleMockPrompt(false);
                        setError("");
                      }}
                      className="w-full py-2 bg-[#1f2a3c]/50 hover:bg-[#1f2a3c] border border-white/10 text-[#d8e3fb]/80 hover:text-white text-xs font-space font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleMockGoogleSubmit} className="space-y-4">
                  <div className="p-4 bg-[#081425]/40 border border-white/5 rounded-lg space-y-1.5">
                    <p className="text-xs text-white leading-relaxed font-sans font-medium">
                      Enter Gmail Address manually
                    </p>
                    <p className="text-[11px] text-[#d8e3fb]/60 leading-relaxed font-sans">
                      To prevent fake guest profiles, you must enter a valid <span className="text-white font-semibold">@gmail.com</span> address.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-space font-bold tracking-wider text-[#d8e3fb]/70 mb-1.5">
                      Your Full Name
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-[#d8e3fb]/40">
                        <User className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={googleMockName}
                        onChange={(e) => setGoogleMockName(e.target.value)}
                        placeholder="e.g. swapnil acharjee"
                        className="w-full bg-[#081425] border border-white/10 rounded-lg py-2 pl-9 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00dbe7]/60"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-space font-bold tracking-wider text-[#d8e3fb]/70 mb-1.5">
                      Valid Gmail Address (@gmail.com)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-[#d8e3fb]/40">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        type="email"
                        value={googleMockEmail}
                        onChange={(e) => setGoogleMockEmail(e.target.value)}
                        placeholder="e.g. yourname@gmail.com"
                        className="w-full bg-[#081425] border border-white/10 rounded-lg py-2 pl-9 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00dbe7]/60 font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowManualGoogleForm(false);
                        setError("");
                      }}
                      className="flex-1 py-2.5 bg-[#1f2a3c]/50 hover:bg-[#1f2a3c] border border-white/10 text-[#d8e3fb]/80 hover:text-white text-xs font-space font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-[#0266ff] hover:bg-[#0266ff]/85 text-white text-xs font-space font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-lg flex items-center justify-center gap-1.5"
                    >
                      Continue
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : pendingGoogleUser ? (
            <div className="space-y-5 py-2">
              <div className="flex items-center gap-3 p-3 bg-[#081425]/60 border border-white/5 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-[#00dbe7]/15 flex items-center justify-center text-[#00dbe7] font-bold text-sm">
                  {pendingGoogleUser.displayName ? pendingGoogleUser.displayName.charAt(0).toUpperCase() : "G"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-space font-bold text-[#00dbe7] uppercase tracking-wider">
                    Google Account Selected
                  </div>
                  <div className="text-xs font-semibold text-white truncate">
                    {pendingGoogleUser.displayName || "Google User"}
                  </div>
                  <div className="text-[10px] text-[#d8e3fb]/60 font-mono truncate">
                    {pendingGoogleUser.email}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#081425]/40 border border-white/5 rounded-lg space-y-3">
                <p className="text-[11px] text-[#d8e3fb]/70 leading-relaxed font-sans">
                  To complete your account creation and register using Google, please accept our terms of service and privacy policy:
                </p>

                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    id="googleConsentCheck"
                    className="mt-0.5 w-4 h-4 rounded bg-[#081425] border border-white/20 text-[#0266ff] focus:ring-[#00dbe7] cursor-pointer"
                  />
                  <span className="text-xs text-[#d8e3fb]/80 leading-snug">
                    I agree to the <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); setViewingDocument("terms"); }} className="text-[#00dbe7] hover:underline cursor-pointer font-semibold decoration-[#00dbe7]/40">Terms of Service</span> and <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); setViewingDocument("privacy"); }} className="text-[#00dbe7] hover:underline cursor-pointer font-semibold decoration-[#00dbe7]/40">Privacy Policy</span>.
                  </span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPendingGoogleUser(null);
                    setAgreedToTerms(false);
                    setError("");
                  }}
                  className="flex-1 py-2.5 bg-[#1f2a3c]/50 hover:bg-[#1f2a3c] border border-white/10 text-[#d8e3fb]/80 hover:text-white text-xs font-space font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmGoogleSignIn}
                  disabled={!agreedToTerms}
                  className="flex-1 py-2.5 bg-[#0266ff] hover:bg-[#0266ff]/85 disabled:bg-gray-700 disabled:opacity-40 text-white text-xs font-space font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-lg disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Confirm & Register
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* REGISTER MODE */}
              {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-[11px] font-space font-bold tracking-wider text-[#d8e3fb]/50 uppercase mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#00dbe7]" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Adnan Rahman"
                  className="w-full bg-[#081425] border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-[#00dbe7] transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-space font-bold tracking-wider text-[#d8e3fb]/50 uppercase mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#00dbe7]" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                  placeholder="e.g. adnan@example.com"
                  className="w-full bg-[#081425] border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-[#00dbe7] transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-space font-bold tracking-wider text-[#d8e3fb]/50 uppercase mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#00dbe7]" />
                  Security Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Min 6 characters"
                  className="w-full bg-[#081425] border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-[#00dbe7] transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-space font-bold tracking-wider text-[#d8e3fb]/50 uppercase mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#00dbe7]" />
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  className="w-full bg-[#081425] border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-[#00dbe7] transition-all"
                  required
                />
              </div>

              <div className="py-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    id="registerConsentCheck"
                    className="mt-0.5 w-4 h-4 rounded bg-[#081425] border border-white/20 text-[#0266ff] focus:ring-[#00dbe7] cursor-pointer"
                  />
                  <span className="text-xs text-[#d8e3fb]/80 leading-snug">
                    I agree to the <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); setViewingDocument("terms"); }} className="text-[#00dbe7] hover:underline cursor-pointer font-semibold decoration-[#00dbe7]/40">Terms of Service</span> and <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); setViewingDocument("privacy"); }} className="text-[#00dbe7] hover:underline cursor-pointer font-semibold decoration-[#00dbe7]/40">Privacy Policy</span>.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#0266ff] hover:bg-[#0266ff]/85 text-white text-xs font-space font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg mt-2"
              >
                Create Account
              </button>

              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <span className="relative px-3 bg-[#111c2d] text-[10px] uppercase font-space font-bold tracking-wider text-[#d8e3fb]/40">
                  Or Use Fast Authentication
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className={`w-full py-2.5 bg-[#1f2a3c]/70 hover:bg-[#1f2a3c] border border-white/10 hover:border-[#00dbe7]/40 text-[#d8e3fb] hover:text-white text-xs font-space font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${isGoogleLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isGoogleLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                    Connecting to Google...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-[#00dbe7]" viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21.35,11.1H12v2.7h5.38C16.88,15.75,14.63,17,12,17c-2.76,0-5-2.24-5-5s2.24-5,5-5c1.38,0,2.63,0.56,3.54,1.46l2-2C16.12,4.88,14.18,4,12,4,7.58,4,4,7.58,4,12s3.58,8,8,8c4.58,0,8-3.42,8-8A6.8,6.8,0,0,0,21.35,11.1Z" fill="currentColor" />
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>

              <p className="text-center text-xs text-[#d8e3fb]/50 mt-4">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setSuccess("");
                    setMode("login");
                  }}
                  className="text-[#00dbe7] hover:underline font-bold cursor-pointer"
                >
                  Log In
                </button>
              </p>
            </form>
          )}

          {/* LOGIN MODE */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">


              <div>
                <label className="block text-[11px] font-space font-bold tracking-wider text-[#d8e3fb]/50 uppercase mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#00dbe7]" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                  placeholder="e.g. adnan@example.com"
                  className="w-full bg-[#081425] border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-[#00dbe7] transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-space font-bold tracking-wider text-[#d8e3fb]/50 uppercase mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#00dbe7]" />
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Enter your security password"
                  className="w-full bg-[#081425] border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-[#00dbe7] transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#0266ff] hover:bg-[#0266ff]/85 text-white text-xs font-space font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg mt-2"
              >
                Log In
              </button>

              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <span className="relative px-3 bg-[#111c2d] text-[10px] uppercase font-space font-bold tracking-wider text-[#d8e3fb]/40">
                  Or Use Fast Authentication
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className={`w-full py-2.5 bg-[#1f2a3c]/70 hover:bg-[#1f2a3c] border border-white/10 hover:border-[#00dbe7]/40 text-[#d8e3fb] hover:text-white text-xs font-space font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${isGoogleLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isGoogleLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                    Connecting to Google...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-[#00dbe7]" viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21.35,11.1H12v2.7h5.38C16.88,15.75,14.63,17,12,17c-2.76,0-5-2.24-5-5s2.24-5,5-5c1.38,0,2.63,0.56,3.54,1.46l2-2C16.12,4.88,14.18,4,12,4,7.58,4,4,7.58,4,12s3.58,8,8,8c4.58,0,8-3.42,8-8A6.8,6.8,0,0,0,21.35,11.1Z" fill="currentColor" />
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>

              <p className="text-center text-xs text-[#d8e3fb]/50 mt-4">
                Don't have an account yet?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setSuccess("");
                    setMode("register");
                  }}
                  className="text-[#00dbe7] hover:underline font-bold cursor-pointer"
                >
                  Register Now
                </button>
              </p>
            </form>
          )}

          {/* PROFILE / EDIT PROFILE MODE */}
          {mode === "profile" && activeUser && (
            <div className="space-y-4">
              {/* Badge Area */}
              <div className="bg-[#081425]/50 border border-white/5 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-[#00dbe7]/10 border border-[#00dbe7]/35 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-[#00dbe7]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white font-space uppercase">
                      {activeUser.name}
                    </h4>
                    <p className="text-[9px] text-[#00dbe7] font-mono tracking-wider">
                      {activeUser.role || "Customer"}
                    </p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={handleLogout}
                  className="py-1 px-2.5 bg-[#93000a]/20 border border-[#ffb4ab]/15 hover:bg-[#93000a]/35 text-[#ffb4ab] rounded text-[9px] font-space font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  Sign Out
                </button>
              </div>

              {/* Subtabs for profile */}
              <div className="flex border-b border-white/10 gap-2">
                {(activeUser.email?.toLowerCase() !== "swapnilacharjee2003@gmail.com" && activeUser.email?.toLowerCase() !== "2023100000622@seu.edu.bd") && (
                  <button
                    type="button"
                    onClick={() => setProfileTab("orders")}
                    className={`py-2 px-3 text-[10px] uppercase font-space font-bold tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                      profileTab === "orders" 
                        ? "text-[#00dbe7] border-[#00dbe7]" 
                        : "text-[#d8e3fb]/40 border-transparent hover:text-white"
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Purchase History ({orders.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setProfileTab("settings")}
                  className={`py-2 px-3 text-[10px] uppercase font-space font-bold tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    profileTab === "settings" 
                      ? "text-[#00dbe7] border-[#00dbe7]" 
                      : "text-[#d8e3fb]/40 border-transparent hover:text-white"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  Account Settings
                </button>
              </div>

              {/* TAB CONTENT: ORDERS */}
              {profileTab === "orders" && activeUser.email?.toLowerCase() !== "swapnilacharjee2003@gmail.com" && activeUser.email?.toLowerCase() !== "2023100000622@seu.edu.bd" && (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {loadingOrders ? (
                    <div className="text-center py-8 text-xs text-[#d8e3fb]/40 font-mono animate-pulse">
                      Retrieving order logs from secure database...
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-10 bg-[#081425]/30 border border-white/5 rounded-lg">
                      <ShoppingBag className="w-8 h-8 text-[#d8e3fb]/20 mx-auto mb-2" />
                      <p className="text-xs text-white font-space font-semibold uppercase tracking-wider">No Purchase History</p>
                      <p className="text-[10px] text-[#d8e3fb]/50 mt-1 max-w-[200px] mx-auto leading-relaxed font-sans">
                        You have not placed any components or schematics orders yet.
                      </p>
                    </div>
                  ) : (
                    orders.map((ord) => (
                      <div key={ord.id} className="p-3 bg-[#081425]/45 border border-white/5 rounded-lg space-y-2.5 hover:border-[#00dbe7]/20 transition-all text-left">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] font-mono font-bold text-[#00dbe7] bg-[#00dbe7]/5 px-1.5 py-0.5 rounded border border-[#00dbe7]/10">
                              {ord.id.substring(0, 14)}
                            </span>
                            <div className="flex items-center gap-1 text-[9px] text-[#d8e3fb]/40 mt-1">
                              <Calendar className="w-3 h-3 text-[#00dbe7]/60" />
                              <span>{new Date(ord.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold text-[#c3f400] font-sans">
                              ${parseFloat(ord.total).toFixed(2)}
                            </div>
                            <span className={`inline-block mt-0.5 text-[8px] uppercase tracking-widest px-2 py-0.5 rounded font-space font-bold border ${
                              (ord.status || "pending").toLowerCase() === "completed"
                                ? "bg-green-500/15 text-green-400 border-green-500/30"
                                : (ord.status || "pending").toLowerCase() === "processing"
                                ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                                : "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
                            }`}>
                              {ord.status || "pending"}
                            </span>
                          </div>
                        </div>

                        {/* Order Items List */}
                        <div className="border-t border-b border-white/5 py-1.5 my-1 space-y-1">
                          {ord.items && ord.items.map((it: any, index: number) => (
                            <div key={index} className="flex justify-between text-[10px] leading-normal font-sans text-[#d8e3fb]/80">
                              <span>
                                {it.name} <strong className="text-[#00dbe7]">x{it.quantity}</strong>
                              </span>
                              <span className="font-mono text-white/90">${(it.price * it.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Delivery Specs */}
                        <div className="text-[9px] text-[#d8e3fb]/60 space-y-0.5">
                          <div className="flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5 text-[#00dbe7]/50" />
                            <span>Contact: <strong>{ord.customerPhone}</strong></span>
                          </div>
                          <div className="flex items-start gap-1">
                            <MapPin className="w-2.5 h-2.5 mt-0.5 text-[#00dbe7]/50 shrink-0" />
                            <span className="leading-snug">Address: {ord.deliveryLocation}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB CONTENT: SETTINGS */}
              {profileTab === "settings" && (
                <form onSubmit={handleUpdateProfile} className="space-y-3.5 pt-1 text-left">
                  <div>
                    <label className="block text-[10px] font-space font-bold tracking-wider text-[#d8e3fb]/50 uppercase mb-1">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#081425] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#00dbe7] transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-space font-bold tracking-wider text-[#d8e3fb]/50 uppercase mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#081425] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#00dbe7] transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-space font-bold tracking-wider text-[#d8e3fb]/50 uppercase mb-1">
                      New Security Password (optional)
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Leave blank to keep current"
                      className="w-full bg-[#081425] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#00dbe7] transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-[#00dbe7]/15 border border-[#00dbe7]/30 hover:bg-[#00dbe7]/30 text-[#00dbe7] hover:text-white rounded text-[10px] font-space font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                  >
                    Save & Apply Settings
                  </button>
                </form>
              )}
            </div>
          )}
          </>
          )}
        </div>

        {viewingDocument && (
          <div className="absolute inset-0 bg-[#111c2d] z-20 flex flex-col animate-in slide-in-from-bottom duration-250">
            {/* Document Header */}
            <div className="bg-[#1f2a3c] border-b border-[#00dbe7]/20 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#00dbe7]" />
                <h3 className="font-space text-sm font-bold text-white tracking-wide uppercase">
                  {viewingDocument === "terms" ? "Terms of Service" : "Privacy Policy"}
                </h3>
              </div>
              <button 
                onClick={() => setViewingDocument(null)}
                className="p-1 text-[#d8e3fb]/60 hover:text-white transition-colors cursor-pointer rounded-full hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-[#d8e3fb]/80 leading-relaxed font-sans">
              {viewingDocument === "terms" ? (
                <>
                  <p className="font-space text-xs font-bold text-[#00dbe7] uppercase tracking-wider mb-2">
                    RoboBD Terms & Conditions
                  </p>
                  <p>
                    Welcome to RoboBD! By creating an account or purchasing from our platform, you agree to these Terms of Service. Please read them carefully.
                  </p>
                  
                  <h4 className="font-space font-bold text-white uppercase tracking-wider text-[11px] mt-3">
                    1. User Registration & Verification
                  </h4>
                  <p>
                    When registering, users must provide accurate, current, and complete details. You are responsible for safeguarding your credentials. Any unauthorized action on your profile must be reported instantly.
                  </p>

                  <h4 className="font-space font-bold text-white uppercase tracking-wider text-[11px] mt-3">
                    2. Orders, Invoices & Pricing
                  </h4>
                  <p>
                    All products listed on RoboBD are subject to real-time availability. RoboBD reserves the right to revise prices, deny transactions, or cancel duplicate order sequences in case of system anomalies or parts restocking delays.
                  </p>

                  <h4 className="font-space font-bold text-white uppercase tracking-wider text-[11px] mt-3">
                    3. Electronic Parts & System Usage
                  </h4>
                  <p>
                    RoboBD provides automation nodes, microcontrollers, and electronic components for prototyping. Users must ensure safe wiring and operation. We are not liable for hardware misconfiguration or damage caused during user experimentation.
                  </p>

                  <h4 className="font-space font-bold text-white uppercase tracking-wider text-[11px] mt-3">
                    4. Service Access & Security
                  </h4>
                  <p>
                    We deploy secure Firebase Auth protection shields. Attempting to inject scripts, compromise user directories, or execute DDoS protocols will result in permanent account termination and legal action.
                  </p>

                  <h4 className="font-space font-bold text-white uppercase tracking-wider text-[11px] mt-3">
                    5. Amendments & Notifications
                  </h4>
                  <p>
                    These Terms of Service may be updated as our systems evolve. Continued usage of our website signifies automatic acceptance of revised guidelines.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-space text-xs font-bold text-[#00dbe7] uppercase tracking-wider mb-2">
                    RoboBD Privacy Standards
                  </p>
                  <p>
                    Your privacy is of critical importance to us. This policy describes how we collect, safeguard, and process your industrial user credentials and interaction records.
                  </p>

                  <h4 className="font-space font-bold text-white uppercase tracking-wider text-[11px] mt-3">
                    1. Collected Credentials
                  </h4>
                  <p>
                    We store secure profile datasets including names, email addresses, order histories, and cart choices. Google auth identities are tokenized securely through Google OAuth protocols.
                  </p>

                  <h4 className="font-space font-bold text-white uppercase tracking-wider text-[11px] mt-3">
                    2. Database & Firebase Integration
                  </h4>
                  <p>
                    All user account data is compiled, mapped, and synced in real-time with Google Cloud Firestore. We store passwords strictly via secure hash formulas and never expose plain-text entries.
                  </p>

                  <h4 className="font-space font-bold text-white uppercase tracking-wider text-[11px] mt-3">
                    3. Third-Party Protocols
                  </h4>
                  <p>
                    We do not sell, exchange, or rent user directories. Your contact information is exclusively shared with official local delivery providers in Bangladesh to dispatch your purchased components securely.
                  </p>

                  <h4 className="font-space font-bold text-white uppercase tracking-wider text-[11px] mt-3">
                    4. Cookies & System Memory
                  </h4>
                  <p>
                    We utilize persistent browser cookies to maintain local cart status, token validations, and responsive navigation workflows across tab closures.
                  </p>

                  <h4 className="font-space font-bold text-white uppercase tracking-wider text-[11px] mt-3">
                    5. Contact & Support
                  </h4>
                  <p>
                    For any queries regarding your data footprints or to request account/profile wiping, please contact our support desk through our direct live interface.
                  </p>
                </>
              )}
            </div>

            {/* Document Footer */}
            <div className="bg-[#1f2a3c]/50 border-t border-white/5 p-4 flex gap-2">
              <button
                type="button"
                onClick={() => setViewingDocument(null)}
                className="w-full py-2 bg-[#0266ff] hover:bg-[#0266ff]/85 text-white text-xs font-space font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
              >
                <Check className="w-4 h-4" />
                I Understand & Close
              </button>
            </div>
          </div>
        )}


      </div>
    </div>
  );
}
