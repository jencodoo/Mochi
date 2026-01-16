import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";

const ProtectedRoute = () => {
  const { accessToken, user, loading, refresh, fetchMe } = useAuthStore();
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        // refresh token nếu chưa có accessToken
        if (!accessToken) {
          await refresh();
        }

        // fetch user nếu đã có token nhưng chưa có user
        if (accessToken && !user) {
          await fetchMe();
        }
      } finally {
        if (isMounted) {
          setStarting(false);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [accessToken, user, refresh, fetchMe]);

  if (starting || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Đang tải trang...
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to="/signin" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
