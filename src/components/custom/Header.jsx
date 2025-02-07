import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { FaBars, FaTimes, FaUserCircle, FaGoogle } from "react-icons/fa";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const navigate = useNavigate();

  // Function to update state from localStorage
  const updateAuthState = () => {
    const storedToken = localStorage.getItem("authToken");
    const storedProfile = localStorage.getItem("googleProfile");
    if (storedToken && storedProfile) {
      setIsAuthenticated(true);
      setUserProfile(JSON.parse(storedProfile));
    } else {
      setIsAuthenticated(false);
      setUserProfile(null);
    }
  };

  // Check auth state on mount
  useEffect(() => {
    updateAuthState();
  }, []);

  // Listen for the custom "authChanged" event to update the auth state
  useEffect(() => {
    const handleAuthChange = () => {
      updateAuthState();
    };
    window.addEventListener("authChanged", handleAuthChange);
    return () => {
      window.removeEventListener("authChanged", handleAuthChange);
    };
  }, []);

  const handleGoogleLoginSuccess = (tokenResponse) => {
    // Fetch user profile using the access token from tokenResponse
    fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
    })
      .then((res) => res.json())
      .then((profile) => {
        // Store the token and profile in localStorage
        localStorage.setItem("authToken", tokenResponse.access_token);
        localStorage.setItem("googleProfile", JSON.stringify(profile));
        // Update local state immediately
        setIsAuthenticated(true);
        setUserProfile(profile);
        // Dispatch a custom event so that other components know about the change
        window.dispatchEvent(new Event("authChanged"));
      })
      .catch((error) => console.error("Failed to fetch user profile", error));
  };

  // Create a custom Google login function using the useGoogleLogin hook
  const login = useGoogleLogin({
    onSuccess: handleGoogleLoginSuccess,
    onError: () => console.error("Google login failed"),
  });

  const handleLogout = () => {
    // Remove the token and profile from localStorage
    localStorage.removeItem("authToken");
    localStorage.removeItem("googleProfile");
    // Update state to reflect logout
    setIsAuthenticated(false);
    setUserProfile(null);
    // Dispatch a custom event so that any other component can update accordingly
    window.dispatchEvent(new Event("authChanged"));
    // Redirect the user to the home page
    navigate("/");
  };

  // Only show the "Trips" navigation link if authenticated.
  const navigationItems = isAuthenticated ? ["Trips"] : [];

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_AUTH_CLIENT_ID}>
      <header className="bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md border-b border-gray-300 w-full">
        <nav className="flex justify-between items-center px-4 py-3 w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center ml-2 mt-2">
            <img
              src="/logoipsum-348.svg"
              alt="Logo"
              className="w-40 h-auto transition-transform hover:scale-105"
            />
          </Link>

          {/* Desktop Navigation: Render only if there are navigation items */}
          {navigationItems.length > 0 && (
            <ul className="hidden md:flex gap-6 text-lg font-medium">
              {navigationItems.map((item) => (
                <li key={item}>
                  <Link
                    to={`/${item.toLowerCase()}`}
                    className="hover:text-yellow-300 transition duration-300"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* Mobile Menu Icon: Render only if there are navigation items */}
          {navigationItems.length > 0 && (
            <div
              className="md:hidden cursor-pointer"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </div>
          )}

          {/* Mobile Dropdown Menu: Render only if menuOpen and there are navigation items */}
          {menuOpen && navigationItems.length > 0 && (
            <ul className="absolute top-16 left-0 w-full bg-white text-gray-900 shadow-md p-4 flex flex-col gap-4 md:hidden">
              {navigationItems.map((item) => (
                <li key={item}>
                  <Link
                    to={`/${item.toLowerCase()}`}
                    onClick={() => setMenuOpen(false)}
                    className="block p-2"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* Authentication Section */}
          {isAuthenticated ? (
            <div className="flex items-center gap-4 mr-2 mt-2 relative z-50">
              {userProfile?.picture ? (
                <img
                  src={userProfile.picture}
                  alt="Profile"
                  className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                />
              ) : (
                <FaUserCircle className="text-3xl text-white" />
              )}
              <button
                onClick={handleLogout}
                className="bg-white text-gray-800 font-semibold py-2 px-6 rounded-lg hover:bg-gray-100 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="mr-2 mt-2 relative z-50">
              <button
                onClick={() => login()}
                className="flex items-center gap-2 bg-white text-gray-800 font-semibold py-2 px-6 rounded-lg hover:bg-gray-100 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <FaGoogle size={20} />
                Sign in with Google
              </button>
            </div>
          )}
        </nav>
      </header>
    </GoogleOAuthProvider>
  );
};

export default Header;
