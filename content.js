// 从存储中获取已保存的单词并高亮显示
async function highlightSavedWords() {
  const { words = [] } = await chrome.storage.sync.get('words');
  
  if (words.length === 0) return;
  const wordRegex = new RegExp(`\\b(${words.join('|')})\\b`, 'gi');
  
  function walkText(node) {
    if (node.nodeType === 3) {
      const text = node.textContent;
      if (wordRegex.test(text)) {
        const span = document.createElement('span');
        span.innerHTML = text.replace(wordRegex, '<span class="highlighted-word">$1</span>');
        node.parentNode.replaceChild(span, node);
      }
    } else {
      for (const child of node.childNodes) {
        walkText(child);
      }
    }
  }
  
  walkText(document.body);
}

// 检查是否为英文单词
function isEnglishWord(text) {
  return /^[a-zA-Z]+(?:[-'][a-zA-Z]+)*$/.test(text);
}

// 创建按钮
function createActionButton(isAdded) {
  const button = document.createElement('div');
  button.className = `word-action-button ${isAdded ? 'remove' : 'add'}`;
  button.innerHTML = isAdded ? '−' : '+';
  return button;
}

// 处理选中文本
let currentButton = null;
let currentWord = null;
let isSelecting = false;

// 开始选择文本
document.addEventListener('mousedown', (e) => {
  // 如果点击的是当前按钮，不做任何处理
  if (currentButton && currentButton.contains(e.target)) {
    return;
  }
  
  isSelecting = true;
  if (currentButton) {
    currentButton.remove();
    currentButton = null;
    currentWord = null;
  }
});

// 处理选中文本结束事件
document.addEventListener('mouseup', (e) => {
  // 如果点击的是当前按钮，不做处理
  if (currentButton && currentButton.contains(e.target)) {
    return;
  }

  // 确保是在完成选择后
  setTimeout(async () => {
    if (isSelecting) {
      const selection = window.getSelection();
      const word = selection.toString().trim().toLowerCase();
      
      // 如果选中了新的有效单词
      if (word && isEnglishWord(word)) {
        const { words = [] } = await chrome.storage.sync.get('words');
        const isWordAdded = words.includes(word);
        
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // 创建新按钮
        const button = createActionButton(isWordAdded);
        document.body.appendChild(button);
        
        // 设置按钮位置
        const top = window.scrollY + rect.top - 30;
        const left = window.scrollX + rect.right + 5;
        button.style.top = `${top}px`;
        button.style.left = `${left}px`;
        
        currentButton = button;
        currentWord = word;
        
        // 添加点击事件
        button.addEventListener('click', async (e) => {
          e.stopPropagation();
          const { words = [] } = await chrome.storage.sync.get('words');
          const { wordDates = {} } = await chrome.storage.sync.get('wordDates');
          
          if (isWordAdded) {
            // 删除单词
            const newWords = words.filter(w => w !== currentWord);
            delete wordDates[currentWord];
            await chrome.storage.sync.set({ words: newWords, wordDates });
          } else {
            // 添加单词
            if (!words.includes(currentWord)) {
              words.push(currentWord);
              wordDates[currentWord] = Date.now();
              await chrome.storage.sync.set({ words, wordDates });
            }
          }
          
          highlightSavedWords();
          button.remove();
          currentButton = null;
          currentWord = null;
        });
      }
      // 如果点击了页面其他地方（没有选中单词）
      else if (!word) {
        if (currentButton) {
          currentButton.remove();
          currentButton = null;
          currentWord = null;
        }
      }
    }
    isSelecting = false;
  }, 10);
});

// 页面加载完成后高亮已保存的单词
highlightSavedWords(); 