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
                  toast.info(`💰 Ваш баланс обновлён: ${currentUser.balance} ₽`);
                }
                if (referralsChanged) {
                  toast.info(`👥 Рефералов: ${currentUser.referralCount}`);
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
          referralCode: data.user.referralCode || ''
        };
        
        setUser(userData);
        setBalance(userData.balance);
        setReferralCount(userData.referralCount);
        localStorage.setItem('user', JSON.stringify(userData));
        
        if (authMode === 'register') {
          const registeredAccounts = JSON.parse(localStorage.getItem('registeredAccounts') || '[]');
          registeredAccounts.push(userData.username);
          localStorage.setItem('registeredAccounts', JSON.stringify(registeredAccounts));
        }
        
        toast.success(authMode === 'login' ? 'Вы вошли в систему!' : 'Регистрация успешна!');
        setScreen('home');
        
        setUsername('');
        setPassword('');
      } else {
        toast.error(data.error || 'Ошибка');
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('Ошибка соединения с сервером');
    }
  };

  const loadAdminUsers = async () => {
    try {
      const response = await fetch(ADMIN_URL);
      const data = await response.json();
      if (data.users) {
        setAdminUsers(data.users);
      }
    } catch (error) {
      console.error('Load users error:', error);
      toast.error('Ошибка загрузки пользователей');
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(ADMIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_user',
          userId: selectedUser.id,
          balance: editBalance ? parseInt(editBalance) : undefined,
          referralCount: editReferrals ? parseInt(editReferrals) : undefined
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Данные пользователя обновлены');
        await loadAdminUsers();
        setScreen('admin');
        setSelectedUser(null);
        setEditBalance('');
        setEditReferrals('');
      } else {
        toast.error(data.error || 'Ошибка обновления');
      }
    } catch (error) {
      toast.error('Ошибка соединения с сервером');
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
          action: 'ban_user',
          userId: selectedUser.id,
          reason: banReason.trim()
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Пользователь заблокирован');
        await loadAdminUsers();
        setScreen('admin');
        setSelectedUser(null);
        setBanReason('');
      } else {
        toast.error(data.error || 'Ошибка');
      }
    } catch (error) {
      toast.error('Ошибка соединения с сервером');
    }
  };

  const handleUnbanUser = async (userId: number) => {
    try {
      const response = await fetch(ADMIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'unban_user',
          userId
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Пользователь разблокирован');
        await loadAdminUsers();
        setScreen('admin');
        setSelectedUser(null);
      } else {
        toast.error(data.error || 'Ошибка');
      }
    } catch (error) {
      toast.error('Ошибка соединения с сервером');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setBalance(0);
    setReferralCount(0);
    localStorage.removeItem('user');
    setScreen('auth');
    toast.success('Вы вышли из системы');
  };

  if (screen === 'auth') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f2e] via-[#0f1419] to-[#1a0f2e]" />
        
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-48 h-48 sm:w-64 sm:h-64 bg-[#FF10F0] rounded-full blur-[100px] opacity-10 animate-pulse-glow" />
          <div className="absolute bottom-20 right-10 w-48 h-48 sm:w-64 sm:h-64 bg-[#00F0FF] rounded-full blur-[100px] opacity-10 animate-pulse-glow" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10 max-w-md w-full space-y-8 animate-fade-in">
          <h1 className="text-4xl sm:text-6xl font-black text-center tracking-wider mb-8" style={{ color: '#FF10F0', textShadow: '0 0 20px rgba(255, 16, 240, 0.5)' }}>
            LUSKY BEAR
          </h1>

          <Card className="bg-black/60 border border-[#FF10F0]/30 p-6 sm:p-8">
            <h2 className="text-2xl sm:text-3xl font-black mb-6 text-center" style={{ color: authMode === 'login' ? '#00F0FF' : '#FF10F0' }}>
              {authMode === 'login' ? 'Вход' : 'Регистрация'}
            </h2>

            <div className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Имя пользователя"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-[#1a1a2e] border-[#FF10F0]/30 text-white placeholder:text-gray-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                />
              </div>

              <div>
                <Input
                  type="password"
                  placeholder="Пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#1a1a2e] border-[#FF10F0]/30 text-white placeholder:text-gray-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                />
              </div>

              <Button
                onClick={handleAuth}
                className="w-full h-12 text-lg font-bold bg-[#1a1a2e] hover:bg-[#252545] text-[#FF10F0] border-2 border-[#FF10F0]/30 hover:border-[#FF10F0]/60 transition-all"
              >
                {authMode === 'login' ? 'Войти' : 'Зарегистрироваться'}
              </Button>

              <div className="text-center">
                <button
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  className="text-[#00F0FF] hover:text-[#FF10F0] transition-colors text-sm"
                >
                  {authMode === 'login' ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (screen === 'home') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f2e] via-[#0f1419] to-[#1a0f2e]" />
        
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-48 h-48 sm:w-64 sm:h-64 bg-[#FF10F0] rounded-full blur-[100px] opacity-10 animate-pulse-glow" />
          <div className="absolute bottom-20 right-10 w-48 h-48 sm:w-64 sm:h-64 bg-[#00F0FF] rounded-full blur-[100px] opacity-10 animate-pulse-glow" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10 max-w-4xl w-full space-y-8 sm:space-y-12 animate-fade-in">
          <div className="flex justify-between items-center">
            <h1 className="text-5xl sm:text-7xl md:text-9xl font-black text-center tracking-wider flex-1" style={{ color: '#FF10F0', textShadow: '0 0 20px rgba(255, 16, 240, 0.5)' }}>
              LUSKY BEAR
            </h1>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="text-[#00F0FF] hover:text-[#FF10F0] text-sm"
            >
              <Icon name="LogOut" size={20} className="mr-1" />
              Выход
            </Button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <Button
                onClick={() => setScreen('instructions')}
                size="lg"
                className="h-20 sm:h-24 text-lg sm:text-2xl font-bold bg-[#1a1a2e] hover:bg-[#252545] text-[#FF10F0] border-2 border-[#FF10F0]/30 hover:border-[#FF10F0]/60 transition-all"
              >
                <Icon name="Rocket" size={28} className="mr-2 sm:mr-3" />
                Начать
              </Button>

              <Button
                onClick={() => setScreen('referral')}
                size="lg"
                className="h-20 sm:h-24 text-lg sm:text-2xl font-bold bg-[#1a1a2e] hover:bg-[#252545] text-[#00F0FF] border-2 border-[#00F0FF]/30 hover:border-[#00F0FF]/60 transition-all"
              >
                <Icon name="Users" size={28} className="mr-2 sm:mr-3" />
                Реферальная система
              </Button>

              <Button
                onClick={handleVipSignals}
                size="lg"
                className="h-20 sm:h-24 text-lg sm:text-2xl font-bold bg-[#1a1a2e] hover:bg-[#252545] text-[#9b87f5] border-2 border-[#9b87f5]/30 hover:border-[#9b87f5]/60 transition-all"
              >
                <Icon name="Crown" size={28} className="mr-2 sm:mr-3" />
                VIP Сигналы
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'instructions') {
    return (
      <div className="min-h-screen p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f2e] via-[#0f1419] to-[#1a0f2e]" />
        
        <div className="relative z-10 max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fade-in py-4">
          <Button
            onClick={() => setScreen('home')}
            variant="ghost"
            className="text-[#00F0FF] hover:text-[#FF10F0]"
          >
            <Icon name="ArrowLeft" size={20} className="mr-2" />
            Назад
          </Button>

          <Card className="bg-black/60 border border-[#FF10F0]/30 p-4 sm:p-8">
            <h2 className="text-2xl sm:text-4xl font-black mb-6 text-center" style={{ color: '#FF10F0' }}>
              ⚡ Инструкция для правильной работы ⚡
            </h2>

            <div className="space-y-4 sm:space-y-6 text-base sm:text-lg">
              <div className="flex gap-3 sm:gap-4">
                <span className="text-2xl sm:text-3xl">🚀</span>
                <p><strong>1.</strong> Зарегистрируйте совершенно новый аккаунт.</p>
              </div>

              <div className="flex gap-3 sm:gap-4">
                <span className="text-2xl sm:text-3xl">🔥</span>
                <p><strong>2.</strong> Вы получаете бесплатный бонус в размере 50 рублей, при желании введите промокод.</p>
              </div>

              <div className="flex gap-3 sm:gap-4">
                <span className="text-2xl sm:text-3xl">👑</span>
                <p><strong>3.</strong> Пополните баланс на любую сумму. Можно играть и на бонус, но в этом случае казино будет вас сливать.</p>
              </div>

              <div className="flex gap-3 sm:gap-4">
                <span className="text-2xl sm:text-3xl">🌟</span>
                <p><strong>4.</strong> Зайдите в игру Tower Rush и сделайте 2 ставки — это нужно, чтобы казино увидело, что вы не бот.</p>
              </div>

              <div className="flex gap-3 sm:gap-4">
                <span className="text-2xl sm:text-3xl">🎰</span>
                <p><strong>5.</strong> Затем зайдите в игру CRASH X и нажмите «Получить сигнал» 🎟️</p>
              </div>
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleRegister}
              size="lg"
              className="flex-1 h-14 sm:h-16 text-lg sm:text-xl font-bold bg-[#1a1a2e] hover:bg-[#252545] text-[#FF10F0] border-2 border-[#FF10F0]/30 hover:border-[#FF10F0]/60 transition-all"
            >
              <Icon name="UserPlus" size={24} className="mr-2" />
              Зарегистрироваться
            </Button>

            <Button
              onClick={() => setScreen('signals')}
              size="lg"
              className="flex-1 h-14 sm:h-16 text-lg sm:text-xl font-bold bg-[#1a1a2e] hover:bg-[#252545] text-[#00F0FF] border-2 border-[#00F0FF]/30 hover:border-[#00F0FF]/60 transition-all"
            >
              <Icon name="Play" size={24} className="mr-2" />
              К сигналам
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'signals') {
    return (
      <div className="min-h-screen p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f2e] via-[#0f1419] to-[#1a0f2e]" />
        
        <div className="relative z-10 max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fade-in py-4">
          <Button
            onClick={() => setScreen('home')}
            variant="ghost"
            className="text-[#00F0FF] hover:text-[#FF10F0]"
          >
            <Icon name="ArrowLeft" size={20} className="mr-2" />
            Назад
          </Button>

          <Card className="bg-black/60 border border-[#00F0FF]/30 p-4 sm:p-8 text-center">
            <h2 className="text-3xl sm:text-5xl font-black mb-6 sm:mb-8" style={{ color: '#00F0FF' }}>
              🎰 CRASH X
            </h2>

            {currentSignal !== null && (
              <div className="mb-6 sm:mb-8 p-6 sm:p-12 bg-black/60 rounded-lg border-2 border-[#FF10F0]/50">
                <p className="text-lg sm:text-2xl mb-3 sm:mb-4 text-[#00F0FF]">Ваш сигнал:</p>
                <p className="text-5xl sm:text-8xl font-black animate-pulse-glow" style={{ color: '#FF10F0', textShadow: '0 0 30px rgba(255, 16, 240, 0.5)' }}>
                  {currentSignal.toString().replace('.', ',')}x
                </p>
              </div>
            )}

            {isWaiting && (
              <div className="mb-6 p-4 bg-black/40 rounded-lg border border-[#00F0FF]/30">
                <p className="text-[#00F0FF] text-lg">
                  ⏱️ Следующий сигнал через: <span className="font-bold text-[#FF10F0]">{timeLeft}с</span>
                </p>
              </div>
            )}

            <Button
              onClick={generateSignal}
              size="lg"
              disabled={isWaiting}
              className="h-16 sm:h-20 px-8 sm:px-12 text-lg sm:text-2xl font-bold bg-[#1a1a2e] hover:bg-[#252545] text-[#FF10F0] border-2 border-[#FF10F0]/30 hover:border-[#FF10F0]/60 transition-all w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name="Zap" size={28} className="mr-2 sm:mr-3" />
              {currentSignal === null ? 'Получить сигнал' : isWaiting ? `Ожидание (${timeLeft}с)` : 'Следующий сигнал'}
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (screen === 'referral') {
    return (
      <div className="min-h-screen p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f2e] via-[#0f1419] to-[#1a0f2e]" />
        
        <div className="relative z-10 max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fade-in py-4">
          <Button
            onClick={() => setScreen('home')}
            variant="ghost"
            className="text-[#00F0FF] hover:text-[#FF10F0]"
          >
            <Icon name="ArrowLeft" size={20} className="mr-2" />
            Назад
          </Button>

          <Card className="bg-black/60 border border-[#FF10F0]/30 p-4 sm:p-8">
              <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
                <div className="flex flex-row justify-around items-center gap-4">
                  <div className="text-center">
                    <p className="text-xs sm:text-sm text-[#00F0FF] mb-1">Ваш баланс</p>
                    <p className="text-3xl sm:text-4xl font-black" style={{ color: '#FF10F0' }}>
                      {balance} ₽
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs sm:text-sm text-[#00F0FF] mb-1">Рефералов</p>
                    <p className="text-3xl sm:text-4xl font-black" style={{ color: '#00F0FF' }}>
                      {referralCount}
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start gap-2">
                    <Icon name="AlertTriangle" size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="text-xs sm:text-sm text-yellow-200">
                      <p className="font-bold mb-1">⚠️ Внимание!</p>
                      <p>Если баланс не обновляется, выйдите из аккаунта и зайдите назад. <strong>Сохраняйте свои логин и пароль!</strong></p>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <Button
                    onClick={handleWithdraw}
                    className="bg-[#1a1a2e] hover:bg-[#252545] text-[#FF10F0] border-2 border-[#FF10F0]/30 hover:border-[#FF10F0]/60 transition-all px-6 py-2"
                  >
                    <Icon name="Wallet" size={20} className="mr-2" />
                    Вывести
                  </Button>
                  <p className="text-xs text-[#00F0FF] mt-2">Минимальная сумма вывода: 200 ₽</p>
                </div>
              </div>

              <h2 className="text-xl sm:text-3xl font-black mb-4 sm:mb-6 text-center" style={{ color: '#FF10F0' }}>
                ⭐ Реферальная программа Lusky Bear
              </h2>

              {user?.referralCode && (
                <div className="bg-black/60 p-3 rounded-lg border border-[#FF10F0]/30 mb-6">
                  <h3 className="text-base font-bold text-center mb-2" style={{ color: '#FF10F0' }}>
                    Ваша реферальная ссылка
                  </h3>
                  <p className="text-xs text-center text-[#00F0FF] mb-2">
                    Отправьте эту ссылку другу для получения рефералов
                  </p>
                  <div className="bg-[#1a1a2e] p-2 rounded-lg border border-[#FF10F0]/30 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`https://t.me/Lusky_bear_bot?start=${user.referralCode}`}
                      className="flex-1 bg-transparent border-none outline-none text-[#00F0FF] font-mono text-xs px-2 py-1"
                    />
                    <Button
                      onClick={copyReferralLink}
                      size="sm"
                      className="bg-[#1a1a2e] hover:bg-[#252545] text-[#FF10F0] border border-[#FF10F0]/30 hover:border-[#FF10F0]/60 transition-all text-xs"
                    >
                      <Icon name="Copy" size={14} className="mr-1" />
                      Копировать
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-4 sm:space-y-6 text-sm sm:text-base mb-6 sm:mb-8">
                <p className="text-center">
                  Зарабатывайте по <span className="text-[#FF10F0] font-bold">20 рублей</span> за приглашённого человека и его траты в казино Lusky Bear
                </p>

                <div className="bg-black/60 p-4 sm:p-6 rounded-lg border border-[#9b87f5]/30">
                  <h3 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4 text-[#00F0FF]">💰 Сколько вы получаете</h3>
                  <p>🥳 Вы получаете по <strong className="text-[#FF10F0]">20 ₽</strong> за каждого приглашённого, который пополнил баланс на минимальную сумму и получил хотя бы 2 сигнала.</p>
                  <p className="mt-3 sm:mt-4">Ваш приглашённый получает <strong className="text-[#00F0FF]">360% бонусом</strong> за первое пополнение баланса и бесплатные сигналы в казино Lusky Bear.</p>
                </div>

                <div className="bg-black/60 p-4 sm:p-6 rounded-lg border border-[#9b87f5]/30">
                  <h3 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4 text-[#00F0FF]">🔍 Как это работает</h3>
                  <ol className="space-y-2 list-decimal list-inside">
                    <li>Вы отправляете человеку свою реферальную ссылку.</li>
                    <li>Он переходит по ней, выполняет условия, пополняет баланс и получает точные сигналы.</li>
                    <li>Ваш баланс пополняется на 20 рублей.</li>
                    <li>Всё понятно и просто 🎉</li>
                  </ol>
                </div>

                <div className="bg-black/60 p-4 sm:p-6 rounded-lg border border-[#9b87f5]/30">
                  <h3 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4 text-[#00F0FF]">📌 Основные условия</h3>
                  <div className="space-y-2 sm:space-y-3">
                    <p><strong>1️⃣</strong> Выплаты по реферальной программе осуществляются раз в неделю, за этот срок все ваши приглашённые пользователи закрепляются за вами.</p>
                    <p><strong>2️⃣</strong> Только новые пользователи. Если приглашённый пользователь уже играл в казино Lusky Bear, то он не будет отображаться.</p>
                    <p><strong>3️⃣</strong> Не нарушайте условия реферальной программы, не накручивайте трафик — только живые пользователи и новые аккаунты. За нарушение соглашения следует аннулирование баланса и блокировка пользователя.</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-center text-[#00F0FF]">
                Чтобы вывести баланс, напишите администратору и предоставьте скриншоты
              </p>
            </Card>
        </div>
      </div>
    );
  }

  if (screen === 'vip') {
    return (
      <div className="min-h-screen p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f2e] via-[#0f1419] to-[#1a0f2e]" />
        
        <div className="relative z-10 max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fade-in py-4">
          <Button
            onClick={() => setScreen('home')}
            variant="ghost"
            className="text-[#00F0FF] hover:text-[#FF10F0]"
          >
            <Icon name="ArrowLeft" size={20} className="mr-2" />
            Назад
          </Button>

          <Card className="bg-black/60 border border-[#9b87f5]/30 p-4 sm:p-8">
            <h2 className="text-2xl sm:text-4xl font-black mb-6 text-center" style={{ color: '#9b87f5' }}>
              👑 VIP Сигналы
            </h2>

            <div className="space-y-4 sm:space-y-6 text-base sm:text-lg">
              <div className="flex gap-3 sm:gap-4">
                <span className="text-2xl sm:text-3xl">🚀</span>
                <p><strong>1.</strong> VIP сигналы доступны в Telegram боте Lusky Bear.</p>
              </div>

              <div className="flex gap-3 sm:gap-4">
                <span className="text-2xl sm:text-3xl">🔥</span>
                <p><strong>2.</strong> Получите доступ к эксклюзивным сигналам с повышенной точностью.</p>
              </div>

              <div className="flex gap-3 sm:gap-4">
                <span className="text-2xl sm:text-3xl">👑</span>
                <p><strong>3.</strong> VIP сигналы обновляются чаще и имеют приоритет в обработке.</p>
              </div>

              <div className="flex gap-3 sm:gap-4">
                <span className="text-2xl sm:text-3xl">🌟</span>
                <p><strong>4.</strong> Для получения VIP статуса свяжитесь с администратором в боте.</p>
              </div>

              <div className="flex gap-3 sm:gap-4">
                <span className="text-2xl sm:text-3xl">🎰</span>
                <p><strong>5.</strong> Нажмите кнопку ниже, чтобы перейти в бот и получить VIP доступ.</p>
              </div>
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => window.open('https://t.me/K_Elite_Bot/app?startapp=eHd1PTE3MDQwMjgzNzcmbT1uZXRsbzU1NSZjPWRlZmF1bHQ', '_blank')}
              size="lg"
              className="flex-1 h-14 sm:h-16 text-lg sm:text-xl font-bold bg-[#1a1a2e] hover:bg-[#252545] text-[#9b87f5] border-2 border-[#9b87f5]/30 hover:border-[#9b87f5]/60 transition-all"
            >
              <Icon name="UserPlus" size={24} className="mr-2" />
              Зарегистрироваться
            </Button>

            <Button
              onClick={() => setScreen('crashx')}
              size="lg"
              className="flex-1 h-14 sm:h-16 text-lg sm:text-xl font-bold bg-[#1a1a2e] hover:bg-[#252545] text-[#00F0FF] border-2 border-[#00F0FF]/30 hover:border-[#00F0FF]/60 transition-all"
            >
              <Icon name="Play" size={24} className="mr-2" />
              К сигналам
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'crashx') {
    return (
      <div className="min-h-screen p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f2e] via-[#0f1419] to-[#1a0f2e]" />
        
        <div className="relative z-10 max-w-2xl mx-auto space-y-6 animate-fade-in py-4">
          <Button
            onClick={() => setScreen('vip')}
            variant="ghost"
            className="text-[#00F0FF] hover:text-[#FF10F0]"
          >
            <Icon name="ArrowLeft" size={20} className="mr-2" />
            Назад
          </Button>

          <Card className="bg-black/60 border border-[#00F0FF]/40 p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🎰</div>
              <h1 className="text-3xl sm:text-4xl font-black" style={{ color: '#00F0FF' }}>
                CRASH X
              </h1>
            </div>

            {crashXSignal === null ? (
              <Button
                onClick={generateCrashXSignal}
                size="lg"
                className="w-full h-16 sm:h-20 text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#9b87f5] to-[#7c3aed] hover:from-[#8b77e5] hover:to-[#6c2acd] text-white border-2 border-[#9b87f5] transition-all"
              >
                <Icon name="Zap" size={28} className="mr-3" />
                Получить сигнал
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="bg-black/80 border-2 border-[#9b87f5] rounded-2xl p-6 sm:p-8">
                  <p className="text-[#00F0FF] text-lg sm:text-xl text-center mb-3">Ваш сигнал:</p>
                  <p className="text-5xl sm:text-7xl font-black text-center" style={{ color: '#FF10F0' }}>
                    {crashXSignal.toFixed(2)}x
                  </p>
                </div>

                <div className="bg-black/60 border border-[#00F0FF]/30 rounded-xl p-4 sm:p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Icon name="Clock" size={24} className="text-[#00F0FF]" />
                    <p className="text-[#00F0FF] text-base sm:text-lg">Следующий сигнал через:</p>
                  </div>
                  <p className="text-3xl sm:text-4xl font-bold" style={{ color: '#FF10F0' }}>
                    {crashXTimeLeft}с
                  </p>
                </div>

                <Button
                  onClick={generateCrashXSignal}
                  disabled={isCrashXWaiting}
                  size="lg"
                  className="w-full h-14 sm:h-16 text-lg sm:text-xl font-bold bg-gradient-to-r from-[#9b87f5] to-[#7c3aed] hover:from-[#8b77e5] hover:to-[#6c2acd] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Icon name="Zap" size={24} className="mr-2" />
                  {isCrashXWaiting ? `Ожидание (${crashXTimeLeft}с)` : 'Получить следующий сигнал'}
                </Button>
              </div>
            )}
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
                setIsAdmin(false);
                localStorage.removeItem('isAdmin');
                setScreen('auth');
                toast.success('Вы вышли из админ-панели');
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
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return null;
};

export default Index;