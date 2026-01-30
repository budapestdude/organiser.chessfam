import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import AdminSidebar from '../../components/admin/AdminSidebar';
import * as adminApi from '../../api/admin';
import { professionalsApi } from '../../api/professionals';

export default function AdminLayout() {
  const user = useStore((state) => state.user);
  const navigate = useNavigate();
  const [pendingCounts, setPendingCounts] = useState({
    venues: 0,
    masters: 0,
    professionals: 0,
    claims: 0,
    verifications: 0,
    chessTitleVerifications: 0,
  });

  const isAuthenticated = !!user;

  useEffect(() => {
    // Redirect non-admin users
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    if (!user?.is_admin) {
      navigate('/');
      return;
    }

    // Fetch pending counts for badges
    const fetchPendingCounts = async () => {
      try {
        const [venuesRes, mastersRes, professionalsRes, claimsRes, verificationsRes, chessTitleVerificationsRes] = await Promise.all([
          adminApi.getPendingVenues({ limit: 1 }),
          adminApi.getPendingMasters({ limit: 1 }),
          professionalsApi.getPendingApplications({ status: 'pending', limit: 1 }),
          adminApi.getPendingClaims({ limit: 1 }),
          adminApi.getPendingVerifications({ limit: 1 }),
          adminApi.getPendingChessTitleVerifications({ limit: 1 }),
        ]);
        setPendingCounts({
          venues: venuesRes.data.pagination?.total || 0,
          masters: mastersRes.data.pagination?.total || 0,
          professionals: professionalsRes.data?.total || 0,
          claims: claimsRes.data.pagination?.total || 0,
          verifications: verificationsRes.data.pagination?.total || 0,
          chessTitleVerifications: chessTitleVerificationsRes.data.pagination?.total || 0,
        });
      } catch (error) {
        console.error('Failed to fetch pending counts:', error);
      }
    };

    fetchPendingCounts();
  }, [isAuthenticated, user, navigate]);

  if (!isAuthenticated || !user?.is_admin) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#0f0f1a]">
      <AdminSidebar pendingCounts={pendingCounts} />
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
