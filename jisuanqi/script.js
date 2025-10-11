document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    let isLightTheme = false;
    
    themeToggle.addEventListener('click', function() {
        isLightTheme = !isLightTheme;
        
        if (isLightTheme) {
            body.classList.add('light-theme');
            themeToggle.textContent = '切换暗色主题';
        } else {
            body.classList.remove('light-theme');
            themeToggle.textContent = '切换浅色主题';
        }
    });

    const expression = document.getElementById('expression');
    const result = document.getElementById('result');
    const buttons = document.querySelectorAll('.buttons button');    
    
    let currentInput = '';
    let currentOperation = null;
    let previousInput = '';
    let expressionText = '';
    
    // 为所有按钮添加点击事件
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            const value = this.value;
            const displayValue = this.textContent;
            
            // 处理不同类型的按钮
            if (value === 'clear') {
                // 清除所有输入
                clear();
            } else if (value === 'backspace') {
                // 删除最后一个字符
                backspace();
            } else if (value === '=') {
                // 计算结果
                calculate();
            } else if (['+', '-', '*', '/', '%'].includes(value)) {
                // 处理运算符
                handleOperator(value, displayValue);
            } else if (value === 'reciprocal') {  
                // 计算倒数
                calculateReciprocal();
            } else if (value === 'x²') {  
                // 计算平方
                calculateSquare();
            } else {
                // 处理数字和小数点
                appendNumber(value);
            }
            
            // 更新显示
            updateDisplay();
        });
    });
    

    function calculateSquare() {
    if (currentInput === '' && previousInput === '') return;
    
    // 确定要计算平方的值
    const valueToSquare = currentInput || previousInput;
    if (valueToSquare === '') return;
    
    const num = parseFloat(valueToSquare);
    if (isNaN(num)) return;
    
    // 计算平方
    const squared = roundNumber(num * num);
    
    // 保存完整表达式用于显示
    const baseExpression = expressionText || '';
    
    // 更新状态
    currentInput = squared.toString();
    
    // 构建表达式文本
    if (baseExpression.includes('=')) {
        // 如果已经有等号，重新开始表达式
        expressionText = `(${valueToSquare})² = `;
    } else if (currentOperation !== null) {
        // 如果正在进行运算，将平方应用到当前输入
        expressionText = `${baseExpression}(${valueToSquare})² = `;
    } else {
        // 普通情况
        expressionText = `${valueToSquare}² = `;
    }
    
    currentOperation = null;
    previousInput = '';
}

    // 倒数计算
    function calculateReciprocal() {
        let numberToCalculate = currentInput || previousInput || '0';
    
        if (numberToCalculate === '0') {
            result.value = 'ERROR';
            return;
        }
    
        const num = parseFloat(numberToCalculate);
        const reciprocal = roundNumber(1 / num);
    
        expressionText = `1/(${numberToCalculate}) = `;
        currentInput = reciprocal.toString();
        previousInput = '';
        currentOperation = null;
    }

    // 清除所有输入
    function clear() {
        currentInput = '';
        previousInput = '';
        currentOperation = null;
        expressionText = '';
    }
    
    // 删除最后一个字符
    function backspace() {
        // 如果当前有输入，则删除当前输入的最后一个字符
        if (currentInput !== '') {
            currentInput = currentInput.toString().slice(0, -1);
        } 
        // 如果当前没有输入但有运算符和之前的输入，则删除运算符
        else if (currentOperation !== null && previousInput !== '') {
            currentInput = previousInput;
            previousInput = '';
            currentOperation = null;
            // 更新表达式文本，移除运算符部分
            expressionText = '';
        }
    }
    
    // 添加数字或小数点
    function appendNumber(number) {
        // 防止多个小数点
        if (number === '.' && currentInput.includes('.')) return;
        
        // 处理负号输入
        if (number === '+/-') {
            // 如果当前输入为空，不做任何操作
            if (currentInput === '') return;
            // 切换正负号
            currentInput = (parseFloat(currentInput) * -1).toString();
            return;
        }
        
        currentInput = currentInput.toString() + number.toString();
    }
    
    // 处理运算符
    function handleOperator(operator, displayOperator) {
        if (currentInput === '' && previousInput === '') return;
        
        if (currentInput === '' && previousInput !== '' && currentOperation !== null) {
            // 更换运算符
            currentOperation = operator;
            // 更新表达式，替换最后一个运算符
            expressionText = expressionText.slice(0, -1) + displayOperator;
            return;
        }
        
        if (previousInput !== '' && currentInput !== '') {
            calculate();
        }
        
        currentOperation = operator;
        previousInput = currentInput || previousInput;
        expressionText = previousInput + ' ' + displayOperator + ' ';
        currentInput = '';
    }
    
    // 处理浮点数精度问题
    function roundNumber(num, decimals = 10) {
        return parseFloat(num.toFixed(decimals));
    }
    
    // 计算结果
    function calculate() {
        if (currentOperation === null || previousInput === '') return;
        
        // 如果没有输入当前值，使用之前的值进行计算
        const current = currentInput === '' ? previousInput : currentInput;
        
        let computation;
        const prev = parseFloat(previousInput);
        const currentVal = parseFloat(current);
        
        if (isNaN(prev) || isNaN(currentVal)) return;
        
        // 保存完整表达式用于显示
        const fullExpression = expressionText + (currentInput || previousInput);
        
        switch (currentOperation) {
            case '+':
                computation = roundNumber(prev + currentVal);
                break;
            case '-':
                computation = roundNumber(prev - currentVal);
                break;
            case '*':
                computation = roundNumber(prev * currentVal);
                break;
            case '/':
                computation = roundNumber(prev / currentVal);
                break;
            case '%':
                computation = roundNumber(prev % currentVal);
                break;
            default:
                return;
        }
        
        // 处理结果
        currentInput = computation;
        expressionText = fullExpression + ' = ';
        currentOperation = null;
        previousInput = '';
    }
    
    // 格式化数字显示
    function formatNumber(num) {
        // 如果是整数，直接返回
        if (Number.isInteger(num)) {
            return num.toString();
        }
        
        // 处理小数，最多显示8位小数
        const maxDecimals = 8;
        
        // 移除尾部多余的0
        let formatted = num.toFixed(maxDecimals).replace(/\.?0+$/, '');
        
        // 如果小数部分过长，使用科学计数法
        if (formatted.length > 12) {
            return parseFloat(num).toPrecision(10);
        }
        
        return formatted;
    }
    
    // 更新显示
    function updateDisplay() {
        // 更新表达式显示
        expression.value = expressionText + (currentInput || '');
        
        // 更新结果显示
        if (currentInput === '' && previousInput === '') {
            result.value = '0';
        } else if (currentInput === '' && previousInput !== '') {
            result.value = previousInput;
        } else {
            // 处理长数字和小数位数
            const displayValue = parseFloat(currentInput);
            if (isNaN(displayValue)) {
                result.value = '0';
            } else {
                result.value = formatNumber(displayValue);
            }
        }
    }
    
    // 初始化显示
    updateDisplay();
});