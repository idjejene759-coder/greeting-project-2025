import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

type Screen = 'home' | 'instructions' | 'signals' | 'referral' | 'auth' | 'admin' | 'admin_user' | 'admin_withdrawals' | 'admin_vip' | 'vip' | 'vip_payment' | 'crashx' | 'withdrawal_crypto_select' | 'withdrawal_crypto_usdt' | 'withdrawal_crypto_ton' | 'withdrawal_crypto_confirm';

interface User {
  id: number;
  username: string;
  balance: number;
  referralCount: number;
  referralCode: string;
}

const AUTH_URL = 'https://functions.poehali.dev/84480352-2061-48c5-b055-98dde5c9eaac';
const ADMIN_URL = 'https://functions.poehali.dev/c85f181c-7e3a-4ae4-b2ab-510eafdab9d4';
const WITHDRAWAL_URL = 'https://functions.poehali.dev/70e3feba-e029-403f-90d0-d0d99a410177';
const VIP_URL = 'https://functions.poehali.dev/6aa4ac1b-7cc2-4b00-b3ed-36a090f42772';
const CRYPTO_WALLET = 'UQAdowLWZaOAssDcVX-CbhUl_ydb9wSJON7EPorQEYBqE4UQ';

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
  const [showVipPaymentModal, setShowVipPaymentModal] = useState(false);
  const [vipPaymentScreenshot, setVipPaymentScreenshot] = useState('');
  const [isVip, setIsVip] = useState(false);
  const [vipExpiresAt, setVipExpiresAt] = useState<string | null>(null);
  const [vipRequestStatus, setVipRequestStatus] = useState<string | null>(null);
  const [vipRequests, setVipRequests] = useState<any[]>([]);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [adminView, setAdminView] = useState<'users' | 'withdrawals' | 'vip'>('users');
  const [cryptoType, setCryptoType] = useState<'USDT' | 'TON' | ''>('');
  const [cryptoNetwork, setCryptoNetwork] = useState<'TON' | 'TRC20' | ''>('');
  const [cryptoWallet, setCryptoWallet] = useState('');
  const [confirmStep, setConfirmStep] = useState(0);
  const [hasClickedRegister, setHasClickedRegister] = useState(false);

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
      checkVipStatus();
    }
  }, [user]);

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
                  toast.info(`💰 Ваш баланс обновлён: ${currentUser.balance} USDT`);
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
      }, 21600000);
      
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

  const checkVipStatus = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(VIP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check_status',
          userId: user.id
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setIsVip(data.isVip);
        setVipExpiresAt(data.expiresAt || null);
        setVipRequestStatus(data.requestStatus || null);
      }
    } catch (error) {
      console.error('Error checking VIP status:', error);
    }
  };

  const handleVipSignals = async () => {
    await checkVipStatus();
    
    if (isVip) {
      setScreen('vip');
    } else if (vipRequestStatus === 'pending') {
      toast.info('Ваша заявка на VIP в обработке');
    } else if (vipRequestStatus === 'rejected') {
      toast.error('Ваша заявка была отклонена. Попробуйте снова.');
      setVipRequestStatus(null);
      setShowVipPaymentModal(true);
    } else {
      setShowVipPaymentModal(true);
    }
  };

  const handleVipPaymentSubmit = async () => {
    if (!vipPaymentScreenshot.trim()) {
      toast.error('Добавьте скриншот оплаты');
      return;
    }
    
    if (!user) return;
    
    try {
      console.log('Sending VIP payment request:', {
        action: 'create_request',
        userId: user.id,
        screenshotUrl: vipPaymentScreenshot
      });
      
      const response = await fetch(VIP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_request',
          userId: user.id,
          screenshotUrl: vipPaymentScreenshot
        })
      });
      
      const data = await response.json();
      console.log('VIP payment response:', { status: response.status, data });
      
      if (response.ok && data.success) {
        toast.success(data.message);
        setShowVipPaymentModal(false);
        setVipPaymentScreenshot('');
        setVipRequestStatus('pending');
      } else {
        toast.error('❌ ' + (data.error || 'Ошибка отправки заявки'));
      }
    } catch (error) {
      console.error('Error submitting VIP request:', error);
      toast.error(`❌ Ошибка отправки заявки: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  };

  const loadVipRequests = async () => {
    try {
      const response = await fetch(`${VIP_URL}?action=list_requests&status=pending`);
      const data = await response.json();
      
      if (response.ok) {
        setVipRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error loading VIP requests:', error);
    }
  };

  const handleApproveVip = async (requestId: number) => {
    try {
      const response = await fetch(VIP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          requestId,
          adminId: 1
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success(data.message);
        loadVipRequests();
      } else {
        toast.error(data.error || 'Ошибка одобрения');
      }
    } catch (error) {
      toast.error('Ошибка сети');
    }
  };

  const handleRejectVip = async (requestId: number) => {
    try {
      const response = await fetch(VIP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.dumps({
          action: 'reject',
          requestId,
          adminId: 1
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success(data.message);
        loadVipRequests();
      } else {
        toast.error(data.error || 'Ошибка отклонения');
      }
    } catch (error) {
      toast.error('Ошибка сети');
    }
  };

  const handleDeleteVip = async (requestId: number) => {
    if (!confirm('Удалить эту VIP-заявку?')) return;
    
    try {
      const response = await fetch(VIP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          requestId,
          adminId: 1
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success('✅ ' + data.message);
        loadVipRequests();
      } else {
        toast.error('❌ ' + (data.error || 'Ошибка удаления'));
      }
    } catch (error) {
      toast.error('❌ Ошибка сети');
    }
  };

  const handleWithdraw = () => {
    if (balance < 200) {
      toast.error('Минимальная сумма вывода 200 USDT');
      return;
    }
    setScreen('withdrawal_crypto_select');
  };

  const handleCryptoWithdrawSubmit = async () => {
    if (confirmStep < 2) {
      toast.error('Подтвердите данные дважды');
      return;
    }

    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount < 200) {
      toast.error('Минимальная сумма вывода 200 USDT');
      return;
    }

    if (amount > balance) {
      toast.error('Недостаточно средств');
      return;
    }

    try {
      const details: any = {
        cryptoType,
        wallet: cryptoWallet
      };
      
      if (cryptoType === 'USDT') {
        details.network = cryptoNetwork;
      }

      const response = await fetch(WITHDRAWAL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          username: user?.username,
          amount,
          method: 'crypto',
          details
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message);
        setBalance(balance - amount);
        const updatedUser = { ...user!, balance: balance - amount };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setCryptoType('');
        setCryptoNetwork('');
        setCryptoWallet('');
        setWithdrawalAmount('');
        setConfirmStep(0);
        setScreen('referral');
      } else {
        toast.error(data.error || 'Ошибка создания заявки');
      }
    } catch (error) {
      toast.error('Ошибка сети');
    }
  };



  const copyReferralLink = () => {
    if (user?.referralCode) {
      const referralLink = `https://t.me/LB_Min_bot/app?startapp=eHd1PTE3MDQwMjgzNzcmbT1uZXRsbzU1NSZjPWRlZmF1bHQ`;
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
    setHasClickedRegister(true);
    window.open('https://t.me/LB_Min_bot/app?startapp=eHd1PTE3MDQwMjgzNzcmbT1uZXRsbzU1NSZjPWRlZmF1bHQ', '_blank');
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

  const handlePinUser = async (userId: number) => {
    try {
      const response = await fetch(ADMIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pin_user',
          userId
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('⭐ ' + data.message);
        await loadAdminUsers();
      } else {
        toast.error(data.error || 'Ошибка');
      }
    } catch (error) {
      toast.error('Ошибка сети');
    }
  };

  const handleUnpinUser = async (userId: number) => {
    try {
      const response = await fetch(ADMIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'unpin_user',
          userId
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('✅ ' + data.message);
        await loadAdminUsers();
      } else {
        toast.error(data.error || 'Ошибка');
      }
    } catch (error) {
      toast.error('Ошибка сети');
    }
  };

  const loadWithdrawals = async () => {
    try {
      const response = await fetch(WITHDRAWAL_URL);
      const data = await response.json();
      if (data.withdrawals) {
        setWithdrawals(data.withdrawals);
      }
    } catch (error) {
      console.error('Error loading withdrawals:', error);
      toast.error('Ошибка загрузки заявок');
    }
  };

  const handleApproveWithdrawal = async (withdrawalId: number) => {
    try {
      const response = await fetch(WITHDRAWAL_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          withdrawalId,
          status: 'approved'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Заявка одобрена');
        loadWithdrawals();
      } else {
        toast.error(data.error || 'Ошибка обработки заявки');
      }
    } catch (error) {
      toast.error('Ошибка сети');
    }
  };

  const handleRejectWithdrawal = async (withdrawalId: number) => {
    try {
      const response = await fetch(WITHDRAWAL_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          withdrawalId,
          status: 'rejected'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Заявка отклонена, средства возвращены');
        loadWithdrawals();
        loadAdminUsers();
      } else {
        toast.error(data.error || 'Ошибка обработки заявки');
      }
    } catch (error) {
      toast.error('Ошибка сети');
    }
  };

  const handleDeleteWithdrawal = async (withdrawalId: number) => {
    try {
      const response = await fetch(WITHDRAWAL_URL, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Заявка удалена');
        loadWithdrawals();
      } else {
        toast.error(data.error || 'Ошибка удаления заявки');
      }
    } catch (error) {
      toast.error('Ошибка сети');
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
      <div className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0118] via-[#1a0f2e] to-[#0f0520]" />
        
        <div className="absolute inset-0">
          <div className="absolute top-10 left-5 w-40 h-40 sm:w-80 sm:h-80 bg-[#FF10F0] rounded-full blur-[100px] opacity-20 animate-pulse-glow" />
          <div className="absolute bottom-10 right-5 w-40 h-40 sm:w-80 sm:h-80 bg-[#00F0FF] rounded-full blur-[100px] opacity-20 animate-pulse-glow" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10 max-w-md w-full space-y-4 sm:space-y-6 animate-fade-in">
          <div className="text-center mb-4">
            <h1 className="text-4xl sm:text-6xl font-black tracking-wider mb-2 gradient-text">
              LUSKY BEAR
            </h1>
            <div className="h-1 w-24 sm:w-32 mx-auto animated-gradient rounded-full"></div>
          </div>

          <Card className="glass-card p-5 sm:p-8 shine-effect">
            <h2 className="text-2xl sm:text-3xl font-black mb-5 sm:mb-6 text-center gradient-text">
              {authMode === 'login' ? 'Вход' : 'Регистрация'}
            </h2>

            <div className="space-y-3 sm:space-y-4">
              <Input
                type="text"
                placeholder="Имя пользователя"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-black/40 border-[#FF10F0]/40 text-white placeholder:text-gray-400 h-12 sm:h-14 text-base sm:text-lg backdrop-blur-sm focus:border-[#FF10F0] transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
              />

              <Input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black/40 border-[#FF10F0]/40 text-white placeholder:text-gray-400 h-12 sm:h-14 text-base sm:text-lg backdrop-blur-sm focus:border-[#FF10F0] transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
              />

              <Button
                onClick={handleAuth}
                className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold animated-gradient text-white border-0 hover-lift shine-effect"
              >
                {authMode === 'login' ? 'Войти' : 'Зарегистрироваться'}
              </Button>

              <div className="text-center pt-1">
                <button
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  className="text-[#00F0FF] hover:text-[#FF10F0] transition-all text-sm sm:text-base font-medium"
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
      <>
        <div className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0118] via-[#1a0f2e] to-[#0f0520]" />
          
          <div className="absolute inset-0">
            <div className="absolute top-10 left-5 w-40 h-40 sm:w-80 sm:h-80 bg-[#FF10F0] rounded-full blur-[100px] opacity-20 animate-pulse-glow" />
            <div className="absolute bottom-10 right-5 w-40 h-40 sm:w-80 sm:h-80 bg-[#00F0FF] rounded-full blur-[100px] opacity-20 animate-pulse-glow" style={{ animationDelay: '1s' }} />
          </div>

          <div className="relative z-10 max-w-4xl w-full space-y-6 sm:space-y-10 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-wider gradient-text mb-2">
                  LUSKY BEAR
                </h1>
                <div className="h-1 w-32 sm:w-40 mx-auto sm:mx-0 animated-gradient rounded-full"></div>
              </div>
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="text-[#00F0FF] hover:text-[#FF10F0] hover:bg-[#FF10F0]/10 text-sm sm:text-base font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition-all"
              >
                <Icon name="LogOut" size={18} className="mr-1 sm:mr-2" />
                Выход
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
              <Button
                onClick={() => setScreen('instructions')}
                size="lg"
                className="h-20 sm:h-24 text-lg sm:text-xl font-bold glass-card text-[#FF10F0] border-2 border-[#FF10F0]/40 hover:border-[#FF10F0] hover-lift shine-effect"
              >
                <Icon name="Rocket" size={24} className="mr-2" />
                Начать
              </Button>

              <Button
                onClick={() => setScreen('referral')}
                size="lg"
                className="h-20 sm:h-24 text-lg sm:text-xl font-bold glass-card text-[#00F0FF] border-2 border-[#00F0FF]/40 hover:border-[#00F0FF] hover-lift shine-effect"
              >
                <Icon name="Users" size={24} className="mr-2" />
                Реферальная система
              </Button>

              <Button
                onClick={handleVipSignals}
                size="lg"
                className="h-20 sm:h-24 text-lg sm:text-xl font-bold glass-card text-[#9b87f5] border-2 border-[#9b87f5]/40 hover:border-[#9b87f5] hover-lift shine-effect"
              >
                <Icon name="Crown" size={24} className="mr-2" />
                VIP Сигналы
              </Button>
            </div>
          </div>
        </div>

        {showVipPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-lg animate-fade-in overflow-y-auto">
            <Card className="glass-card border-2 border-[#9b87f5]/60 p-4 sm:p-6 max-w-lg w-full shine-effect my-4 sm:my-8">
              <div className="space-y-3 sm:space-y-4">
                <div className="text-center">
                  <div className="mb-3 sm:mb-4 relative inline-block">
                    <div className="relative z-10">
                      <Icon name="Crown" size={40} className="sm:hidden mx-auto text-[#9b87f5] animate-pulse" />
                      <Icon name="Crown" size={56} className="hidden sm:block mx-auto text-[#9b87f5] animate-pulse" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 sm:w-20 sm:h-20 bg-[#9b87f5] rounded-full blur-2xl opacity-60 animate-pulse"></div>
                    </div>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black mb-2 gradient-text">
                    💎 VIP Доступ
                  </h2>
                  <div className="inline-flex items-center justify-center bg-gradient-to-r from-[#9b87f5] to-[#7c3aed] px-4 py-2 rounded-full mb-3">
                    <p className="text-white font-bold text-sm sm:text-base">
                      8 USDT / месяц
                    </p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-red-500/15 to-orange-500/15 border border-red-400/40 rounded-xl p-3 sm:p-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Icon name="AlertTriangle" size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs sm:text-sm text-red-200 space-y-1">
                      <p className="font-bold text-red-300">⚠️ Условия оплаты:</p>
                      <p className="leading-relaxed">• Сумма: <span className="font-bold text-white">РОВНО 8 USDT</span></p>
                      <p className="leading-relaxed">• Сеть: <span className="font-bold text-white">The Open Network (TON)</span></p>
                      <p className="leading-relaxed text-orange-200">• Другие суммы и сети не принимаются!</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#1a1a2e] to-[#252545] p-3 sm:p-4 rounded-xl border border-[#9b87f5]/40">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="Wallet" size={16} className="text-[#9b87f5]" />
                    <p className="text-xs sm:text-sm text-gray-300 font-semibold">Адрес кошелька:</p>
                  </div>
                  <div className="bg-black/60 p-2 sm:p-3 rounded-lg border border-[#00F0FF]/30 mb-2">
                    <p className="text-[10px] sm:text-xs text-[#00F0FF] font-mono break-all leading-relaxed">{CRYPTO_WALLET}</p>
                  </div>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(CRYPTO_WALLET);
                      toast.success('✅ Адрес скопирован в буфер обмена!');
                    }}
                    className="w-full bg-[#9b87f5]/20 hover:bg-[#9b87f5]/30 text-[#9b87f5] border border-[#9b87f5]/40 hover:border-[#9b87f5] transition-all h-9 sm:h-10 text-xs sm:text-sm font-bold"
                  >
                    <Icon name="Copy" size={14} className="mr-1.5" />
                    Копировать адрес
                  </Button>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-xs sm:text-sm text-gray-300 font-semibold flex items-center gap-1.5">
                    <Icon name="Image" size={14} className="text-[#9b87f5]" />
                    Ссылка на скриншот платежа
                  </label>
                  <Input
                    type="text"
                    placeholder="https://imgur.com/..."
                    value={vipPaymentScreenshot}
                    onChange={(e) => setVipPaymentScreenshot(e.target.value)}
                    className="bg-black/60 border-[#9b87f5]/50 text-white placeholder:text-gray-500 h-10 sm:h-12 text-sm sm:text-base backdrop-blur-sm focus:border-[#9b87f5] transition-all"
                  />
                  <p className="text-[10px] sm:text-xs text-gray-400 leading-relaxed">
                    📸 Загрузите скриншот на <span className="text-[#00F0FF]">imgur.com</span> или <span className="text-[#00F0FF]">imgbb.com</span> и вставьте ссылку
                  </p>
                </div>

                <div className="bg-gradient-to-r from-[#9b87f5]/15 to-[#7c3aed]/15 border border-[#9b87f5]/40 rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <Icon name="Clock" size={18} className="text-[#9b87f5] flex-shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
                      ⚡ <span className="font-bold text-white">Проверка заявки до 15 минут.</span> После одобрения VIP активируется автоматически!
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 sm:gap-3 pt-1">
                  <Button
                    onClick={() => {
                      setShowVipPaymentModal(false);
                      setVipPaymentScreenshot('');
                    }}
                    variant="outline"
                    className="flex-1 h-10 sm:h-12 bg-transparent border-2 border-[#FF10F0]/50 text-[#FF10F0] hover:bg-[#FF10F0]/10 hover:border-[#FF10F0] transition-all text-xs sm:text-sm font-bold"
                  >
                    Отмена
                  </Button>
                  <Button
                    onClick={handleVipPaymentSubmit}
                    className="flex-1 h-10 sm:h-12 animated-gradient text-white border-0 hover-lift shine-effect text-xs sm:text-sm font-bold shadow-lg shadow-[#9b87f5]/20"
                  >
                    <Icon name="Send" size={16} className="mr-1 sm:mr-1.5" />
                    Отправить заявку
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </>
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
              onClick={() => {
                if (!hasClickedRegister) {
                  toast.error('⚠️ Сначала нажмите "Зарегистрироваться", а затем переходите к сигналам!');
                } else {
                  setScreen('signals');
                }
              }}
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

          <Card className="bg-black/60 border border-[#FF10F0]/30 p-4 sm:p-6">
            <h3 className="text-xl sm:text-2xl font-bold mb-4 text-center text-[#00F0FF]">
              📋 Инструкция
            </h3>
            <div className="space-y-3 text-sm sm:text-base mb-6">
              <p>1. Зарегистрируйтесь в казино по кнопке ниже</p>
              <p>2. Пополните баланс на любую сумму</p>
              <p>3. Зайдите в игру CRASH X</p>
              <p>4. Нажмите "Получить сигнал" выше</p>
              <p>5. Ставьте по полученному сигналу</p>
            </div>
            <Button
              onClick={() => window.open('https://t.me/LB_Seed_bot/app?startapp=eHd1PTE3MDQwMjgzNzcmbT1uZXRsbzU1NSZjPWRlZmF1bHQ', '_blank')}
              size="lg"
              className="w-full h-14 sm:h-16 text-lg sm:text-xl font-bold bg-[#1a1a2e] hover:bg-[#252545] text-[#FF10F0] border-2 border-[#FF10F0]/30 hover:border-[#FF10F0]/60 transition-all"
            >
              <Icon name="UserPlus" size={24} className="mr-2" />
              Зарегистрироваться
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
                      {balance} USDT
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
                      <p className="mb-2">Баланс и количество рефералов обновляются автоматически раз в 6 часов.</p>
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
                  <p className="text-xs text-[#00F0FF] mt-2">Минимальная сумма вывода: 10 USDT</p>
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
                      value={`https://t.me/LB_Min_bot/app?startapp=eHd1PTE3MDQwMjgzNzcmbT1uZXRsbzU1NSZjPWRlZmF1bHQ`}
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
                  Зарабатывайте по <span className="text-[#FF10F0] font-bold">20 USDT</span> за приглашённого человека и его траты в казино Lusky Bear
                </p>

                <div className="bg-black/60 p-4 sm:p-6 rounded-lg border border-[#9b87f5]/30">
                  <h3 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4 text-[#00F0FF]">💰 Сколько вы получаете</h3>
                  <p>🥳 Вы получаете по <strong className="text-[#FF10F0]">20 USDT</strong> за каждого приглашённого, который пополнил баланс на минимальную сумму и получил хотя бы 2 сигнала.</p>
                  <p className="mt-3 sm:mt-4">Ваш приглашённый получает <strong className="text-[#00F0FF]">360% бонусом</strong> за первое пополнение баланса и бесплатные сигналы в казино Lusky Bear.</p>
                </div>

                <div className="bg-black/60 p-4 sm:p-6 rounded-lg border border-[#9b87f5]/30">
                  <h3 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4 text-[#00F0FF]">🔍 Как это работает</h3>
                  <ol className="space-y-2 list-decimal list-inside">
                    <li>Вы отправляете человеку свою реферальную ссылку.</li>
                    <li>Он переходит по ней, выполняет условия, пополняет баланс и получает точные сигналы.</li>
                    <li>Ваш баланс пополняется на 20 USDT.</li>
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
        
        <div className="relative z-10 max-w-6xl mx-auto space-y-6 py-4">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black" style={{ color: '#FF10F0', textShadow: '0 0 20px rgba(255, 16, 240, 0.5)' }}>
              👑 АДМИН-ПАНЕЛЬ
            </h1>
            <Button
              onClick={() => {
                setIsAdmin(false);
                localStorage.removeItem('isAdmin');
                setScreen('auth');
                toast.success('Вы вышли из админ-панели');
              }}
              size="sm"
              className="bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30"
            >
              <Icon name="LogOut" size={18} className="mr-1" />
              Выход
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
            <Button
              onClick={() => setAdminView('users')}
              className={`h-12 sm:h-14 text-sm sm:text-base font-bold ${
                adminView === 'users'
                  ? 'bg-gradient-to-br from-[#FF10F0] to-[#c710c0] text-white border-2 border-[#FF10F0]'
                  : 'bg-[#1a1a2e] text-[#FF10F0] border-2 border-[#FF10F0]/30 hover:border-[#FF10F0]/60'
              }`}
            >
              <Icon name="Users" size={18} className="mr-1" />
              <span className="hidden sm:inline">Юзеры</span>
              <span className="sm:hidden">👥</span>
            </Button>
            <Button
              onClick={() => {
                setAdminView('withdrawals');
                loadWithdrawals();
              }}
              className={`h-12 sm:h-14 text-sm sm:text-base font-bold ${
                adminView === 'withdrawals'
                  ? 'bg-gradient-to-br from-[#00F0FF] to-[#00a8b8] text-white border-2 border-[#00F0FF]'
                  : 'bg-[#1a1a2e] text-[#00F0FF] border-2 border-[#00F0FF]/30 hover:border-[#00F0FF]/60'
              }`}
            >
              <Icon name="Wallet" size={18} className="mr-1" />
              <span className="hidden sm:inline">Выводы</span>
              <span className="sm:hidden">💰</span>
            </Button>
            <Button
              onClick={() => {
                setAdminView('vip');
                loadVipRequests();
              }}
              className={`h-12 sm:h-14 text-sm sm:text-base font-bold ${
                adminView === 'vip'
                  ? 'bg-gradient-to-br from-[#9b87f5] to-[#7c3aed] text-white border-2 border-[#9b87f5]'
                  : 'bg-[#1a1a2e] text-[#9b87f5] border-2 border-[#9b87f5]/30 hover:border-[#9b87f5]/60'
              }`}
            >
              <Icon name="Crown" size={18} className="mr-1" />
              <span className="hidden sm:inline">VIP</span>
              <span className="sm:hidden">👑</span>
            </Button>
          </div>

          <Card className="bg-black/70 backdrop-blur-sm border border-[#FF10F0]/30 p-3 sm:p-6 shadow-2xl">
            {adminView === 'users' && (
              <>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Icon name="Users" size={24} className="text-[#00F0FF]" />
                  <h2 className="text-xl sm:text-2xl font-bold text-center" style={{ color: '#00F0FF' }}>
                    Пользователи ({adminUsers.length})
                  </h2>
                </div>

            <div className="space-y-2">
              {adminUsers.map((u) => (
                <div
                  key={u.id}
                  className="bg-gradient-to-br from-[#1a1a2e] to-[#252545] p-3 sm:p-4 rounded-xl border border-[#FF10F0]/20 hover:border-[#FF10F0]/60"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        setSelectedUser(u);
                        setEditBalance(u.balance.toString());
                        setEditReferrals(u.referralCount.toString());
                        setScreen('admin_user');
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {u.isPinned && (
                          <Icon name="Pin" size={14} className="text-yellow-400 flex-shrink-0" />
                        )}
                        <p className="text-sm sm:text-base font-bold text-[#FF10F0] truncate">{u.username}</p>
                        {u.isBanned && (
                          <span className="text-xs bg-red-500/30 text-red-300 px-2 py-0.5 rounded-full border border-red-500/50 flex-shrink-0">
                            🚫
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-2">ID: {u.id}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                        <div className="flex items-center gap-1">
                          <Icon name="Wallet" size={14} className="text-[#00F0FF]" />
                          <span className="text-gray-400">Баланс:</span>
                          <span className="text-[#00F0FF] font-bold">{u.balance} USDT</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Icon name="Users" size={14} className="text-[#FF10F0]" />
                          <span className="text-gray-400">Рефералы:</span>
                          <span className="text-[#FF10F0] font-bold">{u.referralCount}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (u.isPinned) {
                          handleUnpinUser(u.id);
                        } else {
                          handlePinUser(u.id);
                        }
                      }}
                      size="sm"
                      className={`flex-shrink-0 ${u.isPinned ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/40' : 'bg-gray-700/50 hover:bg-gray-700/70 text-gray-400 border border-gray-600/40'}`}
                      title={u.isPinned ? 'Открепить' : 'Закрепить'}
                    >
                      <Icon name="Pin" size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
              </>
            )}

            {adminView === 'vip' && (
              <>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Icon name="Crown" size={24} className="text-[#9b87f5]" />
                  <h2 className="text-xl sm:text-2xl font-bold text-center" style={{ color: '#9b87f5' }}>
                    VIP Заявки ({vipRequests.length})
                  </h2>
                </div>

                <div className="space-y-3">
                  {vipRequests.length === 0 ? (
                    <div className="text-center py-12">
                      <Icon name="Inbox" size={48} className="text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">Нет VIP заявок</p>
                    </div>
                  ) : (
                    vipRequests.map((req) => (
                      <div
                        key={req.id}
                        className="bg-gradient-to-br from-[#1a1a2e] to-[#252545] p-4 rounded-xl border border-[#9b87f5]/30"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-base font-bold text-[#9b87f5]">
                                {req.username} (ID: {req.userId})
                              </p>
                              <p className="text-xs text-gray-500">Заявка #{req.id}</p>
                            </div>
                          </div>

                          <div className="text-xs text-gray-300">
                            <p className="flex items-center gap-1.5 mb-2">
                              <span className="text-gray-500">Скриншот оплаты:</span>
                            </p>
                            <a 
                              href={req.screenshotUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[#00F0FF] hover:text-[#FF10F0] underline break-all"
                            >
                              {req.screenshotUrl}
                            </a>
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{new Date(req.createdAt).toLocaleString('ru-RU')}</span>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleApproveVip(req.id)}
                              size="sm"
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold"
                            >
                              <Icon name="Check" size={16} className="mr-1" />
                              <span className="hidden sm:inline">Одобрить (30 дней)</span>
                              <span className="sm:hidden">✅ Одобрить</span>
                            </Button>
                            <Button
                              onClick={() => handleRejectVip(req.id)}
                              size="sm"
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
                            >
                              <Icon name="X" size={16} className="mr-1" />
                              <span className="hidden sm:inline">Отклонить</span>
                              <span className="sm:hidden">❌</span>
                            </Button>
                            <Button
                              onClick={() => handleDeleteVip(req.id)}
                              size="sm"
                              className="bg-gray-700 hover:bg-gray-800 text-white"
                            >
                              <Icon name="Trash2" size={16} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {adminView === 'withdrawals' && (
              <>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Icon name="Wallet" size={24} className="text-[#00F0FF]" />
                  <h2 className="text-xl sm:text-2xl font-bold text-center" style={{ color: '#00F0FF' }}>
                    Заявки на вывод ({withdrawals.length})
                  </h2>
                </div>

                <div className="space-y-3">
                  {withdrawals.length === 0 ? (
                    <div className="text-center py-12">
                      <Icon name="Inbox" size={48} className="text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">Нет заявок на вывод</p>
                    </div>
                  ) : (
                    withdrawals.map((w) => (
                      <div
                        key={w.id}
                        className="bg-gradient-to-br from-[#1a1a2e] to-[#252545] p-3 sm:p-4 rounded-xl border border-[#00F0FF]/20"
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Icon name="User" size={16} className="text-[#00F0FF] flex-shrink-0" />
                                <p className="text-sm sm:text-base font-bold text-[#00F0FF] truncate">{w.username}</p>
                              </div>
                              <p className="text-xs text-gray-500 mb-2">ID юзера: {w.userId} • Заявка #{w.id}</p>
                            </div>
                            <div className="flex-shrink-0">
                              <p className="text-xl sm:text-2xl font-black text-[#FF10F0]">{w.amount} USDT</p>
                            </div>
                          </div>

                          <div className="bg-black/40 rounded-lg p-2 sm:p-3 border border-[#00F0FF]/10">
                            <div className="flex items-center gap-2 mb-2">
                              <Icon name="Coins" size={14} className="text-[#00F0FF]" />
                              <span className="text-xs font-bold text-[#00F0FF]">
                                💰 Криптовалюта
                              </span>
                            </div>
                            <div className="text-xs text-gray-300 space-y-1">
                              <p className="flex items-center gap-1.5">
                                <span className="text-gray-500">Криптовалюта:</span>
                                <span className="font-bold text-[#26A17B]">{w.details.cryptoType}</span>
                              </p>
                              {w.details.network && (
                                <p className="flex items-center gap-1.5">
                                  <span className="text-gray-500">Сеть:</span>
                                  <span className="font-semibold">{w.details.network === 'TON' ? 'The Open Network (TON)' : 'Tron (TRC20)'}</span>
                                </p>
                              )}
                              <p className="flex flex-col gap-1">
                                <span className="text-gray-500">Адрес кошелька:</span>
                                <span className="font-mono break-all text-[#00F0FF]">{w.details.wallet}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{new Date(w.createdAt).toLocaleString('ru-RU')}</span>
                          </div>

                          <div className="flex gap-2">
                            {w.status === 'pending' ? (
                              <>
                                <Button
                                  onClick={() => handleApproveWithdrawal(w.id)}
                                  size="sm"
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold"
                                >
                                  <Icon name="Check" size={16} className="mr-1" />
                                  Одобрить
                                </Button>
                                <Button
                                  onClick={() => handleRejectWithdrawal(w.id)}
                                  size="sm"
                                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
                                >
                                  <Icon name="X" size={16} className="mr-1" />
                                  Отклонить
                                </Button>
                              </>
                            ) : (
                              <>
                                <div className={`flex-1 text-center py-2 rounded-lg font-bold text-sm ${
                                  w.status === 'approved' 
                                    ? 'bg-green-500/20 text-green-300 border border-green-500/40' 
                                    : 'bg-red-500/20 text-red-300 border border-red-500/40'
                                }`}>
                                  {w.status === 'approved' ? '✅ Одобрено' : '❌ Отклонено'}
                                </div>
                                <Button
                                  onClick={() => handleDeleteWithdrawal(w.id)}
                                  size="sm"
                                  className="bg-gray-600 hover:bg-gray-700 text-white"
                                >
                                  <Icon name="Trash2" size={16} />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
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
                  <label className="text-sm text-[#00F0FF] mb-2 block">Баланс (USDT)</label>
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

  if (screen === 'withdrawal_method') {
    return (
      <div className="min-h-screen p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f2e] via-[#0f1419] to-[#1a0f2e]" />
        
        <div className="relative z-10 max-w-4xl mx-auto space-y-6 animate-fade-in py-4">
          <Button
            onClick={() => setScreen('referral')}
            variant="ghost"
            className="text-[#00F0FF] hover:text-[#FF10F0]"
          >
            <Icon name="ArrowLeft" size={20} className="mr-2" />
            Назад
          </Button>

          <Card className="bg-black/60 border border-[#FF10F0]/30 p-6">
            <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: '#FF10F0' }}>
              💸 Выберите метод вывода
            </h2>

            <div className="space-y-4">
              <div className="mb-4">
                <label className="text-sm text-[#00F0FF] mb-2 block">Сумма вывода (₽)</label>
                <Input
                  type="number"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  className="bg-[#1a1a2e] border-[#FF10F0]/30 text-white"
                  placeholder="Минимум 200 ₽"
                />
                <p className="text-xs text-[#00F0FF] mt-1">Доступно: {balance} ₽</p>
              </div>

              <Button
                onClick={() => setScreen('withdrawal_sbp')}
                className="w-full h-16 text-lg bg-[#1a1a2e] hover:bg-[#252545] text-[#FF10F0] border-2 border-[#FF10F0]/30 hover:border-[#FF10F0]/60"
              >
                <Icon name="Smartphone" size={24} className="mr-2" />
                Вывести по СБП
              </Button>

              <Button
                onClick={() => setScreen('withdrawal_card')}
                className="w-full h-16 text-lg bg-[#1a1a2e] hover:bg-[#252545] text-[#00F0FF] border-2 border-[#00F0FF]/30 hover:border-[#00F0FF]/60"
              >
                <Icon name="CreditCard" size={24} className="mr-2" />
                Вывести на карту
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (screen === 'withdrawal_sbp') {
    return (
      <div className="min-h-screen p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f2e] via-[#0f1419] to-[#1a0f2e]" />
        
        <div className="relative z-10 max-w-4xl mx-auto space-y-6 animate-fade-in py-4">
          <Button
            onClick={() => setScreen('withdrawal_method')}
            variant="ghost"
            className="text-[#00F0FF] hover:text-[#FF10F0]"
          >
            <Icon name="ArrowLeft" size={20} className="mr-2" />
            Назад
          </Button>

          <Card className="bg-black/60 border border-[#FF10F0]/30 p-6">
            <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: '#FF10F0' }}>
              📱 Вывод по СБП
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-[#00F0FF] mb-2 block">Номер телефона</label>
                <Input
                  type="tel"
                  value={sbpPhone}
                  onChange={(e) => setSbpPhone(e.target.value)}
                  className="bg-[#1a1a2e] border-[#FF10F0]/30 text-white"
                  placeholder="+79001234567"
                />
              </div>

              <div>
                <label className="text-sm text-[#00F0FF] mb-2 block">Имя получателя</label>
                <Input
                  type="text"
                  value={sbpName}
                  onChange={(e) => setSbpName(e.target.value)}
                  className="bg-[#1a1a2e] border-[#FF10F0]/30 text-white"
                  placeholder="Иван Иванов"
                />
              </div>

              <div>
                <label className="text-sm text-[#00F0FF] mb-2 block">Выберите банк</label>
                <select
                  value={sbpBank}
                  onChange={(e) => setSbpBank(e.target.value)}
                  className="w-full bg-[#1a1a2e] border border-[#FF10F0]/30 text-white rounded-md px-3 py-2 focus:outline-none focus:border-[#FF10F0]"
                >
                  <option value="Сбербанк">Сбербанк</option>
                  <option value="Тинькофф">Тинькофф</option>
                  <option value="Озон банк">Озон банк</option>
                  <option value="ВБ банк">ВБ банк</option>
                  <option value="ВТБ банк">ВТБ банк</option>
                </select>
              </div>

              <div className="bg-[#1a1a2e] p-3 rounded-lg border border-[#FF10F0]/20">
                <p className="text-sm text-[#00F0FF]">Сумма: <span className="font-bold">{withdrawalAmount || '0'} ₽</span></p>
              </div>

              <Button
                onClick={handleWithdrawSbp}
                className="w-full h-12 bg-[#1a1a2e] hover:bg-[#252545] text-[#FF10F0] border-2 border-[#FF10F0]/30 hover:border-[#FF10F0]/60"
              >
                <Icon name="Send" size={20} className="mr-2" />
                Вывести
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (screen === 'withdrawal_card') {
    return (
      <div className="min-h-screen p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f2e] via-[#0f1419] to-[#1a0f2e]" />
        
        <div className="relative z-10 max-w-4xl mx-auto space-y-6 animate-fade-in py-4">
          <Button
            onClick={() => setScreen('withdrawal_method')}
            variant="ghost"
            className="text-[#00F0FF] hover:text-[#FF10F0]"
          >
            <Icon name="ArrowLeft" size={20} className="mr-2" />
            Назад
          </Button>

          <Card className="bg-black/60 border border-[#FF10F0]/30 p-6">
            <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: '#FF10F0' }}>
              💳 Вывод на карту
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-[#00F0FF] mb-2 block">Номер карты</label>
                <Input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="bg-[#1a1a2e] border-[#FF10F0]/30 text-white"
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                />
              </div>

              <div className="bg-[#1a1a2e] p-3 rounded-lg border border-[#FF10F0]/20">
                <p className="text-sm text-[#00F0FF]">Сумма: <span className="font-bold">{withdrawalAmount || '0'} ₽</span></p>
              </div>

              <Button
                onClick={handleWithdrawCard}
                className="w-full h-12 bg-[#1a1a2e] hover:bg-[#252545] text-[#FF10F0] border-2 border-[#FF10F0]/30 hover:border-[#FF10F0]/60"
              >
                <Icon name="Send" size={20} className="mr-2" />
                Вывести
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (screen === 'withdrawal_crypto_select') {
    return (
      <div className="min-h-screen p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f2e] via-[#0f1419] to-[#1a0f2e]" />
        
        <div className="relative z-10 max-w-4xl mx-auto space-y-6 animate-fade-in py-4">
          <Button
            onClick={() => setScreen('referral')}
            variant="ghost"
            className="text-[#00F0FF] hover:text-[#FF10F0]"
          >
            <Icon name="ArrowLeft" size={20} className="mr-2" />
            Назад
          </Button>

          <Card className="bg-black/60 border border-[#FF10F0]/30 p-6">
            <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: '#FF10F0' }}>
              💰 Выберите криптовалюту
            </h2>

            <div className="space-y-4">
              <div className="mb-4">
                <p className="text-center text-[#00F0FF] font-semibold mb-3">Минимальный вывод от 10$</p>
                <label className="text-sm text-[#00F0FF] mb-2 block">Сумма вывода ($)</label>
                <Input
                  type="number"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  className="bg-[#1a1a2e] border-[#FF10F0]/30 text-white"
                  placeholder="Минимум 10$"
                />
                <p className="text-xs text-[#00F0FF] mt-1">Доступно: {balance}$</p>
              </div>

              <Button
                onClick={() => {
                  if (!withdrawalAmount || parseFloat(withdrawalAmount) < 10) {
                    toast.error('Минимальная сумма вывода 10$');
                    return;
                  }
                  setCryptoType('USDT');
                  setScreen('withdrawal_crypto_usdt');
                }}
                className="w-full h-16 text-lg bg-[#1a1a2e] hover:bg-[#252545] text-[#26A17B] border-2 border-[#26A17B]/30 hover:border-[#26A17B]/60"
              >
                <Icon name="DollarSign" size={24} className="mr-2" />
                USDT
              </Button>

              <Button
                onClick={() => {
                  if (!withdrawalAmount || parseFloat(withdrawalAmount) < 10) {
                    toast.error('Минимальная сумма вывода 10$');
                    return;
                  }
                  setCryptoType('TON');
                  setScreen('withdrawal_crypto_ton');
                }}
                className="w-full h-16 text-lg bg-[#1a1a2e] hover:bg-[#252545] text-[#0088CC] border-2 border-[#0088CC]/30 hover:border-[#0088CC]/60"
              >
                <Icon name="Gem" size={24} className="mr-2" />
                TON
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (screen === 'withdrawal_crypto_usdt') {
    return (
      <div className="min-h-screen p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f2e] via-[#0f1419] to-[#1a0f2e]" />
        
        <div className="relative z-10 max-w-4xl mx-auto space-y-6 animate-fade-in py-4">
          <Button
            onClick={() => setScreen('withdrawal_crypto_select')}
            variant="ghost"
            className="text-[#00F0FF] hover:text-[#FF10F0]"
          >
            <Icon name="ArrowLeft" size={20} className="mr-2" />
            Назад
          </Button>

          <Card className="bg-black/60 border border-[#26A17B]/30 p-6">
            <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: '#26A17B' }}>
              💵 Вывод USDT
            </h2>

            <div className="space-y-4">
              <div className="bg-[#1a1a2e] p-3 rounded-lg border border-[#26A17B]/20 mb-4">
                <p className="text-sm text-[#00F0FF]">Сумма: <span className="font-bold">{withdrawalAmount || '0'}$</span></p>
              </div>

              <div>
                <label className="text-sm text-[#00F0FF] mb-2 block">Выберите сеть</label>
                <select
                  value={cryptoNetwork}
                  onChange={(e) => setCryptoNetwork(e.target.value as 'TON' | 'TRC20')}
                  className="w-full bg-[#1a1a2e] border border-[#26A17B]/30 text-white rounded-md px-3 py-2 focus:outline-none focus:border-[#26A17B]"
                >
                  <option value="">Выберите сеть</option>
                  <option value="TON">The Open Network (TON)</option>
                  <option value="TRC20">Tron (TRC20)</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-[#00F0FF] mb-2 block">Адрес кошелька USDT</label>
                <Input
                  type="text"
                  value={cryptoWallet}
                  onChange={(e) => setCryptoWallet(e.target.value)}
                  className="bg-[#1a1a2e] border-[#26A17B]/30 text-white"
                  placeholder="Введите адрес кошелька"
                />
              </div>

              <Button
                onClick={() => {
                  if (!cryptoNetwork) {
                    toast.error('Выберите сеть');
                    return;
                  }
                  if (!cryptoWallet.trim()) {
                    toast.error('Введите адрес кошелька');
                    return;
                  }
                  setConfirmStep(0);
                  setScreen('withdrawal_crypto_confirm');
                }}
                className="w-full h-12 bg-[#1a1a2e] hover:bg-[#252545] text-[#26A17B] border-2 border-[#26A17B]/30 hover:border-[#26A17B]/60"
              >
                <Icon name="ArrowRight" size={20} className="mr-2" />
                Далее
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (screen === 'withdrawal_crypto_ton') {
    return (
      <div className="min-h-screen p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f2e] via-[#0f1419] to-[#1a0f2e]" />
        
        <div className="relative z-10 max-w-4xl mx-auto space-y-6 animate-fade-in py-4">
          <Button
            onClick={() => setScreen('withdrawal_crypto_select')}
            variant="ghost"
            className="text-[#00F0FF] hover:text-[#FF10F0]"
          >
            <Icon name="ArrowLeft" size={20} className="mr-2" />
            Назад
          </Button>

          <Card className="bg-black/60 border border-[#0088CC]/30 p-6">
            <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: '#0088CC' }}>
              💎 Вывод TON
            </h2>

            <div className="space-y-4">
              <div className="bg-[#1a1a2e] p-3 rounded-lg border border-[#0088CC]/20 mb-4">
                <p className="text-sm text-[#00F0FF]">Сумма: <span className="font-bold">{withdrawalAmount || '0'}$</span></p>
              </div>

              <div>
                <label className="text-sm text-[#00F0FF] mb-2 block">Адрес TON кошелька</label>
                <Input
                  type="text"
                  value={cryptoWallet}
                  onChange={(e) => setCryptoWallet(e.target.value)}
                  className="bg-[#1a1a2e] border-[#0088CC]/30 text-white"
                  placeholder="UQ..."
                />
              </div>

              <Button
                onClick={() => {
                  if (!cryptoWallet.trim()) {
                    toast.error('Введите адрес кошелька');
                    return;
                  }
                  setConfirmStep(0);
                  setScreen('withdrawal_crypto_confirm');
                }}
                className="w-full h-12 bg-[#1a1a2e] hover:bg-[#252545] text-[#0088CC] border-2 border-[#0088CC]/30 hover:border-[#0088CC]/60"
              >
                <Icon name="ArrowRight" size={20} className="mr-2" />
                Далее
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (screen === 'withdrawal_crypto_confirm') {
    const borderColor = cryptoType === 'USDT' ? '#26A17B' : '#0088CC';
    const textColor = cryptoType === 'USDT' ? '#26A17B' : '#0088CC';

    return (
      <div className="min-h-screen p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f2e] via-[#0f1419] to-[#1a0f2e]" />
        
        <div className="relative z-10 max-w-4xl mx-auto space-y-6 animate-fade-in py-4">
          <Button
            onClick={() => {
              if (cryptoType === 'USDT') {
                setScreen('withdrawal_crypto_usdt');
              } else {
                setScreen('withdrawal_crypto_ton');
              }
              setConfirmStep(0);
            }}
            variant="ghost"
            className="text-[#00F0FF] hover:text-[#FF10F0]"
          >
            <Icon name="ArrowLeft" size={20} className="mr-2" />
            Назад
          </Button>

          <Card className="bg-black/60 border p-6" style={{ borderColor: `${borderColor}40` }}>
            <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: textColor }}>
              ⚠️ Подтверждение данных
            </h2>

            <div className="space-y-4 mb-6">
              <div className="bg-[#1a1a2e] p-4 rounded-lg border" style={{ borderColor: `${borderColor}20` }}>
                <p className="text-sm text-gray-400 mb-2">Криптовалюта:</p>
                <p className="text-xl font-bold" style={{ color: textColor }}>{cryptoType}</p>
              </div>

              {cryptoType === 'USDT' && (
                <div className="bg-[#1a1a2e] p-4 rounded-lg border" style={{ borderColor: `${borderColor}20` }}>
                  <p className="text-sm text-gray-400 mb-2">Сеть:</p>
                  <p className="text-xl font-bold" style={{ color: textColor }}>
                    {cryptoNetwork === 'TON' ? 'The Open Network (TON)' : 'Tron (TRC20)'}
                  </p>
                </div>
              )}

              <div className="bg-[#1a1a2e] p-4 rounded-lg border" style={{ borderColor: `${borderColor}20` }}>
                <p className="text-sm text-gray-400 mb-2">Адрес кошелька:</p>
                <p className="text-sm font-mono break-all" style={{ color: textColor }}>{cryptoWallet}</p>
              </div>

              <div className="bg-[#1a1a2e] p-4 rounded-lg border" style={{ borderColor: `${borderColor}20` }}>
                <p className="text-sm text-gray-400 mb-2">Сумма вывода:</p>
                <p className="text-xl font-bold text-[#FF10F0]">{withdrawalAmount} ₽</p>
              </div>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Icon name="AlertTriangle" size={24} className="text-red-400 flex-shrink-0 mt-1" />
                <div className="text-sm text-red-200">
                  <p className="font-bold mb-2">⚠️ ВНИМАНИЕ!</p>
                  <p className="mb-2">Проверьте правильность введённых данных!</p>
                  <p className="text-red-300">Средства будут отправлены на указанный адрес. Убедитесь, что вы выбрали правильную сеть и адрес кошелька.</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => {
                  setConfirmStep(confirmStep + 1);
                  if (confirmStep === 0) {
                    toast.info('Подтвердите ещё раз');
                  }
                }}
                disabled={confirmStep >= 2}
                className="w-full h-12 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 border-2 border-yellow-500/50 hover:border-yellow-500"
              >
                <Icon name="AlertCircle" size={20} className="mr-2" />
                {confirmStep === 0 ? 'Подтвердить данные (1/2)' : 'Подтвердить данные (2/2)'}
              </Button>

              {confirmStep >= 2 && (
                <Button
                  onClick={handleCryptoWithdrawSubmit}
                  className="w-full h-12 animated-gradient text-white border-0 hover-lift shine-effect font-bold"
                >
                  <Icon name="Send" size={20} className="mr-2" />
                  Отправить заявку
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