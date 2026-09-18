import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Moon, Sun, Globe, LogOut, User } from 'lucide-react';
import { Button } from '../ui/button';
import { Link, useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'mm' : 'en');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="border-b px-6 py-4 bg-background">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xl font-bold text-foreground">
            Yaycha
          </Link>
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-4">
              <Link to="/feed" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('nav.feed')}
              </Link>
              <Link to={`/profile/${user?.id}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('nav.profile')}
              </Link>
              {user?.role === 'ADMIN' && (
                <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('nav.admin')}
                </Link>
              )}
            </nav>
          )}
        </div>

        <nav className="flex items-center gap-2">
          {isAuthenticated && (
            <>
              <div className="flex items-center gap-2 mr-4">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{user?.displayName || user?.username}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} title={t('nav.logout')}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}

          <Button variant="ghost" size="icon" onClick={toggleTheme} title={t('theme.toggle')}>
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          <Button variant="ghost" size="icon" onClick={toggleLanguage} title={t('language.toggle')}>
            <Globe className="h-4 w-4" />
          </Button>
        </nav>
      </div>
    </header>
  );
};