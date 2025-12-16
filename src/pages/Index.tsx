import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

type Screen = 'home' | 'instructions' | 'signals' | 'referral';

const Index = () => {
  const [screen, setScreen] = useState<Screen>('home');
  const [currentSignal, setCurrentSignal] = useState<number | null>(null);
  const [balance, setBalance] = useState(0);
  const [referralCount, setReferralCount] = useState(0);
  const [userId] = useState(() => Math.random().toString(36).substring(2, 15));
  const [timeLeft, setTimeLeft] = useState(0);
  const [isWaiting, setIsWaiting] = useState(false);
  const referralLink = `${window.location.origin}/?ref=${userId}`;

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && isWaiting) {
      setIsWaiting(false);
    }
  }, [timeLeft, isWaiting]);

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
    window.open('https://t.me/Lusky_bear_bot', '_blank');
  };

  const handleWithdraw = () => {
    window.open('https://t.me/Lusky_bear_bot', '_blank');
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Ссылка скопирована в буфер обмена!');
  };

  const handleRegister = () => {
    window.open('https://t.me/C_Treasure_Bot/app?startapp=eHd1PTE3MDQwMjgzNzcmbT1uZXRsbzU1NSZjPWRlZmF1bHQ', '_blank');
  };

  if (screen === 'home') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f2e] via-[#0f1419] to-[#1a0f2e]" />
        
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-48 h-48 sm:w-64 sm:h-64 bg-[#FF10F0] rounded-full blur-[100px] opacity-10 animate-pulse-glow" />
          <div className="absolute bottom-20 right-10 w-48 h-48 sm:w-64 sm:h-64 bg-[#00F0FF] rounded-full blur-[100px] opacity-10 animate-pulse-glow" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10 max-w-4xl w-full space-y-8 sm:space-y-12 animate-fade-in">
          <h1 className="text-5xl sm:text-7xl md:text-9xl font-black text-center tracking-wider" style={{ color: '#FF10F0', textShadow: '0 0 20px rgba(255, 16, 240, 0.5)' }}>
            LUSKY BEAR
          </h1>

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
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 sm:mb-8">
                <div className="text-center sm:text-left">
                  <p className="text-xs sm:text-sm text-[#00F0FF] mb-1">Ваш баланс</p>
                  <p className="text-3xl sm:text-4xl font-black" style={{ color: '#FF10F0' }}>
                    {balance} ₽
                  </p>
                </div>
                <Button
                  onClick={handleWithdraw}
                  className="bg-[#1a1a2e] hover:bg-[#252545] text-[#FF10F0] border-2 border-[#FF10F0]/30 hover:border-[#FF10F0]/60 transition-all px-6 py-2"
                >
                  <Icon name="Wallet" size={20} className="mr-2" />
                  Вывести
                </Button>
                <div className="text-center sm:text-right">
                  <p className="text-xs sm:text-sm text-[#00F0FF] mb-1">Рефералов</p>
                  <p className="text-3xl sm:text-4xl font-black" style={{ color: '#00F0FF' }}>
                    {referralCount}
                  </p>
                </div>
              </div>

              <h2 className="text-xl sm:text-3xl font-black mb-4 sm:mb-6 text-center" style={{ color: '#FF10F0' }}>
                ⭐ Реферальная программа Lusky Bear
              </h2>

              <div className="space-y-4 sm:space-y-6 text-sm sm:text-base mb-6 sm:mb-8">
                <p className="text-center">
                  Зарабатывайте по <span className="text-[#FF10F0] font-bold">50 рублей</span> за приглашённого человека и его траты в казино Lusky Bear
                </p>

                <div className="bg-black/60 p-4 sm:p-6 rounded-lg border border-[#9b87f5]/30">
                  <h3 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4 text-[#00F0FF]">💰 Сколько вы получаете</h3>
                  <p>🥳 Вы получаете по <strong className="text-[#FF10F0]">50 ₽</strong> за каждого приглашённого, который пополнил баланс на минимальную сумму и получил хотя бы 2 сигнала.</p>
                  <p className="mt-3 sm:mt-4">Ваш приглашённый получает <strong className="text-[#00F0FF]">360% бонусом</strong> за первое пополнение баланса и бесплатные сигналы в казино Lusky Bear.</p>
                </div>

                <div className="bg-black/60 p-4 sm:p-6 rounded-lg border border-[#9b87f5]/30">
                  <h3 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4 text-[#00F0FF]">🔍 Как это работает</h3>
                  <ol className="space-y-2 list-decimal list-inside">
                    <li>Вы отправляете человеку свою реферальную ссылку.</li>
                    <li>Он переходит по ней, выполняет условия, пополняет баланс и получает точные сигналы.</li>
                    <li>Ваш баланс пополняется на 50 рублей.</li>
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

              <div className="space-y-4">
                <div className="bg-black/60 p-3 sm:p-4 rounded-lg border border-[#FF10F0]/30 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                  <input
                    type="text"
                    readOnly
                    value={referralLink}
                    className="flex-1 bg-transparent border-none outline-none text-[#00F0FF] font-mono text-xs sm:text-sm px-2 py-1"
                  />
                  <Button
                    onClick={copyReferralLink}
                    className="bg-[#1a1a2e] hover:bg-[#252545] text-[#FF10F0] border border-[#FF10F0]/30 hover:border-[#FF10F0]/60 transition-all w-full sm:w-auto"
                  >
                    <Icon name="Copy" size={18} className="mr-2" />
                    Копировать
                  </Button>
                </div>

                <p className="text-xs sm:text-sm text-center text-[#00F0FF]">
                  Чтобы вывести баланс, напишите администратору и предоставьте скриншоты
                </p>
              </div>
            </Card>
        </div>
      </div>
    );
  }

  return null;
};

export default Index;