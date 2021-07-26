import { useEffect } from "react";

const useScript = (url,type) => {
  useEffect(()=> {
    const script = document.createElement('script');

    script.type = type;
    script.src = url;
    script.async = false;

    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    }
  }, [url,type]);
};

export default useScript;