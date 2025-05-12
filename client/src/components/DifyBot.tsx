'use client'

import { useEffect } from 'react'

export default function DifyBot() {
  useEffect(() => {
    // 创建配置脚本
    const configScript = document.createElement('script')
    configScript.innerHTML = `
      window.difyChatbotConfig = {
        token: 'kvHlCawO15fpKclP',
        baseUrl: 'http://localhost',
        systemVariables: {
          // user_id: 'YOU CAN DEFINE USER ID HERE',
        },
      }
    `
    document.head.appendChild(configScript)

    // 创建嵌入脚本
    const embedScript = document.createElement('script')
    embedScript.src = 'http://localhost/embed.min.js'
    embedScript.id = 'kvHlCawO15fpKclP'
    embedScript.defer = true
    document.head.appendChild(embedScript)

    // 添加样式
    const styleElement = document.createElement('style')
    styleElement.innerHTML = `
      #dify-chatbot-bubble-button {
        background-color: #1C64F2 !important;
      }
      #dify-chatbot-bubble-window {
        width: 24rem !important;
        height: 40rem !important;
      }
    `
    document.head.appendChild(styleElement)

    // 清理函数
    return () => {
      document.head.removeChild(configScript)
      document.head.removeChild(embedScript)
      document.head.removeChild(styleElement)
    }
  }, [])

  return null // 此组件不渲染任何内容
} 