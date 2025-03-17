'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function CalculatorApp() {
  const [display, setDisplay] = useState('0')
  const [firstOperand, setFirstOperand] = useState<number | null>(null)
  const [operator, setOperator] = useState<string | null>(null)
  const [waitingForSecondOperand, setWaitingForSecondOperand] = useState(false)

  const inputDigit = (digit: string) => {
    if (waitingForSecondOperand) {
      setDisplay(digit)
      setWaitingForSecondOperand(false)
    } else {
      setDisplay(display === '0' ? digit : display + digit)
    }
  }

  const inputDecimal = () => {
    if (waitingForSecondOperand) {
      setDisplay('0.')
      setWaitingForSecondOperand(false)
      return
    }

    if (!display.includes('.')) {
      setDisplay(display + '.')
    }
  }

  const clearDisplay = () => {
    setDisplay('0')
    setFirstOperand(null)
    setOperator(null)
    setWaitingForSecondOperand(false)
  }

  const handleOperator = (nextOperator: string) => {
    const inputValue = parseFloat(display)

    if (firstOperand === null) {
      setFirstOperand(inputValue)
    } else if (operator) {
      const result = performCalculation()
      setDisplay(String(result))
      setFirstOperand(result)
    }

    setWaitingForSecondOperand(true)
    setOperator(nextOperator)
  }

  const performCalculation = () => {
    if (firstOperand === null || operator === null) return parseFloat(display)

    const secondOperand = parseFloat(display)
    let result = 0

    switch (operator) {
      case '+':
        result = firstOperand + secondOperand
        break
      case '-':
        result = firstOperand - secondOperand
        break
      case '*':
        result = firstOperand * secondOperand
        break
      case '/':
        result = firstOperand / secondOperand
        break
      default:
        return secondOperand
    }

    return result
  }

  const calculateResult = () => {
    if (firstOperand === null || operator === null) return

    const result = performCalculation()
    setDisplay(String(result))
    setFirstOperand(null)
    setOperator(null)
    setWaitingForSecondOperand(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-2xl font-bold text-primary-600">AppHUB</Link>
              </div>
            </div>
            <div className="flex items-center">
              <Link href="/" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                返回首页
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900">
            计算器
          </h2>
          <p className="mt-3 text-xl text-gray-500">
            简单易用的计算器工具
          </p>
        </div>

        <div className="card">
          {/* 显示屏 */}
          <div className="bg-gray-100 p-4 mb-4 rounded-md text-right">
            <div className="text-3xl font-mono">{display}</div>
          </div>

          {/* 按钮区域 */}
          <div className="grid grid-cols-4 gap-2">
            <button onClick={clearDisplay} className="bg-red-500 text-white p-4 rounded-md text-xl font-medium">C</button>
            <button className="bg-gray-200 p-4 rounded-md text-xl font-medium col-span-2" onClick={() => handleOperator('/')}>/</button>
            <button className="bg-gray-200 p-4 rounded-md text-xl font-medium" onClick={() => handleOperator('*')}>×</button>
            
            <button className="bg-white border border-gray-300 p-4 rounded-md text-xl font-medium" onClick={() => inputDigit('7')}>7</button>
            <button className="bg-white border border-gray-300 p-4 rounded-md text-xl font-medium" onClick={() => inputDigit('8')}>8</button>
            <button className="bg-white border border-gray-300 p-4 rounded-md text-xl font-medium" onClick={() => inputDigit('9')}>9</button>
            <button className="bg-gray-200 p-4 rounded-md text-xl font-medium" onClick={() => handleOperator('-')}>-</button>
            
            <button className="bg-white border border-gray-300 p-4 rounded-md text-xl font-medium" onClick={() => inputDigit('4')}>4</button>
            <button className="bg-white border border-gray-300 p-4 rounded-md text-xl font-medium" onClick={() => inputDigit('5')}>5</button>
            <button className="bg-white border border-gray-300 p-4 rounded-md text-xl font-medium" onClick={() => inputDigit('6')}>6</button>
            <button className="bg-gray-200 p-4 rounded-md text-xl font-medium" onClick={() => handleOperator('+')}>+</button>
            
            <button className="bg-white border border-gray-300 p-4 rounded-md text-xl font-medium" onClick={() => inputDigit('1')}>1</button>
            <button className="bg-white border border-gray-300 p-4 rounded-md text-xl font-medium" onClick={() => inputDigit('2')}>2</button>
            <button className="bg-white border border-gray-300 p-4 rounded-md text-xl font-medium" onClick={() => inputDigit('3')}>3</button>
            <button className="bg-primary-500 text-white p-4 rounded-md text-xl font-medium row-span-2" onClick={calculateResult}>=</button>
            
            <button className="bg-white border border-gray-300 p-4 rounded-md text-xl font-medium col-span-2" onClick={() => inputDigit('0')}>0</button>
            <button className="bg-white border border-gray-300 p-4 rounded-md text-xl font-medium" onClick={inputDecimal}>.</button>
          </div>
        </div>
      </div>
    </div>
  )
} 