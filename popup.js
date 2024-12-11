document.addEventListener('DOMContentLoaded', async () => {
  const wordList = document.getElementById('wordList');
  const searchBox = document.getElementById('searchBox');
  const sortButtons = document.querySelectorAll('.sort-button');
  const wordCountElement = document.getElementById('wordCount');
  
  let currentSort = 'time'; // 默认按时间排序
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
    
    // 排序
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
      const wordItem = document.createElement('div');
      wordItem.className = 'word-item';
      
      const wordInfo = document.createElement('div');
      wordInfo.className = 'word-info';
      
      const wordText = document.createElement('div');
      wordText.className = 'word-text';
      wordText.textContent = word.text;
      
      const wordDate = document.createElement('div');
      wordDate.className = 'word-date';
      wordDate.textContent = new Date(word.date).toLocaleString();
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete';
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
      
      wordInfo.appendChild(wordText);
      wordInfo.appendChild(wordDate);
      wordItem.appendChild(wordInfo);
      wordItem.appendChild(deleteBtn);
      wordList.appendChild(wordItem);
    });
  }
  
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
  
  // 初始加载
  await loadWords();
}); 