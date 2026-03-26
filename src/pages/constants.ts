export const AUTH_URL = 'https://functions.poehali.dev/84480352-2061-48c5-b055-98dde5c9eaac';
export const AUTH_EMAIL_URL = 'https://functions.poehali.dev/aedd94db-726b-413f-92dc-f4eae0cd8661';
export const TELEGRAM_AUTH_URL = 'https://functions.poehali.dev/3484034c-2eea-4efb-b6bb-b210a800e4d9';
export const ADMIN_URL = 'https://functions.poehali.dev/d39f2135-dd29-4434-9b42-3a881c1b6eb2';
export const WITHDRAWAL_URL = 'https://functions.poehali.dev/70e3feba-e029-403f-90d0-d0d99a410177';
export const VIP_URL = 'https://functions.poehali.dev/3748b10f-150b-4ed4-99d9-8d0c439e624f';
export const REFERRAL_URL = 'https://functions.poehali.dev/81a8cc6f-5777-44ae-87dc-cb8019062cdb';
export const REFERRAL_WITHDRAWAL_URL = 'https://functions.poehali.dev/d38745fc-69e2-4c65-baec-3b6798e0b76a';
export const PLAYERS_URL = 'https://functions.poehali.dev/3e570920-a9de-4ec8-97e8-928154817722';
export const SUPPORT_URL = 'https://functions.poehali.dev/bb6c509d-0959-41f0-9412-4855a56c8608';
export const VIP_PAYMENT_URL = 'https://functions.poehali.dev/6fd14d89-7e15-4fd6-a152-8129b6527802';
export const CRYPTO_WALLET = 'UQAdowLWZaOAssDcVX-CbhUl_ydb9wSJON7EPorQEYBqE4UQ';
export const FREE_SIGNALS_LIMIT = 10;

export type Screen =
  | 'home' | 'instructions' | 'signals' | 'referral' | 'auth'
  | 'admin' | 'admin_user' | 'admin_customization' | 'admin_players'
  | 'admin_support' | 'admin_support_chat' | 'admin_withdrawals' | 'admin_summary'
  | 'vip' | 'vip_payment' | 'crashx'
  | 'withdrawal_crypto_select' | 'withdrawal_crypto_usdt' | 'withdrawal_crypto_ton' | 'withdrawal_crypto_confirm'
  | 'withdrawal_method' | 'withdrawal_sbp' | 'withdrawal_card'
  | 'support_chat';

export interface User {
  id: number;
  username: string;
  balance: number;
  referralCount: number;
  referralCode: string;
}

export const translations = {
  ru: {
    home: 'Главная', instructions: 'Инструкция', signals: 'Сигналы',
    referral: 'Реферальная программа', vip: 'VIP Сигналы', crashx: 'CRASH X',
    withdrawal: 'Вывод средств', logout: 'Выйти', login: 'Вход', register: 'Регистрация',
    username: 'Имя пользователя', password: 'Пароль', balance: 'Баланс',
    referrals: 'Рефералы', getSignal: 'Получить сигнал', waiting: 'Ожидание',
    coefficient: 'Коэффициент', time: 'Время', sec: 'сек',
    welcome: 'Добро пожаловать', admin: 'АДМИН-ПАНЕЛЬ', summary: 'Сводка',
    players: 'Игроки', support: 'Поддержка', tools: 'Инструменты',
    customization: 'Кастомизация', exit: 'Выход',
    noAccount: 'Нет аккаунта? Зарегистрируйтесь', hasAccount: 'Уже есть аккаунт? Войдите',
    enterBtn: 'Войти', registerBtn: 'Зарегистрироваться', back: 'Назад',
    instructionTitle: '🌟 Инструкция 🌟',
    step1: '1. Зарегистрируйтесь в Lucky bear.',
    step2: '2. Пополните баланс на минимальную сумму.',
    step3: '3. Перейдите в Lucky bear и найдите игру CRASH X.',
    step4: '4. Нажмите кнопку к сигналам и получайте точные сигналы.',
    step5: '5. Интервал между сигналами 7 секунд.',
    registerNow: 'Зарегистрироваться', toSignals: 'К сигналам',
    yourSignal: 'Ваш сигнал:', nextSignalIn: 'Следующий сигнал через:',
    nextSignal: 'Следующий сигнал', vipInstruction: '🌟 VIP Инструкция 🌟',
    allTime: 'За всё время', clicks: 'Переходы:', registrations: 'Регистрации:',
    yourRefLink: 'Ваша реферальная ссылка',
    sendToFriends: 'Отправьте эту ссылку друзьям для получения дохода',
    income: 'Доход:', copy: 'Копировать', main: 'Главная',
    withdrawalMethod: 'Способ вывода', network: 'Сеть',
    withdrawAmount: 'Сумма вывода', minAmount: 'минимум 10$, доступно:',
    walletAddress: 'Адрес кошелька', enterWallet: 'Введите адрес кошелька',
    withdrawFunds: 'Вывести средства', vipAccess: '💎 VIP Доступ',
    perMonth: '8 USDT / месяц', paymentConditions: '⚠️ Условия оплаты:',
    amount: 'Сумма:', exactly: 'РОВНО 8 USDT', tonNetwork: 'The Open Network (TON)',
    otherNotAccepted: 'Другие суммы и сети не принимаются!',
    walletAddr: 'Адрес кошелька:', copyAddress: 'Копировать адрес',
    screenshotLink: 'Ссылка на скриншот платежа',
    uploadInstruction: '📸 Загрузите скриншот на imgur.com или imgbb.com и вставьте ссылку',
    reviewTime: '⚡ Проверка заявки до 15 минут. После одобрения VIP активируется автоматически!',
    cancel: 'Отмена', sendRequest: 'Отправить заявку', enterAmount: 'Введите сумму в $'
  },
  en: {
    home: 'Home', instructions: 'Instructions', signals: 'Signals',
    referral: 'Referral Program', vip: 'VIP Signals', crashx: 'CRASH X',
    withdrawal: 'Withdrawal', logout: 'Logout', login: 'Login', register: 'Register',
    username: 'Username', password: 'Password', balance: 'Balance',
    referrals: 'Referrals', getSignal: 'Get Signal', waiting: 'Waiting',
    coefficient: 'Coefficient', time: 'Time', sec: 'sec',
    welcome: 'Welcome', admin: 'ADMIN PANEL', summary: 'Summary',
    players: 'Players', support: 'Support', tools: 'Tools',
    customization: 'Customization', exit: 'Exit',
    noAccount: "Don't have an account? Register", hasAccount: 'Already have an account? Login',
    enterBtn: 'Login', registerBtn: 'Register', back: 'Back',
    instructionTitle: '🌟 Instructions 🌟',
    step1: '1. Register in Lucky bear.',
    step2: '2. Deposit the minimum amount.',
    step3: '3. Go to Lucky bear and find the CRASH X game.',
    step4: '4. Click the signals button and get accurate signals.',
    step5: '5. Interval between signals is 7 seconds.',
    registerNow: 'Register', toSignals: 'To Signals',
    yourSignal: 'Your signal:', nextSignalIn: 'Next signal in:',
    nextSignal: 'Next Signal', vipInstruction: '🌟 VIP Instructions 🌟',
    allTime: 'All Time', clicks: 'Clicks:', registrations: 'Registrations:',
    yourRefLink: 'Your referral link',
    sendToFriends: 'Send this link to friends to earn income',
    income: 'Income:', copy: 'Copy', main: 'Main',
    withdrawalMethod: 'Withdrawal Method', network: 'Network',
    withdrawAmount: 'Withdrawal Amount', minAmount: 'minimum 10$, available:',
    walletAddress: 'Wallet Address', enterWallet: 'Enter wallet address',
    withdrawFunds: 'Withdraw Funds', vipAccess: '💎 VIP Access',
    perMonth: '8 USDT / month', paymentConditions: '⚠️ Payment Conditions:',
    amount: 'Amount:', exactly: 'EXACTLY 8 USDT', tonNetwork: 'The Open Network (TON)',
    otherNotAccepted: 'Other amounts and networks are not accepted!',
    walletAddr: 'Wallet Address:', copyAddress: 'Copy Address',
    screenshotLink: 'Payment screenshot link',
    uploadInstruction: '📸 Upload screenshot to imgur.com or imgbb.com and paste the link',
    reviewTime: '⚡ Application review takes up to 15 minutes. VIP will be activated automatically after approval!',
    cancel: 'Cancel', sendRequest: 'Send Request', enterAmount: 'Enter amount in $'
  }
};

export type Translations = typeof translations.ru;
