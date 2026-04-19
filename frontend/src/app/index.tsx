import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/shared/contexts/auth-context';
import Header from '@/widgets/header';
import HomePage from '@/pages/home';
import LoginPage from '@/pages/login';
import RegisterPage from '@/pages/register';
import DashboardPage from '@/pages/dashboard';
import CreateTripPage from '@/pages/create-trip';
import ProfilePage from '@/pages/profile';
import AccountPage from '@/pages/account';
import TripConfirmationPage from '@/pages/trip-confirmation';
import TripChatPage from '@/pages/trip-chat';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/create-trip" element={<CreateTripPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/trip-confirmation" element={<TripConfirmationPage />} />
              <Route path="/trip/:id" element={<TripChatPage />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;