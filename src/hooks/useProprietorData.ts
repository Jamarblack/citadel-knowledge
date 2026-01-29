import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const useProprietorData = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    primaryStudents: 0,
    secondaryStudents: 0,
    totalStaff: 0,
  });
  
  const [financials, setFinancials] = useState({
    totalRevenue: 0,
    pinsSold: 0,
    pinsAvailable: 0,
  });

  const [loading, setLoading] = useState(true);

  // We refresh data when the dashboard loads
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 1. GET STUDENTS (with Class info to split Primary/Secondary)
      // We select the 'level_category' from the related 'classes' table
      const { data: students, error: studentError } = await supabase
        .from('students')
        .select(`
          id, 
          classes ( level_category )
        `);

      if (studentError) throw studentError;

      // Calculate counts in Javascript
      const totalStudents = students?.length || 0;
      // @ts-ignore: Supabase types can be tricky with joins, this ignores the type check for now
      const primaryStudents = students?.filter(s => s.classes?.level_category === 'primary').length || 0;
      // @ts-ignore
      const secondaryStudents = students?.filter(s => s.classes?.level_category === 'secondary').length || 0;


      // 2. GET STAFF COUNT
      const { count: staffCount, error: staffError } = await supabase
        .from('staff')
        .select('*', { count: 'exact', head: true });

      if (staffError) throw staffError;


      // 3. GET REVENUE (Pins)
      const { data: pins, error: pinError } = await supabase
        .from('result_pins')
        .select('status');

      if (pinError) throw pinError;

      const soldCount = pins?.filter(p => p.status === 'used').length || 0;
      const PIN_PRICE = 1000; // ₦1,000 per pin

      // 4. SET STATE
      setStats({
        totalStudents,
        primaryStudents,
        secondaryStudents,
        totalStaff: staffCount || 0,
      });

      setFinancials({
        pinsSold: soldCount,
        pinsAvailable: (pins?.length || 0) - soldCount,
        totalRevenue: soldCount * PIN_PRICE,
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, financials, loading, refresh: fetchDashboardData };
};