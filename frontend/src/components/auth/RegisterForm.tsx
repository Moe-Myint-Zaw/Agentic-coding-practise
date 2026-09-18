import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be at most 20 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username must contain only letters, numbers, and underscores'),
  password: z.string().min(8, 'Password must be at least 8 characters').regex(/^(?=.*[A-Za-z])(?=.*\d)/, 'Password must contain at least one letter and one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterForm: React.FC = () => {
  const { t } = useTranslation();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser({
        email: data.email,
        username: data.username,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      navigate('/feed');
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('auth.registerTitle')}</CardTitle>
          <CardDescription>
            {t('auth.noAccount')}{' '}
            <Link to="/login" className="text-primary hover:underline">
              {t('auth.loginLink')}
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t('auth.email')}</label>
              <Input {...register('email')} type="email" placeholder="your@email.com" />
              {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">{t('auth.username')}</label>
              <Input {...register('username')} placeholder="username" />
              {errors.username && <p className="text-destructive text-sm mt-1">{errors.username.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">{t('auth.password')}</label>
              <Input {...register('password')} type="password" placeholder="••••••••" />
              {errors.password && <p className="text-destructive text-sm mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">{t('auth.confirmPassword')}</label>
              <Input {...register('confirmPassword')} type="password" placeholder="••••••••" />
              {errors.confirmPassword && <p className="text-destructive text-sm mt-1">{errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t('common.loading') : t('auth.registerButton')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};