// client/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth } from "../api/firebase";
import { getRedirectResult, onAuthStateChanged, signOut } from "firebase/auth";
import { loginWithFirebase } from "../api/authApi";
import { acceptTeamInvite } from "../api/teamApi";
import axios from "../api/axiosInstance";

// Fix for Safari/Mobile: Ensure cookies are sent with requests
axios.defaults.withCredentials = true;

const INVITE_STORAGE_KEY = "ttm_invite_token";
const ACTIVE_ORG_STORAGE_KEY = "ttm_active_org";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [appUser, setAppUser] = useState(null); // user from our backend (Prisma)
  const [token, setToken] = useState(null); // JWT from our backend
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [hasOrganization, setHasOrganization] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [activeOrgId, setActiveOrgId] = useState(
    () => localStorage.getItem(ACTIVE_ORG_STORAGE_KEY) || ""
  );

  const setMemberships = (orgs = []) => {
    const list = Array.isArray(orgs) ? orgs : [];
    setOrganizations(list);
    setHasOrganization(list.length > 0);
    if (list.length === 0) {
      setActiveOrgId("");
      localStorage.removeItem(ACTIVE_ORG_STORAGE_KEY);
      return;
    }
    const exists = list.some((org) => org.id === activeOrgId);
    if (!exists) {
      const fallbackId = list[0]?.id || "";
      setActiveOrgId(fallbackId);
      if (fallbackId) {
        localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, fallbackId);
      }
    }
  };

  const setActiveOrganization = (orgId) => {
    const next = String(orgId || "");
    setActiveOrgId(next);
    if (next) {
      localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, next);
    } else {
      localStorage.removeItem(ACTIVE_ORG_STORAGE_KEY);
    }
  };

  const activeOrganization = useMemo(() => {
    if (!organizations.length) return null;
    const found = organizations.find((org) => org.id === activeOrgId);
    return found || organizations[0] || null;
  }, [activeOrgId, organizations]);

  const refreshOrganizations = async (idTokenOverride) => {
    if (!firebaseUser && !idTokenOverride) return [];
    const authToken = idTokenOverride || (await firebaseUser.getIdToken());
    const res = await axios.get("/api/orgs", {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const orgs = res.data || [];
    setMemberships(orgs);
    return orgs;
  };

  // Watch Firebase auth state
  useEffect(() => {
    // Always resolve any pending redirect result so auth state updates on any route.
    getRedirectResult(auth).catch(() => {
      // ignore; auth state listener will handle steady-state
    });

    const unsub = onAuthStateChanged(auth, async (user) => {
      setBootstrapped(false);
      if (!user) {
        setFirebaseUser(null);
        setAppUser(null);
        setToken(null);
        setMemberships([]);
        localStorage.removeItem("ttm_token");
        setLoading(false);
        setBootstrapped(true);
        return;
      }

      setFirebaseUser(user);

      // Get fresh Firebase ID token
      const idToken = await user.getIdToken();

      try {
        const data = await loginWithFirebase(idToken);
        setToken(data.token);
        setAppUser(data.user);
        setMemberships(data.organizations || []);
        localStorage.setItem("ttm_token", data.token);

        const inviteToken = localStorage.getItem(INVITE_STORAGE_KEY);
        if (inviteToken) {
          try {
            await acceptTeamInvite({ token: idToken, inviteToken });
            localStorage.removeItem(INVITE_STORAGE_KEY);
            await refreshOrganizations(idToken);
          } catch (inviteError) {
            console.error("Invite accept failed:", inviteError);
          }
        }
      } catch (err) {
        console.error("Error syncing with backend:", err);
      } finally {
        setLoading(false);
        setBootstrapped(true);
      }
    });

    return () => unsub();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    firebaseUser,
    user: appUser,
    token,
    loading,
    organizations,
    hasOrganization,
    activeOrganization,
    activeOrgId,
    setActiveOrganization,
    refreshOrganizations,
    bootstrapped,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => useContext(AuthContext);
