import { createContext, useContext, useState } from "react";

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const [profileState, setProfileState] = useState({
    open: false,
    userId: null,
    mode: "readonly",
    invite: null
  });

  const openProfile = (userId, mode = "readonly", invite = null) => {
    setProfileState({ open: true, userId, mode, invite });
  };

  const closeProfile = () => {
    setProfileState({ open: false, userId: null, mode: "readonly", invite: null });
  };

  return (
    <ProfileContext.Provider value={{ profileState, openProfile, closeProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
