function useSidebarNavigation(location, navigate, isMobile, setIsMobileMenuOpen) {
  const goTo = (path) => {
    if (location.pathname === path) return;

    if (isMobile) {
      setIsMobileMenuOpen(false);

      setTimeout(() => {
        if (location.pathname !== path) {
          navigate(path);
        }
      }, 300);
    } else {
      navigate(path);
    }

  };

  return goTo;
}

export default useSidebarNavigation;