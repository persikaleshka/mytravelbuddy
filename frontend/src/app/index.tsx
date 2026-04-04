import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from '@/widgets/header';
import HomePage from '@/pages/home';
import LoginPage from '@/pages/login';
import RegisterPage from '@/pages/register';
import DashboardPage from '@/pages/dashboard';
import CreateTripPage from '@/pages/create-trip';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/create-trip" element={<CreateTripPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;