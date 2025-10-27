import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import AudioTrainer from "./AudioTrainer";

function App() {
  const [count, setCount] = useState(0)

  return <AudioTrainer />;
}

export default App
