import SolarSystemScene from './components/scene/SolarSystemScene';
import Overlay from './components/ui/Overlay';

function App() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-space-900 relative flex text-white font-sans">
      <div className="absolute inset-0 z-0">
        <SolarSystemScene />
      </div>
      <div className="absolute inset-0 z-10 pointer-events-none">
        <Overlay />
      </div>
    </div>
  );
}

export default App;
