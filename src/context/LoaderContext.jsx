import React, { createContext, useContext, useState } from 'react';
import GlobalLoader from '../components/GlobalLoader';

export const LoaderContext = createContext({ show: false, setShow: () => { } });

export const useLoader = () => useContext(LoaderContext);

export const LoaderProvider = ({ children }) => {
  const [show, setShow] = useState(false);
  return (
    <LoaderContext.Provider value={{ show, setShow }}>
      <GlobalLoader show={show} />
      {children}
    </LoaderContext.Provider>
  );
};
