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
    const tabButtons = document.querySelectorAll('.tab-button');
    const panes = document.querySelectorAll('.tab-pane');
    const genBtn = document.getElementById('genRecipe');
    const resetBtn = document.getElementById('resetRecipe');
    const randomBtn = document.getElementById('randomRecipe');
    const recipeResult = document.getElementById('recipeResult');
    const conflictAlert = document.getElementById('conflictAlert');
    const proteinList = document.getElementById('proteinList');
    const vegList = document.getElementById('vegList');
    const stapleList = document.getElementById('stapleList');
    
    let currentInput = '';
    let currentOperation = null;
    let previousInput = '';
    let expressionText = '';
    
    // ---------- 菜谱数据状态 ----------
    /** @type {Array<{name:string, stuff:string[], difficulty?:string, tags?:string[], methods?:string[], tools?:string[]}>} */
    let recipeData = [];
    /** @type {Array<{a:string,b:string,reason:string}>} */
    let incompatiblePairs = [];
    // CSV 加载失败时的兜底菜谱
    const fallbackRecipes = [
        { name:'番茄炒蛋', stuff:['番茄','鸡蛋'] },
        { name:'土豆烧牛肉', stuff:['土豆','牛肉'] },
        { name:'家常豆腐', stuff:['豆腐'] },
        { name:'茄子烧肉', stuff:['茄子','猪肉'] },
        { name:'花菜虾仁', stuff:['花菜','虾'] },
        { name:'午餐肉蛋炒饭', stuff:['午餐肉','鸡蛋','米'] },
        { name:'西葫芦炒蛋', stuff:['西葫芦','鸡蛋'] },
        { name:'黄瓜拌鸡丝', stuff:['黄瓜','鸡肉'] },
        { name:'番茄牛肉面', stuff:['面食','番茄','牛肉'] },
        { name:'番茄鸡蛋面', stuff:['方便面','番茄','鸡蛋'] },
        { name:'电饭煲腊肠蒸饭', stuff:['腊肠','米'] },
        { name:'电饭煲香肠土豆焖饭', stuff:['香肠','土豆','米'] },
        { name:'电饭煲番茄牛肉焖饭', stuff:['番茄','牛肉','米'] },
        { name:'微波炉鸡蛋羹', stuff:['鸡蛋'] },
        { name:'空气炸锅烤鸡腿', stuff:['鸡肉'] },
        { name:'烤箱吐司蛋', stuff:['面包','鸡蛋'] },
        { name:'白萝卜牛肉汤', stuff:['白萝卜','牛肉'] },
        { name:'洋葱滑牛肉', stuff:['牛肉','洋葱'] },
        { name:'包菜炒肉', stuff:['包菜','猪肉'] },
        { name:'芹菜炒肉', stuff:['芹菜','猪肉'] },
        { name:'菌菇鸡胸', stuff:['菌菇','鸡肉'] }
    ];

    // 渲染来自 food.ts 的选项（嵌入同源清单）
    renderFoodOptions();
    // 加载 CSV 数据
    loadRecipeData();
    loadIncompatibleData();

    // 标签切换
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            panes.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            const target = document.querySelector(btn.getAttribute('data-target'));
            if (target) target.classList.add('active');
        });
    });
    
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
            } else if (value === '(' || value === ')') {
                appendParenthesis(value);
            } else if (value === 'sin' || value === 'cos' || value === 'tan') {
                appendFunction(value);
            } else if (value === '^') {
                appendCaret();
            } else if (value === 'reciprocal') {  
                // 计算倒数
                calculateReciprocal();
            } else if (value === 'x²') {  
                // 计算平方
                calculateSquare();
            } else if (value === 'sqrt') {  
                // 计算平方根
                calculateSquareRoot();
            } else {
                // 处理数字和小数点
                appendNumber(value);
            }
            
            // 更新显示
            updateDisplay();
        });
    });
    
    // 平方根计算函数
    function calculateSquareRoot() {
        // 获取当前表达式或输入值
        let expressionToCalculate = expressionText + currentInput;
        
        // 如果没有表达式但有当前输入，使用当前输入
        if (!expressionToCalculate.trim() && currentInput) {
            expressionToCalculate = currentInput;
        }
        
        // 如果仍然为空，返回
        if (!expressionToCalculate.trim()) return;
        
        // 规范化表达式
        const normalizedExpr = normalizeExpression(expressionToCalculate);
        
        // 尝试计算表达式的值
        const exprValue = tryEval(normalizedExpr);
        
        if (exprValue === null) {
            result.value = 'ERROR';
            return;
        }
        
        // 检查是否为负数
        if (exprValue < 0) {
            result.value = 'ERROR';
            // 保存错误状态
            if (expressionText.includes('=')) {
                expressionText = `√(${expressionToCalculate}) = `;
            } else {
                expressionText = `√(${expressionToCalculate}) = `;
            }
            currentInput = '';
            previousInput = '';
            currentOperation = null;
            return;
        }
        
        // 计算平方根
        const sqrtResult = roundNumber(Math.sqrt(exprValue));
        
        // 更新状态
        if (expressionText.includes('=')) {
            // 如果已经有等号，重新开始表达式
            expressionText = `√(${expressionToCalculate}) = `;
        } else {
            // 普通情况
            expressionText = `√(${expressionToCalculate}) = `;
        }
        
        currentInput = sqrtResult.toString();
        previousInput = '';
        currentOperation = null;
        
        // 更新显示
        updateDisplay();
    }

    // 平方计算函数
    function calculateSquare() {
        // 获取当前表达式或输入值
        let expressionToCalculate = expressionText + currentInput;
        
        // 如果没有表达式但有当前输入，使用当前输入
        if (!expressionToCalculate.trim() && currentInput) {
            expressionToCalculate = currentInput;
        }
        
        // 如果仍然为空，返回
        if (!expressionToCalculate.trim()) return;
        
        // 规范化表达式
        const normalizedExpr = normalizeExpression(expressionToCalculate);
        
        // 尝试计算表达式的值
        const exprValue = tryEval(normalizedExpr);
        
        if (exprValue === null) {
            result.value = 'ERROR';
            return;
        }
        
        // 计算平方
        const squared = roundNumber(exprValue * exprValue);
        
        // 更新状态
        if (expressionText.includes('=')) {
            // 如果已经有等号，重新开始表达式
            expressionText = `(${expressionToCalculate})² = `;
        } else {
            // 普通情况
            expressionText = `(${expressionToCalculate})² = `;
        }
        
        currentInput = squared.toString();
        previousInput = '';
        currentOperation = null;
        
        // 更新显示
        updateDisplay();
    }

    // 倒数计算
    function calculateReciprocal() {
        // 获取当前表达式或输入值
        let expressionToCalculate = expressionText + currentInput;
        
        // 如果没有表达式但有当前输入，使用当前输入
        if (!expressionToCalculate.trim() && currentInput) {
            expressionToCalculate = currentInput;
        }
        
        // 如果仍然为空，返回错误
        if (!expressionToCalculate.trim()) {
            result.value = 'ERROR';
            return;
        }
        
        // 规范化表达式
        const normalizedExpr = normalizeExpression(expressionToCalculate);
        
        // 尝试计算表达式的值
        const exprValue = tryEval(normalizedExpr);
        
        if (exprValue === null || exprValue === 0) {
            result.value = 'ERROR';
            return;
        }
        
        // 计算倒数
        const reciprocal = roundNumber(1 / exprValue);
        
        // 更新显示和状态
        if (expressionText.includes('=')) {
            // 如果已经有等号，重新开始表达式
            expressionText = `1/(${expressionToCalculate}) = `;
        } else {
            // 普通情况
            expressionText = `1/(${expressionToCalculate}) = `;
        }
        
        currentInput = reciprocal.toString();
        previousInput = '';
        currentOperation = null;
        
        // 更新显示
        updateDisplay();
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
        if (currentInput !== '') {
            currentInput = currentInput.toString().slice(0, -1);
            return;
        }
        if (expressionText !== '') {
            // 移除最后一个非空白字符
            expressionText = expressionText.replace(/\s+$/,'');
            expressionText = expressionText.slice(0, -1);
        }
    }
    
    // 添加数字或小数点
    function appendNumber(number) {
        // 防止多个小数点
        if (number === '.' && currentInput.includes('.')) return;
        
        // 处理负号输入
        if (number === '+/-') {
            // 检查是否在指数部分（在 ^ 符号之后）
            const lastCaretIndex = currentInput.lastIndexOf('^');
            
            if (lastCaretIndex !== -1) {
                // 在指数部分：只切换指数部分的正负号，并为负数添加括号
                const base = currentInput.substring(0, lastCaretIndex + 1); // 包含 ^
                let exponent = currentInput.substring(lastCaretIndex + 1);
                
                if (exponent === '') {
                    exponent = '-';
                } else if (exponent === '-') {
                    exponent = '';
                } else if (exponent.startsWith('(') && exponent.endsWith(')')) {
                    // 如果指数已经是带括号的负数，移除括号和负号
                    exponent = exponent.slice(1, -1);
                    if (exponent.startsWith('-')) {
                        exponent = exponent.slice(1);
                    }
                } else {
                    // 切换正负号，并为负数添加括号
                    const num = parseFloat(exponent);
                    if (!isNaN(num)) {
                        if (num >= 0) {
                            exponent = `(-${num})`;
                        } else {
                            exponent = Math.abs(num).toString();
                        }
                    }
                }
                
                currentInput = base + exponent;
            } else {
                // 不在指数部分：智能切换数字的正负号
                currentInput = toggleSignAtCurrentPosition(currentInput);
            }
            return;
        }
        
        currentInput = currentInput.toString() + number.toString();
    }

    // 智能切换当前位置数字的正负号
    function toggleSignAtCurrentPosition(input) {
        if (!input) return '-';
        if (input === '-') return '';
        
        // 检查是否是函数表达式（sin, cos, tan 等）
        const functionMatch = input.match(/(sin|cos|tan)\(([^)]*)\)$/);
        if (functionMatch) {
            const [fullMatch, funcName, innerContent] = functionMatch;
            const before = input.substring(0, input.length - fullMatch.length);
            
            // 如果函数前已经有负号，移除它
            if (before.endsWith('-')) {
                return before.slice(0, -1) + `${funcName}(${innerContent})`;
            } else {
                // 否则在函数前添加负号
                return before + `-${funcName}(${innerContent})`;
            }
        }
        
        // 解析表达式，找到数字边界
        const numberBoundaries = findNumberBoundaries(input);
        
        if (numberBoundaries.length === 0) {
            // 如果没有找到数字，在末尾添加负号
            return input + '-';
        }
        
        // 找到最后一个数字（假设用户正在编辑最后一个数字）
        const lastNumber = numberBoundaries[numberBoundaries.length - 1];
        const before = input.substring(0, lastNumber.start);
        const number = input.substring(lastNumber.start, lastNumber.end);
        const after = input.substring(lastNumber.end);
        
        // 切换该数字的正负号
        let newNumber;
        if (number.startsWith('-')) {
            // 负数变正数：移除负号
            newNumber = number.substring(1);
        } else if (number.startsWith('(') && number.endsWith(')') && number.substring(1, number.length - 1).startsWith('-')) {
            // 带括号的负数：(-5) -> 5
            newNumber = number.substring(2, number.length - 1);
        } else {
            // 正数变负数：总是为负数添加括号以确保数学正确性
            newNumber = `(-${number})`;
        }
        
        return before + newNumber + after;
    }

    // 找到表达式中所有数字的边界
    function findNumberBoundaries(input) {
        const boundaries = [];
        let i = 0;
        const length = input.length;
        
        while (i < length) {
            // 跳过空格
            if (input[i] === ' ') {
                i++;
                continue;
            }
            
            // 检查是否是数字的开始（包括负号、小数点、括号）
            if (isDigitStart(input, i)) {
                const start = i;
                let end = i + 1;
                
                // 找到数字的结束位置
                while (end < length && isDigitPart(input, end)) {
                    end++;
                }
                
                boundaries.push({ start, end });
                i = end;
            } else {
                i++;
            }
        }
        
        return boundaries;
    }

    // 检查是否可能是数字的开始
    function isDigitStart(input, index) {
        const char = input[index];
        
        // 数字开头
        if (char >= '0' && char <= '9') return true;
        
        // 负号开头（后面跟数字）
        if (char === '-' && index + 1 < input.length && input[index + 1] >= '0' && input[index + 1] <= '9') return true;
        
        // 括号开头，里面是负号（(-5) 的情况）
        if (char === '(' && index + 2 < input.length && input[index + 1] === '-' && input[index + 2] >= '0' && input[index + 2] <= '9') return true;
        
        // 小数点开头
        if (char === '.' && index + 1 < input.length && input[index + 1] >= '0' && input[index + 1] <= '9') return true;
        
        return false;
    }

    // 检查是否可能是数字的一部分
    function isDigitPart(input, index) {
        const char = input[index];
        
        // 数字、小数点、负号（在特定情况下）
        if ((char >= '0' && char <= '9') || char === '.') return true;
        
        // 括号结束（对于带括号的数字）
        if (char === ')') return true;
        
        return false;
    }

    function appendParenthesis(p) {
        currentInput = currentInput + p;
    }

    function appendFunction(fn) {
        // 插入如 sin(
        currentInput = currentInput + fn + '(';
    }

    function appendCaret() {
        currentInput = currentInput + '^';
    }
    
    // 处理运算符
    function handleOperator(operator, displayOperator) {
        // 统一采用表达式拼接方式，便于括号与函数
        if (currentInput !== '') {
            expressionText += currentInput + ' ' + displayOperator + ' ';
            currentInput = '';
            currentOperation = null;
            previousInput = '';
            return;
        }
        // 如果没有当前输入但已有表达式，允许替换末尾运算符
        if (/[+\-×÷*/%^]\s$/.test(expressionText)) {
            expressionText = expressionText.slice(0, -2) + displayOperator + ' ';
        }
    }
    
    // 处理浮点数精度问题
    function roundNumber(num, decimals = 10) {
        return parseFloat(num.toFixed(decimals));
    }
    
    // 计算结果
    function calculate() {
        // 表达式求值：支持括号、^、sin/cos/tan(角度)
        const exprRaw = (expressionText || '') + (currentInput || '');
        const expr = normalizeExpression(exprRaw);
        const preview = tryEval(expr);
        if (preview === null) return;
        currentInput = preview.toString();
        expressionText = sanitizeEquals(exprRaw) + ' = ';
        currentOperation = null;
        previousInput = '';
    }

    function sanitizeEquals(s) {
        return s.replace(/\s*=\s*$/,'');
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
        const exprRaw = (expressionText || '') + (currentInput || '');
        
        // 检查特殊函数表达式（在计算前不显示预览）
        const hasSpecialFunction = 
            (exprRaw.includes('1/(') && !exprRaw.includes('=')) ||
            (exprRaw.includes('√(') && !exprRaw.includes('=')) ||
            (exprRaw.includes(')²') && !exprRaw.includes('='));
        
        if (hasSpecialFunction) {
            // 对于特殊函数，尝试计算预览但不强制显示
            const expr = normalizeExpression(exprRaw);
            const preview = tryEval(expr);
            if (preview !== null) {
                result.value = formatNumber(preview);
            } else {
                // 退回到已有数值显示
                if (currentInput === '' && previousInput === '') {
                    result.value = '0';
                } else if (currentInput !== '' && !isNaN(parseFloat(currentInput))) {
                    result.value = formatNumber(parseFloat(currentInput));
                } else {
                    result.value = '0';
                }
            }
        } else {
            const expr = normalizeExpression(exprRaw);
            const preview = tryEval(expr);
            if (preview === null) {
                // 退回到已有数值显示
                if (currentInput === '' && previousInput === '') {
                    result.value = '0';
                } else if (currentInput !== '' && !isNaN(parseFloat(currentInput))) {
                    result.value = formatNumber(parseFloat(currentInput));
                } else {
                    result.value = '0';
                }
            } else {
                result.value = formatNumber(preview);
            }
        }
    }

    // 初始化显示
    updateDisplay();

    // ---------- 表达式求值与替换 ----------
    function normalizeExpression(s) {
        if (!s) return '';
        // 移除尾部等号
        s = s.replace(/=\s*$/,'').trim();
        // 将显示运算符替换为可执行表达式
        s = s.replace(/×/g, '*').replace(/÷/g, '/');
        // 将 ^ 替换为 **
        s = s.replace(/\^/g, '**');
        
        // 修复：直接在表达式中完成角度转弧度
        s = s.replace(/sin\s*\(([^)]*)\)/g, 'Math.sin(($1) * Math.PI / 180)');
        s = s.replace(/cos\s*\(([^)]*)\)/g, 'Math.cos(($1) * Math.PI / 180)');
        s = s.replace(/tan\s*\(([^)]*)\)/g, 'Math.tan(($1) * Math.PI / 180)');
        
        // 倒数表达式
        s = s.replace(/1\/\(/g, '1/(');
        // 平方根表达式
        s = s.replace(/√\(([^)]+)\)/g, 'Math.sqrt($1)');
        // 平方表达式
        s = s.replace(/\(([^)]+)\)²/g, '($1)**2');
        return s;
    }

    function parenthesesBalanced(s) {
        let c = 0;
        for (let ch of s) {
            if (ch === '(') c++;
            else if (ch === ')') { c--; if (c < 0) return false; }
        }
        return c === 0;
    }

    function tryEval(expr) {
        if (!expr) return 0;
        if (!parenthesesBalanced(expr)) return null;
        try {
            // 修复：直接求值，不再依赖外部函数
            const val = Function('"use strict"; return ' + expr)();
            if (typeof val === 'number' && isFinite(val)) {
                return roundNumber(val);
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    // ---------- 菜谱生成 ----------
    function getCheckedValues(selector) {
        return Array.from(document.querySelectorAll('.' + selector.replace('.', '') + '.active')).map(b => b.getAttribute('data-name'));
    }

    function generateRecipeName() {
        const proteins = getCheckedValues('.ing-protein');
        const vegs = getCheckedValues('.ing-veg');
        const staples = getCheckedValues('.ing-staple');

        const selectedRaw = [...proteins, ...vegs, ...staples];
        if (selectedRaw.length === 0) return '请选择一些食材试试~';

        // 冲突检测
        const conflictMsg = findConflicts(selectedRaw);
        // 推荐 Top N
        const recommendations = recommendRecipes(selectedRaw, 5);

        const lines = [];
        if (conflictMsg) lines.push('⚠ 食材冲突提示：' + conflictMsg);
        if (recommendations.length === 0) {
            lines.push('未找到匹配的菜谱，试试减少或更换一些食材。');
        } else {
            lines.push('为你推荐：');
            recommendations.forEach((r, idx) => {
                const meta = [];
                if (r.difficulty) meta.push(r.difficulty);
                if (r.methods && r.methods.length) meta.push(r.methods.join('/'));
                if (r.tools && r.tools.length) meta.push(r.tools.join('、'));
                const metaStr = meta.length ? `（${meta.join(' · ')}）` : '';
                lines.push(`${idx+1}. ${r.name}${metaStr}  [匹配${r.matchCount}/${r.totalStuff}]`);
            });
        }
        return lines.join('\n');
    }

    if (genBtn) {
        genBtn.addEventListener('click', () => {
            recipeResult.textContent = generateRecipeName();
            updateConflictUI();
        });
    }
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            document.querySelectorAll('.recipe .ing-btn').forEach(btn => btn.classList.remove('active'));
            recipeResult.textContent = '请选择食材后点击「生成」';
            updateConflictUI();
        });
    }
    if (randomBtn) {
        randomBtn.addEventListener('click', () => {
            if (!recipeData.length) {
                recipeResult.textContent = '未加载到菜谱数据，请稍后重试。';
                return;
            }
            const r = recipeData[Math.floor(Math.random() * recipeData.length)];
            document.querySelectorAll('.recipe .ing-btn').forEach(btn => btn.classList.remove('active'));
            const needed = new Set((r.stuff || []).map(s => canonicalizeIngredient(s)));
            document.querySelectorAll('.recipe .ing-btn').forEach(btn => {
                const name = canonicalizeIngredient(btn.getAttribute('data-name') || '');
                if (needed.has(name)) btn.classList.add('active');
            });
            recipeResult.textContent = `今日推荐：${r.name}`;
            updateConflictUI();
        });
    }
    function renderFoodOptions() {
        if (!proteinList || !vegList || !stapleList) return;
        const meats = [
            { name:'午餐肉', emoji:'🥓' },{ name:'香肠', emoji:'🌭' },{ name:'腊肠', emoji:'🌭' },{ name:'鸡肉', emoji:'🐤' },{ name:'猪肉', emoji:'🐷' },{ name:'鸡蛋', emoji:'🥚' },{ name:'虾', emoji:'🦐' },{ name:'牛肉', emoji:'🐮' },{ name:'骨头', emoji:'🦴' }
        ];
        const vegetables = [
            { name:'土豆', emoji:'🥔' },{ name:'胡萝卜', emoji:'🥕' },{ name:'花菜', emoji:'🥦' },{ name:'白萝卜', emoji:'🥣' },{ name:'西葫芦', emoji:'🥒' },{ name:'番茄', emoji:'🍅' },{ name:'芹菜', emoji:'🥬' },{ name:'黄瓜', emoji:'🥒' },{ name:'洋葱', emoji:'🧅' },{ name:'莴笋', emoji:'🎍' },{ name:'菌菇', emoji:'🍄' },{ name:'茄子', emoji:'🍆' },{ name:'豆腐', emoji:'🍲' },{ name:'包菜', emoji:'🥗' },{ name:'白菜', emoji:'🥬' }
        ];
        const staples = [
            { name:'面食', emoji:'🍝' },{ name:'面包', emoji:'🍞' },{ name:'米', emoji:'🍚' },{ name:'方便面', emoji:'🍜' }
        ];
        proteinList.innerHTML = meats.map(item => buttonHtml('ing-protein', item)).join('');
        vegList.innerHTML = vegetables.map(item => buttonHtml('ing-veg', item)).join('');
        stapleList.innerHTML = staples.map(item => buttonHtml('ing-staple', item)).join('');
        proteinList.querySelectorAll('.ing-btn').forEach(b => b.addEventListener('click', toggleActiveAndCheck));
        vegList.querySelectorAll('.ing-btn').forEach(b => b.addEventListener('click', toggleActiveAndCheck));
        stapleList.querySelectorAll('.ing-btn').forEach(b => b.addEventListener('click', toggleActiveAndCheck));
    }

    function buttonHtml(cls, item) {
        const emoji = item.emoji ? `<span>${item.emoji}</span>` : '';
        return `<button type="button" class="ing-btn ${cls}" data-name="${item.name}">${emoji}<span>${item.name}</span></button>`;
    }

    function toggleActive(e) {
        e.currentTarget.classList.toggle('active');
    }
    function toggleActiveAndCheck(e) {
        toggleActive(e);
        updateConflictUI();
    }

    function updateConflictUI() {
        if (!conflictAlert) return;
        document.querySelectorAll('.recipe .ing-btn').forEach(btn => btn.classList.remove('conflict'));
        const selected = [
            ...getCheckedValues('.ing-protein'),
            ...getCheckedValues('.ing-veg'),
            ...getCheckedValues('.ing-staple')
        ].map(canonicalizeIngredient);
        if (!selected.length || !incompatiblePairs.length) {
            conflictAlert.textContent = '';
            return;
        }
        let found = null;
        for (const p of incompatiblePairs) {
            if (selected.includes(p.a) && selected.includes(p.b)) { found = p; break; }
        }
        if (found) {
            conflictAlert.textContent = `⚠ 相克提示：${found.a} × ${found.b}：${found.reason}`;
            document.querySelectorAll('.recipe .ing-btn').forEach(btn => {
                const name = canonicalizeIngredient(btn.getAttribute('data-name') || '');
                if (name === found.a || name === found.b) btn.classList.add('conflict');
            });
        } else {
            conflictAlert.textContent = '';
        }
    }


    // ---------- CSV 加载与推荐逻辑 ----------
    function loadRecipeData() {
        fetch('recipe.csv')
            .then(r => r.text())
            .then(t => {
                const parsed = parseRecipeCSV(t);
                recipeData = Array.isArray(parsed) && parsed.length ? parsed : fallbackRecipes;
            })
            .catch(() => { recipeData = fallbackRecipes; });
    }

    function loadIncompatibleData() {
        fetch('incompatible-foods.csv')
            .then(r => r.text())
            .then(t => {
                incompatiblePairs = parseIncompatibleCSV(t);
            })
            .catch(() => { /* 忽略网络错误 */ });
    }

    function parseRecipeCSV(text) {
        const lines = text.split(/\r?\n/).filter(l => l.trim().length);
        if (lines.length === 0) return [];
        const headerParts = lines[0].split(',').map(h => h.trim());
        const headerHasNames = headerParts.includes('name') && headerParts.includes('stuff');
        let startIndex = 0;
        let idx = { name: 0, stuff: 1, difficulty: -1, tags: -1, methods: -1, tools: -1 };
        if (headerHasNames) {
            idx = {
                name: headerParts.findIndex(h => h === 'name'),
                stuff: headerParts.findIndex(h => h === 'stuff'),
                difficulty: headerParts.findIndex(h => h === 'difficulty'),
                tags: headerParts.findIndex(h => h === 'tags'),
                methods: headerParts.findIndex(h => h === 'methods'),
                tools: headerParts.findIndex(h => h === 'tools'),
            };
            startIndex = 1; // 跳过表头
        }
        const out = [];
        for (let i = startIndex; i < lines.length; i++) {
            const cols = lines[i].split(',');
            if (cols.length < 2) continue;
            const name = (cols[idx.name] || '').trim();
            const stuffStr = (cols[idx.stuff] || '').trim();
            if (!name) continue;
            const difficulty = idx.difficulty >= 0 ? (cols[idx.difficulty] || '').trim() : '';
            const tagsStr = idx.tags >= 0 ? (cols[idx.tags] || '').trim() : '';
            const methodsStr = idx.methods >= 0 ? (cols[idx.methods] || '').trim() : '';
            const toolsStr = idx.tools >= 0 ? (cols[idx.tools] || '').trim() : '';
            const stuff = stuffStr ? stuffStr.split('、').map(s => canonicalizeIngredient(s.trim())).filter(Boolean) : [];
            const tags = tagsStr ? tagsStr.split('、').map(s => s.trim()).filter(Boolean) : [];
            const methods = methodsStr ? methodsStr.split('、').map(s => s.trim()).filter(Boolean) : [];
            const tools = toolsStr ? toolsStr.split('、').map(s => s.trim()).filter(Boolean) : [];
            out.push({ name, stuff, difficulty, tags, methods, tools });
        }
        return out;
    }

    function parseIncompatibleCSV(text) {
        const lines = text.split(/\r?\n/).filter(l => l.trim().length);
        if (lines.length <= 1) return [];
        const res = [];
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',');
            if (cols.length < 2) continue;
            const a = canonicalizeIngredient((cols[0]||'').trim());
            const b = canonicalizeIngredient((cols[1]||'').trim());
            const reason = (cols[2]||'').trim();
            if (a && b) res.push({ a, b, reason });
        }
        return res;
    }

    function canonicalizeIngredient(s) {
        if (!s) return '';
        // 简单别名归一
        const map = {
            '西红柿': '番茄',
            '米饭': '米',
            '大米': '米',
            '面条': '面食',
            '馒头': '面食',
            '意面': '面食',
            '西兰花': '花菜',
            '黄瓜条': '黄瓜',
            '鸡胸肉': '鸡肉',
            '鸡翅': '鸡肉',
            '五花肉': '猪肉',
        };
        return (map[s] || s).trim();
    }

    function findConflicts(selected) {
        const set = new Set(selected.map(canonicalizeIngredient));
        for (const p of incompatiblePairs) {
            if (set.has(p.a) && set.has(p.b)) {
                return `${p.a} × ${p.b}：${p.reason}`;
            }
        }
        return '';
    }

    function recommendRecipes(selectedRaw, topN) {
        const selected = selectedRaw.map(canonicalizeIngredient);
        if (!recipeData.length) return [];
        // 评分：完全包含优先；否则按匹配比例、匹配数、总数排序
        const scored = recipeData.map(r => {
            const stuff = (r.stuff || []).map(canonicalizeIngredient);
            const matchCount = stuff.reduce((acc, ing) => acc + (selected.includes(ing) ? 1 : 0), 0);
            const isFullMatch = stuff.length > 0 && matchCount === stuff.length;
            return {
                ...r,
                matchCount,
                totalStuff: stuff.length,
                score: stuff.length ? matchCount / stuff.length : 0,
                isFullMatch,
            };
        }).filter(x => x.matchCount > 0)
          .sort((a,b) => {
              if (a.isFullMatch !== b.isFullMatch) return b.isFullMatch - a.isFullMatch;
              if (b.score !== a.score) return b.score - a.score;
              if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
              return a.totalStuff - b.totalStuff;
          });
        return scored.slice(0, topN);
    }
});