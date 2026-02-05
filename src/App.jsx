import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { Home, Clock, Flame, Menu as MenuIcon, CheckCircle2, Circle, Sun, Moon, Volume2, VolumeX, Sparkles, BookOpen, Settings, X, RotateCcw, LogOut, Zap, Target, Award, ChevronLeft, ChevronRight, Plus, Trash2, Bell, Globe, Shield, Database, HelpCircle, User, Activity, Download, Upload, MessageSquare, ShieldCheck, Fingerprint, Palette, Camera, Image as ImageIcon, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { initialRoutine, quotes } from './data/routine';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import './App.css';

// Context for global state
const AppContext = createContext();

const App = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [showSettings, setShowSettings] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('profile');
    return saved ? JSON.parse(saved) : {
      name: "Identity #001",
      about: "Protagonist of this timeline.",
      avatar: "👤",
      dailyGoal: 5,
      bestStreak: 0,
      lastLoginDate: new Date().toLocaleDateString(),
      academicTasks: 0,
      totalUsageDays: 1,
      tasksAddedToday: 0,
      appOpensToday: 0,
      focusMinutesToday: 0,
      diamonds: 0,
      rewardHistory: [],
      claimedRoutines: [],
      lastSessionDate: new Date().toLocaleDateString()
    };
  });
  const [milestones, setMilestones] = useState(() => {
    const saved = localStorage.getItem('milestones');
    return saved ? JSON.parse(saved) : {
      focusPeak: false,
      academicExcellence: false,
      flowMaster: false,
      disciplineKing: false
    };
  });
  const [dailySystemTasks, setDailySystemTasks] = useState([
    { id: 'focus', title: 'Daily Focus Peak', icon: '🧠', target: 'focusPeak' },
    { id: 'academic', title: 'Academic Excellence', icon: '🎓', target: 'academicExcellence' },
    { id: 'flow', title: 'Flow State Mastery', icon: '🌊', target: 'flowMaster' }
  ]);
  const [dailyRewardClaimed, setDailyRewardClaimed] = useState(false);
  const [appSettings, setAppSettings] = useState(() => {
    const saved = localStorage.getItem('appSettings');
    return saved ? JSON.parse(saved) : {
      theme: 'auto',
      accentColor: '#4F46E5',
      fontSize: 'medium',
      language: 'English',
      taskSort: 'manual',
      hideCompleted: false,
      notifications: {
        reminders: true,
        streaks: true,
        quotes: true,
        sound: true,
        dailyReminderEnabled: true,
        dailyReminderTime: "08:00",
        streakReminderEnabled: true
      },
      language: 'English',
      soundVibration: true,
      streakTracking: true,
      dailyTaskLimit: 10,
      rewardAnimations: true,

    };
  });
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('tasks');
    // Migration: ensure all tasks have a sectionId
    const data = saved ? JSON.parse(saved) : initialRoutine;
    return data
      .filter(t => t.title !== "Change & wash face")
      .map((t, idx) => ({
        ...t,
        sectionId: t.sectionId || (idx < 8 ? 'morning' : 'night')
      }));
  });
  const [streak, setStreak] = useState(() => {
    const saved = localStorage.getItem('streak');
    return saved ? Number(saved) : 0;
  });
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [unlockedTitles, setUnlockedTitles] = useState(() => {
    const saved = localStorage.getItem('unlockedTitles');
    return saved ? JSON.parse(saved) : ["Getting Started 🌱"];
  });
  const [sections, setSections] = useState(() => {
    const saved = localStorage.getItem('sections');
    return saved ? JSON.parse(saved) : [
      { id: 'morning', title: 'Morning Routine', icon: '🌅' },
      { id: 'night', title: 'Night Routine', icon: '🌙' },
    ];
  });
  const [newUnlock, setNewUnlock] = useState(null);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsLoggedIn(true);
        // Load data from Firestore
        loadUserData(firebaseUser.uid);
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Load User Data from Firestore
  const loadUserData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.profile) setProfile(data.profile);
        if (data.tasks) setTasks(data.tasks);
        if (data.milestones) setMilestones(data.milestones);
        if (data.appSettings) setAppSettings(data.appSettings);
        if (data.streak !== undefined) setStreak(data.streak);
        if (data.theme) setTheme(data.theme);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  // Sync Data to Firestore (Debounced)
  useEffect(() => {
    if (!user) return;
    const timeoutId = setTimeout(async () => {
      setIsSyncing(true);
      try {
        await setDoc(doc(db, 'users', user.uid), {
          profile,
          tasks,
          milestones,
          appSettings,
          streak,
          theme,
          lastSynced: new Date().toISOString()
        }, { merge: true });
      } catch (error) {
        console.error("Error syncing user data:", error);
      }
      setIsSyncing(false);
    }, 2000); // 2 second debounce

    return () => clearTimeout(timeoutId);
  }, [profile, tasks, milestones, appSettings, streak, theme, user]);

  const rewards = [
    { streak: 1, title: "Beginner 🌱", icon: "🌱" },
    { streak: 7, title: "Focused Mind 🧠", icon: "🧠" },
    { streak: 14, title: "Consistency Pro 💪", icon: "💪" },
    { streak: 30, title: "Discipline Legend 👑", icon: "👑" },
  ];

  const translations = {
    English: {
      systemConfig: "System Configuration",
      systemSub: "Fine-tune your productivity environment and protocol parameters.",
      account: "Account & Profile",
      appearance: "Appearance",
      notifications: "Notifications",
      appPrefs: "App Preferences",
      prodRules: "Productivity Rules",
      security: "Security",
      support: "Support & About",
      level: "LEVEL",
      agent: "AGENT",
      diamonds: "DIAMONDS",
      streak: "STREAK",
      light: "LIGHT",
      dark: "DARK",
      accent: "Accent Color",
      dailyReminders: "Daily Reminders",
      streakWarnings: "Streak Warnings",
      interfaceLang: "Interface Language",
      soundVib: "Sound & Vibration",
      rewardAnim: "Reward Animations",
      streakTrack: "Streak Tracking",
      dailyGoal: "Daily Task Goal",
      resetDay: "Reset Today's Progress",
      appLock: "App Lock",
      backup: "Backup",
      restore: "Restore",
      clearTasks: "Clear Completed Tasks",
      version: "Version",
      sendFeed: "Send Feedback",
      privacy: "Privacy Policy",
      placeholderPin: "Enter 4-digit PIN",
      logout: "LOG OUT SESSION"
    },
    Spanish: {
      systemConfig: "Configuración del Sistema",
      systemSub: "Ajusta tu entorno de productividad y parámetros de protocolo.",
      account: "Cuenta y Perfil",
      appearance: "Apariencia",
      notifications: "Notificaciones",
      appPrefs: "Preferencias",
      prodRules: "Reglas de Productividad",
      security: "Seguridad",
      support: "Soporte y Acerca de",
      level: "NIVEL",
      agent: "AGENTE",
      diamonds: "DIAMANTES",
      streak: "RACHA",
      light: "CLARO",
      dark: "OSCURO",
      accent: "Color de Acento",
      dailyReminders: "Recordatorios Diarios",
      streakWarnings: "Alertas de Racha",
      interfaceLang: "Idioma de Interfaz",
      soundVib: "Sonido y Vibración",
      rewardAnim: "Animaciones",
      streakTrack: "Seguimiento de Racha",
      dailyGoal: "Meta Diaria",
      resetDay: "Reiniciar Progreso",
      appLock: "Bloqueo de App",
      backup: "Respaldo",
      restore: "Restaurar",
      clearTasks: "Borrar Completadas",
      version: "Versión",
      sendFeed: "Enviar Feedback",
      privacy: "Privacidad",
      placeholderPin: "PIN de 4 dígitos",
      logout: "CERRAR SESIÓN"
    },
    French: {
      systemConfig: "Configuration Système",
      systemSub: "Ajustez votre environnement de productivité.",
      account: "Compte & Profil",
      appearance: "Apparence",
      notifications: "Notifications",
      appPrefs: "Préférences",
      prodRules: "Règles de Productivité",
      security: "Sécurité",
      support: "Support & À propos",
      level: "NIVEAU",
      agent: "AGENT",
      diamonds: "DIAMANTS",
      streak: "SÉRIE",
      light: "CLAIR",
      dark: "SOMBRE",
      accent: "Couleur d'accent",
      dailyReminders: "Rappels Quotidiens",
      streakWarnings: "Alertes de Série",
      interfaceLang: "Langue",
      soundVib: "Son & Vibration",
      rewardAnim: "Animations",
      streakTrack: "Suivi de Série",
      dailyGoal: "Objectif Quotidien",
      resetDay: "Réinitialiser",
      appLock: "Verrouillage",
      backup: "Sauvegarde",
      restore: "Restaurer",
      clearTasks: "Effacer Terminées",
      version: "Version",
      sendFeed: "Envoyer Avis",
      privacy: "Confidentialité",
      placeholderPin: "PIN à 4 chiffres",
      logout: "DÉCONNEXION"
    },
    German: {
      systemConfig: "Systemkonfiguration",
      systemSub: "Optimieren Sie Ihre Produktivitätsumgebung.",
      account: "Konto & Profil",
      appearance: "Aussehen",
      notifications: "Benachrichtigungen",
      appPrefs: "Einstellungen",
      prodRules: "Produktivitätsregeln",
      security: "Sicherheit",
      support: "Hilfe & Über",
      level: "LEVEL",
      agent: "AGENT",
      diamonds: "DIAMANTEN",
      streak: "STREAK",
      light: "HELL",
      dark: "DUNKEL",
      accent: "Akzentfarbe",
      dailyReminders: "Tägliche Erinnerungen",
      streakWarnings: "Streak-Warnungen",
      interfaceLang: "Sprache",
      soundVib: "Ton & Vibration",
      rewardAnim: "Belohnungsanimationen",
      streakTrack: "Streak-Tracking",
      dailyGoal: "Tagesziel",
      resetDay: "Fortschritt zurücksetzen",
      appLock: "App-Sperre",
      backup: "Backup",
      restore: "Wiederherstellen",
      clearTasks: "Erledigte löschen",
      version: "Version",
      sendFeed: "Feedback senden",
      privacy: "Datenschutz",
      placeholderPin: "4-stellige PIN",
      logout: "ABMELDEN"
    }
  };

  const t = (key) => {
    const lang = appSettings.language || 'English';
    return translations[lang]?.[key] || translations['English'][key] || key;
  };

  const playCompletionSound = () => {
    if (!appSettings.soundVibration) return;
    try {
      // Simple cheerful "ding" using Web Audio API to avoid external file deps
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.1); // C6
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) { console.error("Sound error", e); }
  };

  useEffect(() => {
    // Streak logic on login/load
    const today = new Date().toLocaleDateString();
    if (profile.lastLoginDate !== today) {
      const lastLogin = new Date(profile.lastLoginDate);
      const currentDate = new Date(today);
      const diffTime = Math.abs(currentDate - lastLogin);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let newStreak = streak;
      if (diffDays === 1) {
        // Logged in the next day, streak continues but only if tasks were done (handled by completion)
      } else if (diffDays > 1) {
        newStreak = 0; // Reset streak if missed a day
      }

      setProfile(prev => ({
        ...prev,
        lastLoginDate: today,
        totalUsageDays: prev.totalUsageDays + 1,
        tasksAddedToday: 0,
        appOpensToday: 1,
        focusMinutesToday: 0
      }));
      setStreak(newStreak);
    } else {
      setProfile(prev => ({ ...prev, appOpensToday: prev.appOpensToday + 1 }));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('streak', streak.toString());
    localStorage.setItem('unlockedTitles', JSON.stringify(unlockedTitles));
    localStorage.setItem('theme', theme);
    localStorage.setItem('isLoggedIn', isLoggedIn.toString());
    localStorage.setItem('profile', JSON.stringify(profile));
    localStorage.setItem('appSettings', JSON.stringify(appSettings));

    localStorage.setItem('milestones', JSON.stringify(milestones));
    localStorage.setItem('sections', JSON.stringify(sections));
    document.body.className = `${theme}-theme`;
    document.body.style.setProperty('--primary', appSettings.accentColor);
    document.body.style.fontSize = appSettings.fontSize === 'small' ? '14px' : appSettings.fontSize === 'large' ? '18px' : '16px';
  }, [tasks, streak, unlockedTitles, theme, isLoggedIn, profile, appSettings]);

  const activeTitle = rewards.slice().reverse().find(r => unlockedTitles.includes(r.title))?.title || "Novice User";

  const toggleTask = (id) => {
    const newTasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(newTasks);

    // Play sound if completing
    const task = newTasks.find(t => t.id === id);
    if (task && task.completed) playCompletionSound();

    // If all tasks just became completed, check streak/milestones
    const wasAllDone = tasks.every(t => t.completed);
    const isAllDoneNow = newTasks.every(t => t.completed);

    if (!wasAllDone && isAllDoneNow) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > profile.bestStreak) {
        setProfile(prev => ({ ...prev, bestStreak: newStreak }));
      }

      const milestone = rewards.find(r => r.streak === newStreak);
      if (milestone && !unlockedTitles.includes(milestone.title)) {
        setUnlockedTitles([...unlockedTitles, milestone.title]);
        setNewUnlock(milestone.title);
      }
    }

    // Daily Focus Peak
    const completedToday = newTasks.filter(t => t.completed).length;
    if (completedToday >= 5 && !milestones.focusPeak) {
      setMilestones(prev => ({ ...prev, focusPeak: true }));
      setNewUnlock("Daily Focus Peak 🏔️");
    }

    // Academic Excellence (keywords: college, study, homework, exam, class)
    const academicKeywords = ['college', 'study', 'homework', 'exam', 'class', 'assignment', 'lecture'];
    const academicDone = newTasks.filter(t => t.completed && academicKeywords.some(kw => t.title.toLowerCase().includes(kw))).length;
    if (academicDone >= 5 && !milestones.academicExcellence) {
      setMilestones(prev => ({ ...prev, academicExcellence: true }));
      setNewUnlock("Academic Excellence 🎓");
    }

    // Flow State Master (7 continuous days)
    if (profile.totalUsageDays >= 7 && !milestones.flowMaster) {
      setMilestones(prev => ({ ...prev, flowMaster: true }));
      setNewUnlock("Flow State Master 🌊");
    }

    // Discipline King (30 day streak)
    if (streak >= 30 && !milestones.disciplineKing) {
      setMilestones(prev => ({ ...prev, disciplineKing: true }));
      setNewUnlock("Discipline King 👑");
    }
  };

  const addTask = (title, sectionId) => {
    if (!title.trim()) return;
    const newTask = {
      id: Date.now(),
      title,
      sectionId,
      time: "Dynamic",
      icon: "📌",
      completed: false
    };
    setTasks([...tasks, newTask]);
    setProfile(prev => ({ ...prev, tasksAddedToday: prev.tasksAddedToday + 1 }));
  };

  const progress = Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100);
  const isCompleted = progress === 100;

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const resetRoutine = () => {
    setTasks(initialRoutine.map((t, idx) => ({
      ...t,
      sectionId: t.sectionId || (idx < 8 ? 'morning' : 'night')
    })));
  };

  const currentHour = new Date().getHours();
  const getBackgroundImage = () => {
    if (currentHour >= 21 || currentHour < 5) return '/night_bg.jpg';
    if (currentHour >= 17) return '/evening_bg.jpg';
    return '/menu_bg.jpg';
  };



  useEffect(() => {
    // Notification Logic (Simulated for SPA)
    const checkReminders = () => {
      if (appSettings.notifications?.dailyReminderEnabled) {
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        if (currentTime === appSettings.notifications.dailyReminderTime) {
          // In a real PWA we'd use Service Workers. For now, we simulate or show toast if open.
          if (new Date().getSeconds() < 10) { // Limit trigger to just once per minute roughly
            console.log("Daily Reminder: Time to focus!");
          }
        }
      }
    };
    const reminderInterval = setInterval(checkReminders, 10000); // Check every 10s

    return () => {
      clearInterval(reminderInterval);
    };
  }, [appSettings.notifications]);



  return (
    <AppContext.Provider value={{
      tasks, setTasks, streak, setStreak, toggleTask, addTask, deleteTask,
      progress, isCompleted, resetRoutine, unlockedTitles, activeTitle,
      rewards, getBackgroundImage, theme, setTheme,
      sections, setSections,
      activeTab, setActiveTab, showSettings, setShowSettings,
      profile, setProfile, showProfilePanel, setShowProfilePanel,
      appSettings, setAppSettings, milestones, setMilestones,

      dailySystemTasks, setDailySystemTasks, isLoggedIn, setIsLoggedIn, t,
      dailyRewardClaimed, setDailyRewardClaimed,
      sections, setSections,
      user, isSyncing
    }}>
      <AnimatePresence mode="wait">
        {!isLoggedIn ? (
          <AuthPage key="auth" onLogin={() => setIsLoggedIn(true)} />
        ) : (
          <div className="dashboard-wrapper">
            <AnimatePresence mode="wait">
              {activeTab === 'home' && <HomePage key="home" />}
              {activeTab === 'timeline' && <TimelinePage key="timeline" />}
              {activeTab === 'streaks' && <StreaksPage key="streaks" />}
              {activeTab === 'settings' && <SettingsPage key="settings_page" />}
            </AnimatePresence>

            <AnimatePresence>
              {newUnlock && <UnlockCelebration title={newUnlock} onClose={() => setNewUnlock(null)} />}
            </AnimatePresence>

            <div style={{ position: 'fixed', top: '24px', left: '24px', zIndex: 2000 }}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                style={{
                  background: 'var(--bg-card)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '12px',
                  padding: '12px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'var(--transition)'
                }}
              >
                {isMenuOpen ? <X size={24} strokeWidth={1.5} /> : <MenuIcon size={24} strokeWidth={1.5} />}
              </button>
            </div>

            <AnimatePresence>
              {isMenuOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsMenuOpen(false)}
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      background: 'rgba(0,0,0,0.2)',
                      backdropFilter: 'blur(4px)',
                      zIndex: 1998
                    }}
                  />
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      width: '280px',
                      height: '100%',
                      background: 'var(--bg-main)',
                      borderRight: '1px solid var(--border-glass)',
                      padding: '80px 24px 24px',
                      zIndex: 1999,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      boxShadow: 'var(--shadow-md)'
                    }}
                  >
                    {[
                      { id: 'home', label: 'Home', icon: '📊' },
                      { id: 'timeline', label: 'Tasks', icon: '⏰' },
                      { id: 'streaks', label: 'Stats', icon: '📈' },
                      { id: 'settings', label: 'Setup', icon: '⚙️' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMenuOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '14px 20px',
                          borderRadius: '12px',
                          border: 'none',
                          background: activeTab === item.id ? 'var(--primary)' : 'transparent',
                          color: activeTab === item.id ? 'white' : 'var(--text-primary)',
                          fontWeight: 600,
                          fontSize: '0.95rem',
                          cursor: 'pointer',
                          transition: '0.2s'
                        }}
                      >
                        <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                        <span style={{ fontFamily: "'Alkatra', cursive", fontSize: '1.1rem' }}>{item.label}</span>
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </AnimatePresence>
    </AppContext.Provider>
  );
};

const HomePage = () => {
  const { progress, isCompleted, getBackgroundImage, milestones, dailySystemTasks, tasks, setProfile, profile, streak, dailyRewardClaimed, setDailyRewardClaimed, sections } = useContext(AppContext);
  const [claimingId, setClaimingId] = useState(null);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "GOOD MORNING" : hour < 18 ? "GOOD AFTERNOON" : "GOOD EVENING";
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  const allSystemTasksComplete = milestones.focusPeak && milestones.academicExcellence && milestones.flowMaster;

  const handleClaimReward = () => {
    if (dailyRewardClaimed) return;
    setProfile(prev => ({ ...prev, diamonds: (prev.diamonds || 0) + 100 }));
    setDailyRewardClaimed(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="dashboard-wrapper"
    >
      <div className="left-panel">
        <div className="nature-bg" style={{ backgroundImage: "url('/overview_bg.jpg')" }} />
        <div className="left-content">
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="greeting nosifer-font"
          >
            {greeting}
          </motion.h1>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="quote-container"
          >
            <p className="quote-text">{randomQuote}</p>
          </motion.div>
        </div>
      </div>

      <div className="right-panel">
        <div className="blob blob-1" />
        <div className="blob blob-2" />

        <header style={{ marginBottom: '12px' }}>
          <h2 className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: 800 }}>Performance Hub</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Real-time focus and academic tracking</p>
        </header>

        <section className="card">
          <div className="progress-header">
            <h3>Daily Momentum</h3>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', padding: '4px 12px', background: 'var(--primary-soft)', borderRadius: '100px' }}>
              {isCompleted ? 'Finished' : 'In Progress'}
            </span>
          </div>
          <div className="circle-container">
            <svg width="160" height="160" className="circle-svg">
              <circle cx="80" cy="80" r="70" className="circle-bg" />
              <motion.circle
                cx="80" cy="80" r="70"
                className="circle-progress"
                strokeDasharray="440"
                strokeDashoffset={440 - (progress / 100) * 440}
                initial={{ strokeDashoffset: 440 }}
                animate={{ strokeDashoffset: 440 - (progress / 100) * 440 }}
              />
            </svg>
            <div className="percentage">{progress}%</div>
          </div>
        </section>

        <section className="card">
          <div className="progress-header" style={{ marginBottom: '16px' }}>
            <h3>Elite Milestones</h3>
          </div>
          <div className="achievement-list">
            {sections.map(section => {
              const sectionTasks = tasks.filter(t => t.sectionId === section.id);
              const completedCount = sectionTasks.filter(t => t.completed).length;
              const totalCount = sectionTasks.length;
              const isSectionComplete = totalCount > 0 && completedCount === totalCount;
              const isClaimed = profile.claimedRoutines?.includes(section.id);

              let statusText = "Not Started";
              if (completedCount > 0) {
                statusText = isSectionComplete ? "Completed" : "In Progress";
              }

              return (
                <div key={section.id} className="achievement-row" style={{
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  gap: '8px',
                  opacity: isSectionComplete ? 1 : 0.7
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="icon-box">
                      {typeof section.icon === 'string' ? section.icon : React.cloneElement(section.icon, { size: 18, strokeWidth: 1.5 })}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p className="label-text" style={{ marginBottom: '2px' }}>{section.title}</p>
                      <p style={{ fontSize: '0.7rem', color: isSectionComplete ? 'var(--accent-green)' : 'var(--text-muted)', fontWeight: 700 }}>
                        {statusText} ({completedCount}/{totalCount})
                      </p>
                    </div>
                    {isSectionComplete && !isClaimed && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setClaimingId(section.id);
                          setTimeout(() => {
                            setProfile(prev => ({
                              ...prev,
                              diamonds: (prev.diamonds || 0) + 50,
                              claimedRoutines: [...(prev.claimedRoutines || []), section.id]
                            }));
                            setClaimingId(null);
                          }, 1000);
                          playCompletionSound();
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: 'var(--primary)',
                          color: 'white',
                          border: 'none',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          position: 'relative'
                        }}
                      >
                        {claimingId === section.id ? (
                          <motion.span
                            initial={{ y: 0, opacity: 1 }}
                            animate={{ y: -20, opacity: 0 }}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', textAlign: 'center' }}
                          >
                            +50 💎
                          </motion.span>
                        ) : 'CLAIM 50 💎'}
                      </motion.button>
                    )}
                    {isClaimed && (
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        CLAIMED <CheckCircle2 size={12} strokeWidth={1.5} />
                      </span>
                    )}
                  </div>
                  <div style={{ height: '4px', background: 'var(--bg-main)', borderRadius: '2px', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                      style={{ height: '100%', background: isSectionComplete ? 'var(--accent-green)' : 'var(--primary)' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {allSystemTasksComplete && !dailyRewardClaimed && (
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClaimReward}
              style={{
                width: '100%', marginTop: '20px', padding: '16px', borderRadius: '16px',
                background: 'linear-gradient(135deg, #F59E0B, #FDBA74)',
                border: 'none', color: 'white', fontWeight: 800, fontSize: '1rem',
                boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              <Sparkles size={20} /> CLAIM REWARD (+100 💎)
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              width: '100%', marginTop: '12px', padding: '16px', borderRadius: '12px', border: 'none',
              background: 'var(--primary)',
              color: 'white', fontWeight: 700, fontSize: '0.9rem',
              cursor: 'pointer', boxShadow: '0 8px 20px rgba(79, 70, 229, 0.2)',
              opacity: isCompleted ? 1 : 0.6,
            }}
          >
            {isCompleted ? "CLAIM DAILY REWARD" : "COMPLETE TASKS TO UNLOCK"}
          </motion.button>
        </section>
      </div>
    </motion.div>
  );
};

const AchievementRow = ({ icon, label, active }) => (
  <div className="achievement-row" style={{ opacity: active ? 1 : 0.4 }}>
    <div className="icon-box">{icon}</div>
    <span className="label-text">{label}</span>
    {active && <CheckCircle2 size={16} style={{ marginLeft: 'auto', color: 'var(--accent-green)' }} />}
  </div>
);

const TimelinePage = () => {
  const { tasks, toggleTask, deleteTask, addTask, theme, sections, setSections, setTasks } = useContext(AppContext);
  const [addingToSection, setAddingToSection] = useState(null);
  const [inlineTaskTitle, setInlineTaskTitle] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Editing State
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [tempTitle, setTempTitle] = useState("");

  const handleAddInline = (sectionId) => {
    if (!inlineTaskTitle.trim()) {
      setAddingToSection(null);
      return;
    }
    addTask(inlineTaskTitle, sectionId);
    setInlineTaskTitle('');
    setAddingToSection(null);
  };

  const startEditing = (section) => {
    setEditingSectionId(section.id);
    setTempTitle(section.title);
  };

  const saveSectionTitle = (id) => {
    if (tempTitle.trim()) {
      setSections(sections.map(s => s.id === id ? { ...s, title: tempTitle } : s));
    }
    setEditingSectionId(null);
  };

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <div className="right-panel routine-page" style={{ flex: '0 0 100%', padding: '60px', overflowY: 'auto' }}>
      {theme === 'light' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', minHeight: '100vh',
          backgroundImage: "url('/butterfly_garden.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          filter: 'none',
          mixBlendMode: 'normal',
          opacity: 1,
          zIndex: -1,
          pointerEvents: 'none'
        }} />
      )}
      {theme === 'dark' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', minHeight: '100vh',
          backgroundImage: "url('/starry_clouds.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          mixBlendMode: 'normal',
          opacity: 0.7,
          filter: 'brightness(1.15) contrast(1.1) saturate(1.2)',
          zIndex: -1,
          pointerEvents: 'none'
        }} />
      )}
      <header style={{ marginBottom: '40px' }}>
        <h2 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 900 }}>Daily Protocol</h2>
        <p style={{ color: 'var(--text-muted)' }}>Precision mapping of your active timeline.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px', alignItems: 'flex-start' }}>
        {sections.map(section => (
          <div key={section.id} className="settings-card" style={{ padding: '32px' }}>
            <header style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <span style={{ fontSize: '1.5rem' }}>{section.icon}</span>
                  {editingSectionId === section.id ? (
                    <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                      <input
                        autoFocus
                        value={tempTitle}
                        onChange={(e) => setTempTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveSectionTitle(section.id)}
                        style={{ fontSize: '1.4rem', fontWeight: 900, padding: '4px', width: '100%', borderRadius: '8px', border: '1px solid var(--primary)', outline: 'none' }}
                      />
                      <button onClick={() => saveSectionTitle(section.id)} style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}>✓</button>
                      <button onClick={() => setEditingSectionId(null)} style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}>✕</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{
                        fontSize: '1.4rem',
                        fontWeight: 900,
                        background: 'linear-gradient(to right, #ec4899, #a855f7)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '4px', // Adjust spacing if needed
                        margin: 0,
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}>
                        {section.title}
                      </h3>
                      <button
                        onClick={() => startEditing(section)}
                        className="edit-btn-hover"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.3, transition: '0.2s', padding: '4px' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                      </button>
                    </div>
                  )}
                </div>
                {!editingSectionId && (
                  <button
                    className="add-task-subtle"
                    style={{ width: 'auto', padding: '8px 16px' }}
                    onClick={() => setAddingToSection(section.id)}
                  >
                    <Plus size={16} style={{ marginRight: '6px' }} />
                    Add Task
                  </button>
                )}
              </div>
              <div style={{ height: '1px', background: 'var(--border-glass)', width: '100%', opacity: 0.5 }} />
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tasks.filter(t => t.sectionId === section.id).map(task => (
                <div key={task.id} className="achievement-row" style={{
                  padding: '16px',
                  background: task.completed ? 'var(--primary-soft)' : 'var(--bg-card)',
                  border: '1px solid var(--border-global)',
                  borderRadius: '16px',
                  gap: '16px',
                  transition: 'transform 0.2s ease'
                }}>
                  <span style={{ fontSize: '1.6rem' }}>{task.icon || '📌'}</span>
                  {editingSectionId === section.id ? (
                    // While editing section title, tasks are read-only (or could be editable too, but requirement said 'on clicking edit... tasks should be editable'. 
                    // Let's make them renameable here or just keep current "Rename" feature if it existed, or add it.
                    // Current implementation didn't have task renaming. I'll add simple prompt rename for now to satisfy "tasks... editable (rename)"
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, pointerEvents: 'none', opacity: 0.6 }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{task.title}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{task.time || 'Routine Task'}</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <span style={{
                        fontWeight: 900,
                        fontSize: '1rem',
                        background: task.completed ? 'none' : 'linear-gradient(135deg, #F472B6, #A855F7)',
                        WebkitBackgroundClip: task.completed ? 'initial' : 'text',
                        WebkitTextFillColor: task.completed ? 'var(--text-muted)' : 'transparent',
                        color: task.completed ? 'var(--text-muted)' : 'transparent',
                        letterSpacing: '0.2px'
                      }}>
                        {task.title}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {task.time || 'Routine Task'}
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      onClick={() => {
                        const newTitle = prompt("Rename task:", task.title);
                        if (newTitle && newTitle.trim()) {
                          setTasks(tasks.map(t => t.id === task.id ? { ...t, title: newTitle.trim() } : t));
                          setSuccessMessage('Task updated successfully');
                        }
                      }}
                      style={{ background: 'none', border: 'none', color: theme === 'dark' ? '#22D3EE' : '#a855f7', cursor: 'pointer', display: 'flex' }}
                    >
                      <Edit2 size={18} strokeWidth={theme === 'dark' ? 2.5 : 1.5} />
                    </button>
                    <button onClick={() => toggleTask(task.id)} style={{ background: 'none', border: 'none', color: task.completed ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                      {task.completed ? <CheckCircle2 size={24} strokeWidth={1.5} /> : <Circle size={24} strokeWidth={1.5} />}
                    </button>
                    <button onClick={() => deleteTask(task.id)} style={{ background: 'none', border: 'none', color: '#FDA4AF', cursor: 'pointer', display: 'flex' }}>
                      <Trash2 size={18} strokeWidth={theme === 'dark' ? 2.5 : 1.5} />
                    </button>
                  </div>
                </div>
              ))}

              {addingToSection === section.id && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-input-container"
                  style={{ marginTop: '8px' }}
                >
                  <input
                    autoFocus
                    className="inline-input"
                    style={{ padding: '12px' }}
                    placeholder="Describe new phase..."
                    value={inlineTaskTitle}
                    onChange={(e) => setInlineTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddInline(section.id)}
                    onBlur={() => handleAddInline(section.id)}
                  />
                </motion.div>
              )}
            </div>
          </div>
        ))}
      </div>
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            style={{
              position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)',
              background: 'var(--primary)', color: 'white', padding: '12px 24px',
              borderRadius: '100px', fontWeight: 700, boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
              zIndex: 1000, pointerEvents: 'none'
            }}
          >
            ✨ {successMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


const StreaksPage = () => {
  const { streak, profile, theme } = useContext(AppContext);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)));

  return (
    <div className="right-panel" style={{ flex: '0 0 100%', padding: '60px', overflowY: 'auto' }}>
      {theme === 'light' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', minHeight: '100vh',
          backgroundImage: "url('/butterfly_garden.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          filter: 'none',
          mixBlendMode: 'normal',
          opacity: 1,
          zIndex: -1,
          pointerEvents: 'none'
        }} />
      )}
      {theme === 'dark' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', minHeight: '100vh',
          backgroundImage: "url('/starry_clouds.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          mixBlendMode: 'normal',
          opacity: 0.7,
          filter: 'brightness(1.15) contrast(1.1) saturate(1.2)',
          zIndex: -1,
          pointerEvents: 'none'
        }} />
      )}
      <header style={{ marginBottom: '40px' }}>
        <h2 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 900 }}>Performance Metrics</h2>
        <p style={{ color: 'var(--text-muted)' }}>Historical consistency and peak performance data.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
        <div>
          <div className="streak-hero" style={{ padding: '40px', background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-glass)' }}>
            <div className="streak-count-large">
              <span className="gradient-text-alt">{streak}</span>
              <span className="fire-icon-glow">🔥</span>
            </div>
            <p className="motivational-sub gradient-text">Current Protocol Streak</p>
            <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ padding: '16px', background: 'var(--bg-main)', borderRadius: '16px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Best Streak</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 900 }}>{profile.bestStreak}d</p>
              </div>
              <div style={{ padding: '16px', background: 'var(--bg-main)', borderRadius: '16px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Total Days</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 900 }}>{profile.totalUsageDays}d</p>
              </div>
            </div>
          </div>

          <div className="calendar-card" style={{ marginTop: '32px' }}>
            <div className="calendar-header">
              <h3 className="month-label">
                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={prevMonth} className="nav-btn" style={{ padding: '8px' }}><ChevronLeft size={16} strokeWidth={1.5} /></button>
                <button onClick={nextMonth} className="nav-btn" style={{ padding: '8px' }}><ChevronRight size={16} strokeWidth={1.5} /></button>
              </div>
            </div>
            <div className="calendar-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="calendar-day-label">{d}</div>
              ))}
              {Array.from({ length: 30 }).map((_, i) => {
                const day = i + 1;
                const isCompleted = day <= streak;
                const isToday = day === new Date().getDate();
                return (
                  <div
                    key={i}
                    className={`calendar-day ${isCompleted ? 'completed streak' : ''} ${isToday ? 'today' : ''}`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div className="settings-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '20px' }}>PROTOCOL STATS</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <StatItem label="Academic Tasks Done" value={profile.academicTasks} icon="🎓" />
              <StatItem label="Focus Minutes" value={profile.focusMinutesToday} icon="⏱️" />
              <StatItem label="Days in Protocol" value={profile.totalUsageDays} icon="📅" />
              <StatItem label="Total Diamonds" value={profile.diamonds || 0} icon="💎" />
            </div>
          </div>

          <div style={{ padding: '24px', background: 'linear-gradient(to bottom right, var(--primary), #818CF8)', borderRadius: '24px', color: 'white' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '12px' }}>AI INSIGHT</h3>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.6, opacity: 0.9 }}>
              "Your focus peak is usually between 9 AM and 11 AM. Maintaining this streak for 3 more days will unlock the 'Consistency Pro' title."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatItem = ({ label, value, icon }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <span style={{ fontSize: '1.2rem' }}>{icon}</span>
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</p>
      <p style={{ fontSize: '1rem', fontWeight: 800 }}>{value}</p>
    </div>
  </div>
);



const SettingsPage = () => {
  const { appSettings, setAppSettings, profile, setProfile, theme, setTheme, streak, milestones, tasks, setTasks, resetRoutine, setIsLoggedIn, t } = useContext(AppContext);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(profile.name);
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setProfile(prev => ({ ...prev, avatar: evt.target.result }));
      setSuccessMessage("Profile updated");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveName = () => {
    if (!tempName.trim()) return;
    setProfile(prev => ({ ...prev, name: tempName.trim() }));
    setIsEditingName(false);
    setSuccessMessage("Profile updated");
  };

  const updateSettings = (newSettings) => {
    setAppSettings(newSettings);
    setSuccessMessage("Setting updated successfully");
  };

  const handleBackup = () => {
    const data = { profile, appSettings, tasks, streak, milestones };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `todo_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };

  const handleRestore = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        if (data.profile) setProfile(data.profile);
        if (data.appSettings) setAppSettings(data.appSettings);
        // ... restore others if needed, for now just profile/settings for safety
        alert("Settings restored successfully!");
      } catch (err) {
        alert("Invalid backup file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="right-panel" style={{ flex: '0 0 100%', padding: '60px', overflowY: 'auto' }}>
      <header style={{ marginBottom: '40px' }}>
        <h2 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 900 }}>{t('systemConfig')}</h2>
        <p style={{ color: 'var(--text-muted)' }}>{t('systemSub')}</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>

        <SectionGroup title={t('account')} icon={<Fingerprint size={20} strokeWidth={1.5} />}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
            <div
              className="avatar-large"
              onClick={() => fileInputRef.current?.click()}
              style={{
                fontSize: '3rem', width: '80px', height: '80px', cursor: 'pointer',
                overflow: 'hidden', position: 'relative', background: 'var(--primary-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              {profile.avatar?.startsWith('data:image') || profile.avatar?.startsWith('blob') ? (
                <img src={profile.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                profile.avatar || '👤'
              )}
              <div style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '0.6rem', padding: '2px 0', textAlign: 'center' }}>
                <Camera size={10} /> EDIT
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              hidden
              accept="image/*"
              onChange={handleImageUpload}
            />
            <div style={{ flex: 1 }}>
              {isEditingName ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    autoFocus
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={handleSaveName}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    style={{
                      fontSize: '1.1rem', fontWeight: 800, width: '100%', padding: '4px 8px',
                      borderRadius: '8px', border: '1px solid var(--primary)', outline: 'none'
                    }}
                  />
                </div>
              ) : (
                <p
                  onClick={() => setIsEditingName(true)}
                  style={{ fontSize: '1.2rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {profile.name} <Plus size={14} style={{ opacity: 0.3 }} />
                </p>
              )}
              <p style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('level')} {Math.floor(profile.totalUsageDays / 5) + 1} {t('agent')}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1, padding: '12px', background: 'var(--bg-main)', borderRadius: '12px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>{t('diamonds')}</p>
              <p style={{ fontSize: '1.2rem', fontWeight: 900 }}>💎 {profile.diamonds || 0}</p>
            </div>
            <div style={{ flex: 1, padding: '12px', background: 'var(--bg-main)', borderRadius: '12px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>{t('streak')}</p>
              <p style={{ fontSize: '1.2rem', fontWeight: 900 }}>🔥 {streak}d</p>
            </div>
          </div>
        </SectionGroup>

        <SectionGroup title={t('appearance')} icon={<Palette size={20} strokeWidth={1.5} />}>
          <div style={{ padding: '0 24px 16px' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px' }}>{t('systemTheme')}</p>
            <div style={{ display: 'flex', background: 'var(--bg-main)', borderRadius: '12px', padding: '4px', gap: '4px' }}>
              <button
                onClick={() => setTheme('light')}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                  background: theme === 'light' ? 'white' : 'transparent',
                  boxShadow: theme === 'light' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                  fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                <Sun size={16} /> {t('light')}
              </button>
              <button
                onClick={() => setTheme('dark')}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                  background: theme === 'dark' ? '#1E293B' : 'transparent',
                  color: theme === 'dark' ? 'white' : 'inherit',
                  boxShadow: theme === 'dark' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                  fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                <Moon size={16} /> {t('dark')}
              </button>
            </div>
          </div>
          <div style={{ padding: '0 24px 20px' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px' }}>{t('accent')}</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              {['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899'].map(color => (
                <button
                  key={color}
                  onClick={() => updateSettings({ ...appSettings, accentColor: color })}
                  style={{
                    width: '32px', height: '32px', borderRadius: '50%', background: color,
                    border: appSettings.accentColor === color ? '3px solid white' : 'none',
                    boxShadow: appSettings.accentColor === color ? `0 0 0 2px ${color}` : 'none',
                    cursor: 'pointer', transition: '0.2s'
                  }}
                />
              ))}
            </div>
          </div>
        </SectionGroup>

        <SectionGroup title={t('notifications')} icon={<Bell size={20} strokeWidth={1.5} />}>
          <SettingToggle
            label={t('dailyReminders')}
            sub="Get notified to start your routine"
            value={appSettings.notifications?.dailyReminderEnabled}
            onChange={(val) => updateSettings({ ...appSettings, notifications: { ...appSettings.notifications, dailyReminderEnabled: val } })}
          />
          {appSettings.notifications?.dailyReminderEnabled && (
            <div style={{ padding: '0 12px 12px' }}>
              <input
                type="time"
                value={appSettings.notifications?.dailyReminderTime}
                onChange={(e) => updateSettings({ ...appSettings, notifications: { ...appSettings.notifications, dailyReminderTime: e.target.value } })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-glass)', outline: 'none' }}
              />
            </div>
          )}
          <SettingToggle
            label={t('streakWarnings')}
            sub="Alerts before you lose your streak"
            value={appSettings.notifications?.streakReminderEnabled}
            onChange={(val) => updateSettings({ ...appSettings, notifications: { ...appSettings.notifications, streakReminderEnabled: val } })}
          />
        </SectionGroup>

        <SectionGroup title={t('appPrefs')} icon={<Settings size={20} strokeWidth={1.5} />}>
          <div style={{ padding: '12px' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>{t('interfaceLang')}</p>
            <select
              value={appSettings.language}
              onChange={(e) => updateSettings({ ...appSettings, language: e.target.value })}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-glass)', background: 'var(--bg-main)', outline: 'none', color: 'var(--text-primary)' }}
            >
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
              <option>German</option>
            </select>
          </div>
          <SettingToggle
            label={t('soundVib')}
            sub="Feedback on task completion"
            value={appSettings.soundVibration}
            onChange={(val) => updateSettings({ ...appSettings, soundVibration: val })}
          />
          <SettingToggle
            label={t('rewardAnim')}
            sub="Show celebrations on milestones"
            value={appSettings.rewardAnimations}
            onChange={(val) => updateSettings({ ...appSettings, rewardAnimations: val })}
          />
        </SectionGroup>

        <SectionGroup title={t('prodRules')} icon={<Target size={20} strokeWidth={1.5} />}>
          <SettingToggle
            label={t('streakTrack')}
            sub="Enable/disable the streak system"
            value={appSettings.streakTracking}
            onChange={(val) => updateSettings({ ...appSettings, streakTracking: val })}
          />
          <div style={{ padding: '12px' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>{t('dailyGoal')}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="range" min="1" max="20"
                value={appSettings.dailyTaskLimit}
                onChange={(e) => updateSettings({ ...appSettings, dailyTaskLimit: parseInt(e.target.value) })}
                style={{ flex: 1 }}
              />
              <span style={{ fontWeight: 800, minWidth: '30px' }}>{appSettings.dailyTaskLimit}</span>
            </div>
          </div>
          <button
            onClick={() => setShowConfirmReset(true)}
            className="add-task-subtle"
            style={{ margin: '12px', background: '#FFF1F2', color: '#E11D48', border: '1px solid #FECDD3', fontWeight: 700 }}
          >
            {t('resetDay')}
          </button>
        </SectionGroup>




        <SectionGroup title={t('support')} icon={<HelpCircle size={20} strokeWidth={1.5} />}>
          <div style={{ padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('version')}</span>
              <span style={{ fontWeight: 700 }}>2.4.0-PRO</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="link-btn"><MessageSquare size={14} strokeWidth={1.5} /> {t('sendFeed')}</button>
              <button className="link-btn"><ShieldCheck size={14} strokeWidth={1.5} /> {t('privacy')}</button>
            </div>
          </div>
        </SectionGroup>

      </div>

      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            style={{
              position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)',
              background: 'var(--primary)', color: 'white', padding: '12px 24px',
              borderRadius: '100px', fontWeight: 700, boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
              zIndex: 1000, pointerEvents: 'none'
            }}
          >
            ✨ {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfirmReset && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              style={{ background: 'white', padding: '32px', borderRadius: '24px', maxWidth: '400px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}
            >
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '12px' }}>Initialize Reset?</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>This will uncheck all tasks and reset your daily progress counters. This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setShowConfirmReset(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid var(--border-glass)', background: 'none', fontWeight: 700, cursor: 'pointer' }}>CANCEL</button>
                <button
                  onClick={() => { resetRoutine(); setShowConfirmReset(false); }}
                  style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#E11D48', color: 'white', fontWeight: 700, cursor: 'pointer' }}
                >
                  CONFIRM RESET
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SectionGroup = ({ title, icon, children }) => (
  <div className="settings-card" style={{ padding: '0', overflow: 'hidden' }}>
    <header style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.2)' }}>
      <div className="icon-box" style={{ width: '36px', height: '36px', background: 'var(--primary-soft)', color: 'var(--primary)' }}>
        {typeof icon === 'string' ? icon : React.cloneElement(icon, { strokeWidth: 1.5, size: 20 })}
      </div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h3>
    </header>
    <div style={{ padding: '12px 0' }}>{children}</div>
  </div>
);

const SettingToggle = ({ label, sub, value, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px' }}>
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{label}</p>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{sub}</p>
    </div>
    <div
      onClick={() => onChange(!value)}
      style={{
        width: '48px', height: '26px', background: value ? 'var(--primary)' : '#E2E8F0',
        borderRadius: '100px', cursor: 'pointer', position: 'relative', transition: 'all 0.3s ease'
      }}
    >
      <motion.div
        animate={{ x: value ? 24 : 4 }}
        style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
      />
    </div>
  </div>
);

const MenuPage = () => {
  return (
    <div className="right-panel" style={{ flex: '0 0 100%', alignItems: 'center', justifyContent: 'center' }}>
      <h2 className="gradient-text">Profile Managed via Sidebar</h2>
      <p style={{ color: 'var(--text-muted)' }}>Click your avatar in the top left to manage your identity.</p>
    </div>
  );
};

const ProfilePanel = ({ onClose }) => {
  const { profile, setProfile, unlockedTitles, activeTitle, rewards, streak, milestones, setIsLoggedIn } = useContext(AppContext);
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(profile.name);

  const avatars = ['👤', '🦸', '🥷', '🧑‍🚀', '🧙', '🧟'];

  const handleSave = () => {
    setProfile({ ...profile, name: tempName });
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ x: '-100%' }}
      animate={{ x: 0 }}
      exit={{ x: '-100%' }}
      className="settings-panel"
      style={{ left: 0, right: 'auto', borderRight: '1px solid var(--border-glass)', borderLeft: 'none' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Identity Profile</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
          <X size={24} strokeWidth={1.5} />
        </button>
      </div>

      <div className="scroll-container-fixed">
        <div style={{ textAlign: 'center', marginBottom: '32px', position: 'relative' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <div className="avatar-large" style={{ fontSize: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {profile.avatar || '👤'}
            </div>
            <div className="edit-overlay" onClick={() => {
              const nextIdx = (avatars.indexOf(profile.avatar || '👤') + 1) % avatars.length;
              setProfile({ ...profile, avatar: avatars[nextIdx] });
            }}>
              <Sparkles size={14} strokeWidth={1.5} />
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            {isEditing ? (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <input
                  autoFocus
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  style={{ padding: '4px 12px', borderRadius: '8px', border: '1px solid var(--primary)', outline: 'none', textAlign: 'center' }}
                />
                <button onClick={handleSave} style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', padding: '4px 12px', cursor: 'pointer' }}>✓</button>
              </div>
            ) : (
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {profile.name}
                <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Plus size={16} /></button>
              </h3>
            )}
            <p style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{activeTitle}</p>
          </div>
        </div>

        <div className="achievement-grid" style={{ marginBottom: '32px' }}>
          <div className={`achievement-card ${streak >= 3 ? 'milestone-glow' : 'achievement-locked'}`}>
            <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🥉</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800 }}>BRONZE</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>3 DAY STREAK</div>
          </div>
          <div className={`achievement-card ${streak >= 7 ? 'milestone-glow' : 'achievement-locked'}`}>
            <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🥈</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800 }}>SILVER</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>7 DAY STREAK</div>
          </div>
          <div className={`achievement-card ${streak >= 14 ? 'milestone-glow' : 'achievement-locked'}`}>
            <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🥇</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800 }}>GOLD</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>14 DAY STREAK</div>
          </div>
          <div className={`achievement-card ${streak >= 30 ? 'milestone-glow' : 'achievement-locked'}`}>
            <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>💎</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800 }}>ELITE</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>30 DAY STREAK</div>
          </div>
          <div className={`achievement-card ${milestones.focusPeak ? 'milestone-glow' : 'achievement-locked'}`}>
            <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🏔️</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800 }}>FOCUS PEAK</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>5 TASKS / DAY</div>
          </div>
          <div className={`achievement-card ${milestones.academicExcellence ? 'milestone-glow' : 'achievement-locked'}`}>
            <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🎓</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800 }}>ACADEMIC</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>5 STUDY TASKS</div>
          </div>
        </div>

        <button
          onClick={async () => {
            try {
              await signOut(auth);
            } catch (error) {
              console.error("Logout Error:", error);
            }
          }}
          style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #FDA4AF', color: '#EF4444', background: 'transparent', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <LogOut size={18} strokeWidth={1.5} /> TERMINATE SESSION
        </button>
      </div>
    </motion.div>
  );
};

const UnlockCelebration = ({ title, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(255, 255, 255, 0.4)', zIndex: 5000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)'
    }}
  >
    <motion.div
      initial={{ scale: 0.8, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      className="card"
      style={{ textAlign: 'center', padding: '48px', maxWidth: '400px' }}
    >
      <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎉</div>
      <h2 className="gradient-text" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Title Unlocked!</h2>
      <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '32px' }}>{title}</p>

      <button
        onClick={onClose}
        style={{
          width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
          background: 'var(--primary)', color: 'white', fontWeight: 700, cursor: 'pointer'
        }}
      >
        GO TO PROFILE
      </button>
    </motion.div>
  </motion.div>
);

const SettingsPanel = ({ onClose }) => {
  const { theme, setTheme, appSettings, setAppSettings, setIsLoggedIn, resetRoutine, t } = useContext(AppContext);

  const colors = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="settings-panel"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>System Settings</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
          <X size={24} strokeWidth={1.5} />
        </button>
      </div>

      <div className="scroll-container-fixed">
        <section style={{ marginBottom: '32px' }}>
          <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 800 }}>{t('appearance')}</h4>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <button
              onClick={() => setTheme('light')}
              style={{ flex: 1, padding: '12px', borderRadius: '12px', border: theme === 'light' ? '2px solid var(--primary)' : '1px solid var(--border-glass)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600 }}
            >
              <Sun size={16} /> {t('light')}
            </button>
            <button
              onClick={() => setTheme('dark')}
              style={{ flex: 1, padding: '12px', borderRadius: '12px', border: theme === 'dark' ? '2px solid var(--primary)' : '1px solid var(--border-glass)', background: '#1F2937', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600 }}
            >
              <Moon size={16} /> {t('dark')}
            </button>
          </div>

          <p style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '12px' }}>{t('accent')}</p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {colors.map(color => (
              <button
                key={color}
                onClick={() => setAppSettings({ ...appSettings, accentColor: color })}
                style={{ width: '36px', height: '36px', borderRadius: '50%', background: color, border: appSettings.accentColor === color ? '3px solid white' : 'none', cursor: 'pointer', boxShadow: appSettings.accentColor === color ? '0 0 10px' + color : 'none' }}
              />
            ))}
          </div>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 800 }}>Account & Sync</h4>
          <div style={{ padding: '16px', background: 'var(--bg-main)', borderRadius: '16px', border: '1px solid var(--border-glass)' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>{user?.email || 'Anonymous Agent'}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', background: isSyncing ? '#F59E0B' : '#10B981', borderRadius: '50%', boxShadow: isSyncing ? '0 0 8px #F59E0B' : 'none' }} />
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {isSyncing ? 'Syncing...' : 'All data synced'}
              </p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 800 }}>{t('dataManagement')}</h4>
          <button
            onClick={resetRoutine}
            style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-glass)', background: 'white', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontWeight: 600 }}
          >
            <RotateCcw size={18} /> {t('reinitializeProtocol')}
          </button>
        </section>

        <button
          onClick={async () => { try { await signOut(auth); } catch (e) { } }}
          style={{ width: '100%', padding: '18px', background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '16px', fontWeight: 800, marginBottom: '60px', cursor: 'pointer' }}
        >
          {t('logout')}
        </button>
      </div>
    </motion.div>
  );
};

const AuthPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLogin();
    } catch (err) {
      console.error("Authentication Error Details:", err);
      setError(err.message.replace('Firebase: ', ''));
    }
    setLoading(false);
  };

  return (
    <div className="auth-container" style={{
      height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)', position: 'fixed', top: 0, left: 0, zIndex: 9999
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card"
        style={{ width: '100%', maxWidth: '400px', padding: '48px', textAlign: 'center' }}
      >
        <div style={{ width: '64px', height: '64px', background: 'var(--primary)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'white' }}>
          <Zap size={32} />
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '8px' }}>Elite Protocol</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>{isSignUp ? 'Create Agent Profile' : 'Authentication Required'}</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && <p style={{ color: '#EF4444', fontSize: '0.8rem', fontWeight: 700 }}>{error}</p>}
          <input
            type="email"
            placeholder="Agent Identifier (Email)"
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Security Token (Password)"
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
              background: 'var(--primary)', color: 'white', fontWeight: 700, fontSize: '1rem',
              cursor: 'pointer', marginTop: '16px', boxShadow: '0 10px 20px rgba(79, 70, 229, 0.2)',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'PROCESSING...' : (isSignUp ? 'REGISTER AGENT' : 'INITIALIZE SESSION')}
          </button>
          <p
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', marginTop: '8px' }}
          >
            {isSignUp ? 'Already have an identifier? Log in' : 'Need a new identifier? Register here'}
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default App;





