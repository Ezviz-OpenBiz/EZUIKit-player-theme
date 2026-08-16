import ThemePlayer from './components/ThemePlayer.jsx';
import TimeLine from './components/TimeLine.jsx';

export default function App() {
  return (
    <div
      style={{
        fontFamily: 'Avenir, Helvetica, Arial, sans-serif',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textAlign: 'center',
        color: '#2c3e50',
        padding: '24px',
      }}
    >
      <h1>@ezuikit/player-theme · React + Vite</h1>
      <TimeLine />
      <ThemePlayer />
    </div>
  );
}
