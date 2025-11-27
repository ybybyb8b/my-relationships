import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // <--- 新增这行
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 包裹 BrowserRouter，开启路由魔法 */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)