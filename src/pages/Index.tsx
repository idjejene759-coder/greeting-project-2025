import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

type Screen = 'home' | 'instructions' | 'signals' | 'referral' | 'auth' | 'admin' | 'admin_user' | 'vip' | 'crashx';

interface User {
  id: number;
  username: string;
  balance: number;
  referralCount: number;
  referralCode: string;
}

const AUTH_URL = 'https://functions.poehali.dev/84480352-2061-48c5-b055-98dde5c9eaac';
const ADMIN_URL = 'https://functions.poehali.dev/c85f181c-7e3a-4ae4-b2ab-510eafdab9d4';

const Index = () => {
  const [screen, setScreen] = useState<Screen>('auth');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [currentSignal, setCurrentSignal] = useState<number | null>(null);
  const [balance, setBalance] = useState(0);
  const [referralCount, setReferralCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isWaiting, setIsWaiting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [editBalance, setEditBalance] = useState('');
  const [editReferrals, setEditReferrals] = useState('');
  const [banReason, setBanReason] = useState('');
  const [crashXSignal, setCrashXSignal] = useState<number | null>(null);
  const [crashXTimeLeft, setCrashXTimeLeft] = useState(0);
  const [isCrashXWaiting, setIsCrashXWaiting] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedAdmin = localStorage.getItem('isAdmin');
    
    if (savedAdmin === 'true') {
      setIsAdmin(true);
      loadAdminUsers();
      setScreen('admin');
    } else if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setBalance(userData.balance || 0);
        setReferralCount(userData.referralCount || 0);
        setScreen('home');
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
        setScreen('auth');
      }
    }
  }, []);

  useEffect(() => {
    if (user && !isAdmin) {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(ADMIN_URL);
          const data = await response.json();
          if (data.users) {
            const currentUser = data.users.find((u: any) => u.id === user.id);
            if (currentUser) {
              const balanceChanged = currentUser.balance !== balance;
              const referralsChanged = currentUser.referralCount !== referralCount;
              
              if (balanceChanged || referralsChanged) {
                setBalance(currentUser.balance);
                setReferralCount(currentUser.referralCount);
                const updatedUser = {
                  ...user,
                  balance: currentUser.balance,
                  referralCount: currentUser.referralCount
                };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                
                if (balanceChanged) {
                  toast.info(`Ваш баланс обновлён: ${currentUser.balance} ₽`);
                }
                if (referralsChanged) {
                  toast.info(`Рефералов: ${currentUser.referralCount}`);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error updating user data:', error);
        }
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [user?.id, isAdmin, balance, referralCount]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && isWaiting) {
      setIsWaiting(false);
    }
  }, [timeLeft, isWaiting]);

  useEffect(() => {
    if (crashXTimeLeft > 0) {
      const timer = setTimeout(() => setCrashXTimeLeft(crashXTimeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (crashXTimeLeft === 0 && isCrashXWaiting) {
      setIsCrashXWaiting(false);
    }
  }, [crashXTimeLeft, isCrashXWaiting]);

  const generateSignal = () => {
    if (isWaiting) {
      toast.error(`Подождите ${timeLeft} секунд до следующего сигнала`);
      return;
    }

    const rand = Math.random() * 100;
    let signal;
    
    if (rand < 1) {
      signal = (Math.random() * (90 - 20) + 20).toFixed(2);
    } else if (rand < 30) {
      signal = (Math.random() * (20 - 10) + 10).toFixed(2);
    } else {
      signal = (Math.random() * (10 - 1.01) + 1.01).toFixed(2);
    }
    
    setCurrentSignal(parseFloat(signal.replace(',', '.')));
    setIsWaiting(true);
    setTimeLeft(60);
  };

  const handleVipSignals = () => {
    setScreen('vip');
  };

  const handleWithdraw = () => {
    window.open('https://t.me/Lusky_bear_bot', '_blank');
  };

  const copyReferralLink = () => {
    if (user?.referralCode) {
      const referralLink = `https://t.me/Lusky_bear_bot?start=${user.referralCode}`;
      navigator.clipboard.writeText(referralLink);
      toast.success('Ссылка скопирована в буфер обмена!');
    }
  };

  const generateCrashXSignal = () => {
    if (isCrashXWaiting) {
      toast.error(`Подождите ${crashXTimeLeft} секунд до следующего сигнала`);
      return;
    }

    const rand = Math.random() * 100;
    let signal;
    
    if (rand < 5) {
      signal = (Math.random() * (100 - 15) + 15).toFixed(2);
    } else if (rand < 25) {
      signal = (Math.random() * (15 - 10) + 10).toFixed(2);
    } else {
      signal = (Math.random() * (10 - 1.00) + 1.00).toFixed(2);
    }
    
    setCrashXSignal(parseFloat(signal));
    setIsCrashXWaiting(true);
    setCrashXTimeLeft(60);
  };

  const handleRegister = () => {
    window.open('https://t.me/C_Treasure_Bot/app?startapp=eHd1PTE3MDQwMjgzNzcmbT1uZXRsbzU1NSZjPWRlZmF1bHQ', '_blank');
  };

  const handleAuth = async () => {
    if (!username.trim() || !password.trim()) {
      toast.error('Введите имя пользователя и пароль');
      return;
    }

    try {
      if (username.trim() === 'admin345') {
        const response = await fetch(ADMIN_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'login',
            username: username.trim(),
            password: password.trim()
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setIsAdmin(true);
          localStorage.setItem('isAdmin', 'true');
          toast.success('Добро пожаловать, администратор!');
          await loadAdminUsers();
          setScreen('admin');
          setUsername('');
          setPassword('');
          return;
        }
      }

      if (authMode === 'register') {
        const registeredAccounts = JSON.parse(localStorage.getItem('registeredAccounts') || '[]');
        if (registeredAccounts.length >= 2) {
          toast.error('Превышен лимит регистраций с этого устройства (максимум 2 аккаунта)');
          return;
        }
      }

      const urlParams = new URLSearchParams(window.location.search);
      const referralCode = urlParams.get('ref');

      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: authMode,
          username: username.trim(),
          password: password.trim(),
          referralCode: authMode === 'register' ? referralCode : undefined
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const userData = {
          id: data.user.id,
          username: data.user.username,
          balance: data.user.balance || 0,
          referralCount: data.user.referralCount || 0,
          referralCode: data.user.referralCode
        };

        setUser(userData);
        setBalance(userData.balance);
        setReferralCount(userData.referralCount);
        localStorage.setItem('user', JSON.stringify(userData));

        if (authMode === 'register') {
          const registeredAccounts = JSON.parse(localStorage.getItem('registeredAccounts') || '[]');
          registeredAccounts.push(userData.id);
          localStorage.setItem('registeredAccounts', JSON.stringify(registeredAccounts));
        }

        toast.success(authMode === 'login' ? 'Вход выполнен успешно!' : 'Регистрация прошла успешно!');
        setScreen('home');
        setUsername('');
        setPassword('');
      } else {
        toast.error(data.message || 'Ошибка аутентификации');
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('Ошибка подключения к серверу');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setBalance(0);
    setReferralCount(0);
    setIsAdmin(false);
    setAdminUsers([]);
    setSelectedUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
    setScreen('auth');
    toast.success('Вы вышли из аккаунта');
  };

  const loadAdminUsers = async () => {
    try {
      const response = await fetch(ADMIN_URL);
      const data = await response.json();
      if (data.users) {
        setAdminUsers(data.users);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Ошибка загрузки списка пользователей');
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(ADMIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          userId: selectedUser.id,
          balance: parseFloat(editBalance) || 0,
          referralCount: parseInt(editReferrals) || 0
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Данные пользователя обновлены!');
        await loadAdminUsers();
        setScreen('admin');
        setSelectedUser(null);
      } else {
        toast.error(data.message || 'Ошибка обновления');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Ошибка подключения к серверу');
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser || !banReason.trim()) {
      toast.error('Укажите причину блокировки');
      return;
    }

    try {
      const response = await fetch(ADMIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ban',
          userId: selectedUser.id,
          reason: banReason.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Пользователь заблокирован');
        await loadAdminUsers();
        setScreen('admin');
        setSelectedUser(null);
        setBanReason('');
      } else {
        toast.error(data.message || 'Ошибка блокировки');
      }
    } catch (error) {
      console.error('Ban error:', error);
      toast.error('Ошибка подключения к серверу');
    }
  };

  const handleUnbanUser = async (userId: number) => {
    try {
      const response = await fetch(ADMIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'unban',
          userId: userId
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Пользователь разблокирован');
        await loadAdminUsers();
        setScreen('admin');
        setSelectedUser(null);
      } else {
        toast.error(data.message || 'Ошибка разблокировки');
      }
    } catch (error) {
      console.error('Unban error:', error);
      toast.error('Ошибка подключения к серверу');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    if (!confirm(`Вы уверены, что хотите удалить пользователя ${selectedUser.username}?`)) {
      return;
    }

    try {
      const response = await fetch(ADMIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          userId: selectedUser.id
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Пользователь удален');
        await loadAdminUsers();
        setScreen('admin');
        setSelectedUser(null);
      } else {
        toast.error(data.message || 'Ошибка удаления');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Ошибка подключения к серверу');
    }
  };

  if (screen === 'auth') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f2e] via-[#0f1419] to-[#1a0f2e]" />
        
        <Card className="relative z-10 w-full max-w-md bg-black/60 border border-[#9b87f5]/30 p-6 sm:p-8 animate-fade-in">
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-black mb-2" style={{ color: '#9b87f5' }}>
              Lusky Bear
            </h1>
            <p className="text-sm sm:text-base" style={{ color: '#00F0FF' }}>
              {authMode === 'login' ? 'Войдите в свой аккаунт' : 'Создайте новый аккаунт'}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: '#9b87f5' }}>
                Имя пользователя
              </label>
              <Input
                placeholder="Введите имя пользователя"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-black/40 border-[#9b87f5]/30 focus:border-[#9b87f5]"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: '#9b87f5' }}>
                Пароль
              </label>
              <Input
                type="password"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
                className="bg-black/40 border-[#9b87f5]/30 focus:border-[#9b87f5]"
              />
            </div>

            <Button
              onClick={handleAuth}
              className="w-full h-12 text-base sm:text-lg font-bold bg-[#1a1a2e] hover:bg-[#252545] text-[#9b87f5] border-2 border-[#9b87f5]/30 hover:border-[#9b87f5]/60"
            >
              {authMode === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </Button>

            <div className="text-center">
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="text-sm hover:underline"
                style={{ color: '#00F0FF' }}
              >
                {authMode === 'login' ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
              </button>
            </div>

            <Button
              onClick={handleRegister}
              className="w-full h-12 text-base sm:text-lg font-bold bg-[#1a1a2e] hover:bg-[#252545] text-[#FF10F0] border-2 border-[#FF10F0]/30 hover:border-[#FF10F0]/60"
            >
              <Icon name="UserPlus" size={20} className="mr-2" />
              Зарегистрироваться в боте
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (screen === 'home' && user) {
    return (
      <div className="min-h-screen p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f2e] via-[#0f1419] to-[#1a0f2e]" />
        
        <div className="relative z-10 max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fade-in">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl sm:text-4xl font-black" style={{ color: '#9b87f5' }}>
              Lusky Bear
            </h1>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300"
            >
              <Icon name="LogOut" size={20} className="mr-2" />
              Выход
            </Button>
          </div>

          <Card className="bg-black/60 border border-[#9b87f5]/30 p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4 mb-4">
              <Icon name="User" size={32} className="text-[#00F0FF]" />
              <div>
                <p className="text-base sm:text-lg font-semibold" style={{ color: '#00F0FF' }}>
                  {user.username}
                </p>
                <p className="text-xs sm:text-sm text-gray-400">ID: {user.id}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-black/40 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-400 mb-1">Баланс</p>
                <p className="text-lg sm:text-2xl font-bold" style={{ color: '#00F0FF' }}>
                  {balance} ₽
                </p>
              </div>
              <div className="bg-black/40 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-400 mb-1">Рефералов</p>
                <p className="text-lg sm:text-2xl font-bold" style={{ color: '#FF10F0' }}>
                  {referralCount}
                </p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Button
              onClick={() => setScreen('instructions')}
              size="lg"
              className="h-16 sm:h-20 text-base sm:text-xl font-bold bg-[#1a1a2e] hover:bg-[#252545] text-[#9b87f5] border-2 border-[#9b87f5]/30 hover:border-[#9b87f5]/60 transition-all"
            >
              <Icon name="BookOpen" size={24} className="mr-2" />
              Начать
            </Button>

            <Button
              onClick={() => setScreen('signals')}
              size="lg"
              className="h-16 sm:h-20 text-base sm:text-xl font-bold bg-[#1a1a2e] hover:bg-[#252545] text-[#00F0FF] border-2 border-[#00F0FF]/30 hover:border-[#00F0FF]/60 transition-all"
            >
              <Icon name="TrendingUp" size={24} className="mr-2" />
              Сигналы
            </Button>

            <Button
              onClick={() => setScreen('referral')}
              size="lg"
              className="h-16 sm:h-20 text-base sm:text-xl font-bold bg-[#1a1a2e] hover:bg-[#252545] text-[#FF10F0] border-2 border-[#FF10F0]/30 hover:border-[#FF10F0]/60 transition-all"
            >
              <Icon name="Users" size={24} className="mr-2" />
              Рефералы
            </Button>

            <Button
              onClick={handleVipSignals}
              size="lg"
              className="h-16 sm:h-20 text-base sm:text-xl font-bold bg-gradient-to-r from-[#9b87f5] to-[#7c3aed] hover:from-[#8b77e5] hover:to-[#6c2acd] text-white border-2 border-[#9b87f5]/50 transition-all"
            >
              <Icon name="Crown" size={24} className="mr-2" />
              VIP Сигналы
            </Button>
          </div>

          <Button
            onClick={handleWithdraw}
            size="lg"
            className="w-full h-14 sm:h-16 text-lg sm:text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white transition-all"
          >
            <Icon name="DollarSign" size={24} className="mr-2" />
            Вывести средства
          </Button>
        </div>
      </div>
    );
  }

  if (screen === 'instructions') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-6">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={() => setScreen('home')}
            className="mb-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm"
          >
            <Icon name="ArrowLeft" className="mr-2" />
            Назад
          </Button>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
            <h2 className="text-2xl font-bold mb-6 text-center">
              Как использовать сигналы 1WIN
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center">
                  <Icon name="Zap" className="mr-2 text-yellow-400" />
                  Что такое сигналы?
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  Сигналы - это рекомендации по коэффициентам, которые с высокой вероятностью сработают в игре Aviator на платформе 1WIN.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center">
                  <Icon name="Target" className="mr-2 text-green-400" />
                  Как использовать?
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-300">
                  <li>Зарегистрируйтесь на 1WIN по кнопке "Регистрация"</li>
                  <li>Откройте игру Aviator в разделе "Быстрые игры"</li>
                  <li>Получите сигнал в нашем боте</li>
                  <li>Дождитесь раунда и сделайте ставку</li>
                  <li>Выведите средства на указанном коэффициенте</li>
                </ol>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center">
                  <Icon name="TrendingUp" className="mr-2 text-blue-400" />
                  Советы для успеха
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li>Начинайте с небольших ставок</li>
                  <li>Используйте несколько сигналов подряд</li>
                  <li>Не гонитесь за большими коэффициентами</li>
                  <li>Выводите выигрыш вовремя</li>
                  <li>Следите за балансом</li>
                </ul>
              </div>

              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-yellow-200 text-sm">
                  Помните: азартные игры могут вызывать зависимость. Играйте ответственно и только на те средства, которые можете позволить себе потратить.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (screen === 'signals') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-6">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={() => setScreen('home')}
            className="mb-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm"
          >
            <Icon name="ArrowLeft" className="mr-2" />
            Назад
          </Button>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold mb-2">Aviator Сигналы</h2>
              <p className="text-gray-300">Получите прогноз следующего коэффициента</p>
            </div>

            {currentSignal && (
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-8 mb-6 text-center shadow-2xl">
                <p className="text-white/80 text-sm mb-2">Рекомендуемый коэффициент:</p>
                <p className="text-6xl font-bold text-white">{currentSignal}x</p>
              </div>
            )}

            <Button
              onClick={generateSignal}
              disabled={isWaiting}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-6 text-lg disabled:opacity-50"
            >
              {isWaiting ? (
                <>
                  <Icon name="Clock" className="mr-2 animate-spin" />
                  Следующий сигнал через {timeLeft}с
                </>
              ) : (
                <>
                  <Icon name="Zap" className="mr-2" />
                  Получить сигнал
                </>
              )}
            </Button>

            <div className="mt-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-200">
                Совет: Дождитесь нового раунда в игре Aviator и поставьте на рекомендуемый коэффициент
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (screen === 'referral') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-6">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={() => setScreen('home')}
            className="mb-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm"
          >
            <Icon name="ArrowLeft" className="mr-2" />
            Назад
          </Button>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
            <h2 className="text-2xl font-bold mb-6 text-center">
              Реферальная программа
            </h2>

            <div className="space-y-6">
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-6">
                <div className="text-center mb-4">
                  <Icon name="Users" className="w-16 h-16 mx-auto mb-2 text-yellow-400" />
                  <p className="text-3xl font-bold">{referralCount}</p>
                  <p className="text-gray-300">Приглашенных друзей</p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Ваша реферальная ссылка:</h3>
                <div className="flex gap-2">
                  <Input
                    value={`https://t.me/Lusky_bear_bot?start=${user?.referralCode}`}
                    readOnly
                    className="bg-white/5 border-white/20 text-white"
                  />
                  <Button
                    onClick={copyReferralLink}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    <Icon name="Copy" />
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Как это работает?</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start">
                    <Icon name="CheckCircle" className="mr-2 mt-1 text-green-400 flex-shrink-0" />
                    <span>Поделитесь ссылкой с друзьями</span>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircle" className="mr-2 mt-1 text-green-400 flex-shrink-0" />
                    <span>Когда друг зарегистрируется, вы получите бонус</span>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircle" className="mr-2 mt-1 text-green-400 flex-shrink-0" />
                    <span>Чем больше друзей - тем больше бонусов!</span>
                  </li>
                </ul>
              </div>

              <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4">
                <p className="text-purple-200 text-sm text-center">
                  За каждого приглашенного друга вы получаете +10 ₽ на баланс!
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (screen === 'vip') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white p-6">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={() => setScreen('home')}
            className="mb-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm"
          >
            <Icon name="ArrowLeft" className="mr-2" />
            Назад
          </Button>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
            <div className="text-center mb-8">
              <Icon name="Crown" size={64} className="mx-auto mb-4 text-yellow-400" />
              <h2 className="text-3xl font-bold mb-2">VIP Сигналы</h2>
              <p className="text-gray-300">Премиум прогнозы с повышенной точностью</p>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 text-center text-yellow-400">
                  Преимущества VIP
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Icon name="CheckCircle" className="mr-3 text-green-400" size={20} />
                    <span>Сигналы с точностью до 95%</span>
                  </li>
                  <li className="flex items-center">
                    <Icon name="CheckCircle" className="mr-3 text-green-400" size={20} />
                    <span>Приоритетная поддержка 24/7</span>
                  </li>
                  <li className="flex items-center">
                    <Icon name="CheckCircle" className="mr-3 text-green-400" size={20} />
                    <span>Эксклюзивные стратегии</span>
                  </li>
                  <li className="flex items-center">
                    <Icon name="CheckCircle" className="mr-3 text-green-400" size={20} />
                    <span>Доступ к CrashX сигналам</span>
                  </li>
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  onClick={() => setScreen('crashx')}
                  size="lg"
                  className="h-20 text-lg font-bold bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white"
                >
                  <Icon name="Flame" size={24} className="mr-2" />
                  CrashX Сигналы
                </Button>

                <Button
                  size="lg"
                  className="h-20 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
                  onClick={() => window.open('https://t.me/Lusky_bear_bot', '_blank')}
                >
                  <Icon name="MessageCircle" className="mr-2" />
                  Связаться
                </Button>
              </div>

              <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-200 text-center">
                  Чтобы получить VIP доступ, свяжитесь с нами через Telegram
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (screen === 'crashx') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-orange-900 to-yellow-900 text-white p-6">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={() => setScreen('vip')}
            className="mb-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm"
          >
            <Icon name="ArrowLeft" className="mr-2" />
            Назад
          </Button>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
            <div className="text-center mb-6">
              <Icon name="Flame" size={48} className="mx-auto mb-2 text-orange-400" />
              <h2 className="text-3xl font-bold mb-2">CrashX Сигналы</h2>
              <p className="text-gray-300">Прогнозы для игры CrashX</p>
            </div>

            {crashXSignal && (
              <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-8 mb-6 text-center shadow-2xl">
                <p className="text-white/80 text-sm mb-2">Рекомендуемый коэффициент:</p>
                <p className="text-6xl font-bold text-white">{crashXSignal}x</p>
              </div>
            )}

            <Button
              onClick={generateCrashXSignal}
              disabled={isCrashXWaiting}
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-6 text-lg disabled:opacity-50"
            >
              {isCrashXWaiting ? (
                <>
                  <Icon name="Clock" className="mr-2 animate-spin" />
                  Следующий сигнал через {crashXTimeLeft}с
                </>
              ) : (
                <>
                  <Icon name="Flame" className="mr-2" />
                  Получить сигнал
                </>
              )}
            </Button>

            <div className="mt-6 p-4 bg-orange-500/20 border border-orange-500/30 rounded-lg">
              <p className="text-sm text-orange-200">
                Совет: Используйте сигналы CrashX для максимального выигрыша в игре Crash
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (screen === 'admin') {
    return (
      <div className="min-h-screen p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f2e] via-[#0f1419] to-[#1a0f2e]" />
        
        <div className="relative z-10 max-w-6xl mx-auto space-y-6 animate-fade-in py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl sm:text-5xl font-black" style={{ color: '#FF10F0', textShadow: '0 0 20px rgba(255, 16, 240, 0.5)' }}>
              АДМИН-ПАНЕЛЬ
            </h1>
            <Button
              onClick={() => {
                handleLogout();
              }}
              variant="ghost"
              className="text-[#00F0FF] hover:text-[#FF10F0] text-sm"
            >
              <Icon name="LogOut" size={20} className="mr-1" />
              Выход
            </Button>
          </div>

          <Card className="bg-black/60 border border-[#FF10F0]/30 p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center" style={{ color: '#00F0FF' }}>
              Список пользователей ({adminUsers.length})
            </h2>

            <div className="space-y-2">
              {adminUsers.map((u) => (
                <div
                  key={u.id}
                  className="bg-[#1a1a2e] p-3 rounded-lg border border-[#FF10F0]/20 hover:border-[#FF10F0]/50 transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedUser(u);
                    setEditBalance(u.balance.toString());
                    setEditReferrals(u.referralCount.toString());
                    setScreen('admin_user');
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#FF10F0]">{u.username}</p>
                        <p className="text-xs text-gray-400">ID: {u.id}</p>
                      </div>
                      {u.isBanned && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                          Заблокирован
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4 text-xs">
                      <div>
                        <span className="text-gray-400">Баланс:</span>{' '}
                        <span className="text-[#00F0FF] font-bold">{u.balance} ₽</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Рефералов:</span>{' '}
                        <span className="text-[#00F0FF] font-bold">{u.referralCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (screen === 'admin_user' && selectedUser) {
    return (
      <div className="min-h-screen p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f2e] via-[#0f1419] to-[#1a0f2e]" />
        
        <div className="relative z-10 max-w-4xl mx-auto space-y-6 animate-fade-in py-4">
          <Button
            onClick={() => {
              setScreen('admin');
              setSelectedUser(null);
            }}
            variant="ghost"
            className="text-[#00F0FF] hover:text-[#FF10F0]"
          >
            <Icon name="ArrowLeft" size={20} className="mr-2" />
            Назад
          </Button>

          <Card className="bg-black/60 border border-[#FF10F0]/30 p-4 sm:p-6">
            <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: '#FF10F0' }}>
              Управление пользователем
            </h2>

            <div className="space-y-6">
              <div className="bg-[#1a1a2e] p-4 rounded-lg border border-[#FF10F0]/20">
                <p className="text-sm text-gray-400 mb-1">Имя пользователя</p>
                <p className="text-xl font-bold text-[#FF10F0]">{selectedUser.username}</p>
                <p className="text-xs text-gray-500 mt-1">ID: {selectedUser.id}</p>
                {selectedUser.isBanned && (
                  <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded">
                    <p className="text-sm text-red-400 font-bold">Пользователь заблокирован</p>
                    <p className="text-xs text-red-300 mt-1">Причина: {selectedUser.banReason}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-[#00F0FF] mb-2 block">Баланс (₽)</label>
                  <Input
                    type="number"
                    value={editBalance}
                    onChange={(e) => setEditBalance(e.target.value)}
                    className="bg-[#1a1a2e] border-[#FF10F0]/30 text-white"
                    placeholder="Введите новый баланс"
                  />
                </div>

                <div>
                  <label className="text-sm text-[#00F0FF] mb-2 block">Количество рефералов</label>
                  <Input
                    type="number"
                    value={editReferrals}
                    onChange={(e) => setEditReferrals(e.target.value)}
                    className="bg-[#1a1a2e] border-[#FF10F0]/30 text-white"
                    placeholder="Введите количество рефералов"
                  />
                </div>

                <Button
                  onClick={handleUpdateUser}
                  className="w-full bg-[#1a1a2e] hover:bg-[#252545] text-[#00F0FF] border-2 border-[#00F0FF]/30 hover:border-[#00F0FF]/60"
                >
                  <Icon name="Save" size={18} className="mr-2" />
                  Сохранить изменения
                </Button>
              </div>

              {!selectedUser.isBanned ? (
                <div className="space-y-3 pt-4 border-t border-[#FF10F0]/20">
                  <label className="text-sm text-red-400 mb-2 block font-bold">Блокировка пользователя</label>
                  <Input
                    type="text"
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    className="bg-[#1a1a2e] border-red-500/30 text-white"
                    placeholder="Укажите причину блокировки"
                  />
                  <Button
                    onClick={handleBanUser}
                    className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border-2 border-red-500/50 hover:border-red-500"
                  >
                    <Icon name="Ban" size={18} className="mr-2" />
                    Заблокировать пользователя
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => handleUnbanUser(selectedUser.id)}
                  className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 border-2 border-green-500/50 hover:border-green-500"
                >
                  <Icon name="CheckCircle" size={18} className="mr-2" />
                  Разблокировать пользователя
                </Button>
              )}

              <div className="pt-4 border-t border-[#FF10F0]/20">
                <Button
                  onClick={handleDeleteUser}
                  className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-500 border-2 border-red-600/50 hover:border-red-600"
                >
                  <Icon name="Trash2" size={18} className="mr-2" />
                  Удалить пользователя
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return null;
};

export default Index;