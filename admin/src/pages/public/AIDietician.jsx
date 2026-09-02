import { useState } from 'react';
import { motion } from 'framer-motion';
import { dietPlans, conditions } from '../../data/dietPlans';
import { generateDietResponse } from '../../utils/helpers';
import {
  Salad, Send, Download, Apple, AlertCircle, Flame,
  Beef, Wheat, Droplet, X
} from 'lucide-react';

export default function AIDietician() {
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [messages, setMessages] = useState([
    { type: 'bot', text: "Hello! 🥗 I'm your AI Dietician. Select your health conditions below and I'll create a personalized diet plan for you." },
  ]);
  const [inputText, setInputText] = useState('');
  const [activePlan, setActivePlan] = useState(null);
  const [activeDay, setActiveDay] = useState('Monday');

  const toggleCondition = (condition) => {
    setSelectedConditions((prev) =>
      prev.includes(condition) ? prev.filter((c) => c !== condition) : [...prev, condition]
    );
  };

  const generatePlan = () => {
    if (selectedConditions.length === 0) return;

    const response = generateDietResponse(selectedConditions);
    setMessages((prev) => [
      ...prev,
      { type: 'user', text: `Generate diet plan for: ${selectedConditions.join(', ')}` },
      { type: 'bot', text: response },
    ]);

    // Select the best matching plan
    if (selectedConditions.some((c) => c.includes('Diabetes'))) {
      setActivePlan(dietPlans.diabetes);
    } else if (selectedConditions.some((c) => c.includes('Hypertension') || c.includes('Heart'))) {
      setActivePlan(dietPlans.hypertension);
    } else {
      setActivePlan(dietPlans.general);
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    setMessages((prev) => [
      ...prev,
      { type: 'user', text: inputText },
      { type: 'bot', text: "That's a great question! Based on your current diet plan, I'd recommend focusing on increasing your fiber intake and reducing processed sugars. Here are some specific tips:\n\n1. Replace white rice with brown rice or quinoa\n2. Add more leafy greens to your meals\n3. Snack on nuts instead of processed snacks\n4. Stay hydrated with at least 8 glasses of water daily\n\nWould you like me to adjust your meal plan based on these recommendations?" },
    ]);
    setInputText('');
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="page-wrapper">
      <div className="container-main" style={{ paddingTop: 32, paddingBottom: 0 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>
            <Salad size={28} style={{ display: 'inline', marginRight: 10, verticalAlign: -5 }} />
            AI Dietician
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            Get a personalized diet plan based on your health conditions
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 24, height: 'calc(100vh - 220px)' }}>
            {/* Chat Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      className={`chat-bubble ${msg.type}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      {msg.text}
                    </motion.div>
                  ))}

                  {/* Condition Chips */}
                  {!activePlan && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{ padding: 16 }}
                    >
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)' }}>
                        Select your conditions:
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {conditions.map((condition) => (
                          <button
                            key={condition}
                            className="pill-slot"
                            onClick={() => toggleCondition(condition)}
                            style={{
                              background: selectedConditions.includes(condition) ? 'var(--accent-teal)' : 'var(--glass-bg)',
                              color: selectedConditions.includes(condition) ? '#0a0f1e' : 'var(--text-secondary)',
                              borderColor: selectedConditions.includes(condition) ? 'var(--accent-teal)' : 'var(--glass-border)',
                              fontSize: '0.8rem',
                            }}
                          >
                            {selectedConditions.includes(condition) && <X size={12} />}
                            {condition}
                          </button>
                        ))}
                      </div>
                      {selectedConditions.length > 0 && (
                        <button
                          className="clay-btn clay-btn-primary"
                          style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}
                          onClick={generatePlan}
                        >
                          Generate Diet Plan
                        </button>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="chat-input-bar">
                  <input
                    className="skeu-input"
                    placeholder="Ask a question..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    style={{ flex: 1 }}
                  />
                  <button className="clay-btn clay-btn-primary" style={{ padding: 12 }} onClick={handleSendMessage}>
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Diet Plan Display */}
            <div style={{ overflowY: 'auto', paddingBottom: 24 }}>
              {activePlan ? (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  {/* Nutritional Targets */}
                  <div className="glass-card" style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>
                      📊 Daily Nutritional Targets
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                      {[
                        { icon: <Flame size={18} />, label: 'Calories', value: activePlan.calories, color: 'var(--accent-red)' },
                        { icon: <Beef size={18} />, label: 'Protein', value: activePlan.protein, color: 'var(--accent-teal)' },
                        { icon: <Wheat size={18} />, label: 'Carbs', value: activePlan.carbs, color: 'var(--accent-orange)' },
                        { icon: <Droplet size={18} />, label: 'Fat', value: activePlan.fat, color: 'var(--accent-blue)' },
                        { icon: <Apple size={18} />, label: 'Fiber', value: activePlan.fiber, color: 'var(--clay-green)' },
                      ].map((nutrient, i) => (
                        <div key={i} style={{ textAlign: 'center', padding: 12, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                          <div style={{ color: nutrient.color, marginBottom: 6 }}>{nutrient.icon}</div>
                          <p style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>{nutrient.value}</p>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{nutrient.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Weekly Tabs */}
                  <div className="tabs" style={{ marginBottom: 20, overflowX: 'auto' }}>
                    {days.map((day) => (
                      <button
                        key={day}
                        className={`tab ${activeDay === day ? 'active' : ''}`}
                        onClick={() => setActiveDay(day)}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>

                  {/* Meal Plan for Selected Day */}
                  {activePlan.weekly[activeDay] && (
                    <div style={{ display: 'grid', gap: 16 }}>
                      {['breakfast', 'lunch', 'dinner', 'snacks'].map((meal) => (
                        <div key={meal} className="glass-card">
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 12, textTransform: 'capitalize' }}>
                            {meal === 'breakfast' ? '🌅' : meal === 'lunch' ? '☀️' : meal === 'dinner' ? '🌙' : '🍎'} {meal}
                          </h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {activePlan.weekly[activeDay][meal].map((item, i) => (
                              <span
                                key={i}
                                style={{
                                  padding: '6px 14px',
                                  background: 'var(--bg-secondary)',
                                  borderRadius: 'var(--radius-full)',
                                  fontSize: '0.82rem',
                                  color: 'var(--text-primary)',
                                }}
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Foods to Avoid */}
                  <div className="glass-card" style={{ marginTop: 20 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <AlertCircle size={18} style={{ color: 'var(--accent-red)' }} /> Foods to Avoid
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {activePlan.avoid.map((item, i) => (
                        <span key={i} className="badge badge-red" style={{ fontSize: '0.8rem' }}>
                          ✕ {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Download Button */}
                  <button
                    className="clay-btn clay-btn-secondary"
                    style={{ width: '100%', justifyContent: 'center', marginTop: 20 }}
                    onClick={() => {}}
                  >
                    <Download size={18} /> Download as PDF
                  </button>
                </motion.div>
              ) : (
                <div className="glass-card" style={{ textAlign: 'center', padding: 60 }}>
                  <Salad size={64} style={{ color: 'var(--text-tertiary)', marginBottom: 16 }} />
                  <h3 style={{ fontWeight: 700, marginBottom: 8 }}>No Plan Generated Yet</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Select your health conditions from the chat panel and generate a personalized diet plan
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
