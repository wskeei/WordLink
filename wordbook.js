document.addEventListener('DOMContentLoaded', async () => {
  const wordList = document.getElementById('wordList');
  const searchBox = document.getElementById('searchBox');
  const sortButtons = document.querySelectorAll('.sort-button');
  const wordCountElement = document.getElementById('wordCount');
  const addWordForm = document.getElementById('addWordForm');
  
  let currentSort = 'time';
  let wordData = [];
  
  // 从存储中获取单词数据
  async function loadWords() {
    const { words = [] } = await chrome.storage.sync.get('words');
    const { wordDates = {} } = await chrome.storage.sync.get('wordDates');
    
    wordData = words.map(word => ({
      text: word,
      date: wordDates[word] || Date.now()
    }));
    
    updateWordCount();
    renderWords();
  }
  
  // 更新单词计数
  function updateWordCount() {
    wordCountElement.textContent = `${wordData.length} 个单词`;
  }
  
  // 渲染单词列表
  function renderWords() {
    const searchTerm = searchBox.value.toLowerCase();
    let filteredWords = wordData.filter(word => 
      word.text.toLowerCase().includes(searchTerm)
    );
    
    if (currentSort === 'alpha') {
      filteredWords.sort((a, b) => a.text.localeCompare(b.text));
    } else {
      filteredWords.sort((a, b) => b.date - a.date);
    }
    
    wordList.innerHTML = '';
    
    if (filteredWords.length === 0) {
      wordList.innerHTML = '<div class="empty-message">没有找到单词</div>';
      return;
    }
    
    filteredWords.forEach(word => {
      const wordCard = document.createElement('div');
      wordCard.className = 'word-card';
      
      const wordText = document.createElement('div');
      wordText.className = 'word-text';
      wordText.textContent = word.text;
      
      const wordDate = document.createElement('div');
      wordDate.className = 'word-date';
      wordDate.textContent = new Date(word.date).toLocaleString();
      
      const wordActions = document.createElement('div');
      wordActions.className = 'word-actions';
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'action-button delete-button';
      deleteBtn.textContent = '删除';
      deleteBtn.onclick = async () => {
        const { words = [] } = await chrome.storage.sync.get('words');
        const { wordDates = {} } = await chrome.storage.sync.get('wordDates');
        
        const newWords = words.filter(w => w !== word.text);
        delete wordDates[word.text];
        
        await chrome.storage.sync.set({ words: newWords, wordDates });
        wordData = wordData.filter(w => w.text !== word.text);
        updateWordCount();
        renderWords();
      };
      
      wordActions.appendChild(deleteBtn);
      wordCard.appendChild(wordText);
      wordCard.appendChild(wordDate);
      wordCard.appendChild(wordActions);
      wordList.appendChild(wordCard);
    });
  }
  
  // 添加新单词
  addWordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newWordInput = document.getElementById('newWord');
    const word = newWordInput.value.trim().toLowerCase();
    
    if (word && /^[a-zA-Z]+(?:[-'][a-zA-Z]+)*$/.test(word)) {
      const { words = [] } = await chrome.storage.sync.get('words');
      const { wordDates = {} } = await chrome.storage.sync.get('wordDates');
      
      if (!words.includes(word)) {
        words.push(word);
        wordDates[word] = Date.now();
        await chrome.storage.sync.set({ words, wordDates });
        
        wordData.push({
          text: word,
          date: wordDates[word]
        });
        
        updateWordCount();
        renderWords();
        newWordInput.value = '';
      }
    }
  });
  
  // 搜索功能
  searchBox.addEventListener('input', renderWords);
  
  // 排序功能
  sortButtons.forEach(button => {
    button.addEventListener('click', () => {
      sortButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      currentSort = button.dataset.sort;
      renderWords();
    });
  });
  
  // 添加文件导入功能
  const fileInput = document.getElementById('fileInput');
  
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target.result;
      const words = parseWordsFromContent(content);
      
      if (words.length > 0) {
        await importWords(words);
        showImportProgress(words.length);
      }
    };
    
    reader.readAsText(file);
    fileInput.value = ''; // 重置文件输入，允许重复导入同一个文件
  });
  
  // 解析文本内容中的单词
  function parseWordsFromContent(content) {
    // 将内容按行分割
    const lines = content.split(/\r?\n/);
    const words = new Set();
    
    lines.forEach(line => {
      // 移除 markdown 列表标记和其他特殊字符
      line = line.replace(/^[-*+]\s+/, '') // 无序列表
                 .replace(/^\d+\.\s+/, '') // 有序列表
                 .trim();
      
      if (line) {
        // 处理空格分隔的多个单词
        const lineWords = line.split(/\s+/);
        lineWords.forEach(word => {
          // 清理单词，只保留字母、连字符和撇号
          word = word.replace(/[^a-zA-Z\-']/g, '').toLowerCase();
          if (word && /^[a-zA-Z]+(?:[-'][a-zA-Z]+)*$/.test(word)) {
            words.add(word);
          }
        });
      }
    });
    
    return Array.from(words);
  }
  
  // 导入单词到生词本
  async function importWords(newWords) {
    const { words = [] } = await chrome.storage.sync.get('words');
    const { wordDates = {} } = await chrome.storage.sync.get('wordDates');
    
    const timestamp = Date.now();
    let addedCount = 0;
    
    newWords.forEach(word => {
      if (!words.includes(word)) {
        words.push(word);
        wordDates[word] = timestamp;
        addedCount++;
      }
    });
    
    if (addedCount > 0) {
      await chrome.storage.sync.set({ words, wordDates });
      
      // 更新本地数据
      wordData = words.map(word => ({
        text: word,
        date: wordDates[word]
      }));
      
      updateWordCount();
      renderWords();
    }
    
    return addedCount;
  }
  
  // 显示导入进度提示
  function showImportProgress(totalWords) {
    const progressElement = document.createElement('div');
    progressElement.className = 'import-progress';
    progressElement.textContent = `成功导入 ${totalWords} 个单词`;
    document.body.appendChild(progressElement);
    
    // 2.3秒后移除提示
    setTimeout(() => {
      progressElement.remove();
    }, 2300);
  }
  
  // 初始加载
  await loadWords();
}); 