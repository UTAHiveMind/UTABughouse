import { useEffect, useState } from "react";
import useIsMobile from "./useIsMobile";

function useMobileDrawer(breakpoint = 768) {
  const isMobile = useIsMobile(breakpoint);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobile]);

  return {
    isMobile,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
  };
}

export default useMobileDrawer;