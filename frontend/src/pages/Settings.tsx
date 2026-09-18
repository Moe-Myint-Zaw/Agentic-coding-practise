import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export const Settings: React.FC = () => {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t('nav.settings')}</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('theme.toggle')}</CardTitle>
            <CardDescription>
              {t('theme.current')}: {theme === 'light' ? t('theme.light') : t('theme.dark')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={toggleTheme}>
              {theme === 'light' ? t('theme.dark') : t('theme.light')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('language.toggle')}</CardTitle>
            <CardDescription>
              {t('language.current')}: {t('language.english')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => {}}>
              {t('language.myanmar')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('profile.editProfile')}</CardTitle>
            <CardDescription>
              Update your profile information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t('auth.displayName')}</label>
              <Input
                defaultValue={user?.displayName || ''}
                placeholder={t('profile.displayNamePlaceholder')}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t('auth.bio')}</label>
              <Input
                defaultValue={user?.bio || ''}
                placeholder={t('profile.bioPlaceholder')}
              />
            </div>
            <Button>{t('profile.saveProfile')}</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};