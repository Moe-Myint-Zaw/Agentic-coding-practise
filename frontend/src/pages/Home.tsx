import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export const Home: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4">Welcome to Yaycha</h1>
        <p className="text-muted-foreground mb-8">
          {t('post.postContent')}
        </p>
        <Link to="/feed">
          <Button size="lg">{t('nav.feed')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl">Yaycha</CardTitle>
          <CardDescription className="text-lg">
            Connect with friends and share your moments
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Link to="/login" className="w-full">
            <Button size="lg" className="w-full">
              {t('auth.loginTitle')}
            </Button>
          </Link>
          <Link to="/register" className="w-full">
            <Button size="lg" variant="outline" className="w-full">
              {t('auth.registerTitle')}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};