import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import FindService from "./pages/FindService";
import MyBookings from "./pages/MyBookings";
import WorkerBookings from "./pages/WorkerBookings";
import WorkerProfile from "./pages/WorkerProfile";
import EditWorkerProfile from "./pages/EditWorkerProfile";
import Availability from "./pages/Availability";
import Booking from "./pages/Booking";
import MyReviews from "./pages/MyReviews";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";


function App() {
  return (
    <BrowserRouter>

      <Routes>
          <Route
  path="/"
  element={<Login />}
/>
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/find-service"
          element={<FindService />}
        />

        <Route
          path="/my-bookings"
          element={<MyBookings />}
        />

        <Route
          path="/my-reviews"
          element={<MyReviews />}
        />

        <Route
          path="/worker-bookings"
          element={<WorkerBookings />}
        />

        <Route
          path="/worker/:workerId"
          element={<WorkerProfile />}
        />

        <Route
          path="/worker/profile"
          element={<WorkerProfile />}
        />

        <Route
          path="/worker/edit-profile"
          element={<EditWorkerProfile />}
        />

        <Route
          path="/worker/availability"
          element={<Availability />}
        />

        <Route
          path="/booking"
          element={<Booking />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;