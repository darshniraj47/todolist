import React, { useState, useEffect, createContext, useContext } from 'react';
import { Home, Clock, Flame, Menu as MenuIcon, CheckCircle2, Circle, Sun, Moon, Volume2, VolumeX, Sparkles, BookOpen, Settings, X, RotateCcw, LogOut, Zap, Target, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { initialRoutine, quotes } from './data/routine';
import './App.css';

// Context for global state
const AppContext = createContext();

const App = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [showSettings, setShowSettings] = useState(false);
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('tasks');
    return saved ? JSON.parse(saved) : initialRoutine;
  });
  const [streak, setStreak] = useState(() => {
    const saved = localStorage.getItem('streak');
    return saved ? Number(saved) : 0;
  });
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [unlockedTitles, setUnlockedTitles] = useState(() => {
    const saved = localStorage.getItem('unlockedTitles');
    return saved ? JSON.parse(saved) : ["Getting Started 🌱"];
  });
  const [newUnlock, setNewUnlock] = useState(null);

  const rewards = [
    { streak: 1, title: "Getting Started 🌱", icon: "🌱" },
    { streak: 5, title: "Consistent 💪", icon: "💪" },
    { streak: 10, title: "Focused Mind 🧠", icon: "🧠" },
    { streak: 30, title: "Discipline Master 👑", icon: "👑" },
  ];

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('streak', streak.toString());
    localStorage.setItem('unlockedTitles', JSON.stringify(unlockedTitles));
  }, [tasks, streak, unlockedTitles]);

  const activeTitle = rewards.slice().reverse().find(r => unlockedTitles.includes(r.title))?.title || "Novice User";

  const toggleTask = (id) => {
    const newTasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(newTasks);

    // If all tasks just became completed, check streak/milestones
    const wasAllDone = tasks.every(t => t.completed);
    const isAllDoneNow = newTasks.every(t => t.completed);

    if (!wasAllDone && isAllDoneNow) {
      const newStreak = streak + 1;
      setStreak(newStreak);

      const milestone = rewards.find(r => r.streak === newStreak);
      if (milestone && !unlockedTitles.includes(milestone.title)) {
        setUnlockedTitles([...unlockedTitles, milestone.title]);
        setNewUnlock(milestone.title);
      }
    }
  };

  const addTask = (title) => {
    if (!title.trim()) return;
    const newTask = {
      id: Date.now(),
      title,
      time: "Dynamic",
      icon: "📌",
      completed: false
    };
    setTasks([...tasks, newTask]);
  };

  const progress = Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100);
  const isCompleted = progress === 100;

  const resetRoutine = () => {
    setTasks(initialRoutine.map(t => ({ ...t, completed: false })));
    setShowSettings(false);
  };

  return (
    <AppContext.Provider value={{ tasks, setTasks, streak, setStreak, voiceEnabled, setVoiceEnabled, toggleTask, addTask, progress, isCompleted, resetRoutine, unlockedTitles, activeTitle, rewards }}>
      <div className="dashboard-wrapper">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && <HomePage key="home" />}
          {activeTab === 'timeline' && <TimelinePage key="timeline" />}
          {activeTab === 'streaks' && <StreaksPage key="streaks" />}
          {activeTab === 'menu' && <MenuPage key="menu" />}
        </AnimatePresence>

        <AnimatePresence>
          {newUnlock && <UnlockCelebration title={newUnlock} onClose={() => setNewUnlock(null)} />}
        </AnimatePresence>

        <AnimatePresence>
          {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
        </AnimatePresence>

        <button
          className="settings-toggle"
          onClick={() => setShowSettings(true)}
          style={{
            position: 'absolute', top: '40px', right: '40px', zIndex: 100,
            background: 'white', border: '1px solid var(--border-glass)',
            color: 'var(--text-primary)', width: '48px', height: '48px', borderRadius: '14px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <Settings size={20} />
        </button>

        <nav className="nav-bar">
          <div className="nav-pill">
            <button onClick={() => setActiveTab('home')} className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`}>
              <Home size={18} />
              <span>Overview</span>
            </button>
            <button onClick={() => setActiveTab('timeline')} className={`nav-btn ${activeTab === 'timeline' ? 'active' : ''}`}>
              <Clock size={18} />
              <span>Routine</span>
            </button>
            <button onClick={() => setActiveTab('streaks')} className={`nav-btn ${activeTab === 'streaks' ? 'active' : ''}`}>
              <Zap size={18} />
              <span>Metrics</span>
            </button>
            <button onClick={() => setActiveTab('menu')} className={`nav-btn ${activeTab === 'menu' ? 'active' : ''}`}>
              <Sparkles size={18} />
              <span>Profile</span>
            </button>
          </div>
        </nav>
      </div>
    </AppContext.Provider>
  );
};

const HomePage = () => {
  const { progress, isCompleted } = useContext(AppContext);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="dashboard-wrapper"
    >
      <div className="left-panel">
        <div className="nature-bg" />
        <div className="left-content">
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="greeting"
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
            <AchievementRow icon={<Target size={18} />} label="Daily Focus Peak" active={true} />
            <AchievementRow icon={<Award size={18} />} label="Academic Excellence" active={progress >= 50} />
            <AchievementRow icon={<Zap size={18} />} label="Flow State Master" active={isCompleted} />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              width: '100%', marginTop: '32px', padding: '16px', borderRadius: '12px', border: 'none',
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
  const { tasks, toggleTask, addTask } = useContext(AppContext);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    addTask(newTaskTitle);
    setNewTaskTitle('');
  };

  return (
    <div className="right-panel" style={{ flex: '0 0 100%', padding: '80px', overflowY: 'auto' }}>
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 800 }}>Daily Protocol</h2>
          <p style={{ color: 'var(--text-muted)' }}>High-density academic schedule</p>
        </div>

        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            placeholder="New academic task..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            style={{
              padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--border-glass)',
              background: 'white', fontSize: '0.9rem', width: '250px', outline: 'none',
              boxShadow: 'var(--shadow-sm)', cursor: 'text'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '12px 24px', borderRadius: '12px', border: 'none',
              background: 'var(--primary)', color: 'white', fontWeight: 600,
              fontSize: '0.9rem', cursor: 'pointer', boxShadow: 'var(--shadow-sm)'
            }}
          >
            Add Task
          </button>
        </form>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' }}>
        {['Morning Routine', 'Academic Core', 'Deep Work'].map((title, idx) => (
          <div key={title} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>{title}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tasks.filter((_, tIdx) => {
                if (idx === 0) return tIdx < 5;
                if (idx === 1) return tIdx >= 5 && tIdx < 10;
                return tIdx >= 10;
              }).map(task => (
                <div key={task.id} className="achievement-row" style={{ background: task.completed ? 'var(--primary-soft)' : 'white', border: '1px solid var(--border-glass)' }}>
                  <span style={{ fontSize: '1.2rem' }}>{task.icon}</span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{task.title}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{task.time}</span>
                  </div>
                  <button onClick={() => toggleTask(task.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: task.completed ? 'var(--primary)' : 'var(--text-muted)' }}>
                    {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


const StreaksPage = () => {
  const { streak, tasks } = useContext(AppContext);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const milestones = [
    { days: 3, label: '3-day streak', icon: '🌱' },
    { days: 7, label: '7-day streak', icon: '🔥' },
    { days: 14, label: '14-day streak', icon: '👑' },
    { days: 30, label: '30-day streak', icon: '⭐' },
  ];

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)));

  return (
    <div className="right-panel" style={{ flex: '0 0 100%', padding: '60px', overflowY: 'auto' }}>
      <div className="streak-hero">
        <div className="streak-count-large">
          <span className="gradient-text-alt">{streak}</span>
          <span className="fire-icon-glow">🔥</span>
        </div>
        <p className="motivational-sub gradient-text">Days of pure consistency!</p>
        <p style={{ marginTop: '12px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          “This is the longest streak you’ve ever had!” ✨
        </p>
      </div>

      <div className="badges-container">
        {milestones.map((m, idx) => (
          <div key={idx} className={`hexagon-badge ${streak >= m.days ? 'unlocked' : ''}`}>
            <span className="badge-icon">{m.icon}</span>
            <span className="badge-label">{m.label}</span>
          </div>
        ))}
      </div>

      <div className="calendar-card">
        <div className="calendar-header">
          <h3 className="month-label">
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={prevMonth} className="nav-btn" style={{ padding: '8px' }}><ChevronLeft size={16} /></button>
            <button onClick={nextMonth} className="nav-btn" style={{ padding: '8px' }}><ChevronRight size={16} /></button>
          </div>
        </div>

        <div className="calendar-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="calendar-day-label">{d}</div>
          ))}
          {/* Mock Calendar logic for visual demo */}
          {Array.from({ length: 30 }).map((_, i) => {
            const day = i + 1;
            const isCompleted = day <= streak || (day === 15 || day === 20); // Mocking some completed days
            const isToday = day === new Date().getDate();
            return (
              <div
                key={i}
                className={`calendar-day ${isCompleted ? 'completed' : ''} ${day <= streak && streak > 0 ? 'streak' : ''} ${isToday ? 'today' : ''}`}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: '40px', padding: '24px', background: 'var(--primary-soft)', borderRadius: '16px' }}>
        <h4 style={{ marginBottom: '8px', color: 'var(--primary)' }}>💡 Streak Rules</h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Your streak increases when you complete all your daily tasks. Missing a full day will reset it to zero. Stay disciplined!
        </p>
      </div>
    </div>
  );
};

const MenuPage = () => {
  const { activeTitle, unlockedTitles, rewards } = useContext(AppContext);

  return (
    <div className="right-panel" style={{ flex: '0 0 100%', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <div className="menu-bg" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="menu-content"
        style={{ width: '90%', maxWidth: '600px' }}
      >
        <div style={{ marginBottom: '32px' }}>
          <p style={{ textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Active Identity</p>
          <h2 className="gradient-text" style={{ fontSize: '3rem', fontWeight: 900 }}>{activeTitle}</h2>
        </div>

        <div style={{ background: 'white', borderRadius: '24px', padding: '32px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-glass)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '24px', textAlign: 'left' }}>Daily Badges & Milestones</h3>

          <div className="badges-container" style={{ margin: 0, gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {rewards.map((r, idx) => (
              <div key={idx} className={`hexagon-badge ${unlockedTitles.includes(r.title) ? 'unlocked' : ''}`} style={{ width: '100%' }}>
                <span className="badge-icon">{r.icon}</span>
                <span className="badge-label">{r.streak}d</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ marginTop: '24px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Complete your daily protocol to unlock higher tiers of excellence.
        </p>
      </motion.div>
    </div>
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
  const { voiceEnabled, setVoiceEnabled, resetRoutine } = useContext(AppContext);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      style={{
        position: 'fixed', top: 0, right: 0, height: '100vh', width: '350px',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.2))',
        borderLeft: '1px solid var(--border-glass)',
        zIndex: 2000, padding: '48px', boxShadow: '-10px 0 30px rgba(0,0,0,0.05)',
        backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>System Settings</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
          <X size={24} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className="achievement-row"
          style={{ width: '100%', border: 'none', cursor: 'pointer', background: 'white', padding: '16px' }}
        >
          <div className="icon-box" style={{ background: 'var(--primary-soft)' }}>
            {voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </div>
          <span className="label-text">AI Companion: {voiceEnabled ? 'On' : 'Off'}</span>
        </button>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-glass)', margin: '12px 0' }} />

        <button
          onClick={resetRoutine}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600 }}
        >
          <RotateCcw size={18} />
          Reset Daily Protocol
        </button>
      </div>
    </motion.div>
  );
};

export default App;
