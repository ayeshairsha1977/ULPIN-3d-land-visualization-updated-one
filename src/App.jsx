import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { SessionProvider } from '@/lib/SessionContext';
import RequireAuth from '@/components/auth/RequireAuth';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import ScrollToTop from './components/ScrollToTop';
import AppLayout from '@/components/layout/AppLayout';
import AdminLayout from '@/components/admin/AdminLayout';
import Home from '@/pages/Home';
import MapPage from '@/pages/MapPage';
import PropertyDetails from '@/pages/PropertyDetails';
import DigitalTwin from '@/pages/DigitalTwin';
import PropertyRecord from '@/pages/PropertyRecord';
import UlpinInfo from '@/pages/UlpinInfo';
import UlpinRequest from '@/pages/UlpinRequest';
import Applications from '@/pages/Applications';
import Complaints from '@/pages/Complaints';
import ComplaintNew from '@/pages/ComplaintNew';
import About from '@/pages/About';
import Dashboard from '@/pages/Dashboard';
import MyProperties from '@/pages/MyProperties';
import Profile from '@/pages/Profile';
import AdminOverview from '@/pages/admin/AdminOverview';
import AdminApplications from '@/pages/admin/AdminApplications';
import AdminApplicationReview from '@/pages/admin/AdminApplicationReview';
import AdminComplaints from '@/pages/admin/AdminComplaints';
import AdminComplaintDetail from '@/pages/admin/AdminComplaintDetail';
import AdminProperties from '@/pages/admin/AdminProperties';
import AdminRecords from '@/pages/admin/AdminRecords';

const AuthenticatedApp = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/property/:id" element={<PropertyDetails />} />
          <Route path="/property/:id/3d" element={<DigitalTwin />} />
          <Route path="/property-record/:id" element={<PropertyRecord />} />
          <Route path="/ulpin" element={<UlpinInfo />} />
          <Route path="/about" element={<About />} />
          <Route element={<RequireAuth />}>
            <Route path="/ulpin/request" element={<UlpinRequest />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/complaints" element={<Complaints />} />
            <Route path="/complaints/new" element={<ComplaintNew />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/properties" element={<MyProperties />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route element={<AdminLayout allow={["government", "surveyor"]} />}>
            <Route path="/admin/applications" element={<AdminApplications />} />
            <Route path="/admin/applications/:id" element={<AdminApplicationReview />} />
          </Route>
          <Route element={<AdminLayout allow={["government"]} />}>
            <Route path="/admin" element={<AdminOverview />} />
            <Route path="/admin/complaints" element={<AdminComplaints />} />
            <Route path="/admin/complaints/:id" element={<AdminComplaintDetail />} />
          </Route>
          <Route element={<AdminLayout allow={["government", "surveyor"]} />}>
            <Route path="/admin/properties" element={<AdminProperties />} />
            <Route path="/admin/records" element={<AdminRecords />} />
          </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </SessionProvider>
  )
}

export default App