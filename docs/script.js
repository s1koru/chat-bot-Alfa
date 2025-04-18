document.addEventListener('DOMContentLoaded', function() {
  // Состояния приложения
  let selectedAge = null;
  let selectedIncome = null;
  let conversationHistory = [];
  
  // DOM элементы
  const UI = {
    ageSelection: document.getElementById('ageSelection'),
    incomeWrapper: document.getElementById('incomeWrapper'),
    welcomeScreen: document.getElementById('welcomeScreen'),
    welcomeHeader: document.getElementById('welcomeHeader'), // <-- добавлено
    chatBot: document.getElementById('chatBot'),
    toIncomeBtn: document.getElementById('toIncomeBtn'),
    toWelcomeBtn: document.getElementById('toWelcomeBtn'),
    toChatBtn: document.getElementById('toChatBtn'),
    returnBtn: document.getElementById('returnBtn'),
    chatMessages: document.querySelector('.chat-messages'),
    chatInput: document.getElementById('chatInput'),
    sendBtn: document.getElementById('sendBtn'),
    bgPhoto: document.querySelector('.bg-photo'),
    header: document.querySelector('.chatbot-header')
  };
  

  // Конфигурация анимаций
  const animationSettings = {
    duration: 500,
    fadeOut: 'fadeOut 0.5s forwards',
    fadeIn: 'fadeIn 0.5s forwards'
  };

  // Инициализация обработчиков событий
  function initEventListeners() {
    // Выбор возраста
    document.querySelectorAll('.option-btn[data-age]').forEach(btn => {
      btn.addEventListener('click', handleAgeSelection);
    });

    // Выбор дохода
    document.querySelectorAll('.option-btn[data-income]').forEach(btn => {
      btn.addEventListener('click', handleIncomeSelection);
    });

    // Кнопки навигации
    UI.toIncomeBtn.addEventListener('click', handleToIncome);
    UI.toWelcomeBtn.addEventListener('click', handleToWelcome);
    UI.toChatBtn.addEventListener('click', handleToChat);
    UI.returnBtn.addEventListener('click', handleReturn);

    // Отправка сообщений
    UI.sendBtn.addEventListener('click', sendMessage);
    UI.chatInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') sendMessage();
    });
  }

  // Обработчики событий
  function handleAgeSelection(e) {
    const button = e.target;
    selectedAge = button.dataset.age;
    
    document.querySelectorAll('.option-btn[data-age]').forEach(btn => {
      btn.classList.remove('selected');
    });
    
    button.classList.add('selected');
    UI.toIncomeBtn.disabled = false;
  }

  function handleIncomeSelection(e) {
    const button = e.target;
    selectedIncome = button.dataset.income;
  
    document.querySelectorAll('.option-btn[data-income]').forEach(btn => {
      btn.classList.remove('selected');
    });
  
    button.classList.add('selected');
  
    // Снимаем блокировку кнопки и выводим сообщение для отладки
    UI.toWelcomeBtn.disabled = false;
    console.log("Доход выбран, кнопка 'Далее' активна");
  }
  

  function handleToIncome() {
    animateTransition(UI.ageSelection, UI.incomeWrapper);
    // Явно переключаем видимость кнопок "Далее":
    UI.toIncomeBtn.style.display = 'none';
    UI.toWelcomeBtn.style.display = 'block';
  }


  function handleToChat() {
    UI.header.style.display = 'none';
    UI.bgPhoto.style.opacity = '0';
    animateTransition(UI.welcomeScreen, UI.chatBot);
  }

  function handleReturn() {
    UI.header.style.display = 'block';
    UI.bgPhoto.style.opacity = '1';
    animateTransition(UI.chatBot, UI.ageSelection);
    resetSelections();
  }


// Функция для анимации изменения текста заголовка с fadeOut/fadeIn
function changeWelcomeHeader(newText) {
  // Запускаем анимацию исчезновения
  UI.welcomeHeader.style.animation = 'fadeOut 0.5s forwards';
  setTimeout(() => {
    // После анимации исчезновения меняем содержимое
    UI.welcomeHeader.innerHTML = newText;
    // Запускаем анимацию появления
    UI.welcomeHeader.style.animation = 'fadeIn 0.5s forwards';
  }, 500);
}

function handleToWelcome() {
  // Анимируем исчезновение заголовка чат-бота
  UI.header.style.animation = 'fadeOut 0.5s forwards';
  setTimeout(() => {
    UI.header.style.display = 'none';
    
    // Обновляем приветственный заголовок с новым текстом
    UI.welcomeHeader.style.display = 'block';
    UI.welcomeHeader.innerHTML = `Привет, меня зовут ${personaMapping[selectedAge]}.<br>
Сегодня я отвечу на все<br>
твои вопросы!`;
    
    // Плавная анимация перехода от экрана выбора дохода к экрану приветствия
    animateTransition(UI.incomeWrapper, UI.welcomeScreen);
  }, 500);
}
function handleReturn() {
  // Восстанавливаем заголовок с оригинальным содержимым и анимацией появления
  UI.header.innerHTML = `
    <div class="chatbot-title">Чат-бот</div>
    <div class="chatbot-subtitle">который решит все ваши вопросы</div>
  `;
  UI.header.style.display = 'block';
  UI.header.style.animation = 'fadeIn 1s forwards';

  UI.bgPhoto.style.opacity = '1';
  animateTransition(UI.chatBot, UI.ageSelection);
  resetSelections();
}


  
  // Вспомогательные функции
  function animateTransition(fromElement, toElement) {
    fromElement.style.animation = animationSettings.fadeOut;
    
    setTimeout(() => {
      fromElement.style.display = 'none';
      toElement.style.display = 'block';
      toElement.style.animation = animationSettings.fadeIn;
    }, animationSettings.duration);
  }

  function resetSelections() {
    selectedAge = null;
    selectedIncome = null;
    conversationHistory = [];
    
    document.querySelectorAll('.selected').forEach(btn => {
      btn.classList.remove('selected');
    });
    
    UI.chatMessages.innerHTML = '';
    UI.toIncomeBtn.disabled = true;
    UI.toWelcomeBtn.disabled = true;
    UI.toWelcomeBtn.style.display = 'none';
    UI.toIncomeBtn.style.display = 'block';
  }

  // Логика работы чата
  async function sendMessage() {
    const messageText = UI.chatInput.value.trim();
    if (!messageText) return;
  
    // Добавляем сообщение пользователя
    addMessage(messageText, 'user');
    UI.chatInput.value = '';
  
    // Создаём и отображаем индикатор "бот печатает"
    const typingIndicator = createTypingIndicator();
    UI.chatMessages.appendChild(typingIndicator);
    scrollToBottom();
  
    try {
      // Запрашиваем ответ у сервера
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          message: messageText,
          age: selectedAge,
          income: selectedIncome,
          history: conversationHistory
        })
      });
  
      // Получаем результат
      const data = await response.json();
  
      // Ждём искусственную задержку (время "набора")
      await new Promise(resolve =>
        setTimeout(resolve, calculateDelay(data.reply))
      );
  
      // Убираем индикатор typingIndicator после задержки
      typingIndicator.remove();
  
      // Добавляем окончательный ответ бота
      addMessage(data.reply, 'bot');
      scrollToBottom();
  
    } catch (error) {
      // В случае ошибки индикатор тоже убираем, чтобы не висел бесконечно
      typingIndicator.remove();
      addMessage(`Ошибка: ${error.message}`, 'error');
      scrollToBottom();
    }
  }
  

  function addMessage(text, type) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', `${type}-message`);
    
    if (type === 'bot') {
      const avatar = avatarMapping[selectedAge] || 'avatars/default.png';
      messageElement.innerHTML = `
        <img class="avatar" src="${avatar}" alt="Аватар">
        <div class="message-content">
          <span class="sender-name">${personaMapping[selectedAge]}:</span>
          ${text}
        </div>
      `;
    } else {
      messageElement.innerHTML = `
        <div class="message-content">Вы: ${text}</div>
      `;
    }
    
    UI.chatMessages.appendChild(messageElement);
    conversationHistory.push({
      role: type === 'user' ? 'user' : 'assistant',
      content: text
    });
  }

  function createTypingIndicator() {
    const typingElem = document.createElement('div');
    typingElem.classList.add('chat-message', 'bot-message', 'typing-indicator');
    typingElem.innerHTML = `
      <div class="message-content">
        ${personaMapping[selectedAge]} печатает<span class="dots"></span>
      </div>
    `;
    return typingElem;
  }

  function calculateDelay(text) {
    const baseDelay = 1000;
    const charDelay = 15;
    return Math.min(baseDelay + text.length * charDelay, 5000);
  }

  function scrollToBottom() {
    UI.chatMessages.scrollTop = UI.chatMessages.scrollHeight;
  }

  // Маппинги
  const personaMapping = {
    "14-17": "Вика",
    "18-22": "Аня",
    "23-28": "Индира",
    "29-36": "Надежда",
    "37+": "Роман"
  };

  const avatarMapping = {
    "14-17": "avatars/vika.png",
    "18-22": "avatars/anya.png",
    "23-28": "avatars/indira.png",
    "29-36": "avatars/nadezhda.png",
    "37+": "avatars/roman.png"
  };

  // Анимация точек
  setInterval(() => {
    document.querySelectorAll('.dots').forEach(dot => {
      dot.textContent = dot.textContent.length < 3 ? 
        dot.textContent + '.' : '';
    });
  }, 500);

  // Запуск приложения
  initEventListeners();
});
