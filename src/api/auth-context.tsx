import React, { useState, useEffect, useCallback } from "react";
import * as authAction from "../api/auth-action";

let logoutTimer: NodeJS.Timeout;

type Props = { children?: React.ReactNode };
type UserInfo = { email: string; nickname: string };
type LoginToken = {
  grantType: string;
  accessToken: string;
  tokenExpiresIn: number;
};

const AuthContext = React.createContext({
  token: "",
  userObj: { email: "", nickname: "" },
  isLoggedIn: false,
  isSuccess: false,
  isGetSuccess: false,
  signup: (email: string, password: string, nickname: string) => {
    console.warn("signup method not implemented");
  },
  login: (email: string, password: string) => {
    console.warn("login method not implemented");
  },
  logout: () => {
    console.warn("logout method not implemented");
  },
  getUser: () => {
    console.warn("getUser method not implemented");
  },
  changeNickname: (nickname: string) => {
    console.warn("changeNickname method not implemented");
  },
  changePassword: (exPassword: string, newPassword: string) => {
    console.warn("changePassword method not implemented");
  },
});

export const AuthContextProvider: React.FC<Props> = (props) => {
  const tokenData = authAction.retrieveStoredToken();

  let initialToken: any;
  if (tokenData) {
    initialToken = tokenData.token!;
  }

  const [token, setToken] = useState(initialToken);
  const [userObj, setUserObj] = useState({
    email: "",
    nickname: "",
  });

  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isGetSuccess, setIsGetSuccess] = useState<boolean>(false);

  const userIsLoggedIn = !!token;

  const signupHandler = (email: string, password: string, nickname: string) => {
    setIsSuccess(false);
    const response = authAction.signupActionHandler(email, password, nickname);
    response.then((result: any) => {
      if (result !== null) {
        setIsSuccess(true);
      }
    });
  };

  const loginHandler = async (email: string, password: string) => {
    setIsSuccess(false);
    // console.log(isSuccess);
    const res = await authAction.loginActionHandler(email, password);
    const data: LoginToken = res?.data;
    if (data !== null) {
      setToken(data.accessToken);
      logoutTimer = setTimeout(logoutHandler, authAction.loginTokenHandler(data.accessToken, data.tokenExpiresIn));

      const getUserRes = await authAction.getUserActionHandler(data.accessToken);
      if (getUserRes !== null) {
        const userData: UserInfo = getUserRes.data;
        setUserObj(userData);
      }

      setIsSuccess(true);
      // console.log(isSuccess);
    }
  };

  const logoutHandler = useCallback(() => {
    setToken("");
    authAction.logoutActionHandler();
    if (logoutTimer) {
      clearTimeout(logoutTimer);
    }
  }, []);

  const getUserHandler = async () => {
    setIsGetSuccess(false);
    const res = await authAction.getUserActionHandler(token);
    if (res !== null) {
      const userData: UserInfo = res.data;
      setUserObj(userData);
    }
  };

  const changeNicknameHandler = (nickname: string) => {
    setIsSuccess(false);

    const data = authAction.changeNicknameActionHandler(nickname, token);
    data.then((result: any) => {
      if (result !== null) {
        const userData: UserInfo = result.data;
        setUserObj(userData);
        setIsSuccess(true);
      }
    });
  };

  const changePaswordHandler = (exPassword: string, newPassword: string) => {
    setIsSuccess(false);
    const data = authAction.changePasswordActionHandler(exPassword, newPassword, token);
    data.then((result: any) => {
      if (result !== null) {
        setIsSuccess(true);
        logoutHandler();
      }
    });
  };

  useEffect(() => {
    if (tokenData) {
      // console.log(tokenData.duration);
      logoutTimer = setTimeout(logoutHandler, tokenData.duration);
    }
  }, [tokenData, logoutHandler]);

  const contextValue = {
    token,
    userObj,
    isLoggedIn: userIsLoggedIn,
    isSuccess,
    isGetSuccess,
    signup: signupHandler,
    login: loginHandler,
    logout: logoutHandler,
    getUser: getUserHandler,
    changeNickname: changeNicknameHandler,
    changePassword: changePaswordHandler,
  };

  return <AuthContext.Provider value={contextValue}>{props.children}</AuthContext.Provider>;
};

export default AuthContext;
